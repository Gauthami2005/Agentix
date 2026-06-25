import { LayoutDashboard, MessageSquare, Map, Zap } from "lucide-react";

export default function Sidebar({ view, setView, views }) {
  return (
    <aside className="w-64 flex-col bg-slate-950/80 border-r border-cyan-500/10 flex h-full justify-between p-4 backdrop-blur-md shrink-0">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-2 py-4 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-neon/40 bg-cyan-neon/10 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Zap className="h-5 w-5 text-cyan-neon animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-neon to-emerald-neon bg-clip-text text-transparent tracking-wider">
              Agentix
            </h1>
            <p className="font-mono text-[0.6rem] uppercase tracking-wider text-slate-500">
              v1.0.0 · Core OS
            </p>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex flex-col gap-2">
          {views.map(({ id, label, icon: Icon }) => {
            const isActive = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-200 border ${
                  isActive
                    ? "border-cyan-neon/35 bg-cyan-neon/10 text-cyan-neon shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 hover:border-slate-800/40"
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 transition duration-200 ${
                    isActive ? "text-cyan-neon scale-110" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Status / Footer */}
      <div className="rounded-xl border border-cyan-500/10 bg-slate-900/40 p-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-neon animate-ping" />
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-slate-400">
            Node Online
          </span>
        </div>
        <p className="mt-1.5 text-xs font-semibold text-slate-200">Gauthami</p>
      </div>
    </aside>
  );
}
