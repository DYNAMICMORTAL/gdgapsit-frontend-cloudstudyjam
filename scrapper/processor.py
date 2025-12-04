import pandas as pd
from pathlib import Path
import logging
from datetime import datetime
from typing import List, Dict, Any

def build_and_save_csvs(results: List[Dict], data_dir: Path):
    """
    Build two dataframes:
      - detailed_df: one row per badge
      - summary_df: one row per participant summary
    Saves them to data_dir and returns (summary_df, detailed_df)
    """
    detailed_rows = []
    summary_rows = []
    
    for r in results:
        badges = r.get("badges", [])
        
        # Cap badges at maximum of 19
        MAX_BADGES = 19
        if len(badges) > MAX_BADGES:
            logging.info("Capping badges for %s from %d to %d", r.get("name"), len(badges), MAX_BADGES)
            badges = badges[:MAX_BADGES]
        
        # Build detailed rows (one per badge)
        for b in badges:
            earned_date = b.get("earned_date")
            try:
                earned_date_parsed = pd.to_datetime(earned_date) if earned_date else None
            except Exception:
                earned_date_parsed = None
            
            detailed_rows.append({
                "name": r.get("name"),
                "email": r.get("email"),
                "profile_url": r.get("profile_url"),
                "badge_name": b.get("badge_name"),
                "earned_date": earned_date_parsed,
                "earned_date_raw": b.get("earned_date_raw")
            })
        
        # Build summary row (one per participant)
        total_badges = len(badges)
        
        # compute latest earned date (max) and earliest (min)
        dates = []
        for b in badges:
            if b.get("earned_date"):
                try:
                    dates.append(pd.to_datetime(b.get("earned_date")))
                except:
                    pass
        
        last_earned = max(dates) if dates else None
        first_earned = min(dates) if dates else None
        
        summary_rows.append({
            "name": r.get("name"),
            "email": r.get("email"),
            "profile_url": r.get("profile_url"),
            "total_badges": total_badges,
            "last_earned": last_earned,
            "first_earned": first_earned,
            "error": r.get("error")
        })

    detailed_df = pd.DataFrame(detailed_rows)
    summary_df = pd.DataFrame(summary_rows)

    # Ranking: sort by total_badges desc, tie-breaker earliest last_earned (i.e., smaller last_earned date wins)
    if not summary_df.empty:
        # Convert all dates to UTC and remove timezone info to avoid comparison issues
        summary_df['last_earned_filled'] = summary_df['last_earned'].apply(
            lambda x: pd.Timestamp.max.tz_localize(None) if pd.isna(x) 
            else (x.tz_localize(None) if x.tz is None else x.tz_convert('UTC').tz_localize(None))
        )
        summary_df = summary_df.sort_values(by=['total_badges', 'last_earned_filled'], ascending=[False, True])
        summary_df['rank'] = range(1, len(summary_df) + 1)
        summary_df.drop(columns=['last_earned_filled'], inplace=True)

    # Save to CSV
    data_dir.mkdir(parents=True, exist_ok=True)
    summary_path = data_dir / "leaderboard_summary.csv"
    detailed_path = data_dir / "leaderboard_detailed.csv"
    summary_df.to_csv(summary_path, index=False)
    detailed_df.to_csv(detailed_path, index=False)

    logging.info("Saved summary: %s (%d rows)", summary_path, len(summary_df))
    logging.info("Saved detailed: %s (%d rows)", detailed_path, len(detailed_df))
    
    return summary_df, detailed_df

def compute_summary(results: List[Dict]) -> List[Dict]:
    """
    Build a structure suitable for upserting to database.
    For each participant return:
    {
      participant: {name,email,profile_url,total_badges,last_earned},
      badges: [ {badge_name,earned_date,earned_date_raw}, ... ]
    }
    """
    out = []
    import pandas as pd
    
    for r in results:
        badges = r.get("badges", [])
        dates = []
        for b in badges:
            if b.get("earned_date"):
                try:
                    dates.append(pd.to_datetime(b.get("earned_date")))
                except:
                    pass
        
        last_earned = max(dates).to_pydatetime().isoformat() if dates else None
        
        out.append({
            "participant": {
                "full_name": r.get("name"),
                "email": r.get("email"),
                "profile_url": r.get("profile_url"),
                "total_badges": len(badges),
                "last_earned": last_earned
            },
            "badges": badges
        })
    
    return out
