
import requests


TOPIC_MAP = {
    "array": "",
    "arrays": "",
    "graph": "",
    "graphs": "",
    "tree": "",
    "trees": "",
    "dp": "",
    "dynamic programming": ""
}


def search_problems(topic):

    url = "https://leetcode.com/api/problems/all/"

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    try:

        response = requests.get(url, headers=headers)

        data = response.json()

        questions = data["stat_status_pairs"]

        results = []

        for q in questions[:15]:

            title = q["stat"]["question__title"]

            difficulty_num = q["difficulty"]["level"]

            if difficulty_num == 1:
                difficulty = "Easy"

            elif difficulty_num == 2:
                difficulty = "Medium"

            else:
                difficulty = "Hard"

            results.append(
                f"{title} ({difficulty})"
            )

        return results

    except Exception as e:

        return [f"Error: {str(e)}"]
