import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
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
  fetchProgress,
  toggleTask,
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

export default function Dashboard({ isDarkMode, setIsDarkMode }) {
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmapId, setActiveRoadmapId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({
    completed_tasks: 0,
    total_tasks: 0,
    overall_progress: 0,
    topics: [
      { name: "Arrays", completed: false },
      { name: "Strings", completed: false },
      { name: "Trees", completed: false },
      { name: "Graphs", completed: false },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeRoadmap = useMemo(() => {
    return roadmaps.find((r) => r.id === activeRoadmapId) || null;
  }, [roadmaps, activeRoadmapId]);

  const activeTasks = useMemo(() => {
    if (tasks.length > 0) return tasks;
    return DEFAULT_TASKS.map((t) => ({ task: t, completed: false }));
  }, [tasks]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, roadmapRes, progressRes] = await Promise.all([
        fetchTasks(),
        fetchRoadmap(),
        fetchProgress(),
      ]);

      setTasks(tasksRes.tasks || []);
      setProgress(progressRes);

      const entries = roadmapRes.roadmaps ?? [];
      setRoadmaps(entries);

      if (entries.length > 0) {
        setActiveRoadmapId((prev) => {
          const exists = entries.some((r) => r.id === prev);
          return exists && prev ? prev : entries[entries.length - 1].id;
        });
      } else {
        setActiveRoadmapId("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      setRoadmaps([]);
      setActiveRoadmapId("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completedCount = progress.completed_tasks;
  const progressPct = progress.overall_progress;

  const targetGoal = activeRoadmap?.title ?? "DSA Interview Ready — 3 Month Sprint";

  const timelineLines = useMemo(() => {
    if (!activeRoadmap?.roadmap) return [];
    return activeRoadmap.roadmap
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
  }, [activeRoadmap]);

  const upcomingReminder =
    timelineLines[0] ?? "Complete today's theory review before starting LeetCode problems.";

  const handleToggleTask = async (taskName, currentCompleted) => {
    try {
      const result = await toggleTask(taskName, currentCompleted);
      if (result.status === "success") {
        setProgress(result.progress);
        const tasksRes = await fetchTasks();
        setTasks(tasksRes.tasks || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle task status");
    }
  };

  const handleClearRoadmap = async () => {
    if (!window.confirm("Are you sure you want to clear your current learning roadmap and daily schedule? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await clearRoadmap();
      setRoadmaps([]);
      setActiveRoadmapId("");
      setTasks([]);
      setProgress({
        completed_tasks: 0,
        total_tasks: 0,
        overall_progress: 0,
        topics: [
          { name: "Arrays", completed: false },
          { name: "Strings", completed: false },
          { name: "Trees", completed: false },
          { name: "Graphs", completed: false },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear roadmap");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-[#030303] text-white" : "bg-[#fcfcfc] text-zinc-900"}`}>
      <button
        type="button"
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-8 right-8 z-50 p-2.5 rounded-lg border transition-all duration-300 cursor-pointer ${
          isDarkMode
            ? "border-zinc-800 bg-[#0c0c0e]/80 text-cyan-400 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            : "border-zinc-200 bg-white text-cyan-600 hover:border-cyan-400 shadow-[0_4_12px_rgba(0,0,0,0.03)]"
        }`}
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="relative mx-auto max-w-6xl px-6 py-12 sm:px-8 lg:px-12">
        {error && (
          <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            isDarkMode ? "border-amber-500/20 bg-amber-500/5 text-amber-300" : "border-amber-300 bg-amber-50 text-amber-800"
          }`}>
            System online with fallback defaults. ({error})
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-16 items-start">
          <div className="space-y-8">
            <div className={`flex items-center justify-between pb-4 border-b ${
              isDarkMode ? "border-zinc-800/80" : "border-zinc-200"
            }`}>
              <span className={`font-mono text-xs tracking-widest uppercase font-semibold ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                Today's Timeline ({completedCount}/{activeTasks.length})
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  className={`flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isDarkMode ? "text-zinc-400 hover:text-cyan-400" : "text-zinc-500 hover:text-cyan-600"
                  } disabled:opacity-40`}
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={handleClearRoadmap}
                  disabled={loading}
                  className={`flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isDarkMode ? "text-zinc-500 hover:text-red-400" : "text-zinc-400 hover:text-red-600"
                  } disabled:opacity-40`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Roadmap
                </button>
              </div>
            </div>

            <div className="relative pl-6">
              <ul className="space-y-0 relative">
                {activeTasks.map((taskItem, index) => {
                  const taskText = typeof taskItem === "string" ? taskItem : taskItem.task;
                  const checked = typeof taskItem === "string" ? false : taskItem.completed;
                  return (
                    <li key={`${taskText}-${index}`} className="group/item relative pb-8 flex items-start gap-4">
                      {index < activeTasks.length - 1 && (
                        <div
                          className={`absolute left-[7px] top-5 bottom-0 w-[2px] transition-all duration-300 ${
                            isDarkMode
                              ? "bg-zinc-800 group-hover/item:bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                              : "bg-zinc-200 group-hover/item:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                          }`}
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleTask(taskText, checked)}
                        className={`z-10 mt-1 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border bg-transparent transition-all duration-300 cursor-pointer ${
                          checked
                            ? "border-emerald-500 hover:border-emerald-400 bg-emerald-500/10"
                            : "border-zinc-700 hover:border-emerald-500"
                        } group-hover/item:border-cyan-400 group-hover/item:shadow-[0_0_12px_rgba(6,182,212,0.5)]`}
                      >
                        {checked && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <span
                          onClick={() => handleToggleTask(taskText, checked)}
                          className={`text-sm leading-relaxed transition-all cursor-pointer font-medium ${
                            checked
                              ? isDarkMode
                                ? "text-zinc-500 line-through"
                                : "text-zinc-400 line-through"
                              : isDarkMode
                              ? "text-zinc-200 hover:text-white"
                              : "text-zinc-800 hover:text-zinc-950"
                          } group-hover/item:translate-x-1 duration-200 block`}
                        >
                          {taskText}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className={`mt-12 pt-8 border-t ${isDarkMode ? "border-zinc-800/80" : "border-zinc-200"}`}>
              <p className={`font-mono text-xs tracking-widest uppercase font-semibold mb-6 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                Topic Progress Roadmap
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {progress.topics && progress.topics.map((topic) => {
                  let icon = "❌";
                  let statusText = "Pending";
                  let colorClass = "text-zinc-500";
                  if (topic.completed) {
                    icon = "✔";
                    statusText = "Completed";
                    colorClass = "text-emerald-500 font-bold";
                  } else {
                    const isDP = topic.name.toLowerCase() === "graphs" || topic.name.toLowerCase() === "trees";
                    if (progress.completed_tasks > 0 && isDP) {
                      icon = "⏳";
                      statusText = "In Progress";
                      colorClass = "text-cyan-400";
                    }
                  }

                  return (
                    <div key={topic.name} className="flex flex-col gap-1.5">
                      <span className={`text-sm font-mono uppercase tracking-wider ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                        {topic.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{icon}</span>
                        <span className={`text-xs font-semibold ${colorClass}`}>{statusText}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div>
              <p className={`font-mono text-xs tracking-widest uppercase font-semibold ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                {formatDate()}
              </p>
              <h1 className={`text-5xl font-black tracking-tighter mt-2 leading-none ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                {greeting()}<br />Gauthami
              </h1>
              <p className={`text-xs mt-3 font-mono ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                Agentix OS v1.0.0 · Core Node Online
              </p>
            </div>

            {roadmaps.length > 0 && (
              <div className="relative w-full">
                <p className={`font-mono text-[10px] tracking-widest uppercase mb-2 ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                  Active Roadmap File
                </p>
                <div className="relative">
                  <select
                    value={activeRoadmapId}
                    onChange={(e) => setActiveRoadmapId(e.target.value)}
                    className={`w-full appearance-none rounded-lg border px-4 py-2.5 pr-10 text-xs font-semibold cursor-pointer transition-all duration-300 ${
                      isDarkMode
                        ? "border-zinc-800 bg-[#0c0c0e]/80 text-zinc-200 hover:border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)] focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                        : "border-zinc-200 bg-white text-zinc-800 hover:border-cyan-400 shadow-[0_4_12px_rgba(0,0,0,0.02)] focus:border-cyan-400 focus:shadow-[0_4_12px_rgba(0,0,0,0.04)]"
                    }`}
                  >
                    {roadmaps.map((r) => (
                      <option key={r.id} value={r.id} className={isDarkMode ? "bg-zinc-950 text-slate-200" : "bg-white text-zinc-800"}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-cyan-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )}

            <div className={`space-y-6 pt-6 border-t ${isDarkMode ? "border-zinc-800/80" : "border-zinc-200"}`}>
              <p className={`font-mono text-[10px] tracking-widest uppercase ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                Performance Stats
              </p>

              <div className="flex justify-between items-center">
                <span className={`text-xs font-mono uppercase tracking-wider ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                  Solved Today
                </span>
                <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                  {completedCount} Tasks
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-dashed border-zinc-800/40 pt-4">
                <span className={`text-xs font-mono uppercase tracking-wider ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                  Current Topic
                </span>
                <span className={`text-sm font-bold ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`}>
                  {targetGoal}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-dashed border-zinc-800/40 pt-4">
                <span className={`text-xs font-mono uppercase tracking-wider ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                  Completion
                </span>
                <span className={`text-sm font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                  {progressPct}% ({completedCount} / {progress.total_tasks} Tasks)
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-dashed border-zinc-800/40 pt-4">
                <span className={`text-xs font-mono uppercase tracking-wider ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                  Longest Streak
                </span>
                <span className="text-sm font-bold text-orange-500">
                  12 Days
                </span>
              </div>
            </div>

            {timelineLines.length > 0 && (
              <div className={`pt-6 border-t ${isDarkMode ? "border-zinc-800/80" : "border-zinc-200"}`}>
                <p className={`font-mono text-[10px] tracking-widest uppercase mb-4 ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                  Roadmap Timeline
                </p>
                <ol className="space-y-4">
                  {timelineLines.map((line, i) => (
                    <li key={line} className={`relative border-l pl-4 py-0.5 ${isDarkMode ? "border-zinc-800" : "border-zinc-200"}`}>
                      <span
                        className={`absolute -left-[4.5px] top-2 h-2.5 w-2.5 rounded-full border transition-all duration-300 ${
                          i === 0
                            ? "bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                            : isDarkMode
                            ? "bg-zinc-950 border-zinc-850"
                            : "bg-white border-zinc-300"
                        }`}
                      />
                      <p className={`text-xs leading-relaxed font-medium ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`}>
                        {line}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className={`p-5 rounded-lg border transition-all duration-300 ${
              isDarkMode
                ? "border-zinc-850 bg-[#0c0c0e]/80 text-zinc-300 shadow-[0_0_15px_rgba(34,197,94,0.02)]"
                : "border-zinc-200 bg-zinc-50/50 text-zinc-700 shadow-[0_4_12px_rgba(0,0,0,0.01)]"
            }`}>
              <p className={`font-mono text-[9px] tracking-widest uppercase font-semibold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                Upcoming Reminder
              </p>
              <p className="mt-2 text-xs leading-relaxed font-medium">
                {upcomingReminder}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
