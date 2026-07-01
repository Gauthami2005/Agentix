import json
import os
import uuid

ROADMAP_FILE = os.path.join("memory", "roadmap.json")


def load_roadmaps():
    """Safely load the roadmaps from memory/roadmap.json."""
    if not os.path.exists(ROADMAP_FILE):
        return {"roadmaps": []}
    try:
        with open(ROADMAP_FILE, "r") as f:
            data = json.load(f)
            if not isinstance(data, dict) or "roadmaps" not in data:
                return {"roadmaps": []}
            return data
    except Exception as e:
        print(f"Error loading roadmaps: {e}")
        return {"roadmaps": []}


def save_roadmaps(data):
    """Safely save the roadmaps to memory/roadmap.json."""
    try:
        # Ensure parent directories exist
        os.makedirs(os.path.dirname(ROADMAP_FILE), exist_ok=True)
        with open(ROADMAP_FILE, "w") as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        print(f"Error saving roadmaps: {e}")


def save_roadmap(title, roadmap):
    """Append a new roadmap and save."""
    data = load_roadmaps()
    data["roadmaps"].append({
        "id": str(uuid.uuid4()),
        "title": title,
        "roadmap": roadmap,
        "completed_days": []
    })
    save_roadmaps(data)


def get_latest_roadmap():
    """Safely get the latest roadmap text, returning None if none exist."""
    data = load_roadmaps()
    roadmaps = data.get("roadmaps", [])
    if not roadmaps:
        return None
    latest = roadmaps[-1]
    if isinstance(latest, dict):
        return latest.get("roadmap")
    return None


def clear_roadmaps():
    """Safely clear or reset the roadmaps to an empty roadmaps array."""
    save_roadmaps({"roadmaps": []})

