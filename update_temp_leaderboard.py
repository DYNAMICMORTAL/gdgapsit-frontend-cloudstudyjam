"""
Temporary script to update leaderboard data from a Google Sheet
Matches participants with existing profile URLs from leaderboard_detailed.csv
"""
import sys
import logging
import json
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone
from scrapper.fetch_excel import download_excel_to_df

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Configuration
EXCEL_URL = "https://docs.google.com/spreadsheets/d/1iY4Ct0r9vLczOiNmm447oZGrKf0GglFk-8dTD4IaGVM/edit?gid=0#gid=0"
DATA_DIR = Path("./data")
DETAILED_CSV = DATA_DIR / "leaderboard_detailed.csv"
OUTPUT_JSON = DATA_DIR / "leaderboard_latest.json"
OUTPUT_SUMMARY_CSV = DATA_DIR / "leaderboard_summary.csv"
OUTPUT_DETAILED_CSV = DATA_DIR / "leaderboard_detailed.csv"

def load_existing_profiles():
    """Load existing participant profiles from leaderboard_detailed.csv"""
    if not DETAILED_CSV.exists():
        logging.error(f"File not found: {DETAILED_CSV}")
        return {}
    
    df = pd.read_csv(DETAILED_CSV)
    logging.info(f"Loaded {len(df)} badge records from existing data")
    
    # Create a mapping of name/email to profile_url
    profiles = {}
    for _, row in df.iterrows():
        name = str(row['name']).strip()
        email = str(row['email']).strip()
        profile_url = str(row['profile_url']).strip()
        
        # Use name as primary key, email as secondary
        if name and name not in profiles:
            profiles[name] = {
                'email': email,
                'profile_url': profile_url
            }
        
        # Also index by email
        if email and email not in profiles:
            profiles[email] = {
                'name': name,
                'profile_url': profile_url
            }
    
    logging.info(f"Created profile mapping for {len(profiles)} unique identifiers")
    return profiles

def normalize_name(name):
    """Normalize name for matching"""
    if pd.isna(name):
        return ""
    return str(name).strip().lower()

def normalize_email(email):
    """Normalize email for matching"""
    if pd.isna(email):
        return ""
    return str(email).strip().lower()

def download_and_process_excel(excel_url, existing_profiles):
    """Download Excel and process participant data"""
    logging.info(f"Downloading Excel from: {excel_url}")
    
    try:
        df = download_excel_to_df(excel_url)
        logging.info(f"Downloaded {len(df)} rows, {len(df.columns)} columns")
        
        # Log column names to help identify the right columns
        logging.info("Columns found:")
        for i, col in enumerate(df.columns, 1):
            logging.info(f"  {i}. {col}")
        
        # Detect column names - flexible matching
        name_col = None
        email_col = None
        badge_count_col = None
        arcade_col = None
        
        for col in df.columns:
            col_lower = col.lower()
            if 'name' in col_lower and not name_col:
                name_col = col
            elif 'email' in col_lower and not email_col:
                email_col = col
            elif 'badge' in col_lower and ('completed' in col_lower or 'count' in col_lower or 'total' in col_lower):
                badge_count_col = col
            elif 'arcade' in col_lower:
                arcade_col = col
        
        if not name_col or not email_col:
            logging.error("Could not detect required columns!")
            logging.error(f"Name column: {name_col}, Email column: {email_col}")
            return None
        
        logging.info(f"Using columns - Name: '{name_col}', Email: '{email_col}', Badge Count: '{badge_count_col}', Arcade: '{arcade_col}'")
        
        # Process participants
        participants = []
        matched = 0
        unmatched = 0
        
        for idx, row in df.iterrows():
            name = str(row.get(name_col, "")).strip() if name_col in row else ""
            email = str(row.get(email_col, "")).strip() if email_col in row else ""
            badge_count = 0
            arcade_count = 0
            
            if badge_count_col and badge_count_col in row:
                try:
                    badge_count = int(row[badge_count_col]) if pd.notna(row[badge_count_col]) else 0
                except:
                    badge_count = 0
            
            if arcade_col and arcade_col in row:
                try:
                    arcade_count = int(row[arcade_col]) if pd.notna(row[arcade_col]) else 0
                except:
                    arcade_count = 0
            
            if not name or not email:
                logging.debug(f"Skipping row {idx}: missing name or email")
                continue
            
            # Try to match with existing profiles
            profile_url = None
            matched_email = None
            
            # First try exact name match
            name_key = normalize_name(name)
            if name_key in [normalize_name(k) for k in existing_profiles.keys()]:
                for key, profile in existing_profiles.items():
                    if normalize_name(key) == name_key:
                        profile_url = profile['profile_url']
                        matched_email = profile.get('email', email)
                        matched += 1
                        break
            
            # Then try exact email match
            if not profile_url:
                email_key = normalize_email(email)
                if email_key in [normalize_email(k) for k in existing_profiles.keys()]:
                    for key, profile in existing_profiles.items():
                        if normalize_email(key) == email_key:
                            profile_url = profile['profile_url']
                            matched += 1
                            break
            
            if not profile_url:
                # Create a placeholder profile URL for participants without existing data
                logging.info(f"Creating placeholder for: {name} ({email})")
                unmatched += 1
                # Generate a placeholder profile URL
                profile_url = f"https://www.cloudskillsboost.google/public_profiles/placeholder-{idx}"
            else:
                matched += 1
            
            participants.append({
                'name': name,
                'email': matched_email or email,
                'profile_url': profile_url,
                'total_badges': badge_count,
                'arcade_count': arcade_count,
                'badges': [],  # We'll populate this from existing data if available
                'error': None
            })
        
        logging.info(f"Matched: {matched}, Unmatched: {unmatched}, Total processed: {len(participants)}")
        return participants
        
    except Exception as e:
        logging.exception(f"Error downloading/processing Excel: {e}")
        return None

def load_existing_badges(existing_profiles):
    """Load existing badge data for matched participants"""
    if not DETAILED_CSV.exists():
        return {}
    
    df = pd.read_csv(DETAILED_CSV)
    
    # Group badges by participant
    badges_by_participant = {}
    
    for _, row in df.iterrows():
        name = str(row['name']).strip()
        email = str(row['email']).strip()
        badge_name = str(row['badge_name']).strip()
        earned_date = row['earned_date']
        earned_date_raw = row['earned_date_raw']
        
        key = normalize_name(name)
        
        if key not in badges_by_participant:
            badges_by_participant[key] = []
        
        badges_by_participant[key].append({
            'badge_name': badge_name,
            'earned_date': earned_date,
            'earned_date_raw': earned_date_raw
        })
    
    return badges_by_participant

def generate_output_files(participants, existing_badges):
    """Generate updated JSON and CSV files"""
    
    # Add badges to participants
    for p in participants:
        name_key = normalize_name(p['name'])
        if name_key in existing_badges:
            p['badges'] = existing_badges[name_key]
            # Update total_badges if not set or to match actual badge count
            if not p['total_badges']:
                p['total_badges'] = len(p['badges'])
    
    # Sort by total_badges descending, then by name
    participants.sort(key=lambda x: (-x['total_badges'], x['name']))
    
    # Generate JSON
    output_data = {
        'scraped_at': datetime.now(timezone.utc).isoformat(),
        'total_participants': len(participants),
        'participants': participants
    }
    
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    logging.info(f"✅ Saved JSON to: {OUTPUT_JSON}")
    
    # Generate Summary CSV
    summary_rows = []
    for rank, p in enumerate(participants, 1):
        badges = p.get('badges', [])
        
        # Calculate first and last earned dates
        dates = []
        for b in badges:
            if b.get('earned_date'):
                try:
                    dates.append(pd.to_datetime(b['earned_date']))
                except:
                    pass
        
        last_earned = max(dates) if dates else None
        first_earned = min(dates) if dates else None
        
        summary_rows.append({
            'name': p['name'],
            'email': p['email'],
            'profile_url': p['profile_url'],
            'total_badges': p['total_badges'],
            'last_earned': last_earned,
            'first_earned': first_earned,
            'error': p.get('error'),
            'rank': rank
        })
    
    summary_df = pd.DataFrame(summary_rows)
    summary_df.to_csv(OUTPUT_SUMMARY_CSV, index=False)
    logging.info(f"✅ Saved Summary CSV to: {OUTPUT_SUMMARY_CSV}")
    
    # Generate Detailed CSV
    detailed_rows = []
    for p in participants:
        for badge in p.get('badges', []):
            earned_date = badge.get('earned_date')
            try:
                earned_date_parsed = pd.to_datetime(earned_date) if earned_date else None
            except:
                earned_date_parsed = None
            
            detailed_rows.append({
                'name': p['name'],
                'email': p['email'],
                'profile_url': p['profile_url'],
                'badge_name': badge.get('badge_name'),
                'earned_date': earned_date_parsed,
                'earned_date_raw': badge.get('earned_date_raw')
            })
    
    detailed_df = pd.DataFrame(detailed_rows)
    detailed_df.to_csv(OUTPUT_DETAILED_CSV, index=False)
    logging.info(f"✅ Saved Detailed CSV to: {OUTPUT_DETAILED_CSV}")

def main():
    logging.info("=" * 60)
    logging.info("TEMPORARY LEADERBOARD UPDATE")
    logging.info("=" * 60)
    
    # Load existing profiles
    existing_profiles = load_existing_profiles()
    if not existing_profiles:
        logging.error("Failed to load existing profiles. Exiting.")
        return 1
    
    # Download and process Excel
    participants = download_and_process_excel(EXCEL_URL, existing_profiles)
    if participants is None or len(participants) == 0:
        logging.error("No participants to process. Exiting.")
        return 1
    
    # Load existing badges
    existing_badges = load_existing_badges(existing_profiles)
    
    # Generate output files
    generate_output_files(participants, existing_badges)
    
    logging.info("=" * 60)
    logging.info("✅ COMPLETED SUCCESSFULLY")
    logging.info(f"Updated files in: {DATA_DIR}")
    logging.info("=" * 60)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
