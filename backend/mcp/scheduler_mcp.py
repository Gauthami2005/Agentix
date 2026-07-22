from datetime import datetime
from mcp.db import get_db
from mcp.roadmap_manager import get_latest_roadmap

def save_schedule(data):
    try:
        db = get_db()
        db["schedules"].delete_many({})
        db["schedules"].insert_one({
            "taskQueue": data.get("today", []),
            "today": data.get("today", []),
            "tomorrow": data.get("tomorrow", []),
            "reminders": [],
            "createdAt": datetime.utcnow()
        })
    except Exception as e:
        print(f"Error saving schedule: {e}")

def create_schedule(today, tomorrow=None):
    if tomorrow is None:
        tomorrow = []

    data = {
        "today": [
            {"task": task, "completed": False}
            for task in today
        ],
        "tomorrow": [
            {"task": task, "completed": False}
            for task in tomorrow
        ]
    }
    save_schedule(data)

def generate_schedule():
    """Generates today's and tomorrow's study schedule from the active learning roadmap."""
    try:
        roadmap = get_latest_roadmap()
        if not roadmap:
            create_schedule([], [])
            return {"today": [], "tomorrow": []}

        lines = [line.strip() for line in roadmap.split("\n") if line.strip()]
        today_tasks = lines[:3]
        tomorrow_tasks = lines[3:6]

        create_schedule(today_tasks, tomorrow_tasks)

        return {
            "today": today_tasks,
            "tomorrow": tomorrow_tasks
        }
    except Exception as e:
        print(f"Error generating schedule: {e}")
        try:
            create_schedule([], [])
        except Exception:
            pass
        return {"today": [], "tomorrow": []}
