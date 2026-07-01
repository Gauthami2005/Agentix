from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent import app as agent_graph
from memory.memory_manager import add_message, create_session
from mcp.daily_task_mcp import today_tasks
from mcp.roadmap_manager import load_roadmaps, clear_roadmaps
from memory.schedule_manager import clear_schedule

load_dotenv()

api = FastAPI(
    title="Agentix API",
    description="FastAPI backend for the Agentix LangGraph + MCP agent",
    version="1.0.0",
)

api.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User message for the agent")
    session_id: Optional[str] = Field(default=None, description="Existing chat session ID")


class ChatResponse(BaseModel):
    session_id: str
    response: str
    plan: Optional[str] = None
    status: Optional[str] = None


class TaskItem(BaseModel):
    task: str
    completed: bool


class TasksResponse(BaseModel):
    tasks: list[TaskItem]
    source: str


class ToggleTaskRequest(BaseModel):
    task: str
    completed: bool


@api.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "agentix"}


@api.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """Invoke the LangGraph agent (planner → tools → evaluator)."""
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    session_id = request.session_id or create_session(message)

    add_message(session_id, "user", message)

    try:
        result: dict[str, Any] = agent_graph.invoke(
            {"task": message, "iteration": 1},
        )
    except Exception as e:
        print(f"CRITICAL BACKEND ERROR: {str(e)}")  # Print the actual error to the terminal
        raise HTTPException(status_code=500, detail=f"Backend Agent Error: {str(e)}")

    response_text = result.get("result") or result.get("plan") or "No response generated."
    add_message(session_id, "assistant", response_text)

    return ChatResponse(
        session_id=session_id,
        response=response_text,
        plan=result.get("plan"),
        status=result.get("status"),
    )


@api.get("/api/roadmap")
def get_roadmap() -> dict[str, Any]:
    """Read saved roadmaps from memory/roadmap.json."""
    return load_roadmaps()


@api.delete("/api/roadmap")
def delete_roadmap():
    """safely clear or reset memory/roadmap.json and memory/schedule.json."""
    try:
        clear_roadmaps()
        clear_schedule()
        return {"status": "success", "message": "Roadmap and daily schedule cleared successfully"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to clear roadmap: {exc}")



@api.get("/api/tasks", response_model=TasksResponse)
def get_tasks() -> TasksResponse:
    """Fetch today's study tasks and sync from roadmap if empty."""
    from memory.schedule_manager import load_schedule, save_schedule
    sched = load_schedule()

    # If today's list is empty, initialize it from raw today_tasks()
    if not sched.get("today") or len(sched["today"]) == 0:
        raw = today_tasks()
        if isinstance(raw, list):
            tasks_list = [line.strip("- ").strip() for line in raw if line.strip()]
            sched["today"] = [{"task": t, "completed": False} for t in tasks_list]
            save_schedule(sched)
        elif isinstance(raw, str) and raw != "No roadmap found.":
            sched["today"] = [{"task": raw, "completed": False}]
            save_schedule(sched)

    tasks = [TaskItem(task=item["task"], completed=item["completed"]) for item in sched.get("today", [])]
    source = "roadmap" if tasks else "fallback"
    return TasksResponse(tasks=tasks, source=source)


@api.post("/api/tasks/toggle")
def toggle_task_endpoint(req: ToggleTaskRequest) -> dict[str, Any]:
    """Toggle task completion state on backend and return recalculated progress."""
    try:
        from memory.schedule_manager import toggle_task
        from mcp.progress_mcp import update_progress
        from memory.progress_manager import calculate_progress

        # 1. Update schedule.json
        toggle_task(req.task, req.completed)

        # 2. Update progress.json
        update_progress(req.task, req.completed)

        # 3. Calculate and return updated progress metrics
        progress_data = calculate_progress()
        return {
            "status": "success",
            "progress": progress_data
        }
    except Exception as exc:
        raise HTTPException(status_code=550, detail=f"Failed to toggle task: {exc}")


@api.get("/api/progress")
def get_progress_endpoint() -> dict[str, Any]:
    """Fetch recalculated progress details."""
    try:
        from memory.progress_manager import calculate_progress
        return calculate_progress()
    except Exception as exc:
        raise HTTPException(status_code=550, detail=f"Failed to fetch progress: {exc}")
