import json
import os
import uuid

MEMORY_FILE = "memory/agent_memory.json"

def load_memory():
    if not os.path.exists(MEMORY_FILE):
        return {"sessions": []}

    with open(MEMORY_FILE, "r") as f:
        return json.load(f)

def save_memory(memory):
    with open(MEMORY_FILE, "w") as f:
        json.dump(memory, f, indent=4)

def create_session(task):
    memory = load_memory()

    session_id = str(uuid.uuid4())

    session = {
        "id": session_id,
        "title": task,
        "messages": []
    }

    memory["sessions"].append(session)

    save_memory(memory)

    return session_id

def add_message(session_id, role, content):
    memory = load_memory()

    for session in memory["sessions"]:
        if session["id"] == session_id:
            session["messages"].append({
                "role": role,
                "content": content
            })

    save_memory(memory)

def get_sessions():
    return load_memory()["sessions"]