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


def clear_schedule():
    save_schedule({
        "today": [],
        "tomorrow": []
    })