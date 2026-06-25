import { useState } from "react";
import { LayoutDashboard, MessageSquare, Map } from "lucide-react";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ChatBotUI from "./components/ChatBotUI";
import Roadmaps from "./components/Roadmaps";

const VIEWS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "roadmaps", label: "Roadmaps", icon: Map },
];

function App() {
  const [view, setView] = useState("dashboard");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-void">
      <Sidebar view={view} setView={setView} views={VIEWS} />
      <main className="flex-1 h-full overflow-y-auto min-w-0">
        {view === "dashboard" && <Dashboard />}
        {view === "chat" && <ChatBotUI />}
        {view === "roadmaps" && <Roadmaps />}
      </main>
    </div>
  );
}

export default App;
