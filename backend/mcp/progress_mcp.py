from memory.progress_manager import (
    load_progress,
    calculate_progress,
    toggle_completed_task,
    reset_progress,
)


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