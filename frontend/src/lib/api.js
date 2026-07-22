const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function request(path, init) {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function fetchTasks() {
  return request(`/api/tasks?_t=${Date.now()}`);
}

export function fetchRoadmap() {
  return request(`/api/roadmap?_t=${Date.now()}`);
}

export function clearRoadmap() {
  return request("/api/roadmap", {
    method: "DELETE",
  });
}

export function fetchProgress() {
  return request(`/api/progress?_t=${Date.now()}`);
}

export function toggleTask(task, completed) {
  return request("/api/tasks/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, completed }),
  });
}

export function completeTask(taskName, completed) {
  return request("/api/complete-task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_name: taskName, completed }),
  });
}


export function completeRoadmapTopic(roadmapId, phaseTitle, topicName, completed) {
  return request("/api/complete-roadmap-topic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roadmap_id: roadmapId, phase_title: phaseTitle, topic_name: topicName, completed }),
  });
}


export function sendChat(message, sessionId, chatMode = "general_chat", activePersona = null, selectedRepo = "") {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return request("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ message, session_id: sessionId ?? null, chatMode, activePersona, selectedRepo }),
  });
}

export async function sendMessageToAgent(text, sessionId, chatMode, activePersona = null, selectedRepo = "") {
  const data = await sendChat(text.trim(), sessionId, chatMode, activePersona, selectedRepo);
  return {
    reply: data.response,
    sessionId: data.session_id,
    chatMode: data.chat_mode,
    youtubeMetadata: data.youtube_metadata,
    status: data.status,
    problemName: data.problem_name,
  };
}


export const DEFAULT_TASKS = [
  "Theory review — Arrays & Hashing",
  "LeetCode — Two Sum (Easy)",
  "LeetCode — Valid Parentheses (Easy)",
  "Revision — Graph BFS/DFS notes",
  "Mock interview prep — 30 min",
];
