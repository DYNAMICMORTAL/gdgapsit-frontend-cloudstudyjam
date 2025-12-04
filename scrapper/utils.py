import logging
from datetime import datetime
from typing import Optional
import dateparser

def parse_date(date_string: str) -> Optional[str]:
    """
    Parse a date string and return ISO format string, or None if parsing fails
    """
    if not date_string:
        return None
    
    try:
        parsed = dateparser.parse(date_string)
        if parsed:
            return parsed.isoformat()
    except Exception as e:
        logging.debug("Failed to parse date '%s': %s", date_string, e)
    
    return None

def sanitize_text(text: str, max_length: int = 255) -> str:
    """
    Sanitize text by removing extra whitespace and limiting length
    """
    if not text:
        return ""
    
    # Remove extra whitespace
    text = " ".join(text.split())
    
    # Limit length
    if len(text) > max_length:
        text = text[:max_length-3] + "..."
    
    return text

def validate_url(url: str) -> bool:
    """
    Basic URL validation
    """
    if not url:
        return False
    
    return url.startswith("http://") or url.startswith("https://")
