from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv('config/.env')
client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# Check participants
participants = client.table('participants').select('*').order('rank').limit(10).execute()
print(f'✅ Top 10 Participants:')
for p in participants.data:
    print(f'  Rank #{p["rank"]}: {p["full_name"]} - {p["total_badges"]} badges')

print()

# Check total counts
total_participants = client.table('participants').select('id', count='exact').execute()
total_badges = client.table('badges').select('id', count='exact').execute()
total_runs = client.table('runs').select('id', count='exact').execute()
total_snapshots = client.table('leaderboard_snapshot').select('id', count='exact').execute()

print(f'📊 Database Summary:')
print(f'  ✅ Participants: {total_participants.count} records')
print(f'  ✅ Badges: {total_badges.count} records')
print(f'  ✅ Runs: {total_runs.count} records')
print(f'  ✅ Snapshots: {total_snapshots.count} records')
