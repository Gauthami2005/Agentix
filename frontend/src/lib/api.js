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


export function sendChat(message, sessionId) {
  return request("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId ?? null }),
  });
}

export async function sendMessageToAgent(text, sessionId) {
  const data = await sendChat(text.trim(), sessionId);
  return { reply: data.response, sessionId: data.session_id };
}

export const DEFAULT_TASKS = [
  "Theory review — Arrays & Hashing",
  "LeetCode — Two Sum (Easy)",
  "LeetCode — Valid Parentheses (Easy)",
  "Revision — Graph BFS/DFS notes",
  "Mock interview prep — 30 min",
];
