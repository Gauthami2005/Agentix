import re
from datetime import datetime
from mcp.db import get_db
from mcp.roadmap_manager import load_roadmaps

DEFAULT_TOPICS = ["Arrays", "Strings", "Trees", "Graphs"]

def load_progress():
    try:
        db = get_db()
        doc = db["progresses"].find_one(sort=[("createdAt", -1)])
        if not doc:
            doc = db["progresses"].find_one()  # fallback
        if doc:
            # Match schema structure
            return {
                "completed_tasks": doc.get("completedTasksCount", doc.get("completed_tasks", 0)),
                "total_tasks": doc.get("totalTasks", doc.get("total_tasks", 0)),
                "completed_task_names": doc.get("completedTaskNames", doc.get("completed_task_names", [])),
                "topics": doc.get("topics", [
                    {"name": "Arrays", "completed": False},
                    {"name": "Strings", "completed": False},
                    {"name": "Trees", "completed": False},
                    {"name": "Graphs", "completed": False}
                ]),
                "overall_progress": doc.get("overallProgress", doc.get("overall_progress", 0))
            }
    except Exception as e:
        print(f"Error loading progress: {e}")

    return {
        "completed_tasks": 0,
        "total_tasks": 0,
        "completed_task_names": [],
        "topics": [
            {"name": "Arrays", "completed": False},
            {"name": "Strings", "completed": False},
            {"name": "Trees", "completed": False},
            {"name": "Graphs", "completed": False}
        ],
        "overall_progress": 0
    }

def save_progress(data):
    try:
        db = get_db()
        db["progresses"].delete_many({})
        db["progresses"].insert_one({
            "studyStreak": data.get("studyStreak", 0),
            "progressPercentage": data.get("overall_progress", 0),
            "completedTasks": data.get("completed_task_names", []),
            "completedTaskNames": data.get("completed_task_names", []),
            "totalTasks": data.get("total_tasks", 0),
            "topics": data.get("topics", []),
            "overallProgress": data.get("overall_progress", 0),
            "createdAt": datetime.utcnow()
        })
    except Exception as e:
        print(f"Error saving progress: {e}")

def calculate_progress():
    progress = load_progress()
    roadmaps_data = load_roadmaps()

    total_tasks = 0
    roadmap_tasks = []
    if roadmaps_data.get("roadmaps"):
        last_roadmap = roadmaps_data["roadmaps"][-1]["roadmap"]
        for line in last_roadmap.split("\n"):
            trimmed = line.strip()
            if trimmed.startswith("-") or trimmed.startswith("*") or trimmed.startswith("+"):
                cleaned = re.sub(r'^[-*+•\s]+', '', trimmed).strip()
                if cleaned:
                    roadmap_tasks.append(cleaned)
        total_tasks = len(roadmap_tasks)

    if total_tasks == 0:
        total_tasks = 5

    completed_task_names = progress.get("completed_task_names", [])
    
    roadmap_completed_count = 0
    if roadmap_tasks:
        def clean_key(txt):
            return re.sub(r'[^a-zA-Z0-9]', '', txt).lower()
        
        roadmap_keys = {clean_key(t) for t in roadmap_tasks}
        for completed_task in completed_task_names:
            if clean_key(completed_task) in roadmap_keys:
                roadmap_completed_count += 1
    else:
        roadmap_completed_count = len(completed_task_names)

    topics = []
    for topic_name in DEFAULT_TOPICS:
        completed = False
        keywords = []
        if topic_name == "Arrays":
            keywords = ["array", "hash", "sort", "anagram", "duplicate", "two sum", "search insert"]
        elif topic_name == "Strings":
            keywords = ["string", "palindrome", "valid parentheses", "reverse"]
        elif topic_name == "Trees":
            keywords = ["tree", "bst", "trie", "binary tree", "traversal"]
        elif topic_name == "Graphs":
            keywords = ["graph", "bfs", "dfs", "matrix", "dijkstra", "island"]

        for task in completed_task_names:
            task_lower = task.lower()
            if any(kw in task_lower for kw in keywords):
                completed = True
                break
        topics.append({"name": topic_name, "completed": completed})

    progress["total_tasks"] = total_tasks
    progress["completed_tasks"] = roadmap_completed_count
    progress["topics"] = topics

    overall_progress = 0
    if total_tasks > 0:
        overall_progress = round((roadmap_completed_count * 100) / total_tasks)
    progress["overall_progress"] = min(overall_progress, 100)

    save_progress(progress)
    return progress

def toggle_completed_task(task_name, completed):
    progress = load_progress()
    completed_task_names = progress.get("completed_task_names", [])

    cleaned_name = task_name.strip()
    if completed:
        if cleaned_name not in completed_task_names:
            completed_task_names.append(cleaned_name)
    else:
        if cleaned_name in completed_task_names:
            completed_task_names.remove(cleaned_name)

    progress["completed_task_names"] = completed_task_names
    save_progress(progress)
    return calculate_progress()

def reset_progress():
    save_progress({
        "completed_tasks": 0,
        "total_tasks": 0,
        "completed_task_names": [],
        "topics": [
            {"name": "Arrays", "completed": False},
            {"name": "Strings", "completed": False},
            {"name": "Trees", "completed": False},
            {"name": "Graphs", "completed": False}
        ]
    })

def update_progress(task_name, completed):
    toggle_completed_task(task_name, completed)
    return "Progress updated"

def weak_topics():
    progress = calculate_progress()
    weak = []
    for topic in progress.get("topics", []):
        if not topic.get("completed"):
            weak.append(topic.get("name"))
    return weak