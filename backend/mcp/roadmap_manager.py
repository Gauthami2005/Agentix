import os
from datetime import datetime
from bson import ObjectId
from mcp.db import get_db

def load_roadmaps():
    """Load roadmaps from MongoDB."""
    try:
        db = get_db()
        docs = list(db["roadmaps"].find({}))
        # Format documents to mimic expected JSON structure
        for doc in docs:
            doc["id"] = str(doc.get("_id", ""))
            if "_id" in doc:
                del doc["_id"]
            if "roadmapText" in doc and "roadmap" not in doc:
                doc["roadmap"] = doc["roadmapText"]
            if "completedDays" in doc and "completed_days" not in doc:
                doc["completed_days"] = doc["completedDays"]
            if "completedTopics" in doc and "completed_topics" not in doc:
                doc["completed_topics"] = doc["completedTopics"]
        return {"roadmaps": docs}
    except Exception as e:
        print(f"Error loading roadmaps from DB: {e}")
        return {"roadmaps": []}

def save_roadmaps(data):
    """Save all roadmaps back to MongoDB (clears first to mimic JSON replacement)."""
    try:
        db = get_db()
        db["roadmaps"].delete_many({})
        roadmaps = data.get("roadmaps", [])
        if roadmaps:
            to_insert = []
            for r in roadmaps:
                # Convert string ID to ObjectId if possible
                doc_id = r.get("id")
                _id = ObjectId(doc_id) if doc_id and ObjectId.is_valid(doc_id) else ObjectId()
                to_insert.append({
                    "_id": _id,
                    "targetGoal": r.get("targetGoal", r.get("title", "Study Goal")),
                    "title": r.get("title"),
                    "roadmapText": r.get("roadmapText", r.get("roadmap", "")),
                    "completedDays": r.get("completedDays", r.get("completed_days", [])),
                    "completedTopics": r.get("completedTopics", r.get("completed_topics", [])),
                    "active": r.get("active", True),
                    "createdAt": datetime.utcnow()
                })
            db["roadmaps"].insert_many(to_insert)
    except Exception as e:
        print(f"Error saving roadmaps to DB: {e}")

def save_roadmap(title, roadmap):
    """Save a single new roadmap to MongoDB."""
    try:
        db = get_db()
        db["roadmaps"].insert_one({
            "targetGoal": title,
            "title": title,
            "roadmapText": roadmap,
            "completedDays": [],
            "completedTopics": [],
            "active": True,
            "createdAt": datetime.utcnow()
        })
    except Exception as e:
        print(f"Error appending roadmap: {e}")

def get_latest_roadmap():
    """Retrieve the latest active roadmap text from MongoDB."""
    try:
        db = get_db()
        doc = db["roadmaps"].find_one(sort=[("createdAt", -1)])
        if doc:
            return doc.get("roadmapText", doc.get("roadmap", ""))
        return None
    except Exception as e:
        print(f"Error getting latest roadmap: {e}")
        return None

def toggle_roadmap_topic(roadmap_id: str, phase_title: str, topic_name: str, completed: bool) -> dict:
    """Toggle completion of a specific topic inside a saved roadmap."""
    try:
        db = get_db()
        query = {}
        if roadmap_id and ObjectId.is_valid(roadmap_id):
            query["_id"] = ObjectId(roadmap_id)
        else:
            # Fallback to query by string target if we can find one, or just get latest
            query = {}

        doc = None
        if query:
            doc = db["roadmaps"].find_one(query)
        if not doc:
            doc = db["roadmaps"].find_one(sort=[("createdAt", -1)])

        if doc:
            # Maintain both camelCase and snake_case for compatibility
            completed_topics = doc.get("completedTopics", doc.get("completed_topics", []))
            if completed:
                if topic_name not in completed_topics:
                    completed_topics.append(topic_name)
            else:
                if topic_name in completed_topics:
                    completed_topics.remove(topic_name)

            db["roadmaps"].update_one(
                {"_id": doc["_id"]},
                {"$set": {
                    "completedTopics": completed_topics,
                    "completed_topics": completed_topics
                }}
            )
            doc["completed_topics"] = completed_topics
            doc["completedTopics"] = completed_topics
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            if "roadmapText" in doc:
                doc["roadmap"] = doc["roadmapText"]
            return doc
        return {}
    except Exception as e:
        print(f"Error toggling roadmap topic: {e}")
        return {}

def clear_roadmaps():
    """Clear all roadmaps from MongoDB."""
    try:
        db = get_db()
        db["roadmaps"].delete_many({})
    except Exception as e:
        print(f"Error clearing roadmaps: {e}")