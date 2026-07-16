from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time


def open_leetcode(topic):

    try:

        driver = webdriver.Chrome(
            service=Service(
                ChromeDriverManager().install()
            )
        )

        url = f"https://leetcode.com/tag/{topic}/"

        driver.get(url)

        time.sleep(5)

        return f"Successfully opened LeetCode {topic} page"

    except Exception as e:

        return f"Browser Error: {str(e)}"

