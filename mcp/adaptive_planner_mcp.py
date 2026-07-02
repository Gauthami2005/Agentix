import json
import os
import re
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

ROADMAP_FILE = os.path.join("memory", "roadmap.json")
SCHEDULE_FILE = os.path.join("memory", "schedule.json")
PROGRESS_FILE = os.path.join("memory", "progress.json")

def load_json_file(filepath, default_value):
    if not os.path.exists(filepath):
        return default_value
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except Exception:
        return default_value

def adapt_schedule():
    """Reads roadmap.json, schedule.json, and progress.json, calls the LLM study planner to adapt tomorrow's schedule block, and persists it back to schedule.json."""
    roadmap_data = load_json_file(ROADMAP_FILE, {"roadmaps": []})
    schedule_data = load_json_file(SCHEDULE_FILE, {"today": [], "tomorrow": []})
    progress_data = load_json_file(PROGRESS_FILE, {
        "completed_tasks": 0,
        "total_tasks": 0,
        "completed_task_names": [],
        "topics": []
    })

   
    prompt = f"""
You are an AI study planner tracking Gauthami's progress. Based on the overall roadmap, today's schedule, and the exact completed vs. missed tasks in progress.json, intelligently generate a reorganized schedule block for tomorrow.
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
    
            os.makedirs(os.path.dirname(SCHEDULE_FILE), exist_ok=True)
            with open(SCHEDULE_FILE, "w") as f:
                json.dump(parsed_json, f, indent=4)
            return parsed_json
        else:
            print("Adaptive Planner MCP Error: LLM returned invalid JSON schema.")
            return schedule_data
    except Exception as e:
        print(f"Adaptive Planner MCP Exception: {e}")
        return schedule_data
