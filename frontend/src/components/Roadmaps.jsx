import { useCallback, useEffect, useState } from "react";
import { fetchRoadmap } from "../lib/api";
import { Calendar, CheckCircle2, Circle, Compass, Loader2, RefreshCw, Sparkles, Target } from "lucide-react";

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

export default function Roadmaps() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(() => {
    try {
      const saved = localStorage.getItem("completedTasks");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleTask = (task) => {
    const key = cleanTaskKey(task);
    setDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("completedTasks", JSON.stringify(next));
      return next;
    });
  };

  const loadRoadmaps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRoadmap();
      const list = res.roadmaps ?? [];
      setRoadmaps(list);
      if (list.length > 0) {
        setSelectedRoadmap((prev) => {
          if (prev) {
            const found = list.find((r) => r.id === prev.id);
            if (found) return found;
          }
          return list[list.length - 1];
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roadmaps");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoadmaps();
  }, [loadRoadmaps]);

  // Parse roadmap string into lines/sections for rendering
  const parsedSteps = selectedRoadmap
    ? selectedRoadmap.roadmap
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    : [];

  const parsedRoadmap = selectedRoadmap
    ? tryParseRoadmap(selectedRoadmap.roadmap)
    : null;

  return (
    <div className="min-y-screen bg-void text-slate-200 p-6 sm:p-8">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(16,185,129,0.06),transparent),radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(6,182,212,0.04),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-neon/40 bg-emerald-neon/10 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-emerald-neon">
              <Compass className="h-3 w-3" />
              Syllabus & Milestones
            </span>
            <h1 className="mt-2 bg-gradient-to-r from-cyan-neon to-emerald-neon bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Study Roadmaps
            </h1>
            <p className="text-sm text-slate-400">
              Interactive structural timelines compiled by your AI agent
            </p>
          </div>

          <button
            type="button"
            onClick={loadRoadmaps}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-neon/40 bg-cyan-neon/10 px-3.5 py-2 text-xs font-medium text-cyan-neon transition hover:border-emerald-neon/50 hover:bg-cyan-neon/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </header>

        {loading && roadmaps.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-cyan-neon/10 bg-slate-900/20 backdrop-blur-md">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-neon" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
            Error loading roadmaps: {error}
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-cyan-neon/20 bg-slate-900/40 px-6 py-8 text-center shadow-[0_0_15px_rgba(6,182,212,0.1)] backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-neon/30 bg-cyan-neon/10 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <Sparkles className="h-6 w-6 text-cyan-neon" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">No Roadmaps Found</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              You haven't generated any study roadmaps yet. Ask the AI Chat agent to create a customized study path for you.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[250px_1fr]">
            {/* Sidebar list of roadmaps */}
            <div className="space-y-3">
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-slate-500 px-1">
                Saved Sprints
              </p>
              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                {roadmaps.map((rm) => {
                  const isSelected = selectedRoadmap?.id === rm.id;
                  return (
                    <button
                      key={rm.id}
                      type="button"
                      onClick={() => setSelectedRoadmap(rm)}
                      className={`text-left w-full rounded-xl border p-3.5 transition duration-200 ${
                        isSelected
                          ? "border-emerald-neon/40 bg-emerald-neon/10 text-emerald-neon shadow-[0_0_12px_rgba(16,185,129,0.12)]"
                          : "border-cyan-neon/10 bg-surface/50 text-slate-400 hover:border-cyan-neon/30 hover:text-slate-200"
                      }`}
                    >
                      <p className="text-xs font-mono text-slate-500 mb-1 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        ID: {rm.id.slice(0, 8)}
                      </p>
                      <p className="text-sm font-semibold line-clamp-2 leading-snug">
                        {rm.title || "Custom Study Roadmap"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Roadmap content */}
            <div className="rounded-2xl border border-cyan-neon/20 bg-gradient-to-br from-surface to-surface-2 p-6 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
              {selectedRoadmap && (
                <div>
                  <div className="border-b border-cyan-500/10 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Target className="h-5 w-5 text-emerald-neon" />
                        {selectedRoadmap.title || "Study Roadmap"}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Detailed layout of all targets, chapters, and tasks.
                      </p>
                    </div>
                  </div>

                  {parsedRoadmap ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 text-xs font-mono text-cyan-neon">
                        <span>Duration: {parsedRoadmap.duration}</span>
                      </div>
                      <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-cyan-500/10">
                        {parsedRoadmap.phases.map((phase, pIdx) => (
                          <div key={pIdx} className="relative space-y-4">
                            <div className="relative">
                              <span className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-emerald-neon bg-void shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                              <h3 className="text-base font-bold text-emerald-neon pt-0.5 tracking-tight">
                                {phase.phase_title}
                              </h3>
                              {phase.description && (
                                <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">{phase.description}</p>
                              )}
                            </div>
                            <div className="space-y-2.5 pl-1">
                              {phase.core_topics?.map((topic, tIdx) => {
                                const checked = !!done[cleanTaskKey(topic)];
                                return (
                                  <div key={tIdx} className="relative group">
                                    <span className={`absolute -left-[18px] top-4 h-2.5 w-2.5 rounded-full border bg-void transition ${
                                      checked 
                                        ? "border-emerald-neon bg-emerald-neon shadow-[0_0_6px_rgba(16,185,129,0.7)]" 
                                        : "border-cyan-neon/60 group-hover:bg-cyan-neon group-hover:shadow-[0_0_6px_rgba(6,182,212,0.5)]"
                                    }`} />
                                    <button
                                      type="button"
                                      onClick={() => toggleTask(topic)}
                                      className={`w-full text-left rounded-xl border p-3.5 transition duration-200 ${
                                        checked
                                          ? "border-emerald-neon/40 bg-emerald-neon/5 shadow-[0_0_12px_rgba(16,185,129,0.12)]"
                                          : "border-cyan-500/5 bg-void/30 hover:border-cyan-neon/20 hover:bg-void/50"
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        {checked ? (
                                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-neon" />
                                        ) : (
                                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 group-hover:text-cyan-neon" />
                                        )}
                                        <span className={`text-sm leading-relaxed ${
                                          checked ? "text-slate-400 line-through" : "text-slate-200"
                                        }`}>
                                          {topic}
                                        </span>
                                      </div>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-cyan-500/10">
                      {parsedSteps.map((step, idx) => {
                        const isHeader =
                          step.toLowerCase().startsWith("week") ||
                          step.toLowerCase().startsWith("phase") ||
                          step.startsWith("#");

                        const cleanStep = step.replace(/^[#\-\*\•\s]+/, "");
                        const checked = !isHeader && !!done[cleanTaskKey(step)];

                        return (
                          <div key={idx} className="relative group">
                            {isHeader ? (
                              <>
                                <span className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-emerald-neon bg-void shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                                <h3 className="text-base font-bold text-emerald-neon pt-0.5 tracking-tight">
                                  {cleanStep}
                                </h3>
                              </>
                            ) : (
                              <>
                                <span className={`absolute -left-[18px] top-4 h-2.5 w-2.5 rounded-full border bg-void transition ${
                                  checked 
                                    ? "border-emerald-neon bg-emerald-neon shadow-[0_0_6px_rgba(16,185,129,0.7)]" 
                                    : "border-cyan-neon/60 group-hover:bg-cyan-neon group-hover:shadow-[0_0_6px_rgba(6,182,212,0.5)]"
                                }`} />
                                <button
                                  type="button"
                                  onClick={() => toggleTask(step)}
                                  className={`w-full text-left rounded-xl border p-3.5 transition duration-200 ${
                                    checked
                                      ? "border-emerald-neon/40 bg-emerald-neon/5 shadow-[0_0_12px_rgba(16,185,129,0.12)]"
                                      : "border-cyan-500/5 bg-void/30 hover:border-cyan-neon/20 hover:bg-void/50"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    {checked ? (
                                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-neon" />
                                    ) : (
                                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 group-hover:text-cyan-neon" />
                                    )}
                                    <span className={`text-sm leading-relaxed ${
                                      checked ? "text-slate-400 line-through" : "text-slate-200"
                                    }`}>
                                      {cleanStep}
                                    </span>
                                  </div>
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
