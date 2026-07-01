
from mcp.leetcode_mcp import search_problems
from mcp.browser_mcp import open_leetcode
from mcp.daily_task_mcp import today_tasks
from mcp.scheduler_mcp import generate_schedule
from mcp.adaptive_planner_mcp import adapt_schedule
from mcp.youtube_search_mcp import search_youtube_resources

TOOLS = [

    {
        "name": "leetcode_search",

        "description":
        "Searches real LeetCode problems by topic",

        "function": search_problems
    },

    {
        "name": "browser_automation",

        "description":
        "Opens LeetCode pages in browser automatically",

        "function": open_leetcode
    },
    
    {
    "name": "daily_task",
    "description": "Generate today's study tasks",
    "function": today_tasks
    },

    {
        "name": "daily_scheduler",
        "description": "Generate today's and tomorrow's structured study schedule from the active learning roadmap.",
        "function": generate_schedule
    },

    {
        "name": "adaptive_scheduler",
        "description": "Intelligently reorganize and adapt study schedule based on user performance progress.",
        "function": adapt_schedule
    },

    {
        "name": "youtube_search",
        "description": "Searches educational videos and playlists on YouTube for learning technical concepts.",
        "function": search_youtube_resources
    }

]
