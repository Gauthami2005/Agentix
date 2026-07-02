import { useState, useEffect } from "react";
import { LayoutDashboard, MessageSquare, Map, User } from "lucide-react";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ChatBotUI from "./components/ChatBotUI";
import Roadmaps from "./components/Roadmaps";

import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";

const VIEWS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "roadmaps", label: "Roadmaps", icon: Map },
  { id: "profile", label: "Integrations", icon: User },
];

function App() {
  const [view, setView] = useState("dashboard");
  const [hasNewRoadmapNotification, setHasNewRoadmapNotification] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setView("dashboard");
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b0c0e] text-[#f3f4f6]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#22252a] border-t-[#6366f1]" />
          <p className="text-sm font-medium text-[#9ca3af]">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-void">
      <Sidebar
        view={view}
        setView={setView}
        views={VIEWS}
        hasNewRoadmapNotification={hasNewRoadmapNotification}
        setHasNewRoadmapNotification={setHasNewRoadmapNotification}
        user={user}
      />
      <main className="flex-1 h-full overflow-y-auto min-w-0">
        {view === "dashboard" && <Dashboard setView={setView} />}
        {view === "chat" && (
          <ChatBotUI setHasNewRoadmapNotification={setHasNewRoadmapNotification} />
        )}
        {view === "roadmaps" && <Roadmaps />}
        {view === "profile" && (
          <ProfilePage user={user} setUser={setUser} onLogout={handleLogout} />
        )}
      </main>
    </div>
  );
}

export default App;
