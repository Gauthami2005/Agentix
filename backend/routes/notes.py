import os
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException, status, Query, Request
from pydantic import BaseModel
from typing import List, Optional, Any
from mcp.db import get_db

router = APIRouter(prefix="/api/notes", tags=["notes"])

@router.get("")
def get_notes():
    try:
        db = get_db()
        docs = list(db["notes"].find({}).sort("created_at", -1))
        for doc in docs:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
        return docs
    except Exception as e:
        raise HTTPException(status_code=550, detail=str(e))

@router.post("")
async def save_note(request: Request):
    db = get_db()
    payload = await request.json()
    
    # Handle array of notes
    if isinstance(payload, list):
        try:
            db["notes"].delete_many({})
            inserted_docs = []
            for item in payload:
                note_id = item.get("id") or item.get("_id")
                _id = ObjectId(note_id) if note_id and ObjectId.is_valid(note_id) else ObjectId()
                doc = {
                    "_id": _id,
                    "title": item.get("title") or "Untitled Note",
                    "content": item.get("content", ""),
                    "category": item.get("category", "General Notes"),
                    "tags": item.get("tags", []),
                    "created_at": item.get("created_at") or item.get("createdAt") or datetime.utcnow().isoformat(),
                    "user_id": item.get("user_id") or item.get("userId")
                }
                db["notes"].insert_one(doc)
                doc["id"] = str(doc["_id"])
                del doc["_id"]
                inserted_docs.append(doc)
                print(f"📝 Saved note to MongoDB Atlas: {doc['id']}")
            return {"status": "success", "message": "Notes array updated successfully", "notes": inserted_docs}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    # Handle single note
    try:
        note_id = payload.get("id") or payload.get("_id")
        title = payload.get("title") or "Untitled Note"
            
        doc = {
            "title": title,
            "content": payload.get("content", ""),
            "category": payload.get("category", "General Notes"),
            "tags": payload.get("tags", []),
            "created_at": payload.get("created_at") or payload.get("createdAt") or datetime.utcnow().isoformat(),
            "user_id": payload.get("user_id") or payload.get("userId")
        }
        
        if note_id and ObjectId.is_valid(note_id):
            db["notes"].update_one({"_id": ObjectId(note_id)}, {"$set": doc}, upsert=True)
            saved_id = note_id
            doc["id"] = saved_id
        else:
            res = db["notes"].insert_one(doc)
            saved_id = str(res.inserted_id)
            doc["id"] = saved_id
            if "_id" in doc:
                del doc["_id"]
            
        print(f"📝 Saved note to MongoDB Atlas: {saved_id}")
        
        docs = list(db["notes"].find({}).sort("created_at", -1))
        for d in docs:
            d["id"] = str(d["_id"])
            del d["_id"]
        return {"status": "success", "message": "Note saved successfully", "note": doc, "notes": docs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{note_id}")
def delete_note(note_id: str):
    try:
        db = get_db()
        if ObjectId.is_valid(note_id):
            db["notes"].delete_one({"_id": ObjectId(note_id)})
        else:
            db["notes"].delete_one({"id": note_id})
            
        docs = list(db["notes"].find({}).sort("created_at", -1))
        for d in docs:
            d["id"] = str(d["_id"])
            del d["_id"]
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
