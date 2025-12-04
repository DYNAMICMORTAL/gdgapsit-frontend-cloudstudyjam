"""
Quick test to verify badge scraping works for a single profile
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from scrapper.scrapper import scrape_profile_badges
import logging

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [%(levelname)s] %(message)s")

# Test with the profile from the screenshot
test_url = "https://www.cloudskillsboost.google/public_profiles/64d1273f-91fe-444f-a7ca-e592bdef4557"

print("=" * 60)
print(f"Testing badge scraping for: {test_url}")
print("=" * 60)

badges = scrape_profile_badges(test_url)

print(f"\n✅ Found {len(badges)} badge(s):\n")
for i, badge in enumerate(badges, 1):
    print(f"{i}. {badge['badge_name']}")
    print(f"   Earned: {badge['earned_date_raw']}")
    print(f"   Parsed: {badge['earned_date']}")
    print()

if not badges:
    print("❌ No badges found! Check the HTML parsing logic.")
    print("\nTip: The page might be using JavaScript to load badges.")
    print("Try setting USE_PLAYWRIGHT_FALLBACK=true in .env")
else:
    print(f"✅ Successfully extracted {len(badges)} badge(s)!")
