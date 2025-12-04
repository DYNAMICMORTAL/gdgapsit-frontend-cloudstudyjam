"""
Script to push temporary leaderboard data to Supabase temp_participants table
"""
from dotenv import load_dotenv
from pathlib import Path
import os
import json
import logging
from datetime import datetime
from supabase import create_client, Client

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
        logging.error("No JSON file found. Run update_temp_leaderboard.py first!")
        return 1
    
    with open(json_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)
    
    participants_data = json_data.get("participants", [])
    logging.info("Loaded data for %d participants", len(participants_data))
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        logging.error("Missing Supabase credentials!")
        return 1
    
    # Connect to Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logging.info("Connected to Supabase")
    
    try:
        # Clear existing temp data
        logging.info("Clearing existing temp_participants table...")
        delete_response = supabase.table('temp_participants').delete().neq('id', 0).execute()
        logging.info("Cleared existing data")
        
        # Prepare data for insertion
        temp_records = []
        for rank, participant in enumerate(participants_data, 1):
            # Get last and first earned dates from badges
            badges = participant.get('badges', [])
            dates = []
            for badge in badges:
                if badge.get('earned_date'):
                    dates.append(badge['earned_date'])
            
            last_earned = max(dates) if dates else None
            first_earned = min(dates) if dates else None
            
            temp_records.append({
                'full_name': participant.get('name', ''),
                'email': participant.get('email', ''),
                'profile_url': participant.get('profile_url', ''),
                'total_badges': participant.get('total_badges', 0),
                'arcade_completed': participant.get('arcade_count', 0),
                'last_earned': last_earned,
                'first_earned': first_earned,
                'rank': rank
            })
        
        # Insert data in batches (Supabase has a limit)
        batch_size = 100
        total_inserted = 0
        
        for i in range(0, len(temp_records), batch_size):
            batch = temp_records[i:i + batch_size]
            logging.info(f"Inserting batch {i//batch_size + 1} ({len(batch)} records)...")
            
            response = supabase.table('temp_participants').insert(batch).execute()
            total_inserted += len(batch)
            logging.info(f"Inserted {len(batch)} records")
        
        logging.info("=" * 60)
        logging.info("✅ Successfully pushed %d participants to temp_participants table!", total_inserted)
        logging.info("=" * 60)
        return 0
        
    except Exception as e:
        logging.exception("Error during Supabase operations: %s", e)
        return 1

if __name__ == "__main__":
    exit(main())
