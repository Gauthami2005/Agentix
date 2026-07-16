# Agentix OS ⚡

An autonomous, agentic learning ecosystem that transforms a dark-mode developer workspace into an automated, contextual study assistant. Powered by a proactive feedback loop and live browser automation, Agentix orchestrates real-time curriculum adjustment and hands-free platform research.

## 🗺️ System Architecture & Roadmap

### Project Architecture
![Project Architecture](./architecture_diagram.jpg)

### System Workflows
![Roadmap Timeline](./roadmap_image.jpg)

---

## 🚀 Core Features

* **Adaptive Learning Engine:** Built a closed-loop task-optimization engine using **FastAPI** and **LangGraph** that monitors real-time checklist interactions to autonomously restructure upcoming training modules.
* **Browser Automation MCP Subsystem:** Implemented a native **Python** browser automation node enabling the agent to programmatically launch desktop windows, handle multi-tab execution, and synchronize automated web research across platform nodes.
* **Unified Metrics Workspace:** Engineered a premium, high-contrast **React** and **Tailwind CSS** control dashboard complete with unified progress tracking calculators, background sync indicators, and embedded inline video resources.

---

## 🛠️ Tech Stack

* **Frontend:** React, Tailwind CSS, Vite
* **Backend Engine:** FastAPI, LangGraph, Python
* **Data Layer:** JSON State Matrices

---

## ⚙️ Installation & Setup

### 1. Backend Environment Setup
```bash
# Activate your virtual environment
source venv/bin/activate

# Install core dependencies
python3 -m pip install playwright
python3 -m playwright install
```

### 2. Frontend Interface Setup
```bash
# Install node dependencies
npm install

# Boot the local development instance
npm run dev
```
The interface will initialize locally at http://localhost:5173.
