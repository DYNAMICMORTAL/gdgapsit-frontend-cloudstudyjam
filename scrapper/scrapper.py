import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any
import time
import logging
import dateparser
from pathlib import Path
from tqdm import tqdm
import os

REQUESTS_TIMEOUT = int(os.getenv("REQUESTS_TIMEOUT", "15"))
SLEEP_SECONDS = float(os.getenv("SLEEP_SECONDS", "2"))
USE_PLAYWRIGHT_FALLBACK = os.getenv("USE_PLAYWRIGHT_FALLBACK", "true").lower() in ("1","true","yes")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def parse_badges_from_soup(soup: BeautifulSoup) -> List[Dict[str, str]]:
    """
    Inspect the Cloud Skills Boost public profile structure and extract badges.
    Based on actual HTML structure from skills.google.com/public_profiles/
    """
    badges = []
    
    # Cloud Skills Boost uses div.profile-badge for each badge
    badge_elements = soup.select("div.profile-badge")
    
    if badge_elements:
        logging.debug("Found %d badge elements using div.profile-badge", len(badge_elements))
        for badge_el in badge_elements:
            # Extract badge name from span.ql-title-medium (inside the badge)
            name_el = badge_el.find("span", class_=lambda x: x and "ql-title-medium" in x)
            if not name_el:
                # Fallback to any title-like span
                name_el = badge_el.find("span", class_=lambda x: x and "title" in str(x).lower())
            
            badge_name = name_el.get_text(strip=True) if name_el else None
            
            # Extract earned date from span.ql-body-medium containing "Earned"
            date_el = badge_el.find("span", class_=lambda x: x and "ql-body-medium" in x)
            date_text = None
            if date_el:
                date_text = date_el.get_text(strip=True)
                # Clean up text like "Earned Oct 21, 2025 EDT" to just the date part
                if "Earned" in date_text:
                    date_text = date_text.replace("Earned", "").strip()
            
            # Parse the date
            parsed_date = None
            if date_text:
                try:
                    parsed_date = dateparser.parse(date_text)
                except Exception as e:
                    logging.debug("Failed to parse date '%s': %s", date_text, e)
            
            # Only add if we have a badge name
            if badge_name and len(badge_name) > 3:
                badges.append({
                    "badge_name": badge_name,
                    "earned_date_raw": date_text,
                    "earned_date": parsed_date.isoformat() if parsed_date else None
                })
                logging.debug("Extracted badge: %s (earned: %s)", badge_name, date_text)
    
    # Fallback: Try alternate selectors if profile-badge didn't work
    if not badges:
        logging.debug("No badges found with div.profile-badge, trying fallback selectors")
        
        # Try profile-badges container
        badges_container = soup.find("div", class_="profile-badges")
        if badges_container:
            # Look for any elements with badge in the class name
            badge_elements = badges_container.find_all("div", class_=lambda x: x and "badge" in str(x).lower())
            for badge_el in badge_elements:
                # Extract any text that looks like a title
                name_el = badge_el.find(["span", "h3", "h4", "div"], class_=lambda x: x and ("title" in str(x).lower() or "medium" in str(x).lower()))
                if name_el:
                    badge_name = name_el.get_text(strip=True)
                    if badge_name and len(badge_name) > 3:
                        badges.append({
                            "badge_name": badge_name,
                            "earned_date_raw": None,
                            "earned_date": None
                        })
    
    # Another fallback: Look for ql-button elements with "Learn more" that are near badge info
    if not badges:
        logging.debug("Trying ql-button fallback")
        learn_more_buttons = soup.find_all("ql-button", attrs={"aria-label": lambda x: x and "Learn more" in str(x)})
        for button in learn_more_buttons:
            # Get the parent container
            parent = button.find_parent("div")
            if parent:
                # Look for title
                name_el = parent.find("span", class_=lambda x: x and "title" in str(x).lower())
                if name_el:
                    badge_name = name_el.get_text(strip=True)
                    # Look for earned date
                    date_el = parent.find("span", class_=lambda x: x and "body" in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else None
                    if date_text and "Earned" in date_text:
                        date_text = date_text.replace("Earned", "").strip()
                    
                    parsed_date = None
                    if date_text:
                        try:
                            parsed_date = dateparser.parse(date_text)
                        except:
                            pass
                    
                    if badge_name and len(badge_name) > 3:
                        badges.append({
                            "badge_name": badge_name,
                            "earned_date_raw": date_text,
                            "earned_date": parsed_date.isoformat() if parsed_date else None
                        })
    
    # De-duplicate by badge_name + date
    unique = []
    seen = set()
    for b in badges:
        key = (b.get("badge_name"), b.get("earned_date_raw"))
        if key not in seen:
            unique.append(b)
            seen.add(key)
    
    logging.info("Extracted %d unique badges", len(unique))
    return unique

def fetch_with_requests(url: str) -> str | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=REQUESTS_TIMEOUT)
        if r.status_code == 200:
            return r.text
        logging.warning("Requests fetch non-200: %s -> %s", url, r.status_code)
        return None
    except Exception as e:
        logging.exception("Requests fetch failed: %s", e)
        return None

def fetch_with_playwright(url: str) -> str | None:
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
            page = browser.new_page()
            page.goto(url, timeout=30000)
            # wait briefly for network to settle
            page.wait_for_load_state("networkidle", timeout=10000)
            content = page.content()
            browser.close()
            return content
    except ImportError:
        logging.warning("Playwright not installed, skipping fallback")
        return None
    except Exception as e:
        logging.exception("Playwright fetch failed: %s", e)
        return None

def scrape_profile_badges(profile_url: str) -> List[Dict[str, str]]:
    """
    Returns a list of badges (badge_name, earned_date, earned_date_raw)
    """
    if not profile_url or not profile_url.startswith("http"):
        logging.warning("Invalid profile URL: %s", profile_url)
        return []
    
    logging.debug("Scraping %s", profile_url)
    html = fetch_with_requests(profile_url)
    
    if not html and USE_PLAYWRIGHT_FALLBACK:
        logging.info("Requests failed or returned empty, trying Playwright for %s", profile_url)
        html = fetch_with_playwright(profile_url)
    
    if not html:
        logging.error("Could not fetch profile: %s", profile_url)
        return []
    
    soup = BeautifulSoup(html, "html.parser")
    badges = parse_badges_from_soup(soup)
    return badges

def scrape_profile_badges_for_list(participants: List[Dict[str, str]]) -> List[Dict]:
    """
    Accepts list of participants (each with name,email,profile_url) and returns list of results:
    [
      {
        "name": "...",
        "email": "...",
        "profile_url": "...",
        "badges": [ {badge_name, earned_date, earned_date_raw}, ... ],
        "error": None or text
      },
      ...
    ]
    """
    results = []
    logging.info("Beginning scrape of %d profiles", len(participants))
    
    for p in tqdm(participants, desc="Scraping profiles"):
        url = p.get("profile_url", "")
        try:
            badges = scrape_profile_badges(url)
            results.append({
                "name": p.get("name"),
                "email": p.get("email"),
                "profile_url": url,
                "badges": badges,
                "error": None
            })
            logging.info("Scraped %s: found %d badges", p.get("name"), len(badges))
        except Exception as e:
            logging.exception("Failed scraping %s", url)
            results.append({
                "name": p.get("name"),
                "email": p.get("email"),
                "profile_url": url,
                "badges": [],
                "error": str(e)
            })
        
        # Rate limiting
        time.sleep(SLEEP_SECONDS)
    
    return results
