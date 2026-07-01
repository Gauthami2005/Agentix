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

                if "graph" in task_lower:
                    return func("graph")

                elif "array" in task_lower:
                    return func("array")

                elif "tree" in task_lower:
                    return func("tree")

                else:
                    return func("dynamic-programming")

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

    return f"No suitable tool found for: {selected_tool}"
