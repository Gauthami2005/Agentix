
from mcp.leetcode_mcp import search_problems
from mcp.browser_mcp import open_leetcode
from mcp.daily_task_mcp import today_tasks
from mcp.scheduler_mcp import generate_schedule

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
    }

]
