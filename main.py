import os
import logging
import json
import pandas as pd
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
from scrapper.fetch_excel import download_excel_to_df
from scrapper.scrapper import scrape_profile_badges_for_list
from scrapper.processor import build_and_save_csvs, compute_summary
from scrapper.supbase_client import SupabaseClient

# Load environment variables from config/.env if it exists (local development)
env_path = Path("config/.env")
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    logging.info("Loaded environment variables from config/.env")
else:
    logging.info("No config/.env found, using environment variables")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

DRIVE_LINK = os.getenv("DRIVE_XLSX_LINK")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not DRIVE_LINK:
    logging.error("Please set DRIVE_XLSX_LINK environment variable or in config/.env")
    raise SystemExit(1)
if not SUPABASE_URL or not SUPABASE_KEY:
    logging.error("Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables or in config/.env")
    raise SystemExit(1)

def main():
    run_start = datetime.now(timezone.utc)
    logging.info("Starting Study Jam scraper run at %s", run_start.isoformat())
    
    # 1. Download Excel & read into DataFrame
    df = download_excel_to_df(DRIVE_LINK)
    logging.info("Excel downloaded: %d rows", len(df))

    # 2. Ensure column name for profile url (your sheet header)
    # Look for column containing URLs (cloudskillsboost.google or public_profiles in the name)
    profile_col_candidates = []
    
    # First try: look for columns with "cloudskillsboost" or explicit URL markers
    for col in df.columns:
        col_lower = col.lower()
        if "cloudskillsboost" in col_lower or "public_profiles" in col_lower or "profile url" in col_lower:
            profile_col_candidates.append(col)
    
    # Second try: look for columns containing actual URLs in the data
    if not profile_col_candidates:
        logging.info("Trying to detect profile URL column from data content...")
        for col in df.columns:
            # Check if this column contains URLs
            sample_values = df[col].dropna().head(5)
            url_count = sum(1 for val in sample_values if isinstance(val, str) and "cloudskillsboost.google" in val.lower())
            if url_count > 0:
                profile_col_candidates.append(col)
                logging.info("Found column '%s' with %d URLs in sample", col, url_count)
    
    if not profile_col_candidates:
        # fall back to last column
        profile_col = df.columns[-1] if len(df.columns) >= 1 else df.columns[0]
        logging.warning("Could not detect profile url column automatically. Using fallback column: %s", profile_col)
    else:
        profile_col = profile_col_candidates[0]
        logging.info("Detected profile URL column: %s", profile_col)

    participants = []
    for idx, row in df.iterrows():
        profile_url = str(row.get(profile_col, "")).strip()
        
        # Try different variations of name column
        name_cols = ["Your Full Name", "Full Name", "Your full name", "Name"]
        name = ""
        for col in name_cols:
            if col in row and pd.notna(row[col]):
                name = str(row[col]).strip()
                break
        
        # Try different variations of email column - look for the email-specific one
        email_cols = [col for col in df.columns if "email address" in col.lower() and "skills boost" in col.lower()]
        if not email_cols:
            email_cols = ["Email", "Email Address", "email"]
        
        email = ""
        for col in email_cols:
            if col in row and pd.notna(row[col]):
                email = str(row[col]).strip()
                break
        
        # Validate profile URL
        if profile_url and profile_url.startswith("http") and "cloudskillsboost.google" in profile_url.lower():
            participants.append({
                "row_index": int(idx),
                "name": name or "Unknown",
                "email": email or "",
                "profile_url": profile_url
            })
        elif profile_url and profile_url.startswith("http"):
            logging.warning("Skipping row %d: URL doesn't look like Cloud Skills Boost: %s", idx, profile_url[:50])

    logging.info("Found %d valid participants with Cloud Skills Boost profile URLs", len(participants))

    # 3. Scrape badges for each participant
    results = scrape_profile_badges_for_list(participants)

    # 4. Save CSVs locally
    summary_df, detailed_df = build_and_save_csvs(results, DATA_DIR)

    # 5. Save JSON files locally
    json_data = {
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "total_participants": len(results),
        "participants": []
    }
    
    for r in results:
        json_data["participants"].append({
            "name": r.get("name"),
            "email": r.get("email"),
            "profile_url": r.get("profile_url"),
            "total_badges": len(r.get("badges", [])),
            "badges": r.get("badges", []),
            "error": r.get("error")
        })
    
    # Save complete JSON
    json_path = DATA_DIR / f"leaderboard_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)
    logging.info("Saved JSON: %s", json_path)
    
    # Save latest JSON (overwrite)
    latest_json_path = DATA_DIR / "leaderboard_latest.json"
    with open(latest_json_path, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)
    logging.info("Saved latest JSON: %s", latest_json_path)

    # 6. Push to Supabase
    supa = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    logging.info("Pushing to Supabase")
    
    run_id = None
    try:
        # Create run record
        run_id = supa.create_run(len(participants))
        
        # Upsert participants and badges
        success_count, failure_count = supa.upsert_participants_and_badges(results)
        
        # Save leaderboard snapshot
        supa.save_leaderboard_snapshot(json_data)
        
        # Complete run record
        run_finish = datetime.now(timezone.utc)
        supa.complete_run(run_id, success_count, failure_count, f"Completed successfully in {(run_finish - run_start).seconds}s")
        
        logging.info("Scraper run completed successfully.")
        logging.info("Success: %d, Failures: %d", success_count, failure_count)
    except Exception as e:
        logging.exception("Error during Supabase operations")
        if run_id:
            supa.complete_run(run_id, 0, len(participants), f"Failed: {str(e)}")
    
    logging.info("Summary saved: %s", DATA_DIR / "leaderboard_summary.csv")
    logging.info("Detailed saved: %s", DATA_DIR / "leaderboard_detailed.csv")
    logging.info("JSON saved: %s", json_path)

if __name__ == "__main__":
    main()
