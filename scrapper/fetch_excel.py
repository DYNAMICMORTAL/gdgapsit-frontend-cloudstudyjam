import re
import requests
from io import BytesIO
import pandas as pd
import logging

def extract_drive_file_id(url: str) -> str | None:
    """
    Extracts the file id from common Google Drive share link forms.
    Also handles Google Sheets URLs.
    """
    if not url:
        return None
    # formats:
    # https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    m = re.search(r"/d/([a-zA-Z0-9_\-]+)", url)
    if m:
        return m.group(1)
    # alternate: open?id=FILE_ID
    m = re.search(r"id=([a-zA-Z0-9_\-]+)", url)
    if m:
        return m.group(1)
    # Google Sheets: https://docs.google.com/spreadsheets/d/FILE_ID/edit...
    m = re.search(r"/spreadsheets/d/([a-zA-Z0-9_\-]+)", url)
    if m:
        return m.group(1)
    return None

def download_excel_to_df(drive_link: str) -> pd.DataFrame:
    """
    Downloads a publicly shared Drive file or Google Sheet and returns a pandas DataFrame.
    """
    file_id = extract_drive_file_id(drive_link)
    if not file_id:
        logging.error("Could not extract drive file id from link. Please provide a share link.")
        raise ValueError("Invalid drive link")

    # Try Google Sheets export first
    if "spreadsheets" in drive_link:
        download_url = f"https://docs.google.com/spreadsheets/d/{file_id}/export?format=xlsx"
        logging.info("Downloading Google Sheet as Excel from: %s", download_url)
    else:
        download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
        logging.info("Downloading Excel from: %s", download_url)
    
    try:
        r = requests.get(download_url, stream=True, timeout=30)
        if r.status_code != 200:
            logging.error("Failed to download file, status %s", r.status_code)
            r.raise_for_status()
        content = BytesIO(r.content)
        # Try reading first sheet
        df = pd.read_excel(content, engine="openpyxl")
        logging.info("Successfully loaded DataFrame with %d rows and %d columns", len(df), len(df.columns))
        logging.info("Columns: %s", list(df.columns))
        return df
    except Exception as e:
        logging.exception("Error downloading or parsing Excel file: %s", e)
        raise
