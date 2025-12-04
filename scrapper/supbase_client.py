import os
import logging
from supabase import create_client, Client
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
import json

class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url
        self.key = key
        self.client: Client = create_client(url, key)
        logging.info("Supabase client initialized")

    def create_run(self, total_profiles: int) -> str:
        """
        Create a new run record and return the run ID
        """
        try:
            run_data = {
                "started_at": datetime.now(timezone.utc).isoformat(),
                "total_profiles": total_profiles,
                "success_count": 0,
                "failure_count": 0,
                "log": "Run started"
            }
            resp = self.client.table("runs").insert(run_data).execute()
            if resp.data and len(resp.data) > 0:
                run_id = resp.data[0].get("id")
                logging.info("Created run record with ID: %s", run_id)
                return run_id
            else:
                logging.error("Failed to create run record")
                return None
        except Exception as e:
            logging.exception("Error creating run record: %s", e)
            return None

    def complete_run(self, run_id: str, success_count: int, failure_count: int, log_msg: str):
        """
        Update run record with completion details
        """
        try:
            update_data = {
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "success_count": success_count,
                "failure_count": failure_count,
                "log": log_msg
            }
            self.client.table("runs").update(update_data).eq("id", run_id).execute()
            logging.info("Updated run record %s", run_id)
        except Exception as e:
            logging.exception("Error updating run record: %s", e)

    def upsert_participants_and_badges(self, results: List[Dict[str, Any]]) -> Tuple[int, int]:
        """
        For each participant result:
          - Upsert into participants table (match by profile_url)
          - Delete existing badges for participant (if any)
          - Insert new badges
        
        Returns (success_count, failure_count)
        """
        success_count = 0
        failure_count = 0
        
        for r in results:
            profile_url = r.get("profile_url", "")
            if not profile_url:
                logging.warning("Skipping participant with no profile URL")
                failure_count += 1
                continue
            
            try:
                # Compute rank and total badges
                badges = r.get("badges", [])
                
                # Cap badges at maximum of 19
                MAX_BADGES = 19
                if len(badges) > MAX_BADGES:
                    logging.info("Participant %s has %d badges, capping at %d", r.get("name"), len(badges), MAX_BADGES)
                    badges = badges[:MAX_BADGES]
                
                total_badges = len(badges)
                
                # Get last earned date
                earned_dates = [b.get("earned_date") for b in badges if b.get("earned_date")]
                last_earned = max(earned_dates) if earned_dates else None
                
                participant = {
                    "full_name": r.get("name"),
                    "email": r.get("email"),
                    "profile_url": profile_url,
                    "last_scraped": datetime.now(timezone.utc).isoformat(),
                    "total_badges": total_badges,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Upsert participant, returning id
                resp = self.client.table("participants").upsert(
                    participant, 
                    on_conflict="profile_url"
                ).execute()
                
                # Get participant ID
                participant_id = None
                if resp.data and len(resp.data) > 0:
                    participant_id = resp.data[0].get("id")
                else:
                    # Fallback: try to fetch by profile_url
                    q = self.client.table("participants").select("id").eq("profile_url", profile_url).execute()
                    if q.data and len(q.data) > 0:
                        participant_id = q.data[0].get("id")
                
                if not participant_id:
                    logging.error("Could not determine participant id for %s", profile_url)
                    failure_count += 1
                    continue

                # Delete old badges for this participant (we'll re-insert)
                del_resp = self.client.table("badges").delete().eq("participant_id", participant_id).execute()
                logging.debug("Deleted old badges for participant %s", participant_id)

                # Insert new badges
                badges_to_insert = []
                for b in badges:
                    rec = {
                        "participant_id": participant_id,
                        "badge_name": b.get("badge_name"),
                        "raw_date_text": b.get("earned_date_raw"),
                        "earned_date": b.get("earned_date")  # iso string or None
                    }
                    badges_to_insert.append(rec)
                
                if badges_to_insert:
                    ins = self.client.table("badges").insert(badges_to_insert).execute()
                    logging.debug("Inserted %d badges for participant %s", len(badges_to_insert), participant_id)

                # Update participant with computed fields
                upd = {
                    "total_badges": total_badges,
                    "last_scraped": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                self.client.table("participants").update(upd).eq("id", participant_id).execute()
                
                success_count += 1
                logging.info("Successfully updated participant: %s (%d badges)", r.get("name"), total_badges)
                
            except Exception as e:
                logging.exception("Failed to process participant %s: %s", profile_url, e)
                failure_count += 1
        
        # Update ranks after all participants are processed
        try:
            self._update_ranks()
        except Exception as e:
            logging.exception("Failed to update ranks: %s", e)
        
        logging.info("Finished pushing to Supabase. Success: %d, Failures: %d", success_count, failure_count)
        return success_count, failure_count

    def _update_ranks(self):
        """
        Update rank for all participants based on total_badges (desc) and last_earned (asc for ties)
        """
        try:
            # Fetch all participants ordered by badges desc, last_earned asc
            resp = self.client.table("participants").select("id, total_badges, last_scraped").order("total_badges", desc=True).order("last_scraped", desc=False).execute()
            
            if resp.data:
                rank = 1
                for p in resp.data:
                    self.client.table("participants").update({"rank": rank}).eq("id", p["id"]).execute()
                    rank += 1
                logging.info("Updated ranks for %d participants", len(resp.data))
        except Exception as e:
            logging.exception("Error updating ranks: %s", e)

    def save_leaderboard_snapshot(self, snapshot_data: Dict):
        """
        Save a snapshot of the leaderboard to leaderboard_snapshot table
        """
        try:
            snapshot = {
                "created_at": datetime.now(timezone.utc).isoformat(),
                "snapshot": json.dumps(snapshot_data)
            }
            self.client.table("leaderboard_snapshot").insert(snapshot).execute()
            logging.info("Saved leaderboard snapshot")
        except Exception as e:
            logging.exception("Error saving leaderboard snapshot: %s", e)
