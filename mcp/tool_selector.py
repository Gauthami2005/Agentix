from planner import llm
from mcp.tool_registry import TOOLS


def select_tool(task):

    tool_descriptions = ""

    for tool in TOOLS:

        tool_descriptions += (
            f"{tool['name']} : "
            f"{tool['description']}\n"
        )

    prompt = f"""
    User task:
    {task}

    Available tools:
    {tool_descriptions}

    IMPORTANT:
    Return ONLY ONE EXACT tool name.

    Example:
    leetcode_search

    Do not explain anything.
    """

    response = llm.invoke(prompt)

    selected_tool = response.content.strip()

    print("AI Selected:", selected_tool)

    return selected_tool