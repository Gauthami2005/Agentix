from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent import app as agent_graph
from memory.memory_manager import add_message, create_session
from mcp.daily_task_mcp import today_tasks
from mcp.roadmap_manager import load_roadmaps

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


class TasksResponse(BaseModel):
    tasks: list[str]
    source: str


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
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Agent error: {exc}") from exc

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


@api.get("/api/tasks", response_model=TasksResponse)
def get_tasks() -> TasksResponse:
    """Fetch today's study tasks via daily_task_mcp."""
    raw = today_tasks()

    if isinstance(raw, list):
        tasks = [line.strip("- ").strip() for line in raw if line.strip()]
        return TasksResponse(tasks=tasks, source="roadmap")

    if isinstance(raw, str):
        return TasksResponse(
            tasks=[] if raw == "No roadmap found." else [raw],
            source="fallback" if raw == "No roadmap found." else "roadmap",
        )

    return TasksResponse(tasks=[], source="fallback")
