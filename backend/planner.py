from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

from mcp.roadmap_manager import save_roadmap

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY")
)


def planner_node(state):
    print("\n--- Planner Node ---")

    task = state["task"]

    prompt = f"""
You are an expert AI Study Planner. Parse the user's intent and extract a standardized, professional curriculum structure.
Create a detailed, clean study roadmap for the following goal:

Goal: {task}

You MUST respond using a strict JSON schema and nothing else.
Strict JSON Schema:
{{
  "roadmap_title": "string (e.g., 'Dynamic Programming Mastery')",
  "duration": "string (e.g., '30 Days')",
  "phases": [
    {{
      "phase_title": "string (e.g., 'Phase 1: Foundations')",
      "description": "string (brief summary of this phase's goals)",
      "core_topics": [
        "string (topic 1, e.g., 'Memoization vs Tabulation')",
        "string (topic 2, e.g., '1D DP Basics')"
      ]
    }}
  ]
}}

Rules:
Strip out any conversational filler, introductory remarks, markdown formatting symbols, or chat history. Output only the pure structured JSON metadata. Ensure it is valid, parseable JSON.
"""

    response = llm.invoke(prompt)
    content = response.content.strip()

    import re
    if "```" in content:
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
        if match:
            content = match.group(1).strip()

    roadmap = content

    title = task
    try:
        import json
        parsed_data = json.loads(roadmap)
        if isinstance(parsed_data, dict) and "roadmap_title" in parsed_data:
            title = parsed_data["roadmap_title"]
    except Exception:
        pass

    save_roadmap(title, roadmap)

    return {
        "plan": roadmap
    }