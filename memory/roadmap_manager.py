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
        "completed_days": [],
        "completed_topics": []
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


def toggle_roadmap_topic(roadmap_id: str, phase_title: str, topic_name: str, completed: bool) -> dict:
    """Toggle a specific topic's completion inside a saved roadmap."""
    data = load_roadmaps()
    target_rm = None
    for rm in data.get("roadmaps", []):
        if rm["id"] == roadmap_id:
            target_rm = rm
            break

    if not target_rm and data.get("roadmaps", []):
        # fallback to the latest
        target_rm = data["roadmaps"][-1]

    if target_rm:
        if "completed_topics" not in target_rm:
            target_rm["completed_topics"] = []

        if completed:
            if topic_name not in target_rm["completed_topics"]:
                target_rm["completed_topics"].append(topic_name)
        else:
            if topic_name in target_rm["completed_topics"]:
                target_rm["completed_topics"].remove(topic_name)

        save_roadmaps(data)
        return target_rm
    return {}


def clear_roadmaps():
    """Safely clear or reset the roadmaps to an empty roadmaps array."""
    save_roadmaps({"roadmaps": []})

