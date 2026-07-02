from mcp.tool_registry import TOOLS
from mcp.tool_selector import select_tool


def execute_tool(task):

    selected_tool = select_tool(task)

    selected_tool = selected_tool.strip().lower()

    print("Selected Tool:", selected_tool)

    task_lower = task.lower()

    for tool in TOOLS:

        tool_name = tool["name"].strip().lower()

        if tool_name == selected_tool:

            func = tool["function"]

            # Browser Automation MCP
            if selected_tool == "browser_automation":
                from planner import llm
                parsing_prompt = f"""
                Analyze the user task and extract:
                1. The browser automation intent. Choose from: 'solve_leetcode', 'find_neetcode', or 'save_progress'.
                   - If the user wants to solve, open, check, or code a LeetCode problem, use 'solve_leetcode'.
                   - If the user wants a NeetCode solution, solution video, or explanation code, use 'find_neetcode'.
                   - If the user wants to save progress or bookmark, use 'save_progress'.
                2. The specific LeetCode problem name (e.g., 'Two Sum', 'Binary Tree Inorder Traversal', 'Edit Distance').

                User task: "{task}"

                Return ONLY a string in the format: intent_type|problem_name. Do not include any other text.
                Example: solve_leetcode|Two Sum
                """
                try:
                    res = llm.invoke(parsing_prompt).content.strip()
                    parts = res.split("|")
                    intent_type = parts[0].strip()
                    problem_name = parts[1].strip() if len(parts) > 1 else ""
                except Exception:
                    intent_type = "solve_leetcode"
                    problem_name = task
                return func(intent_type, problem_name, task)

            # LeetCode Search MCP
            elif selected_tool == "leetcode_search":

                if "graph" in task_lower:
                    return func("graph")

                elif "array" in task_lower:
                    return func("array")

                elif "tree" in task_lower:
                    return func("tree")

                else:
                    return func("dynamic-programming")

            # Daily Task MCP
            elif selected_tool == "daily_task":
                return func()

            # Daily Scheduler MCP
            elif selected_tool == "daily_scheduler":
                return func()

            # YouTube Search MCP
            elif selected_tool == "youtube_search":
                return func(task)

    return f"No suitable tool found for: {selected_tool}"
