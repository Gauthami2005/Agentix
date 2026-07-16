import urllib.request
import urllib.parse
import re
import json

CURATED_FALLBACKS = [
    {
        "keywords": ["graph", "bfs", "dfs", "dijkstra", "kruskal", "prim"],
        "video_title": "L1. Introduction to Graph | Types | Adjacency Matrix and List",
        "channel_name": "take U forward",
        "video_id": "M3_pLsDdeuU",
        "embed_url": "https://www.youtube.com/embed/M3_pLsDdeuU"
    },
    {
        "keywords": ["graph", "bfs", "dfs", "dijkstra", "kruskal", "prim"],
        "video_title": "Graph Algorithms for Technical Interviews - BFS, DFS, Dijkstra",
        "channel_name": "freeCodeCamp.org",
        "video_id": "tWVWeP39XHY",
        "embed_url": "https://www.youtube.com/embed/tWVWeP39XHY"
    },
    {
        "keywords": ["dp", "dynamic programming", "memoization", "tabulation", "fibonacci", "knapsack"],
        "video_title": "Dynamic Programming - Learn to Solve Algorithmic Problems & Coding Challenges",
        "channel_name": "freeCodeCamp.org",
        "video_id": "oBt53YbR9Kk",
        "embed_url": "https://www.youtube.com/embed/oBt53YbR9Kk"
    },
    {
        "keywords": ["dp", "dynamic programming", "knapsack"],
        "video_title": "0/1 Knapsack Top Down & Bottom Up Dynamic Programming",
        "channel_name": "Aditya Verma",
        "video_id": "ntCGbPMeqgg",
        "embed_url": "https://www.youtube.com/embed/ntCGbPMeqgg"
    },
    {
        "keywords": ["array", "sorting", "binary search", "two sum"],
        "video_title": "Binary Search - LeetCode 704 - Python",
        "channel_name": "NeetCode",
        "video_id": "SFD5Klxn96s",
        "embed_url": "https://www.youtube.com/embed/SFD5Klxn96s"
    },
    {
        "keywords": ["tree", "binary tree", "bst", "traversal"],
        "video_title": "Binary Tree Inorder Traversal - LeetCode 94 - Python",
        "channel_name": "NeetCode",
        "video_id": "g_S5WuasWUE",
        "embed_url": "https://www.youtube.com/embed/g_S5WuasWUE"
    }
]

def search_youtube_resources(topic_query: str) -> str:
    """Searches YouTube for high-quality educational videos on the given topic."""
    query = topic_query.strip()
    if not query:
        return json.dumps([])

    try:
        encoded_query = urllib.parse.quote(query + " educational tutorial")
        url = f"https://www.youtube.com/results?search_query={encoded_query}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            html = response.read().decode('utf-8')

        pattern = r"ytInitialData\s*=\s*(\{.*?\});"
        match = re.search(pattern, html)
        if not match:
            pattern_script = r"var ytInitialData\s*=\s*(\{.*?\});"
            match = re.search(pattern_script, html)

        videos = []
        if match:
            data = json.loads(match.group(1))
            contents = data.get("contents", {}).get("twoColumnSearchResultsRenderer", {}).get("primaryContents", {}).get("sectionListRenderer", {}).get("contents", [])
            for content in contents:
                item_section = content.get("itemSectionRenderer", {})
                for item in item_section.get("contents", []):
                    video_renderer = item.get("videoRenderer")
                    if video_renderer:
                        video_id = video_renderer.get("videoId")
                        title_runs = video_renderer.get("title", {}).get("runs", [{}])
                        title = title_runs[0].get("text") if title_runs else None
                        owner_runs = video_renderer.get("ownerText", {}).get("runs", [{}])
                        channel_name = owner_runs[0].get("text") if owner_runs else "YouTube Resource"
                        if video_id and title:
                            videos.append({
                                "video_title": title,
                                "channel_name": channel_name,
                                "video_id": video_id,
                                "embed_url": f"https://www.youtube.com/embed/{video_id}"
                            })
                    if len(videos) >= 5:
                        break
                if len(videos) >= 5:
                    break

        if videos:
            return json.dumps(videos, indent=2)

    except Exception as e:
        print(f"Live YouTube search error: {e}")

    query_lower = query.lower()
    matches = []
    for item in CURATED_FALLBACKS:
        for kw in item["keywords"]:
            if kw in query_lower:
                matches.append({
                    "video_title": item["video_title"],
                    "channel_name": item["channel_name"],
                    "video_id": item["video_id"],
                    "embed_url": item["embed_url"]
                })
                break
        if len(matches) >= 3:
            break

    if not matches:
        matches = [
            {
                "video_title": "Graph Algorithms for Technical Interviews",
                "channel_name": "freeCodeCamp.org",
                "video_id": "tWVWeP39XHY",
                "embed_url": "https://www.youtube.com/embed/tWVWeP39XHY"
            },
            {
                "video_title": "Dynamic Programming Learn to Solve Algorithmic Problems & Coding Challenges",
                "channel_name": "freeCodeCamp.org",
                "video_id": "oBt53YbR9Kk",
                "embed_url": "https://www.youtube.com/embed/oBt53YbR9Kk"
            }
        ]

    return json.dumps(matches, indent=2)
