import json
import os
from datetime import datetime

USER_DB_FILE = "/Users/gauthami/Desktop/Agent/backend/memory/users.json"

def load_users() -> dict:
    if not os.path.exists(USER_DB_FILE):
        return {}
    try:
        with open(USER_DB_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def save_users(users: dict):
    try:
        with open(USER_DB_FILE, "w") as f:
            json.dump(users, f, indent=2)
    except Exception as e:
        print(f"Error saving users database: {e}")

def get_user(email: str) -> dict:
    users = load_users()
    return users.get(email.lower())

def save_user(user: dict):
    users = load_users()
    email = user["email"].lower()
    users[email] = user
    save_users(users)

def create_or_update_google_user(email: str, display_name: str, google_id: str = None, picture: str = None) -> dict:
    email_lc = email.lower()
    user = get_user(email_lc)
    if not user:
        user = {
            "email": email_lc,
            "displayName": display_name,
            "googleId": google_id,
            "picture": picture,
            "github": None,
            "leetcode": None,
            "createdAt": datetime.utcnow().isoformat()
        }
    else:
        user["displayName"] = display_name
        if google_id:
            user["googleId"] = google_id
        if picture:
            user["picture"] = picture
    save_user(user)
    return user
