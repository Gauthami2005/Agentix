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
      <div className="relative mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22252a] bg-[#121316] px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-[#9ca3af]">
              <Compass className="h-3 w-3" />
              Syllabus & Milestones
            </span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#f3f4f6]">
              Study Roadmaps
            </h1>
            <p className="text-sm text-[#9ca3af]">
              Interactive structural timelines compiled by your AI agent
            </p>
          </div>

          <button
            type="button"
            onClick={loadRoadmaps}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#22252a] bg-[#121316] px-3.5 py-2 text-xs font-medium text-[#f3f4f6] transition hover:border-[#6366f1]/50 hover:bg-[#1c1e22] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </header>

        {loading && roadmaps.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-[#22252a] bg-[#121316]">
            <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
            Error loading roadmaps: {error}
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-[#22252a] bg-[#121316] px-6 py-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#22252a] bg-[#1c1d22]">
              <Sparkles className="h-6 w-6 text-[#6366f1]" />
            </div>
            <h2 className="text-lg font-semibold text-[#f3f4f6]">No Roadmaps Found</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
              You haven't generated any study roadmaps yet. Ask the AI Chat agent to create a customized study path for you.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[250px_1fr]">
            {/* Sidebar list of roadmaps */}
            <div className="space-y-3">
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-[#9ca3af] px-1">
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
                          ? "border-[#6366f1]/30 bg-[#6366f1]/5 text-[#f3f4f6]"
                          : "border-[#22252a] bg-[#121316]/50 text-[#9ca3af] hover:border-[#6366f1]/30 hover:text-[#f3f4f6] hover:bg-[#1c1e22]"
                      }`}
                    >
                      <p className="text-xs font-mono text-[#9ca3af] mb-1 flex items-center gap-1.5">
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
            <div className="rounded-2xl border border-[#22252a] bg-[#121316] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              {selectedRoadmap && (
                <div>
                  <div className="border-b border-[#22252a] pb-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-[#f3f4f6] flex items-center gap-2">
                        <Target className="h-5 w-5 text-[#6366f1]" />
                        {selectedRoadmap.title || "Study Roadmap"}
                      </h2>
                      <p className="text-xs text-[#9ca3af]">
                        Detailed layout of all targets, chapters, and tasks.
                      </p>
                    </div>
                  </div>

                  {parsedRoadmap ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 text-xs font-mono text-[#6366f1]">
                        <span>Duration: {parsedRoadmap.duration}</span>
                      </div>
                      <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#22252a]">
                        {parsedRoadmap.phases.map((phase, pIdx) => (
                          <div key={pIdx} className="relative space-y-4">
                            <div className="relative">
                              <span className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#6366f1] bg-[#0b0c0e]" />
                              <h3 className="text-base font-bold text-[#f3f4f6] pt-0.5 tracking-tight">
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
                                    <span className={`absolute -left-[18px] top-4 h-2.5 w-2.5 rounded-full border bg-[#0b0c0e] transition ${
                                      checked 
                                        ? "border-[#6366f1] bg-[#6366f1]" 
                                        : "border-slate-700 group-hover:border-[#6366f1]"
                                    }`} />
                                    <button
                                      type="button"
                                      onClick={() => toggleTask(topic)}
                                      className={`w-full text-left rounded-xl border p-3.5 transition duration-200 ${
                                        checked
                                          ? "border-[#6366f1]/20 bg-[#6366f1]/5 text-[#f3f4f6]"
                                          : "border-[#22252a] bg-[#121316]/50 text-[#9ca3af] hover:border-[#6366f1]/30 hover:text-[#f3f4f6] hover:bg-[#1c1e22]"
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        {checked ? (
                                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#6366f1]" />
                                        ) : (
                                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-600 group-hover:text-[#6366f1]" />
                                        )}
                                        <span className={`text-sm leading-relaxed ${
                                          checked ? "text-[#9ca3af] line-through" : "text-[#f3f4f6]"
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
                    <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#22252a]">
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
                                <span className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#6366f1] bg-[#0b0c0e]" />
                                <h3 className="text-base font-bold text-[#f3f4f6] pt-0.5 tracking-tight">
                                  {cleanStep}
                                </h3>
                              </>
                            ) : (
                              <>
                                <span className={`absolute -left-[18px] top-4 h-2.5 w-2.5 rounded-full border bg-[#0b0c0e] transition ${
                                  checked 
                                    ? "border-[#6366f1] bg-[#6366f1]" 
                                    : "border-slate-700 group-hover:border-[#6366f1]"
                                }`} />
                                <button
                                  type="button"
                                  onClick={() => toggleTask(step)}
                                  className={`w-full text-left rounded-xl border p-3.5 transition duration-200 ${
                                    checked
                                      ? "border-[#6366f1]/20 bg-[#6366f1]/5 text-[#f3f4f6]"
                                      : "border-[#22252a] bg-[#121316]/50 text-[#9ca3af] hover:border-[#6366f1]/30 hover:text-[#f3f4f6] hover:bg-[#1c1e22]"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    {checked ? (
                                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#6366f1]" />
                                    ) : (
                                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-600 group-hover:text-[#6366f1]" />
                                    )}
                                    <span className={`text-sm leading-relaxed ${
                                      checked ? "text-[#9ca3af] line-through" : "text-[#f3f4f6]"
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
