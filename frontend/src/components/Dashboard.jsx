import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Flame,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  Zap,
} from "lucide-react";

import { ProgressRing } from "./ProgressRing";
import {
  DEFAULT_TASKS,
  fetchRoadmap,
  fetchTasks,
  clearRoadmap,
} from "../lib/api";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function Card({
  children,
  className = "",
  glow = "cyan",
}) {
  const border =
    glow === "emerald"
      ? "border-emerald-neon/35 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
      : "border-cyan-neon/35 shadow-[0_0_15px_rgba(6,182,212,0.15)]";

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br from-surface to-surface-2 p-5 ${border} ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ icon: Icon, label }) {
  return (
    <div className="mb-4 flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-cyan-neon">
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {label}
    </div>
  );
}

function cleanTaskKey(text) {
  if (!text) return "";
  return text.replace(/^[#\-\*\•\s]+/, "").trim();
}

export default function Dashboard() {
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [taskSource, setTaskSource] = useState("fallback");
  const [done, setDone] = useState(() => {
    try {
      const saved = localStorage.getItem("completedTasks");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, roadmapRes] = await Promise.all([fetchTasks(), fetchRoadmap()]);

      if (tasksRes.tasks.length > 0) {
        setTasks(tasksRes.tasks);
        setTaskSource(tasksRes.source === "roadmap" ? "roadmap" : "fallback");
      } else {
        setTasks(DEFAULT_TASKS);
        setTaskSource("fallback");
      }

      const entries = roadmapRes.roadmaps ?? [];
      setRoadmap(entries.length ? entries[entries.length - 1] : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      setTasks(DEFAULT_TASKS);
      setTaskSource("fallback");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completedCount = useMemo(
    () => tasks.filter((task) => !!done[cleanTaskKey(task)]).length,
    [tasks, done],
  );

  const progressPct = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  const targetGoal = roadmap?.title ?? "DSA Interview Ready — 3 Month Sprint";

  const timelineLines = useMemo(() => {
    if (!roadmap?.roadmap) return [];
    return roadmap.roadmap
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.startsWith("-") ||
          line.startsWith("*") ||
          /week\s+\d/i.test(line),
      )
      .slice(0, 5)
      .map((line) => line.replace(/^[-*•]\s*/, ""));
  }, [roadmap]);

  const upcomingReminder =
    timelineLines[0] ?? "Complete today's theory review before starting LeetCode problems.";

  const toggleTask = (task) => {
    const key = cleanTaskKey(task);
    setDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("completedTasks", JSON.stringify(next));
      return next;
    });
  };

  const handleClearRoadmap = async () => {
    if (!window.confirm("Are you sure you want to clear your current learning roadmap and daily schedule? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await clearRoadmap();
      setTasks([]);
      setTaskSource("fallback");
      setRoadmap(null);
      localStorage.removeItem("completedTasks");
      setDone({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear roadmap");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-void text-slate-200">
      {/* Ambient background */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.08),transparent),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(16,185,129,0.06),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header card */}
        <Card className="mb-6 overflow-hidden">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-neon/40 bg-cyan-neon/10 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-cyan-neon">
                  <Zap className="h-3 w-3" />
                  Agentix OS · Online
                </span>
                <button
                  type="button"
                  onClick={handleClearRoadmap}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-red-400 hover:bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3 text-red-400/80" />
                  Clear Roadmap
                </button>
              </div>
              <h1 className="bg-gradient-to-r from-cyan-neon to-emerald-neon bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                {greeting()} Gauthami
              </h1>
              <p className="text-sm text-slate-400">
                LangGraph + MCP agent ready · {formatDate()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <ProgressRing percent={progressPct} />

              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-emerald-neon/35 bg-surface/80 px-5 py-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <p className="font-mono text-[0.6rem] uppercase tracking-widest text-slate-400">
                    Study Streak
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-emerald-neon">
                    <Flame className="h-6 w-6 text-orange-400" />
                    7 days
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-neon/35 bg-surface/80 px-5 py-3 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <p className="font-mono text-[0.6rem] uppercase tracking-widest text-slate-400">
                    Target Goal
                  </p>
                  <p className="mt-1 flex items-start gap-2 text-sm font-medium leading-snug text-slate-200">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-cyan-neon" />
                    <span className="line-clamp-2">{targetGoal}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {error && (
          <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            API offline — showing defaults. ({error})
          </div>
        )}

        {/* Two-column hub */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Tasks */}
          <div>
            <SectionLabel icon={Sparkles} label="Today's Tasks" />
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {completedCount}/{tasks.length} completed
                  {taskSource === "roadmap" ? " · synced from roadmap" : " · default queue"}
                </p>
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-neon/40 bg-cyan-neon/10 px-3 py-1.5 text-xs font-medium text-cyan-neon transition hover:border-emerald-neon/50 hover:bg-cyan-neon/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Refresh
                </button>
              </div>

              <ul className="space-y-2">
                {tasks.map((task, index) => {
                  const checked = !!done[cleanTaskKey(task)];
                  return (
                    <li key={`${task}-${index}`}>
                      <button
                        type="button"
                        onClick={() => toggleTask(task)}
                        className={`group flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                          checked
                            ? "border-emerald-neon/40 bg-emerald-neon/5 shadow-[0_0_12px_rgba(16,185,129,0.12)]"
                            : "border-cyan-neon/20 bg-void/40 hover:border-cyan-neon/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                        }`}
                      >
                        {checked ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-neon" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 group-hover:text-cyan-neon" />
                        )}
                        <span
                          className={`text-sm leading-relaxed ${
                            checked ? "text-slate-400 line-through" : "text-slate-200"
                          }`}
                        >
                          {task}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          {/* Roadmap timeline + reminder */}
          <div>
            <SectionLabel icon={Target} label="Roadmap Timeline" />
            <Card glow="emerald" className="mb-4">
              {timelineLines.length > 0 ? (
                <ol className="space-y-4">
                  {timelineLines.map((line, i) => (
                    <li key={line} className="relative border-l-2 border-cyan-neon/30 pl-4">
                      <span
                        className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ${
                          i === 0 ? "bg-emerald-neon shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "bg-cyan-neon/60"
                        }`}
                      />
                      <p className="text-sm leading-relaxed text-slate-300">{line}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-400">
                  No roadmap saved yet. Ask the AI agent to generate one via{" "}
                  <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-cyan-neon">
                    POST /api/chat
                  </code>
                  .
                </p>
              )}
            </Card>

            <div className="rounded-2xl border border-emerald-neon/40 bg-emerald-neon/5 p-5 shadow-[0_0_15px_rgba(16,185,129,0.18)]">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-emerald-neon">
                Upcoming Reminder
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{upcomingReminder}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
