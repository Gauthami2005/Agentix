from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import os
import urllib.parse
import webbrowser
import re
import requests

# Global variable to hold driver reference
_driver = None
_leetcode_cache = None

def get_leetcode_problems():
    global _leetcode_cache
    if _leetcode_cache is not None:
        return _leetcode_cache
    try:
        url = "https://leetcode.com/api/problems/all/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            pairs = data.get("stat_status_pairs", [])
            _leetcode_cache = pairs
            print(f"Successfully fetched and cached {len(_leetcode_cache)} LeetCode problems.")
            return _leetcode_cache
    except Exception as e:
        print(f"Error fetching LeetCode API: {e}")
    return []

def resolve_by_number(num: int) -> str:
    pairs = get_leetcode_problems()
    for q in pairs:
        stat = q.get("stat", {})
        q_id = stat.get("frontend_question_id") or stat.get("question_id")
        if q_id == num:
            return stat.get("question__title_slug")
    return None

def generate_slug(text: str) -> str:
    cleaned = re.sub(r'[^\w\s-]', '', text).strip().lower()
    slug = re.sub(r'[\s_]+', '-', cleaned)
    
    translations = {
        "two-sum": "two-sum",
        "three-sum": "3sum",
        "four-sum": "4sum",
        "wiggle-sort-two": "wiggle-sort-ii",
        "wiggle-sort-one": "wiggle-sort",
        "valid-parentheses": "valid-parentheses"
    }
    if slug in translations:
        return translations[slug]
    
    text_to_roman = {
        "-one": "",
        "-two": "-ii",
        "-three": "-iii",
        "-four": "-iv",
        "-five": "-v",
    }
    for word, roman in text_to_roman.items():
        if slug.endswith(word):
            slug = slug[:-len(word)] + roman
            break
            
    return slug

def resolve_by_title(text: str) -> str:
    slug = generate_slug(text)
    pairs = get_leetcode_problems()
    for q in pairs:
        stat = q.get("stat", {})
        title_slug = stat.get("question__title_slug")
        if title_slug == slug:
            return title_slug
            
    cleaned_text = re.sub(r'[^\w\s]', '', text).strip().lower()
    for q in pairs:
        stat = q.get("stat", {})
        title = stat.get("question__title", "").lower()
        cleaned_title = re.sub(r'[^\w\s]', '', title).strip().lower()
        if cleaned_title == cleaned_text:
            return stat.get("question__title_slug")
            
    return slug

def get_driver():
    global _driver
    if _driver is None:
        try:
            options = webdriver.ChromeOptions()
            options.add_argument("--start-maximized")
            
           
            user_data_dir = os.path.expanduser("~/.agentix_browser_profile")
            options.add_argument(f"--user-data-dir={user_data_dir}")
            
            
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option("useAutomationExtension", False)
            
            options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            
            service = Service(ChromeDriverManager().install())
            _driver = webdriver.Chrome(service=service, options=options)
            
            _driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            })
        except Exception as e:
            print(f"Error starting Selenium driver: {e}")
            _driver = None
    return _driver

def execute_browser_workflow(intent_type: str, problem_name: str = "", user_message: str = "") -> str:
    """
    Executes real-time browser automation based on intent_type.
    - solve_leetcode: open specific coding problem.
    - find_neetcode: open NeetCode solution page.
    - save_progress: bookmark page or handle logged-in session.
    """
    intent = intent_type.strip().lower()
    prob = problem_name.strip()
    full_message = user_message.strip() if user_message else prob
    
    print(f"Executing browser workflow: {intent} for problem: {prob} (Message: {full_message})")
    
    if intent == "solve_leetcode":
        # TIER 1: FLEXIBLE NUMBER EXTRACTION (Regex Layer)
        number_match = re.search(r'\b\d+\b', full_message)
        if number_match:
            num_str = number_match.group(0)
            num = int(num_str)
            slug = resolve_by_number(num)
            if slug:
                direct_url = f"https://leetcode.com/problems/{slug}/"
                driver = get_driver()
                if driver:
                    try:
                        driver.get(direct_url)
                        return f"Parsed intent: Extracted index #{num}. Bypassing search layers to load workspace directly at {direct_url} via Selenium."
                    except Exception as e:
                        webbrowser.open(direct_url)
                        return f"Parsed intent: Extracted index #{num}. Browser automation failed: {e}. Default browser opened {direct_url}."
                else:
                    webbrowser.open(direct_url)
                    return f"Parsed intent: Extracted index #{num}. No Selenium driver available. Default browser opened {direct_url}."
        
        # TIER 2: FUZZY STRING & TITLE MATCHING (Slug Generator)
        target_name = prob if prob else full_message
        cleaned_target = re.sub(r'\b(open|solve|leetcode|question|show|find|give\s+me)\b', '', target_name, flags=re.IGNORECASE).strip()
        if not cleaned_target:
            cleaned_target = target_name
            
        slug = resolve_by_title(cleaned_target)
        if slug:
            direct_url = f"https://leetcode.com/problems/{slug}/"
            driver = get_driver()
            if driver:
                try:
                    driver.get(direct_url)
                    return f"Parsed intent: Title match '{cleaned_target}' resolved to slug '{slug}'. Directly navigating to {direct_url} via Selenium."
                except Exception as e:
                    webbrowser.open(direct_url)
                    return f"Parsed intent: Title match '{cleaned_target}' resolved to slug '{slug}'. Browser automation failed: {e}. Default browser opened {direct_url}."
            else:
                webbrowser.open(direct_url)
                return f"Parsed intent: Title match '{cleaned_target}' resolved to slug '{slug}'. No Selenium driver available. Default browser opened {direct_url}."
        
        # TIER 3: STEALTH FALLBACK WEB SEARCH (For complex open queries)
        url = "https://www.google.com/search?q=" + urllib.parse.quote(f"{full_message} LeetCode")
        driver = get_driver()
        if driver:
            try:
                driver.get(url)
                time.sleep(2)
                links = driver.find_elements("xpath", "//a[contains(@href, 'leetcode.com/problems/')]")
                if links:
                    target_link = links[0].get_attribute("href")
                    driver.get(target_link)
                    return f"Parsed intent: Abstract phrase fallback. Executing Stealth Web Search. Loaded {target_link} via Selenium."
                else:
                    fallback_slug = generate_slug(cleaned_target)
                    direct_url = f"https://leetcode.com/problems/{fallback_slug}/"
                    driver.get(direct_url)
                    return f"Parsed intent: Abstract phrase fallback. Executing Stealth Web Search. No search results found. Directly navigating to prospective slug {direct_url}."
            except Exception as e:
                webbrowser.open(url)
                return f"Parsed intent: Abstract phrase fallback. Browser automation failed: {e}. Default browser opened search query."
        else:
            webbrowser.open(url)
            return f"Parsed intent: Abstract phrase fallback. No Selenium driver available. Opened search query in default browser."
            
    elif intent == "find_neetcode":
        url = "https://www.google.com/search?q=" + urllib.parse.quote(f"NeetCode {prob}")
        driver = get_driver()
        if driver:
            try:
                driver.get(url)
                time.sleep(2)
                links = driver.find_elements("xpath", "//a[contains(@href, 'neetcode.io') or contains(@href, 'youtube.com')]")
                if links:
                    target_link = links[0].get_attribute("href")
                    driver.get(target_link)
                    return f"Parsed intent: NeetCode search. Successfully opened '{prob}' solution via Selenium."
                else:
                    youtube_url = f"https://www.youtube.com/results?search_query=neetcode+{urllib.parse.quote(prob)}"
                    driver.get(youtube_url)
                    return f"Parsed intent: NeetCode search fallback. Loaded YouTube search results for '{prob}' solution via Selenium."
            except Exception as e:
                webbrowser.open(url)
                return f"Browser Automation failed: {e}. Default browser opened search query instead."
        else:
            webbrowser.open(url)
            return f"Opened search query for NeetCode '{prob}' in default system browser."
            
    elif intent == "save_progress":
        driver = get_driver()
        if driver:
            try:
                current_url = driver.current_url
                print(f"Current URL: {current_url}")
                return f"Successfully retrieved active browser session URL: {current_url}"
            except Exception as e:
                return f"Failed to retrieve current URL: {e}"
        else:
            return "No active browser session found to save progress."
            
    return f"Unknown browser automation intent: {intent}"
