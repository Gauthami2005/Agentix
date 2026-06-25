from .tool_router import route_tool

def tool_node(state):

    print("\n--- Tool Node ---")

    task = state["task"]
    iteration = state.get("iteration", 1)

    tool_result = route_tool(task)

    result = f"{tool_result}"

    return {
        "result": result,
        "iteration": iteration + 1
    }