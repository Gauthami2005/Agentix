from typing import Any, Optional
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent import app as agent_graph
from memory.memory_manager import add_message, create_session
from mcp.daily_task_mcp import today_tasks
from mcp.roadmap_manager import load_roadmaps, clear_roadmaps
from memory.schedule_manager import clear_schedule

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
    activePersona: Optional[str] = Field(default=None, description="Active agent persona")
    selectedRepo: Optional[str] = Field(default="", description="Selected repository for context")



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
def chat(request: ChatRequest, authorization: Optional[str] = Header(None)) -> ChatResponse:
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    session_id = request.session_id or create_session(message)

    add_message(session_id, "user", message)

    try:
        from mcp.tool_selector import select_tool
        selected_tool = select_tool(message)

        import re
        is_youtube_requested = bool(re.search(r'youtube|video|watch|tutorial', message, re.IGNORECASE))

        if selected_tool == "youtube_search" and is_youtube_requested:
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
        elif request.chatMode == "general_chat" or request.chatMode == "persona" or (selected_tool == "youtube_search" and not is_youtube_requested):
            from routes.auth import verify_jwt
            from memory.user_db import get_user
            current_user = None
            if authorization and authorization.startswith("Bearer "):
                token = authorization.split(" ")[1]
                payload = verify_jwt(token)
                if payload and "email" in payload:
                    current_user = get_user(payload["email"])

            username = "Gauthami"
            easy = 439
            medium = 139
            hard = 4
            repos = 3

            topics_summary = ""
            if current_user:
                email_name = current_user.get("email", "Gauthami").split("@")[0].capitalize()
                username = current_user.get("displayName") or email_name
                leetcode = current_user.get("leetcode", {}) or {}
                if leetcode.get("username"):
                    easy = leetcode.get("easySolved", 0)
                    medium = leetcode.get("mediumSolved", 0)
                    hard = leetcode.get("hardSolved", 0)
                github = current_user.get("github", {}) or {}
                if github.get("username"):
                    repos = github.get("repositories_count", 3)
                
                t_data = current_user.get("leetcode_topics")
                if t_data:
                    parts = []
                    for level in ["advanced", "intermediate", "fundamental"]:
                        level_topics = t_data.get(level, [])
                        if level_topics:
                            topics_list = [f"{t.get('tagName')} ({t.get('problemsSolved')} solved)" for t in level_topics if t.get("tagName")]
                            if topics_list:
                                parts.append(f"{level.capitalize()} tags: " + ", ".join(topics_list))
                    if parts:
                        topics_summary = "User LeetCode Topic breakdown details: " + "; ".join(parts) + "."
            
            if not topics_summary:
                topics_summary = "User LeetCode Topic breakdown details: Advanced tags: Dynamic Programming (15 solved); Intermediate tags: Depth-First Search (25 solved); Fundamental tags: Arrays (45 solved)."

            github_repos_list = []
            if current_user:
                github_data = current_user.get("github") or {}
                raw_repos = github_data.get("repositories") or current_user.get("repositories") or []
                if isinstance(raw_repos, list):
                    for r in raw_repos:
                        if isinstance(r, dict) and r.get("name"):
                            github_repos_list.append(r.get("name"))
                        elif isinstance(r, str):
                            github_repos_list.append(r)

            if not github_repos_list:
                github_repos_list = ["OceanGuard", "LingoLeap", "SiteGuard", "Agentix", "agentix-backend", "agentix-frontend"]

            github_repo_data_str = (
                "--- GITHUB_REPOSITORY_DATA ---\n"
                f"Repositories: {', '.join(github_repos_list)}\n"
                "------------------------------"
            )

            leetcode_algo_data_str = (
                "--- LEETCODE_ALGORITHM_DATA ---\n"
                f"Easy Solved: {easy}\n"
                f"Medium Solved: {medium}\n"
                f"Hard Solved: {hard}\n"
                f"Topic Breakdown: {topics_summary}\n"
                "-------------------------------"
            )

            selected_repo_info = ""
            if request.selectedRepo:
                repo_desc = "No description available."
                if current_user:
                    github_data = current_user.get("github") or {}
                    raw_repos = github_data.get("repositories") or current_user.get("repositories") or []
                    if isinstance(raw_repos, list):
                        for r in raw_repos:
                            if isinstance(r, dict) and r.get("name") == request.selectedRepo:
                                repo_desc = r.get("description") or repo_desc
                                break
                if repo_desc == "No description available.":
                    mock_portfolios = {
                        "OceanGuard": "Maritime incident reporting and verification system",
                        "LingoLeap": "Language learning application architecture",
                        "SiteGuard": "AI Safety monitoring and dashboard system",
                        "Agentix": "LangGraph and MCP agent backend",
                        "agentix-backend": "FastAPI backend",
                        "agentix-frontend": "React Dashboard"
                    }
                    if request.selectedRepo in mock_portfolios:
                        repo_desc = mock_portfolios[request.selectedRepo]
                
                selected_repo_info = f"\nACTIVE FOCUS REPOSITORY CONTEXT:\nName: {request.selectedRepo}\nDescription: {repo_desc}\nFocus all answers and advice around this project.\n"

            from langchain_groq import ChatGroq
            import os
            llm = ChatGroq(
                model="llama-3.1-8b-instant",
                api_key=os.getenv("GROQ_API_KEY")
            )
            base_prompt = "CRITICAL FORMATTING RULE: When the user asks for a study plan, guide, or roadmap in general conversation, do NOT return raw JSON objects or escaped string codeblocks. Instead, respond with a beautifully structured, highly readable textual roadmap using markdown syntax. Use bold headings, bullet points, and numbered lists (e.g., '### Phase 1: Foundations\n* **Topic 1:** Description...'). Only output structured JSON when specifically communicating with an internal automated tool call that explicitly requests it."
            system_prompt = base_prompt
            if request.chatMode == "persona":
                persona = request.activePersona or "hackathon_partner"
                if persona == "hackathon_partner":
                    system_prompt = (
                        f"{base_prompt}\n\nYou are a hackathon partner. Maintain a strict structural separation between Gauthami's actual full-stack GitHub repositories (projects they built) and their LeetCode problem metrics. When asked about repositories, only reference their actual project names. Do not mistake LeetCode topic counts (like Arrays, DFS, Stack) for repository metrics or suggest putting problem counts 'inside' a repository.\n\n"
                        f"{github_repo_data_str}\n\n"
                        f"{leetcode_algo_data_str}"
                    )
                elif persona == "brutally_honest":
                    system_prompt = (
                        f"{base_prompt}\n\nYou are an Honest Reviewer. Brutally honest, critical of bad design or slow code, giving strict constructive feedback. Do not sugarcoat anything. "
                        f"You see {username}'s stats: {easy} Easy, {medium} Medium, and a weak {hard} Hard problems solved. Call out this massive Easy-to-Hard imbalance directly, mock the single-digit Hard count, and tell them to stop dodging real algorithmic optimization.\n\n"
                        f"{github_repo_data_str}\n\n"
                        f"{leetcode_algo_data_str}"
                    )
                elif persona == "cyberpunk_os":
                    system_prompt = (
                        f"{base_prompt}\n\nYou are Cyberpunk OS. Talk in a sci-fi, terminal-based hacker vibe, using words like 'mainframe', 'handshake', 'port linked', etc. Keep the responses thematic. "
                        f"Incorporate these telemetry diagnostics into your system status output: Core Node '{username}' connected. Data Structures Mastered: {easy} Level-1 sectors, {medium} Level-2 sectors, {hard} Level-3 critical sectors.\n\n"
                        f"{github_repo_data_str}\n\n"
                        f"{leetcode_algo_data_str}"
                    )
            
            if selected_repo_info:
                system_prompt = selected_repo_info + "\n" + system_prompt

            
            prompt_message = message
            if system_prompt:
                prompt_message = f"{system_prompt}\n\nUser Message: {message}"
                
            response = llm.invoke(prompt_message)
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

    if isinstance(response_text, (dict, list)):
        import json
        response_text = json.dumps(response_text)
    elif not isinstance(response_text, str):
        response_text = str(response_text)

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

        toggle_task(req.task, req.completed)

        update_progress(req.task, req.completed)

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

        toggle_task(req.task_name, req.completed)
        update_progress(req.task_name, req.completed)

        new_schedule = adapt_schedule()

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
