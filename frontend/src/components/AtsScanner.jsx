import React, { useState } from "react";
import { FileText, Upload, Sparkles, Check, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

import { API_BASE_URL } from "../config";

export default function AtsScanner({ user }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  
  const [selectedRepo, setSelectedRepo] = useState("");
  const [resumeBullets, setResumeBullets] = useState([]);
  const [isGeneratingBullets, setIsGeneratingBullets] = useState(false);
  const [bulletError, setBulletError] = useState("");

  const handleGenerateBullets = async () => {
    if (!selectedRepo) {
      setBulletError("Please select a repository first.");
      return;
    }
    setIsGeneratingBullets(true);
    setBulletError("");
    setResumeBullets([]);

    try {
      const res = await fetch(`${API_BASE_URL}/api/review/resume-bullets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ selectedRepo })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setResumeBullets(data.points || data.bullets || []);
      } else {
        setBulletError(data.message || "Failed to generate resume bullets.");
      }
    } catch (err) {
      console.error(err);
      setBulletError("Network error. Please make sure the Express server is running.");
    } finally {
      setIsGeneratingBullets(false);
    }
  };


  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setError("Please select or upload a resume file.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription.trim());

    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/ats-score`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.detail || "Failed to process resume ATS score.");
      }
    } catch (err) {
      setError("Network error. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const keywordPct = result ? result.keywordMatchDensity : 0;
  const isTabular = result?.formattingCritique?.toLowerCase().includes("warning") || false;
  const structuralScore = result ? result.structuralLayoutIntegrity : 0;
  const semanticScore = result ? result.semanticRecruiterImpact : 0;
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 bg-[#0b0c0e] min-h-screen text-[#f3f4f6]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ATS Resume Scanner</h1>
        <p className="text-sm text-[#9ca3af] mt-1">Verify your resume's machine-readability using our hybrid keyword and layout metrics calculator.</p>
      </div>

      {/* Resume Bullet Generator Panel */}
      <div className="rounded-xl border border-[#22252a] bg-[#121316] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-neon to-[#818cf8]">
            📄 Resume Bullet Point Generator
          </h3>
          <p className="text-xs text-[#9ca3af] mt-1">
            Select a repository to dynamically generate 4 high-impact Google X-Y-Z resume points highlighting your full-stack execution.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="appearance-none rounded-lg border border-[#22252a] bg-[#141519] px-3.5 py-2 text-xs font-semibold text-[#f3f4f6] shadow-md transition-all duration-300 hover:border-[#6366f1]/50 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] focus:shadow-[0_0_10px_rgba(99,102,241,0.2)] focus:outline-none cursor-pointer"
            >
              <option value="">Select Project Repository</option>
              {(() => {
                const githubRepos = user?.github?.repositories || [];
                const activeRepos = Array.isArray(githubRepos)
                  ? githubRepos.map(r => typeof r === "string" ? r : r?.name).filter(Boolean)
                  : [];
                const reposToMap = activeRepos.length > 0 
                  ? activeRepos 
                  : ["OceanGuard", "LingoLeap", "SiteGuard"];
                return reposToMap.map((repoName) => (
                  <option key={repoName} value={repoName}>
                    {repoName}
                  </option>
                ));
              })()}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#9ca3af]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateBullets}
            disabled={isGeneratingBullets || !selectedRepo}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] px-4 py-2 text-xs font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-[#6366f1]/50"
          >
            {isGeneratingBullets ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating Points...
              </>
            ) : (
              <>
                <Sparkles size={13} />
                Generate Placement Resume Points
              </>
            )}
          </button>
        </div>

        {bulletError && (
          <p className="text-xs text-red-400 mt-2 font-mono">{bulletError}</p>
        )}

        {/* Display copy-pasteable bullet list */}
        {resumeBullets.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-[#141519] border border-[#22252a] space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#6366f1] flex items-center justify-between">
              <span>📋 Google X-Y-Z Formula Points (Copy-Pasteable)</span>
              <span className="text-[10px] text-[#9ca3af] normal-case font-sans">Hover to highlight and copy</span>
            </h4>
            <ul className="space-y-3 pt-1">
              {resumeBullets.map((bullet, idx) => (
                <li key={idx} className="group relative flex gap-2.5 items-start text-xs border border-transparent hover:border-[#6366f1]/20 hover:bg-[#181a20]/50 p-2.5 rounded-md transition-all">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1c1d22] border border-[#22252a] font-mono text-[10px] text-[#9ca3af] group-hover:text-[#6366f1] group-hover:border-[#6366f1]/40">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed text-[#d1d5db] select-all cursor-text font-sans group-hover:text-[#f3f4f6]">
                    {bullet}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {}
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-5 rounded-xl border border-[#22252a] bg-[#121316] p-6">
          <h3 className="text-lg font-semibold border-b border-[#22252a] pb-3">Analyze Candidate Metrics</h3>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Upload Resume (PDF or TXT)</label>
            <div className="relative border border-dashed border-[#22252a] hover:border-[#6366f1]/50 bg-[#141519]/50 rounded-xl p-6 transition-all text-center">
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto text-[#6366f1] mb-2" size={24} />
              <p className="text-sm font-medium text-[#f3f4f6]">
                {resumeFile ? resumeFile.name : "Drag resume file here or browse"}
              </p>
              <p className="text-xs text-[#9ca3af] mt-1">Supports PDF, TXT up to 5MB</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Target Job Description</label>
            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description requirements here..."
              className="w-full px-4 py-3 text-sm rounded-lg border border-[#22252a] bg-[#141519] text-[#f3f4f6] focus:outline-none focus:border-[#6366f1] transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#f3f4f6] px-4 py-3 text-sm font-semibold text-[#0b0c0e] hover:bg-white transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0b0c0e] border-t-transparent" />
                Analyzing Document...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Calculate ATS Grade
              </>
            )}
          </button>

          {error && (
            <p className="text-xs text-red-400 mt-2 font-mono">{error}</p>
          )}
        </form>

        {}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6">
              {}
              <div className="rounded-xl border border-[#22252a] bg-[#121316] p-6 text-center">
                <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Calculated ATS Score</p>
                <div className="mt-4 flex items-center justify-center">
                  <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-4 border-[#22252a] bg-[#141519]">
                    <span className="text-4xl font-extrabold text-[#f3f4f6]">{result.finalScore}%</span>
                  </div>
                </div>
                <p className="text-sm text-[#9ca3af] mt-4 max-w-sm mx-auto">
                  Calculated dynamically via mathematical core checks, compliance headings, and semantic action profiles.
                </p>
              </div>

              {}
              <div className="rounded-xl border border-[#22252a] bg-[#121316] p-6 space-y-5">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#22252a] pb-2">
                  Performance Breakdown
                </h4>
                
                <div className="space-y-4">
                  {}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Keyword Match Density <span className="text-[#9ca3af] text-xs">(50% Core Weight)</span></span>
                      <span className="font-semibold">{keywordPct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1c1d22] overflow-hidden">
                      <div className="h-full bg-[#6366f1] transition-all duration-500" style={{ width: `${keywordPct}%` }} />
                    </div>
                  </div>

                  {}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Structural Layout Integrity <span className="text-[#9ca3af] text-xs">(20% Core Weight)</span></span>
                      <span className="font-semibold">{structuralScore}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1c1d22] overflow-hidden">
                      <div className="h-full bg-[#6366f1] transition-all duration-500" style={{ width: `${structuralScore}%` }} />
                    </div>
                  </div>

                  {}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Semantic Recruiter Impact <span className="text-[#9ca3af] text-xs">(30% Core Weight)</span></span>
                      <span className="font-semibold">{semanticScore}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1c1d22] overflow-hidden">
                      <div className="h-full bg-[#6366f1] transition-all duration-500" style={{ width: `${semanticScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {}
              {(isTabular || structuralScore < 100) && (
                <div className="rounded-xl bg-[#1c1b12] border border-[#3a321d] p-5 text-[#f59e0b] space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} />
                    <span className="font-bold text-sm uppercase tracking-wide">⚠ ATS Parsing Interferences Detected</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#f59e0b]/90">
                    {result.formattingCritique} {structuralScore < 100 && "Ensure mandatory Experience, Education, Skills, and Projects section headings are explicitly named in your text layers."}
                  </p>
                </div>
              )}

              {}
              <div className="rounded-xl border border-[#22252a] bg-[#121316] p-6 space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#22252a] pb-2">
                  Keyword Mapping Status
                </h4>

                <div className="flex flex-wrap gap-2">
                  {}
                  {result.matchedKeywords.map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-[#141519] border border-[#22252a] text-[#f3f4f6]">
                      <Check size={12} className="text-[#6366f1]" />
                      {kw}
                    </span>
                  ))}
                  
                  {}
                  {result.missingKeywords.map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-[#1c1212] border border-[#3a1d1d] text-[#f87171]">
                      <AlertTriangle size={12} className="text-[#f87171]" />
                      Missing: {kw}
                    </span>
                  ))}
                </div>
              </div>

              {}
              {result.actionableFixes && result.actionableFixes.length > 0 && (
                <div className="rounded-xl border border-[#22252a] bg-[#121316] p-6 space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#22252a] pb-2">
                    Actionable Improvements
                  </h4>
                  <ul className="space-y-3">
                    {result.actionableFixes.map((fix, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start text-sm">
                        <ArrowRight size={14} className="mt-1 text-[#6366f1] shrink-0" />
                        <span className="leading-relaxed text-[#9ca3af] hover:text-[#f3f4f6] transition-all">
                          {fix}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border border-dashed border-[#22252a] rounded-xl bg-[#121316]/30 p-12 text-center">
              <div className="max-w-xs space-y-3">
                <FileText className="mx-auto text-[#4b5563]" size={36} />
                <h4 className="font-semibold text-[#f3f4f6]">No Grade Computed Yet</h4>
                <p className="text-xs text-[#9ca3af]">Upload a resume and paste target job requirements on the left to compute alignment stats.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
