import sys
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

if not os.environ.get("GROQ_API_KEY"):
    print("ERROR: GROQ_API_KEY environment variable is not set. Please check your .env file.", file=sys.stderr)

from langgraph.graph import StateGraph, END
from typing import TypedDict

from planner import planner_node
from tools.tool_node import tool_node
from evaluator import evaluator_node

class AgentState(TypedDict):
    task: str
    plan: str
    result: str
    status: str
    iteration: int

workflow = StateGraph(AgentState)

workflow.add_node("planner", planner_node)
workflow.add_node("tool", tool_node)
workflow.add_node("evaluator", evaluator_node)

workflow.set_entry_point("planner")

workflow.add_edge("planner", "tool")
workflow.add_edge("tool", "evaluator")

def decide(state):
    if state["status"] == "done":
        return END
    return "planner"

workflow.add_conditional_edges("evaluator", decide)

app = workflow.compile()

if __name__ == "__main__":
    result = app.invoke({
        "task": "Prepare for DSA interview",
        "iteration": 1
    })
    
    print("\nFinal State:", result)