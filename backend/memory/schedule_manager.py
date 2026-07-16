import json
import os

SCHEDULE_FILE = os.path.join("memory", "schedule.json")


def load_schedule():
    if not os.path.exists(SCHEDULE_FILE):
        return {"today": [], "tomorrow": []}

    with open(SCHEDULE_FILE, "r") as f:
        return json.load(f)


def save_schedule(data):
    with open(SCHEDULE_FILE, "w") as f:
        json.dump(data, f, indent=4)


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


def get_today_tasks():
    return load_schedule()["today"]


def get_tomorrow_tasks():
    return load_schedule()["tomorrow"]


def complete_task(index):
    data = load_schedule()

    if 0 <= index < len(data["today"]):
        data["today"][index]["completed"] = True
        save_schedule(data)


def toggle_task(task_name, completed):
    data = load_schedule()
    target = task_name.strip()
    updated = False
    
    import re
    def clean_t(name):
        return re.sub(r'^[-*+•\s]+', '', name).strip()
        
    clean_target = clean_t(target)
    
    for item in data.setdefault("today", []):
        if clean_t(item.get("task", "")) == clean_target:
            item["completed"] = completed
            updated = True
            
    if not updated:
        data["today"].append({"task": target, "completed": completed})
        
    save_schedule(data)


def clear_schedule():
    save_schedule({
        "today": [],
        "tomorrow": []
    })
    try:
        from memory.progress_manager import reset_progress
        reset_progress()
    except Exception as e:
        print(f"Error resetting progress on clear schedule: {e}")