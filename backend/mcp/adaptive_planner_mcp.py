import json
import os
import re
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from mcp.db import get_db
from mcp.roadmap_manager import load_roadmaps
from mcp.progress_mcp import load_progress
from mcp.scheduler_mcp import save_schedule

load_dotenv()

def get_current_schedule():
    try:
        db = get_db()
        doc = db["schedules"].find_one(sort=[("createdAt", -1)])
        if not doc:
            doc = db["schedules"].find_one()
        if doc:
            return {
                "today": doc.get("today", []),
                "tomorrow": doc.get("tomorrow", [])
            }
    except Exception as e:
        print(f"Error loading schedule for adaptation: {e}")
    return {"today": [], "tomorrow": []}

def adapt_schedule():
    """Reads roadmap, schedule, and progress from MongoDB, calls the LLM study planner to adapt tomorrow's schedule block, and persists it back to MongoDB."""
    roadmap_data = load_roadmaps()
    schedule_data = get_current_schedule()
    progress_data = load_progress()

    prompt = f"""
You are an AI study planner tracking Gauthami's progress. Based on the overall roadmap, today's schedule, and the exact completed vs. missed tasks in progress, intelligently generate a reorganized schedule block for tomorrow.
Rules: Do not overload the user. Prioritize unfinished or failed tasks (e.g., if Trees are repeatedly marked incomplete, schedule 'Trees Revision' and 'Easy Tree Problems' tomorrow and proactively shift advanced topics like Graphs or DP later into the timeline). Maintain foundational learning order. Output raw JSON only matching our schedule schema.

Active Learning Roadmap:
{json.dumps(roadmap_data, indent=2)}

Today's Schedule:
{json.dumps(schedule_data, indent=2)}

User Progress and Completed Task Names:
{json.dumps(progress_data, indent=2)}

Return ONLY a raw valid JSON string (no markdown formatting, no code block markers like ```json, no explanation text). The JSON must exactly match this schedule schema:
{{
  "today": [
    {{"task": "Task name 1", "completed": false}},
    {{"task": "Task name 2", "completed": false}}
  ],
  "tomorrow": [
    {{"task": "Task name 3", "completed": false}},
    {{"task": "Task name 4", "completed": false}}
  ]
}}
"""

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("Adaptive Planner MCP Error: GROQ_API_KEY environment variable is missing.")
        return schedule_data

    try:
        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=api_key
        )
        response = llm.invoke(prompt)
        content = response.content.strip()

        if "```" in content:
            match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
            if match:
                content = match.group(1).strip()

        parsed_json = json.loads(content)

        if isinstance(parsed_json, dict) and "today" in parsed_json and "tomorrow" in parsed_json:
            save_schedule(parsed_json)
            return parsed_json
        else:
            print("Adaptive Planner MCP Error: LLM returned invalid JSON schema.")
            return schedule_data
    except Exception as e:
        print(f"Adaptive Planner MCP Exception: {e}")
        return schedule_data
