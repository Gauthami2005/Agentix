import os
from dotenv import load_dotenv

# Load dotenv at the very top
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=env_path)

import pymongo

client = None

def get_db():
    global client
    # Reload environment variables in case they were dynamically set
    load_dotenv(dotenv_path=env_path)
    mongo_uri = os.getenv("MONGO_URI")
    
    if not mongo_uri:
        print("⚠️  WARNING: MONGO_URI environment variable is missing. Falling back to localhost.")
        mongo_uri = "mongodb://localhost:27017/agentix"

    if client is None:
        try:
            client = pymongo.MongoClient(mongo_uri)
        except Exception as e:
            print(f"❌ Connection error: Could not initialize pymongo client: {e}")
            raise e
            
    return client["agentix"]
