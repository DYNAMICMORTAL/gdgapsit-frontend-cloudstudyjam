"""
Quick script to push existing CSV data to Supabase
"""
from dotenv import load_dotenv
from pathlib import Path
import os
import json
import logging
from datetime import datetime, timezone
from scrapper.supbase_client import SupabaseClient

# Load environment variables from config/.env if it exists
env_path = Path("config/.env")
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    logging.info("No config/.env found, using environment variables")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

DATA_DIR = Path("./data")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def main():
    # Load the latest JSON data
    json_path = DATA_DIR / "leaderboard_latest.json"
    
    if not json_path.exists():
        logging.error("No JSON file found. Run the scraper first!")
        return
    
    with open(json_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)
    
    logging.info("Loaded data for %d participants", len(json_data.get("participants", [])))
    
    # Connect to Supabase
    supa = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    logging.info("Connected to Supabase")
    
    # Transform JSON data to match the format expected by upsert_participants_and_badges
    results = json_data.get("participants", [])
    
    try:
        # Create run record
        run_id = supa.create_run(len(results))
        
        # Push data
        success_count, failure_count = supa.upsert_participants_and_badges(results)
        
        # Save leaderboard snapshot
        supa.save_leaderboard_snapshot(json_data)
        
        # Complete run record
        supa.complete_run(run_id, success_count, failure_count, "Pushed from existing CSV data")
        
        logging.info("✅ Successfully pushed data to Supabase!")
        logging.info("Success: %d, Failures: %d", success_count, failure_count)
        
    except Exception as e:
        logging.exception("Error during Supabase operations: %s", e)

if __name__ == "__main__":
    main()
