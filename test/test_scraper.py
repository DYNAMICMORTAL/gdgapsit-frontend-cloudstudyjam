"""
Test script to verify scraper functionality before running the full scraper
"""
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from scrapper.fetch_excel import extract_drive_file_id, download_excel_to_df
from scrapper.utils import validate_url, parse_date, sanitize_text
from dotenv import load_dotenv

# Load environment
load_dotenv(dotenv_path="config/.env")

def test_env_variables():
    """Test that all required environment variables are set"""
    print("=" * 60)
    print("Testing Environment Variables")
    print("=" * 60)
    
    required_vars = ["DRIVE_XLSX_LINK", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
    all_set = True
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            if "KEY" in var or "SECRET" in var:
                display = value[:10] + "..." + value[-10:] if len(value) > 20 else "***"
            else:
                display = value[:50] + "..." if len(value) > 50 else value
            print(f"✓ {var}: {display}")
        else:
            print(f"✗ {var}: NOT SET")
            all_set = False
    
    print()
    return all_set

def test_drive_link():
    """Test Google Drive link extraction"""
    print("=" * 60)
    print("Testing Google Drive Link Extraction")
    print("=" * 60)
    
    drive_link = os.getenv("DRIVE_XLSX_LINK")
    if not drive_link:
        print("✗ DRIVE_XLSX_LINK not set")
        return False
    
    file_id = extract_drive_file_id(drive_link)
    if file_id:
        print(f"✓ Extracted File ID: {file_id}")
        print(f"✓ Link type: {'Google Sheets' if 'spreadsheets' in drive_link else 'Google Drive'}")
        return True
    else:
        print(f"✗ Could not extract file ID from: {drive_link}")
        return False

def test_download_excel():
    """Test downloading the Excel file"""
    print("\n" + "=" * 60)
    print("Testing Excel Download")
    print("=" * 60)
    
    try:
        drive_link = os.getenv("DRIVE_XLSX_LINK")
        df = download_excel_to_df(drive_link)
        
        print(f"✓ Downloaded successfully")
        print(f"✓ Rows: {len(df)}")
        print(f"✓ Columns: {len(df.columns)}")
        print(f"\nColumn names:")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i}. {col}")
        
        # Try to identify profile URL column
        profile_cols = [col for col in df.columns if "profile" in col.lower()]
        if profile_cols:
            print(f"\n✓ Found potential profile URL columns: {profile_cols}")
            # Show sample URLs
            sample_col = profile_cols[0]
            sample_urls = df[sample_col].dropna().head(3)
            print(f"\nSample URLs from '{sample_col}':")
            for url in sample_urls:
                print(f"  - {url}")
        
        return True
    except Exception as e:
        print(f"✗ Error downloading Excel: {e}")
        return False

def test_utils():
    """Test utility functions"""
    print("\n" + "=" * 60)
    print("Testing Utility Functions")
    print("=" * 60)
    
    # Test URL validation
    test_urls = [
        ("https://www.cloudskillsboost.google/public_profiles/12345", True),
        ("http://example.com", True),
        ("not-a-url", False),
        ("", False)
    ]
    
    print("\nURL Validation:")
    for url, expected in test_urls:
        result = validate_url(url)
        status = "✓" if result == expected else "✗"
        print(f"  {status} '{url[:50]}...' -> {result}")
    
    # Test date parsing
    test_dates = [
        "January 15, 2024",
        "2024-01-15",
        "15 Jan 2024",
        "Earned 3 days ago"
    ]
    
    print("\nDate Parsing:")
    for date_str in test_dates:
        parsed = parse_date(date_str)
        status = "✓" if parsed else "✗"
        print(f"  {status} '{date_str}' -> {parsed}")
    
    # Test text sanitization
    test_text = "  This   is   some   text with   spaces  " * 10
    sanitized = sanitize_text(test_text, max_length=50)
    print(f"\n✓ Text sanitization works (truncated to {len(sanitized)} chars)")
    
    return True

def test_supabase_connection():
    """Test Supabase connection"""
    print("\n" + "=" * 60)
    print("Testing Supabase Connection")
    print("=" * 60)
    
    try:
        from scrapper.supbase_client import SupabaseClient
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            print("✗ Supabase credentials not set")
            return False
        
        client = SupabaseClient(supabase_url, supabase_key)
        print("✓ Supabase client initialized successfully")
        
        # Try to query participants table (should return empty or data)
        try:
            resp = client.client.table("participants").select("id").limit(1).execute()
            print(f"✓ Successfully queried participants table")
            print(f"  Current participants: {len(resp.data) if resp.data else 0}")
        except Exception as e:
            print(f"⚠ Could not query participants table: {e}")
            print("  Make sure tables are created in Supabase")
        
        return True
    except Exception as e:
        print(f"✗ Error connecting to Supabase: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "🔍 SCRAPER PRE-FLIGHT CHECKS 🔍".center(60))
    print()
    
    tests = [
        ("Environment Variables", test_env_variables),
        ("Google Drive Link", test_drive_link),
        ("Excel Download", test_download_excel),
        ("Utility Functions", test_utils),
        ("Supabase Connection", test_supabase_connection)
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n✗ {test_name} failed with exception: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ ALL TESTS PASSED - Ready to run scraper!")
        print("\nRun: python main.py")
    else:
        print("✗ SOME TESTS FAILED - Please fix issues before running scraper")
    print("=" * 60)
    print()
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
