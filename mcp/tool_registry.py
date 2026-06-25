
from mcp.leetcode_mcp import search_problems
from mcp.browser_mcp import open_leetcode


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
    }

]
