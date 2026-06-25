from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

from mcp.roadmap_manager import save_roadmap

# Load environment variables
load_dotenv()

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY")
)


def planner_node(state):
    print("\n--- Planner Node ---")

    task = state["task"]

    prompt = f"""
You are an expert AI Study Planner.

Create a detailed roadmap for the following goal:

{task}

The roadmap should include:
- Weekly breakdown
- Topics to study
- Recommended practice
- Revision plan
- Interview preparation tips

Make the roadmap clear and structured using headings and bullet points.
"""

    response = llm.invoke(prompt)

    roadmap = response.content

    # Save roadmap for later use
    save_roadmap(task, roadmap)

    return {
        "plan": roadmap
    }