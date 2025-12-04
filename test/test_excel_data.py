"""
Test to check Excel data and column detection
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
import os
from scrapper.fetch_excel import download_excel_to_df

load_dotenv(dotenv_path="config/.env")

drive_link = os.getenv("DRIVE_XLSX_LINK")
print(f"Downloading from: {drive_link}\n")

df = download_excel_to_df(drive_link)

print(f"✅ Downloaded {len(df)} rows")
print(f"✅ {len(df.columns)} columns\n")

print("Columns:")
for i, col in enumerate(df.columns, 1):
    print(f"  {i}. {col[:80]}{'...' if len(col) > 80 else ''}")

# Try to find profile URL column
print("\n" + "=" * 60)
print("Looking for Profile URL column...")
print("=" * 60)

for col in df.columns:
    col_lower = col.lower()
    if "cloudskillsboost" in col_lower or "public_profiles" in col_lower or "profile url" in col_lower:
        print(f"✅ Found by name: '{col[:80]}'")
        print(f"\nSample values:")
        for val in df[col].dropna().head(3):
            print(f"  - {val}")
        break
else:
    # Check data content
    print("Checking column content for URLs...")
    for col in df.columns:
        sample_values = df[col].dropna().head(5)
        url_count = sum(1 for val in sample_values if isinstance(val, str) and "cloudskillsboost.google" in val.lower())
        if url_count > 0:
            print(f"✅ Found by content: '{col[:80]}'")
            print(f"   Contains {url_count} URLs in sample\n")
            print(f"Sample values:")
            for val in sample_values[:3]:
                if isinstance(val, str) and "cloudskillsboost" in val.lower():
                    print(f"  - {val}")
            break
    else:
        print("❌ No profile URL column found!")
        print("\nLast column (fallback):")
        print(f"Column name: {df.columns[-1]}")
        print("Sample values:")
        for val in df[df.columns[-1]].dropna().head(3):
            print(f"  - {val}")
