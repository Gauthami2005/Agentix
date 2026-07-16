import { LayoutDashboard, MessageSquare, Map, Zap } from "lucide-react";

export default function Sidebar({ view, setView, views, hasNewRoadmapNotification, setHasNewRoadmapNotification, user, isGuest }) {
  const userName = (() => {
    if (isGuest || !user) return "Guest";
    return user.displayName || user.email || "Gauthami";
  })();

  return (
    <aside className="w-64 flex-col bg-[#121316] border-r border-[#22252a] flex h-full justify-between p-4 shrink-0">
      {}
      <div>
        <div className="flex items-center gap-3 px-2 py-4 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#22252a] bg-[#1c1d22]">
            <Zap className="h-5 w-5 text-[#6366f1]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#f3f4f6] tracking-wider">
              Agentix
            </h1>
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-[#9ca3af]">
              v1.0.0 · Core OS
            </p>
          </div>
        </div>

        {}
        <nav className="flex flex-col gap-2">
          {views.map(({ id, label, icon: Icon }) => {
            const isActive = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setView(id);
                  if (id === "roadmaps" && setHasNewRoadmapNotification) {
                    setHasNewRoadmapNotification(false);
                  }
                }}
                className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-200 border ${isActive
                    ? "border-[#22252a] bg-[#1c1d22] text-[#f3f4f6]"
                    : "border-transparent text-[#9ca3af] hover:bg-[#1c1e22] hover:text-[#f3f4f6]"
                  }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-[#6366f1]" />
                )}
                <Icon
                  className={`h-4.5 w-4.5 transition duration-200 ${isActive ? "text-[#6366f1] scale-110" : "text-[#9ca3af] group-hover:text-[#f3f4f6]"
                    }`}
                />
                <span>{label}</span>
                {id === "roadmaps" && hasNewRoadmapNotification && (
                  <span className="relative flex h-2 w-2 ml-auto">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6366f1] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6366f1]"></span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {}
      <div className="rounded-xl border border-[#22252a] bg-[#141519] p-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[#9ca3af]">
            Node Online
          </span>
        </div>
        <p className="mt-1.5 text-xs font-semibold text-[#f3f4f6]">{userName}</p>
      </div>
    </aside>
  );
}
