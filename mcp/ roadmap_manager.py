import json
import os
import uuid

ROADMAP_FILE = os.path.join("memory", "roadmap.json")


def load_roadmaps():

    if not os.path.exists(ROADMAP_FILE):
        return {"roadmaps": []}

    with open(ROADMAP_FILE, "r") as f:
        return json.load(f)


def save_roadmaps(data):

    with open(ROADMAP_FILE, "w") as f:
        json.dump(data, f, indent=4)


def save_roadmap(title, roadmap):

    data = load_roadmaps()

    data["roadmaps"].append({

        "id": str(uuid.uuid4()),
        "title": title,
        "roadmap": roadmap,
        "completed_days": []

    })

    save_roadmaps(data)