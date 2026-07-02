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

from routes.auth import router as auth_router
from routes.resume import router as resume_router

api = FastAPI(
    title="Agentix API",
    description="FastAPI backend for the Agentix LangGraph + MCP agent",
    version="1.0.0",
)

api.include_router(auth_router)
api.include_router(resume_router)

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
    chatMode: str = Field(default="general_chat", description="Chat mode")


class ChatResponse(BaseModel):
    session_id: str
    response: str
    plan: Optional[str] = None
    status: Optional[str] = None
    chat_mode: Optional[str] = None
    youtube_metadata: Optional[list[dict]] = None
    problem_name: Optional[str] = None


class TaskItem(BaseModel):
    task: str
    completed: bool


class TasksResponse(BaseModel):
    tasks: list[TaskItem]
    tomorrow: list[TaskItem] = []
    source: str


class ToggleTaskRequest(BaseModel):
    task: str
    completed: bool


class CompleteTaskRequest(BaseModel):
    task_name: str
    completed: bool


class CompleteRoadmapTopicRequest(BaseModel):
    roadmap_id: str
    phase_title: str
    topic_name: str
    completed: bool


@api.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "agentix"}


@api.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """Invoke the LangGraph agent or route to standard conversational LLM based on chatMode."""
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    session_id = request.session_id or create_session(message)

    add_message(session_id, "user", message)

    try:
        from mcp.tool_selector import select_tool
        selected_tool = select_tool(message)

        if selected_tool == "youtube_search":
            from mcp.mcp_executor import execute_tool
            tool_res = execute_tool(message)
            result = {"result": tool_res, "plan": None, "status": "success"}
        elif selected_tool == "browser_automation":
            from mcp.mcp_executor import execute_tool
            tool_res = execute_tool(message)
            from planner import llm
            prob_prompt = f"Identify the coding problem name from the user message: '{message}'. Return only the problem name, or 'Unknown' if not found. Do not add extra comments."
            try:
                prob_name = llm.invoke(prob_prompt).content.strip()
            except:
                prob_name = "LeetCode Coding Problem"
            result = {"result": tool_res, "plan": None, "status": "launching_browser", "problem_name": prob_name}
        elif request.chatMode == "general_chat":
            from langchain_groq import ChatGroq
            import os
            llm = ChatGroq(
                model="llama-3.1-8b-instant",
                api_key=os.getenv("GROQ_API_KEY")
            )
            response = llm.invoke(message)
            response_text = response.content.strip()
            result = {"result": response_text, "plan": None, "status": "success"}
        else:
            result = agent_graph.invoke(
                {"task": message, "iteration": 1},
            )
    except Exception as e:
        print(f"CRITICAL BACKEND ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Backend Agent Error: {str(e)}")

    response_text = result.get("result") or result.get("plan") or "No response generated."

    import json
    youtube_metadata = None
    chat_mode = None

    try:
        parsed_youtube = json.loads(response_text)
        if isinstance(parsed_youtube, list) and len(parsed_youtube) > 0 and "video_id" in parsed_youtube[0]:
            youtube_metadata = parsed_youtube
            chat_mode = "youtube_recommendation"
            response_text = "Here are some high-quality YouTube resources I found for you:"
    except Exception:
        pass

    add_message(session_id, "assistant", response_text)

    return ChatResponse(
        session_id=session_id,
        response=response_text,
        plan=result.get("plan"),
        status=result.get("status"),
        chat_mode=chat_mode,
        youtube_metadata=youtube_metadata,
        problem_name=result.get("problem_name"),
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
    tomorrow = [TaskItem(task=item["task"], completed=item["completed"]) for item in sched.get("tomorrow", [])]
    source = "roadmap" if tasks else "fallback"
    return TasksResponse(tasks=tasks, tomorrow=tomorrow, source=source)


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


@api.post("/api/complete-task")
def complete_task_endpoint(req: CompleteTaskRequest) -> dict[str, Any]:
    """Complete a task and automatically trigger schedule optimization via Adaptive Planner MCP."""
    try:
        from memory.schedule_manager import toggle_task
        from mcp.progress_mcp import update_progress
        from mcp.adaptive_planner_mcp import adapt_schedule
        from memory.progress_manager import calculate_progress

        # a) Update status inside schedule.json and progress.json
        toggle_task(req.task_name, req.completed)
        update_progress(req.task_name, req.completed)

        # b) Fire adapt_schedule() to run LLM optimization and c) save to schedule.json
        new_schedule = adapt_schedule()

        # Recalculate progress metrics
        progress_data = calculate_progress()

        return {
            "status": "success",
            "schedule": new_schedule,
            "progress": progress_data
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to complete task and adapt schedule: {exc}")


@api.post("/api/complete-roadmap-topic")
def complete_roadmap_topic_endpoint(req: CompleteRoadmapTopicRequest) -> dict[str, Any]:
    """Toggle completion of a roadmap topic and save it to the structural database."""
    try:
        from mcp.roadmap_manager import toggle_roadmap_topic
        updated_rm = toggle_roadmap_topic(
            roadmap_id=req.roadmap_id,
            phase_title=req.phase_title,
            topic_name=req.topic_name,
            completed=req.completed
        )
        return {
            "status": "success",
            "roadmap": updated_rm
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to toggle roadmap topic: {exc}")


@api.get("/api/progress")
def get_progress_endpoint() -> dict[str, Any]:
    """Fetch recalculated progress details."""
    try:
        from memory.progress_manager import calculate_progress
        return calculate_progress()
    except Exception as exc:
        raise HTTPException(status_code=550, detail=f"Failed to fetch progress: {exc}")
