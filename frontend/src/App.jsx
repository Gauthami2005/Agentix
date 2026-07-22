import { useState, useEffect } from "react";
import { LayoutDashboard, MessageSquare, Map, User, FileText, StickyNote } from "lucide-react";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ChatBotUI from "./components/ChatBotUI";
import Roadmaps from "./components/Roadmaps";
import AtsScanner from "./components/AtsScanner";
import Notes from "./pages/Notes";

import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";

const VIEWS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "roadmaps", label: "Roadmaps", icon: Map },
  { id: "ats", label: "ATS Scanner", icon: FileText },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "profile", label: "Integrations", icon: User },
];

import { API_BASE_URL } from "./config";

function App() {
  const [view, setView] = useState("dashboard");
  const [hasNewRoadmapNotification, setHasNewRoadmapNotification] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
    }
    const githubConnected = urlParams.get("github_connected");
    const viewParam = urlParams.get("view");
    if (githubConnected === "true" || viewParam === "profile") {
      setView("profile");
    }
    if (token || githubConnected === "true" || viewParam) {
      window.history.replaceState({}, document.title, "/");
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        signal: controller.signal,
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxBypass = () => {
    localStorage.setItem("token", "mock_developer_jwt_token_payload");
    setUser({
      email: "developer@agentix.ai",
      displayName: "Dev Gauthami",
      googleId: "mock-google-id-12345",
      github: null,
      leetcode: null
    });
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsGuest(false);
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

  if (!user && !isGuest) {
    return <AuthPage onBypass={handleSandboxBypass} onGuest={() => setIsGuest(true)} />;
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
        isGuest={isGuest}
      />
      <main className="flex-1 h-full overflow-y-auto min-w-0">
        {view === "dashboard" && <Dashboard setView={setView} user={user} isGuest={isGuest} />}
        {view === "chat" && (
          <ChatBotUI user={user} setHasNewRoadmapNotification={setHasNewRoadmapNotification} />
        )}
        {view === "roadmaps" && <Roadmaps />}
        {view === "ats" && <AtsScanner user={user} />}
        {view === "notes" && <Notes />}
        {view === "profile" && (
          <ProfilePage user={user} setUser={setUser} onLogout={handleLogout} />
        )}
      </main>
    </div>
  );
}

export default App;
