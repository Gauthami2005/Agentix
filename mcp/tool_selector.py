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

    Guidelines:
    - If the task is a variation of schedule generation or daily study planning (e.g., "Create today's schedule", "Generate today's tasks", "Today's study plan", "What should I study today?", "Schedule my roadmap", or "Run scheduler"), return 'daily_scheduler'.
    - If the user explicitly asks to learn a technical topic, review a concept, or requests video tutorials or learning playlists (e.g., 'Teach me Graphs', 'Show me tutorials for DP', 'YouTube videos on arrays'), return 'youtube_search'.

    Example:
    leetcode_search

    Do not explain anything.
    """

    response = llm.invoke(prompt)

    selected_tool = response.content.strip()

    print("AI Selected:", selected_tool)

    return selected_tool