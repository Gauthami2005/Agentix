from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import os
import urllib.parse
import webbrowser

# Global variable to hold driver reference
_driver = None

def get_driver():
    global _driver
    if _driver is None:
        try:
            options = webdriver.ChromeOptions()
            options.add_argument("--start-maximized")
            
            # Use persistent browser profile so the user stays logged in or can bookmark
            user_data_dir = os.path.expanduser("~/.agentix_browser_profile")
            options.add_argument(f"--user-data-dir={user_data_dir}")
            
            # Disable automation banner/restrictions so it acts like a normal browser
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)
            
            service = Service(ChromeDriverManager().install())
            _driver = webdriver.Chrome(service=service, options=options)
        except Exception as e:
            print(f"Error starting Selenium driver: {e}")
            _driver = None
    return _driver

def execute_browser_workflow(intent_type: str, problem_name: str = "") -> str:
    """
    Executes real-time browser automation based on intent_type.
    - solve_leetcode: open specific coding problem.
    - find_neetcode: open NeetCode solution page.
    - save_progress: bookmark page or handle logged-in session.
    """
    intent = intent_type.strip().lower()
    prob = problem_name.strip()
    
    print(f"Executing browser workflow: {intent} for problem: {prob}")
    
    if intent == "solve_leetcode":
        url = "https://www.google.com/search?q=" + urllib.parse.quote(f"{prob} LeetCode")
        driver = get_driver()
        if driver:
            try:
                driver.get(url)
                time.sleep(2)
                links = driver.find_elements("xpath", "//a[contains(@href, 'leetcode.com/problems/')]")
                if links:
                    links[0].click()
                    return f"Successfully opened LeetCode problem page for '{prob}' via Selenium."
                else:
                    formatted_prob = prob.lower().replace(" ", "-")
                    direct_url = f"https://leetcode.com/problems/{formatted_prob}/"
                    driver.get(direct_url)
                    return f"Directly loaded LeetCode problem page for '{prob}' via Selenium."
            except Exception as e:
                webbrowser.open(url)
                return f"Browser Automation failed: {e}. Default browser opened search query instead."
        else:
            webbrowser.open(url)
            return f"Opened search query for '{prob}' LeetCode in default system browser."
            
    elif intent == "find_neetcode":
        url = "https://www.google.com/search?q=" + urllib.parse.quote(f"NeetCode {prob}")
        driver = get_driver()
        if driver:
            try:
                driver.get(url)
                time.sleep(2)
                links = driver.find_elements("xpath", "//a[contains(@href, 'neetcode.io') or contains(@href, 'youtube.com')]")
                if links:
                    links[0].click()
                    return f"Successfully opened NeetCode solution for '{prob}' via Selenium."
                else:
                    youtube_url = f"https://www.youtube.com/results?search_query=neetcode+{urllib.parse.quote(prob)}"
                    driver.get(youtube_url)
                    return f"Loaded YouTube search results for '{prob}' solution via Selenium."
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
