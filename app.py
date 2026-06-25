import streamlit as st

from agent import app
from memory.memory_manager import (
    create_session,
    add_message,
    get_sessions
)

st.set_page_config(layout="wide")

st.title("Agentix ")

# Sidebar
st.sidebar.title("Previous Chats")

sessions = get_sessions()

selected_session = None

for session in sessions:
   if st.sidebar.button(
    session["title"],
    key=session["id"]
):
        selected_session = session

# Main Input
task = st.chat_input("Ask your AI agent...")

if task:

    session_id = create_session(task)

    add_message(session_id, "user", task)

    with st.chat_message("user"):
        st.write(task)

    result = app.invoke({
        "task": task,
        "iteration": 1
    })

    agent_response = result["result"]

    add_message(session_id, "assistant", agent_response)

    with st.chat_message("assistant"):
        st.write(agent_response)

# Show Previous Session
if selected_session:

    st.subheader(selected_session["title"])

    for msg in selected_session["messages"]:

        with st.chat_message(msg["role"]):
            st.write(msg["content"])