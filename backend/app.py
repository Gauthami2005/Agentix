import os
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

import json
from datetime import datetime
from pathlib import Path

import streamlit as st

import uuid
from mcp.db import get_db

def get_sessions():
    try:
        db = get_db()
        docs = list(db["agent_memories"].find().sort("lastUpdated", -1))
        for doc in docs:
            doc["id"] = doc.get("sessionId")
            doc["messages"] = doc.get("chatContext", [])
        return docs
    except Exception as e:
        print(f"Error loading sessions: {e}")
        return []

def create_session(task):
    try:
        db = get_db()
        session_id = str(uuid.uuid4())
        db["agent_memories"].insert_one({
            "sessionId": session_id,
            "chatContext": [],
            "title": task,
            "lastUpdated": datetime.utcnow()
        })
        return session_id
    except Exception as e:
        print(f"Error creating session: {e}")
        return str(uuid.uuid4())

def add_message(session_id, role, content):
    try:
        db = get_db()
        db["agent_memories"].update_one(
            {"sessionId": session_id},
            {
                "$push": {"chatContext": {"role": role, "content": content}},
                "$set": {"lastUpdated": datetime.utcnow()}
            }
        )
    except Exception as e:
        print(f"Error adding message: {e}")
from mcp.daily_task_mcp import today_tasks
from mcp.leetcode_mcp import search_problems
from mcp.progress_mcp import progress_db, update_progress, weak_topics
from mcp.roadmap_manager import load_roadmaps

try:
    from agent import app as agent_graph

    AGENT_AVAILABLE = True
    AGENT_ERROR = ""
except Exception as exc:
    agent_graph = None
    AGENT_AVAILABLE = False
    AGENT_ERROR = str(exc)

st.set_page_config(
    page_title="Agentix",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
    --void: #0B0F19;
    --surface: #111827;
    --surface-2: #1A2332;
    --cyan: #06B6D4;
    --emerald: #10B981;
    --text: #E2E8F0;
    --muted: #94A3B8;
    --neon-glow: 0 0 12px rgba(6, 182, 212, 0.15);
    --neon-glow-strong: 0 0 20px rgba(16, 185, 129, 0.25);
}

html, body, [class*="css"] {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
    color: var(--text);
}

.stApp {
    background: var(--void) !important;
    background-image:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.08), transparent),
        radial-gradient(ellipse 60% 40% at 100% 100%, rgba(16, 185, 129, 0.06), transparent) !important;
}

.block-container {
    padding-top: 1.5rem !important;
    max-width: 1400px !important;
}

[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0D1321 0%, #0B0F19 100%) !important;
    border-right: 1px solid rgba(6, 182, 212, 0.2) !important;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4) !important;
}

[data-testid="stSidebar"] .stRadio > label {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.72rem !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    color: var(--cyan) !important;
}

[data-testid="stSidebar"] .stRadio div[role="radiogroup"] {
    gap: 0.35rem !important;
}

[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label {
    background: var(--surface) !important;
    border: 1px solid rgba(6, 182, 212, 0.25) !important;
    border-radius: 10px !important;
    padding: 0.55rem 0.85rem !important;
    margin: 0 !important;
    transition: all 0.2s ease !important;
    box-shadow: var(--neon-glow) !important;
}

[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:hover {
    border-color: var(--cyan) !important;
    box-shadow: 0 0 16px rgba(6, 182, 212, 0.3) !important;
}

[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label[data-checked="true"],
[data-testid="stSidebar"] .stRadio div[role="radiogroup"] label:has(input:checked) {
    background: rgba(6, 182, 212, 0.12) !important;
    border-color: var(--emerald) !important;
    box-shadow: var(--neon-glow-strong) !important;
}

div[data-testid="stMetric"] {
    background: var(--surface) !important;
    border: 1px solid rgba(16, 185, 129, 0.35) !important;
    border-radius: 14px !important;
    padding: 1rem 1.25rem !important;
    box-shadow: var(--neon-glow) !important;
}

div[data-testid="stMetric"] label {
    color: var(--muted) !important;
    font-size: 0.75rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
}

div[data-testid="stMetric"] [data-testid="stMetricValue"] {
    color: var(--cyan) !important;
    font-weight: 600 !important;
}

.stButton > button {
    background: rgba(6, 182, 212, 0.1) !important;
    color: var(--cyan) !important;
    border: 1px solid rgba(6, 182, 212, 0.5) !important;
    border-radius: 10px !important;
    font-weight: 500 !important;
    box-shadow: var(--neon-glow) !important;
    transition: all 0.2s ease !important;
}

.stButton > button:hover {
    background: rgba(6, 182, 212, 0.2) !important;
    border-color: var(--emerald) !important;
    box-shadow: var(--neon-glow-strong) !important;
    color: #fff !important;
}

.stTextInput > div > div > input,
.stTextArea > div > div > textarea,
.stSelectbox > div > div {
    background: var(--surface) !important;
    border: 1px solid rgba(6, 182, 212, 0.3) !important;
    border-radius: 10px !important;
    color: var(--text) !important;
    box-shadow: var(--neon-glow) !important;
}

.stChatMessage {
    background: var(--surface) !important;
    border: 1px solid rgba(6, 182, 212, 0.2) !important;
    border-radius: 14px !important;
    box-shadow: var(--neon-glow) !important;
}

.stCheckbox label span {
    color: var(--text) !important;
}

h1, h2, h3 {
    color: var(--text) !important;
}

/* Hide default Streamlit header/footer chrome */
footer { visibility: hidden; }
header[data-testid="stHeader"] {
    background: transparent !important;
}

.agentix-card {
    background: linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%);
    border: 1px solid rgba(6, 182, 212, 0.35);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: var(--neon-glow);
    margin-bottom: 1rem;
}

.agentix-card-emerald {
    border-color: rgba(16, 185, 129, 0.35);
}

.agentix-card-title {
    font-size: 0.7rem;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--cyan);
    margin-bottom: 0.75rem;
}

.agentix-neon-title {
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(90deg, var(--cyan), var(--emerald));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    line-height: 1.2;
}

.agentix-subtitle {
    color: var(--muted);
    font-size: 0.95rem;
    margin-top: 0.35rem;
}

.agentix-badge {
    display: inline-block;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    font-size: 0.7rem;
    font-family: 'JetBrains Mono', monospace;
    border: 1px solid rgba(6, 182, 212, 0.4);
    color: var(--cyan);
    background: rgba(6, 182, 212, 0.08);
}

.timeline-item {
    border-left: 2px solid rgba(6, 182, 212, 0.4);
    padding-left: 1rem;
    margin-bottom: 1rem;
    position: relative;
}

.timeline-item::before {
    content: '';
    position: absolute;
    left: -5px;
    top: 4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--emerald);
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.timeline-item.done::before {
    background: var(--cyan);
}

.alert-card {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.4);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    box-shadow: var(--neon-glow-strong);
}

.alert-card .alert-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--emerald);
    margin-bottom: 0.4rem;
}

.alert-card .alert-text {
    color: var(--text);
    font-size: 0.95rem;
}
</style>
""",
    unsafe_allow_html=True,
)

NAV_ITEMS = [
    "🏠 Dashboard",
    "💬 AI Chat",
    "🗺️ Roadmaps",
    "📅 Today's Plan",
    "📈 Progress",
    "🧩 LeetCode",
    "🧠 Weak Topics",
    "📊 Analytics",
    "⚙️ Settings",
]

DEFAULT_TASKS = [
    "Theory review — Arrays & Hashing",
    "LeetCode — Two Sum (Easy)",
    "LeetCode — Valid Parentheses (Easy)",
    "Revision — Graph BFS/DFS notes",
    "Mock interview prep — 30 min",
]


def greeting() -> str:
    hour = datetime.now().hour
    if hour < 12:
        return "Good Morning"
    if hour < 17:
        return "Good Afternoon"
    return "Good Evening"


def progress_ring_svg(percent: int, size: int = 120) -> str:
    pct = max(0, min(100, percent))
    radius = 42
    circumference = 2 * 3.14159 * radius
    offset = circumference - (pct / 100) * circumference
    return f"""
    <svg width="{size}" height="{size}" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="{radius}" fill="none"
            stroke="rgba(6,182,212,0.15)" stroke-width="6"/>
        <circle cx="50" cy="50" r="{radius}" fill="none"
            stroke="url(#grad)" stroke-width="6" stroke-linecap="round"
            stroke-dasharray="{circumference}" stroke-dashoffset="{offset}"
            transform="rotate(-90 50 50)"
            style="filter: drop-shadow(0 0 6px rgba(6,182,212,0.5));"/>
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#06B6D4"/>
                <stop offset="100%" stop-color="#10B981"/>
            </linearGradient>
        </defs>
        <text x="50" y="48" text-anchor="middle" fill="#E2E8F0"
            font-size="18" font-weight="700" font-family="Inter,sans-serif">{pct}%</text>
        <text x="50" y="62" text-anchor="middle" fill="#94A3B8"
            font-size="8" font-family="JetBrains Mono,monospace">PROGRESS</text>
    </svg>
    """


def load_agent_memory() -> dict:
    path = Path("memory/agent_memory.json")
    if not path.exists():
        return {"sessions": []}
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def compute_study_streak() -> int:
    memory = load_agent_memory()
    if not memory.get("sessions"):
        return 0
    return min(len(memory["sessions"]), 30)


def compute_progress_percent() -> int:
    if progress_db:
        return int(sum(progress_db.values()) / len(progress_db))
    completed = sum(
        1 for v in st.session_state.get("task_done", {}).values() if v
    )
    total = len(st.session_state.get("task_list", DEFAULT_TASKS))
    if total == 0:
        return 0
    return int((completed / total) * 100)


def resolve_task_list() -> list[str]:
    raw = today_tasks()
    if isinstance(raw, list) and raw:
        return [t.strip("- ").strip() for t in raw]
    if isinstance(raw, str) and raw != "No roadmap found.":
        return [raw]
    return DEFAULT_TASKS


def get_target_goal() -> str:
    data = load_roadmaps()
    if data.get("roadmaps"):
        return data["roadmaps"][-1].get("title", "DSA Interview Ready")
    memory = load_agent_memory()
    sessions = memory.get("sessions", [])
    for session in reversed(sessions):
        title = session.get("title", "")
        if any(k in title.lower() for k in ("roadmap", "dsa", "interview", "prepare")):
            return title[:80] + ("…" if len(title) > 80 else "")
    return "DSA Interview Ready — 3 Month Sprint"


def get_roadmap_entries() -> list[dict]:
    data = load_roadmaps()
    entries = list(data.get("roadmaps", []))
    if entries:
        return entries
    memory = load_agent_memory()
    for session in reversed(memory.get("sessions", [])):
        for msg in session.get("messages", []):
            if msg.get("role") == "assistant" and "roadmap" in msg.get("content", "").lower():
                return [{
                    "id": session.get("id", "memory"),
                    "title": session.get("title", "Saved Roadmap"),
                    "roadmap": msg["content"],
                    "completed_days": [],
                }]
    return []


def get_upcoming_reminder() -> str:
    entries = get_roadmap_entries()
    if entries:
        latest = entries[-1]
        lines = [
            ln.strip()
            for ln in latest.get("roadmap", "").split("\n")
            if ln.strip().startswith(("-", "*", "•")) or "week" in ln.lower()
        ]
        if lines:
            return lines[0].lstrip("-*• ").strip()
    return "Complete today's theory review before starting LeetCode problems."


def render_header_card(progress_pct: int, streak: int, goal: str) -> None:
    st.markdown(
        f"""
        <div class="agentix-card">
            <div style="display:flex; flex-wrap:wrap; align-items:center;
                justify-content:space-between; gap:1.5rem;">
                <div style="flex:1; min-width:220px;">
                    <span class="agentix-badge">Agentix OS · Online</span>
                    <h1 class="agentix-neon-title">{greeting()} Gauthami</h1>
                    <p class="agentix-subtitle">
                        LangGraph + MCP agent ready · {datetime.now().strftime("%A, %B %d")}
                    </p>
                </div>
                <div style="display:flex; align-items:center; gap:2rem; flex-wrap:wrap;">
                    <div style="text-align:center;">
                        {progress_ring_svg(progress_pct)}
                    </div>
                    <div style="display:flex; flex-direction:column; gap:0.75rem;">
                        <div style="background:rgba(17,24,39,0.8); border:1px solid rgba(16,185,129,0.35);
                            border-radius:12px; padding:0.85rem 1.25rem; box-shadow:0 0 12px rgba(6,182,212,0.15);">
                            <div style="font-size:0.65rem; color:#94A3B8; text-transform:uppercase;
                                letter-spacing:0.1em; font-family:'JetBrains Mono',monospace;">Study Streak</div>
                            <div style="font-size:1.75rem; font-weight:700; color:#10B981;">🔥 {streak} days</div>
                        </div>
                        <div style="background:rgba(17,24,39,0.8); border:1px solid rgba(6,182,212,0.35);
                            border-radius:12px; padding:0.85rem 1.25rem; box-shadow:0 0 12px rgba(6,182,212,0.15);">
                            <div style="font-size:0.65rem; color:#94A3B8; text-transform:uppercase;
                                letter-spacing:0.1em; font-family:'JetBrains Mono',monospace;">Target Goal</div>
                            <div style="font-size:0.9rem; font-weight:500; color:#E2E8F0; max-width:260px;">
                                {goal}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_dashboard() -> None:
    if "task_list" not in st.session_state:
        st.session_state.task_list = resolve_task_list()
    if "task_done" not in st.session_state:
        st.session_state.task_done = {}

    progress_pct = compute_progress_percent()
    streak = compute_study_streak()
    goal = get_target_goal()

    render_header_card(progress_pct, streak, goal)

    col_left, col_right = st.columns(2, gap="large")

    with col_left:
        st.markdown(
            '<div class="agentix-card-title">📋 Today\'s Tasks</div>',
            unsafe_allow_html=True,
        )
        with st.container(border=True):
            for idx, task in enumerate(st.session_state.task_list):
                key = f"task_{idx}"
                done = st.checkbox(task, value=st.session_state.task_done.get(key, False), key=key)
                st.session_state.task_done[key] = done

            done_count = sum(1 for v in st.session_state.task_done.values() if v)
            total = len(st.session_state.task_list)
            st.caption(f"{done_count}/{total} completed · synced via daily_task_mcp")

            if st.button("↻ Refresh tasks from roadmap", key="refresh_tasks"):
                st.session_state.task_list = resolve_task_list()
                st.rerun()

    with col_right:
        st.markdown(
            '<div class="agentix-card-title">🗺️ Roadmap Timeline</div>',
            unsafe_allow_html=True,
        )
        entries = get_roadmap_entries()
        if entries:
            latest = entries[-1]
            weeks = [
                ln.strip()
                for ln in latest.get("roadmap", "").split("\n")
                if "week" in ln.lower() or ln.strip().startswith(("-", "*"))
            ][:6]
            timeline_html = ""
            for i, week in enumerate(weeks):
                css_class = "done" if i == 0 else ""
                clean = week.lstrip("-*• ").strip()
                timeline_html += f'<div class="timeline-item {css_class}">{clean}</div>'
            st.markdown(
                f'<div class="agentix-card agentix-card-emerald">{timeline_html}</div>',
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                '<div class="agentix-card"><p style="color:#94A3B8;">No roadmap saved yet. '
                "Ask the AI Chat to generate one.</p></div>",
                unsafe_allow_html=True,
            )

        st.markdown(
            f"""
            <div class="alert-card">
                <div class="alert-label">⏰ Upcoming Reminder</div>
                <div class="alert-text">{get_upcoming_reminder()}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )


def render_ai_chat() -> None:
    st.markdown("## 💬 AI Chat")
    st.caption("Powered by LangGraph agent · planner → tools → evaluator loop")

    if not AGENT_AVAILABLE:
        st.error(f"Agent unavailable: {AGENT_ERROR}")
        st.info("Ensure GROQ_API_KEY is set in `.env` and dependencies are installed.")
        return

    if "chat_session_id" not in st.session_state:
        st.session_state.chat_session_id = None
    if "active_messages" not in st.session_state:
        st.session_state.active_messages = []

    chat_col, history_col = st.columns([2, 1], gap="large")

    with history_col:
        st.markdown("**Previous Chats**")
        sessions = get_sessions()
        for session in reversed(sessions[-12:]):
            label = session["title"][:48] + ("…" if len(session["title"]) > 48 else "")
            if st.button(label, key=f"hist_{session['id']}"):
                st.session_state.chat_session_id = session["id"]
                st.session_state.active_messages = list(session.get("messages", []))
                st.rerun()

    with chat_col:
        for msg in st.session_state.active_messages:
            with st.chat_message(msg["role"]):
                st.markdown(msg["content"])

        prompt = st.chat_input("Ask your AI agent…")
        if prompt:
            if st.session_state.chat_session_id is None:
                st.session_state.chat_session_id = create_session(prompt)
                st.session_state.active_messages = []

            add_message(st.session_state.chat_session_id, "user", prompt)
            st.session_state.active_messages.append({"role": "user", "content": prompt})

            with st.chat_message("user"):
                st.markdown(prompt)

            with st.spinner("Agent thinking…"):
                result = agent_graph.invoke({"task": prompt, "iteration": 1})
                agent_response = result.get("result") or result.get("plan", "No response generated.")

            add_message(st.session_state.chat_session_id, "assistant", agent_response)
            st.session_state.active_messages.append(
                {"role": "assistant", "content": agent_response}
            )

            with st.chat_message("assistant"):
                st.markdown(agent_response)


def render_roadmaps() -> None:
    st.markdown("## 🗺️ Roadmaps")
    entries = get_roadmap_entries()

    if not entries:
        st.info("No roadmaps in `memory/roadmap.json` yet. Use AI Chat to generate one.")
        return

    for entry in reversed(entries):
        with st.expander(entry.get("title", "Untitled Roadmap"), expanded=(entry == entries[-1])):
            st.markdown(entry.get("roadmap", ""))
            completed = entry.get("completed_days", [])
            if completed:
                st.caption(f"Completed days: {', '.join(map(str, completed))}")


def render_todays_plan() -> None:
    st.markdown("## 📅 Today's Plan")
    tasks = resolve_task_list()

    st.markdown(
        f'<div class="agentix-card"><div class="agentix-card-title">Task Queue · daily_task_mcp</div></div>',
        unsafe_allow_html=True,
    )

    for i, task in enumerate(tasks, 1):
        st.markdown(
            f"""
            <div class="agentix-card" style="padding:1rem 1.25rem;">
                <span class="agentix-badge">Task {i:02d}</span>
                <p style="margin:0.5rem 0 0; color:#E2E8F0;">{task}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )


def render_progress() -> None:
    st.markdown("## 📈 Progress")
    c1, c2, c3 = st.columns(3)
    pct = compute_progress_percent()
    c1.metric("Overall Progress", f"{pct}%")
    c2.metric("Study Streak", f"{compute_study_streak()} days")
    c3.metric("Sessions Logged", len(get_sessions()))

    st.markdown("### Update Topic Score")
    with st.form("progress_form"):
        topic = st.text_input("Topic", placeholder="e.g. Dynamic Programming")
        score = st.slider("Score", 0, 100, 50)
        if st.form_submit_button("Save Progress"):
            if topic.strip():
                update_progress(topic.strip(), score)
                st.success(f"Saved {topic} → {score}%")
                st.rerun()

    if progress_db:
        st.markdown("### Topic Scores")
        for topic, score in progress_db.items():
            st.progress(score / 100, text=f"{topic}: {score}%")


def render_leetcode() -> None:
    st.markdown("## 🧩 LeetCode")
    topic = st.selectbox(
        "Search topic",
        ["array", "graph", "tree", "dynamic programming", "dp"],
        index=0,
    )

    if st.button("Search LeetCode Problems"):
        with st.spinner("Fetching from LeetCode API…"):
            problems = search_problems(topic)
        if problems:
            for p in problems:
                st.markdown(
                    f'<div class="agentix-card" style="padding:0.75rem 1rem;">{p}</div>',
                    unsafe_allow_html=True,
                )
        else:
            st.warning("No problems returned.")


def render_weak_topics() -> None:
    st.markdown("## 🧠 Weak Topics")
    weak = weak_topics()

    if not weak and not progress_db:
        st.info(
            "No weak topics tracked yet. Update scores in **Progress** — topics below 60% appear here."
        )
        memory = load_agent_memory()
        suggested = []
        for session in memory.get("sessions", []):
            title = session.get("title", "").lower()
            for topic in ("array", "graph", "dp", "tree", "dynamic programming"):
                if topic in title and topic not in suggested:
                    suggested.append(topic.title())
        if suggested:
            st.markdown("**Suggested focus areas from chat history:**")
            for s in suggested:
                st.markdown(
                    f'<div class="agentix-card" style="padding:0.75rem 1rem; border-color:rgba(239,68,68,0.4);">'
                    f"⚠️ {s}</div>",
                    unsafe_allow_html=True,
                )
        return

    if weak:
        for topic in weak:
            score = progress_db.get(topic, 0)
            st.markdown(
                f"""
                <div class="agentix-card" style="border-color:rgba(239,68,68,0.4);">
                    <span class="agentix-badge" style="border-color:rgba(239,68,68,0.5); color:#F87171;">
                        Needs Work
                    </span>
                    <p style="margin:0.5rem 0 0; color:#E2E8F0;">{topic} — {score}%</p>
                </div>
                """,
                unsafe_allow_html=True,
            )
    else:
        st.success("All tracked topics are above 60%. Keep going!")


def render_analytics() -> None:
    st.markdown("## 📊 Analytics")
    sessions = get_sessions()
    roadmaps = load_roadmaps().get("roadmaps", [])

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Total Chats", len(sessions))
    m2.metric("Roadmaps Saved", len(roadmaps))
    m3.metric("Topics Tracked", len(progress_db))
    m4.metric("Weak Topics", len(weak_topics()))

    if sessions:
        st.markdown("### Recent Activity")
        for session in reversed(sessions[-8:]):
            msg_count = len(session.get("messages", []))
            st.markdown(
                f"- **{session['title'][:60]}** · {msg_count} messages"
            )


def render_settings() -> None:
    st.markdown("## ⚙️ Settings")
    st.markdown(
        """
        <div class="agentix-card">
            <div class="agentix-card-title">System Status</div>
            <p style="color:#94A3B8; margin:0;">
                Agent: <span style="color:#10B981;">● Online</span> if GROQ_API_KEY is configured<br>
                Memory: <code>memory/agent_memory.json</code><br>
                Roadmaps: <code>memory/roadmap.json</code><br>
                MCP: leetcode · browser · daily_task · progress
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    agent_status = "✅ Connected" if AGENT_AVAILABLE else f"❌ {AGENT_ERROR}"
    st.text_input("LangGraph Agent", value=agent_status, disabled=True)

    if st.button("Clear task checkboxes"):
        st.session_state.task_done = {}
        st.success("Task progress reset.")
        st.rerun()


with st.sidebar:
    st.markdown(
        """
        <div style="text-align:center; padding:0.5rem 0 1.5rem;">
            <div style="font-size:1.6rem; font-weight:800;
                background:linear-gradient(90deg,#06B6D4,#10B981);
                -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
                ⚡ Agentix
            </div>
            <div style="font-family:'JetBrains Mono',monospace; font-size:0.65rem;
                color:#06B6D4; letter-spacing:0.15em; margin-top:0.25rem;">
                AI OPERATING SYSTEM
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    page = st.radio(
        "Navigation",
        NAV_ITEMS,
        label_visibility="collapsed",
    )

    st.markdown("---")
    st.caption(f"Session · {datetime.now().strftime('%H:%M')}")
    if AGENT_AVAILABLE:
        st.caption("🟢 Agent online")
    else:
        st.caption("🔴 Agent offline")

ROUTES = {
    "🏠 Dashboard": render_dashboard,
    "💬 AI Chat": render_ai_chat,
    "🗺️ Roadmaps": render_roadmaps,
    "📅 Today's Plan": render_todays_plan,
    "📈 Progress": render_progress,
    "🧩 LeetCode": render_leetcode,
    "🧠 Weak Topics": render_weak_topics,
    "📊 Analytics": render_analytics,
    "⚙️ Settings": render_settings,
}

ROUTES[page]()
