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
  const [hasNewRoadmapNotification, setHasNewRoadmapNotification] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-void">
      <Sidebar
        view={view}
        setView={setView}
        views={VIEWS}
        hasNewRoadmapNotification={hasNewRoadmapNotification}
        setHasNewRoadmapNotification={setHasNewRoadmapNotification}
      />
      <main className="flex-1 h-full overflow-y-auto min-w-0">
        {view === "dashboard" && <Dashboard setView={setView} />}
        {view === "chat" && (
          <ChatBotUI setHasNewRoadmapNotification={setHasNewRoadmapNotification} />
        )}
        {view === "roadmaps" && <Roadmaps />}
      </main>
    </div>
  );
}

export default App;
