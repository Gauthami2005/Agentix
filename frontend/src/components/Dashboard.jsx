import { useCallback, useEffect, useMemo, useState } from "react";
import { Sun, Moon, ChevronDown, CheckCircle2, Circle, Flame, Target, Compass, RefreshCw, Loader2, Trash2, Zap, Sparkles } from "lucide-react";

import { ProgressRing } from "./ProgressRing";
import {
  DEFAULT_TASKS,
  fetchRoadmap,
  fetchTasks,
  clearRoadmap,
  fetchProgress,
  toggleTask as toggleTaskApi,
  completeTask,
  completeRoadmapTopic,
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

function tryParseRoadmap(roadmapStr) {
  if (!roadmapStr) return null;
  try {
    const data = JSON.parse(roadmapStr);
    if (data && data.roadmap_title && data.phases) {
      return data;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export default function Dashboard({ setView }) {
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmapId, setActiveRoadmapId] = useState("");
  const [taskSource, setTaskSource] = useState("fallback");
  const [tasks, setTasks] = useState([]);
  const [tomorrowTasks, setTomorrowTasks] = useState([]);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, roadmapRes, progressRes] = await Promise.all([
        fetchTasks(),
        fetchRoadmap(),
        fetchProgress(),
      ]);

      setProgress(progressRes);
      setTomorrowTasks(tasksRes.tomorrow || []);

      const entries = roadmapRes.roadmaps ?? [];
      setRoadmaps(entries);

      if (entries.length > 0) {
        setActiveRoadmapId((prev) => {
          const exists = entries.some((r) => r.id === prev);
          return exists && prev ? prev : entries[entries.length - 1].id;
        });
        setTaskSource("roadmap");
      } else {
        setActiveRoadmapId("");
        setTaskSource("fallback");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      setRoadmaps([]);
      setActiveRoadmapId("");
      setTaskSource("fallback");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Synchronize activeTasks from active roadmap or defaults with completed states from backend
  useEffect(() => {
    if (activeRoadmap?.roadmap) {
      const parsedRoadmap = tryParseRoadmap(activeRoadmap.roadmap);
      if (parsedRoadmap) {
        const parsedTasks = [];
        for (const phase of parsedRoadmap.phases) {
          if (phase.core_topics) {
            for (const topic of phase.core_topics) {
              const isCompleted = progress.completed_task_names?.some(
                (name) => cleanTaskKey(name) === cleanTaskKey(topic)
              ) || false;
              parsedTasks.push({ task: topic, completed: isCompleted });
              if (parsedTasks.length === 5) break;
            }
          }
          if (parsedTasks.length === 5) break;
        }
        setTasks(parsedTasks);
        return;
      }

      const lines = activeRoadmap.roadmap.split("\n");
      const parsedTasks = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("+")) {
          const cleaned = trimmed.replace(/^[-*+•\s]+/, "").trim();
          if (cleaned) {
            const isCompleted = progress.completed_task_names?.some(
              (name) => cleanTaskKey(name) === cleanTaskKey(cleaned)
            ) || false;
            parsedTasks.push({ task: cleaned, completed: isCompleted });
          }
        }
        if (parsedTasks.length === 5) {
          break;
        }
      }
      if (parsedTasks.length > 0) {
        setTasks(parsedTasks);
      } else {
        setTasks([]);
      }
    } else {
      setTasks([]);
    }
  }, [activeRoadmap, roadmaps, progress.completed_task_names]);

  const roadmapTopics = useMemo(() => {
    if (!activeRoadmap?.roadmap) return [];
    const parsed = tryParseRoadmap(activeRoadmap.roadmap);
    if (!parsed || !parsed.phases) return [];
    
    const topics = [];
    for (const phase of parsed.phases) {
      if (phase.core_topics) {
        for (const topic of phase.core_topics) {
          topics.push(topic);
        }
      }
    }
    return topics;
  }, [activeRoadmap]);

  const completedRoadmapTopicsCount = useMemo(() => {
    if (!activeRoadmap) return 0;
    const completedList = activeRoadmap.completed_topics || [];
    return roadmapTopics.filter(topic => completedList.includes(topic)).length;
  }, [activeRoadmap, roadmapTopics]);

  const dailyCompletedCount = useMemo(() => {
    return tasks.filter((t) => typeof t === "string" ? false : t.completed).length;
  }, [tasks]);

  const totalObjectives = useMemo(() => {
    return tasks.length + roadmapTopics.length;
  }, [tasks.length, roadmapTopics.length]);

  const totalCompleted = useMemo(() => {
    return dailyCompletedCount + completedRoadmapTopicsCount;
  }, [dailyCompletedCount, completedRoadmapTopicsCount]);

  const unifiedProgressPct = useMemo(() => {
    if (totalObjectives === 0) return 0;
    return Math.round((totalCompleted / totalObjectives) * 100);
  }, [totalObjectives, totalCompleted]);

  // Keep these legacy metrics variables so they don't break fallback renderings if any
  const completedCount = dailyCompletedCount;
  const progressPct = unifiedProgressPct;

  const targetGoal = activeRoadmap?.title ?? "DSA Interview Ready — 3 Month Sprint";

  const timelineLines = useMemo(() => {
    if (!activeRoadmap?.roadmap) return [];
    const parsedRoadmap = tryParseRoadmap(activeRoadmap.roadmap);
    if (parsedRoadmap) {
      return parsedRoadmap.phases.map(phase => phase.phase_title).slice(0, 5);
    }
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

  const parsedData = useMemo(() => {
    if (!activeRoadmap?.roadmap) return null;
    return tryParseRoadmap(activeRoadmap.roadmap);
  }, [activeRoadmap]);

  const upcomingReminder = useMemo(() => {
    if (parsedData && parsedData.phases && parsedData.phases.length > 0) {
      return `Current Target: Focus on ${parsedData.phases[0].phase_title} topics this week.`;
    }
    if (tomorrowTasks[0]?.task) {
      return `Upcoming: ${tomorrowTasks[0].task}`;
    }
    if (timelineLines[0]) {
      return timelineLines[0];
    }
    return "Complete today's theory review before starting LeetCode problems.";
  }, [parsedData, tomorrowTasks, timelineLines]);

  const toggleRoadmapTopic = async (phaseTitle, topicName) => {
    if (!activeRoadmap) return;

    const completedList = activeRoadmap.completed_topics || [];
    const isCompleted = completedList.includes(topicName);
    const nextCompleted = !isCompleted;

    // 1. Optimistic UI update locally
    setRoadmaps((prevRoadmaps) => {
      return prevRoadmaps.map((r) => {
        if (r.id === activeRoadmapId) {
          const list = r.completed_topics || [];
          const updatedList = nextCompleted
            ? [...list, topicName]
            : list.filter((t) => t !== topicName);
          return { ...r, completed_topics: updatedList };
        }
        return r;
      });
    });

    // 2. Persist to backend database
    try {
      const result = await completeRoadmapTopic(
        activeRoadmapId,
        phaseTitle,
        topicName,
        nextCompleted
      );
      if (result.status === "success" && result.roadmap) {
        setRoadmaps((prevRoadmaps) => {
          return prevRoadmaps.map((r) => {
            if (r.id === activeRoadmapId) {
              return result.roadmap;
            }
            return r;
          });
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle roadmap topic status");
    }
  };

  const toggleTask = async (taskId) => {
    let taskName = "";
    let currentCompleted = false;

    setTasks((prevTasks) => {
      return prevTasks.map((t) => {
        const tText = typeof t === "string" ? t : t.task;
        if (tText === taskId) {
          taskName = tText;
          currentCompleted = typeof t === "string" ? false : t.completed;
          return { ...t, completed: !currentCompleted };
        }
        return t;
      });
    });

    if (taskName) {
      try {
        const result = await completeTask(taskName, !currentCompleted);
        if (result.status === "success") {
          setProgress(result.progress);
          if (result.schedule) {
            setTasks(result.schedule.today || []);
            setTomorrowTasks(result.schedule.tomorrow || []);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to toggle task status");
      }
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
      setTaskSource("fallback");
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
    <div className="min-h-screen bg-void text-slate-200">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.08),transparent),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(16,185,129,0.06),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
              {roadmaps.length > 0 && (
                <div className="relative mt-3 inline-block w-full max-w-xs">
                  <select
                    value={activeRoadmapId}
                    onChange={(e) => setActiveRoadmapId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-cyan-neon/30 bg-slate-900/80 px-4 py-2 pr-10 text-xs font-semibold text-slate-200 shadow-[0_0_15px_rgba(6,182,212,0.05)] transition-all hover:border-cyan-neon/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] focus:border-cyan-neon focus:outline-none focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer"
                  >
                    {roadmaps.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-950 text-slate-200">
                        {r.title}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-cyan-neon">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              )}
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

        <div className="grid gap-6 lg:grid-cols-2">
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

              {activeRoadmap ? (
                <ul className="space-y-2">
                  {tasks.map((taskItem, index) => {
                    const taskText = typeof taskItem === "string" ? taskItem : taskItem.task;
                    const checked = typeof taskItem === "string" ? false : taskItem.completed;
                    return (
                      <li key={`${taskText}-${index}`}>
                        <div
                          onClick={() => toggleTask(taskText)}
                          className={`group flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition cursor-pointer ${checked
                            ? "border-emerald-neon/40 bg-emerald-neon/5 shadow-[0_0_12px_rgba(16,185,129,0.12)]"
                            : "border-cyan-neon/20 bg-void/40 hover:border-cyan-neon/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                            }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTask(taskText);
                            }}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-transparent transition-all duration-350 cursor-pointer ${checked
                                ? "border-emerald-neon/40 text-emerald-neon"
                                : "border-slate-500 text-slate-500 group-hover:border-cyan-neon"
                              }`}
                          >
                            {checked ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-neon" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-500 group-hover:text-cyan-neon" />
                            )}
                          </button>
                          <span
                            className={`text-sm leading-relaxed ${checked ? "text-slate-400 line-through" : "text-slate-200"
                              }`}
                          >
                            {taskText}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <button
                  type="button"
                  onClick={() => setView("chat")}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-6 py-8 text-center text-sm font-semibold text-white shadow-[0_0_15px_rgba(6,182,212,0.05)] hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 hover:border-cyan-neon/40 cursor-pointer"
                >
                  ➕ Create a Roadmap
                </button>
              )}
            </Card>
          </div>

          <div>
            <SectionLabel icon={Target} label="Roadmap Timeline" />
            <Card glow="emerald" className="mb-4">
              {parsedData && parsedData.phases ? (
                <ol className="space-y-5">
                  {parsedData.phases.map((phase, i) => (
                    <li key={phase.phase_title} className="relative border-l-2 border-cyan-neon/30 pl-4 pb-2">
                      <span
                        className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ${i === 0 ? "bg-emerald-neon shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "bg-cyan-neon/60"
                          }`}
                      />
                      <h4 className="text-sm font-bold text-slate-200 leading-snug">{phase.phase_title}</h4>
                      {phase.description && (
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">{phase.description}</p>
                      )}
                      {phase.core_topics && phase.core_topics.length > 0 && (
                        <div className="mt-3.5 space-y-2">
                          {phase.core_topics.map((topic) => {
                            const isTopicCompleted = activeRoadmap.completed_topics?.includes(topic) || false;
                            return (
                              <div
                                key={topic}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRoadmapTopic(phase.phase_title, topic);
                                }}
                                className={`flex items-center gap-2.5 rounded-lg border px-3 py-1.5 text-left transition cursor-pointer text-xs ${
                                  isTopicCompleted
                                    ? "border-emerald-neon/40 bg-emerald-neon/5 text-emerald-neon shadow-[0_0_8px_rgba(16,185,129,0.06)]"
                                    : "border-slate-800/80 bg-slate-900/30 text-slate-300 hover:border-cyan-neon/30 hover:bg-slate-900/60"
                                }`}
                              >
                                <button
                                  type="button"
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border bg-transparent transition-all duration-300 cursor-pointer ${
                                    isTopicCompleted
                                      ? "border-emerald-neon/50 text-emerald-neon"
                                      : "border-slate-600 text-slate-500 hover:border-cyan-neon"
                                  }`}
                                >
                                  {isTopicCompleted ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-neon" />
                                  ) : (
                                    <Circle className="h-3 w-3 text-slate-500 hover:text-cyan-neon" />
                                  )}
                                </button>
                                <span className={isTopicCompleted ? "line-through text-slate-400" : ""}>
                                  {topic}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              ) : tomorrowTasks.length > 0 ? (
                <ol className="space-y-4">
                  {tomorrowTasks.map((t, i) => (
                    <li key={t.task || t} className="relative border-l-2 border-cyan-neon/30 pl-4">
                      <span
                        className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ${i === 0 ? "bg-emerald-neon shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "bg-cyan-neon/60"
                          }`}
                      />
                      <p className="text-sm leading-relaxed text-slate-300">{t.task || t}</p>
                    </li>
                  ))}
                </ol>
              ) : timelineLines.length > 0 ? (
                <ol className="space-y-4">
                  {timelineLines.map((line, i) => (
                    <li key={line} className="relative border-l-2 border-cyan-neon/30 pl-4">
                      <span
                        className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ${i === 0 ? "bg-emerald-neon shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "bg-cyan-neon/60"
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
