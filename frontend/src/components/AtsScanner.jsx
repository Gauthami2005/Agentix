import React, { useState } from "react";
import { FileText, Upload, Sparkles, Check, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

export default function AtsScanner() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

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
      const res = await fetch("http://localhost:8000/api/resume/ats-score", {
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

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Form Panel */}
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

        {/* Dashboard Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Score Header Card */}
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

              {/* 1. MULTI-METRIC PERFORMANCE BREAKDOWN ROWS */}
              <div className="rounded-xl border border-[#22252a] bg-[#121316] p-6 space-y-5">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#22252a] pb-2">
                  Performance Breakdown
                </h4>
                
                <div className="space-y-4">
                  {/* Row 1: Keyword Match Density */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Keyword Match Density <span className="text-[#9ca3af] text-xs">(50% Core Weight)</span></span>
                      <span className="font-semibold">{keywordPct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1c1d22] overflow-hidden">
                      <div className="h-full bg-[#6366f1] transition-all duration-500" style={{ width: `${keywordPct}%` }} />
                    </div>
                  </div>

                  {/* Row 2: Structural Layout Integrity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Structural Layout Integrity <span className="text-[#9ca3af] text-xs">(20% Core Weight)</span></span>
                      <span className="font-semibold">{structuralScore}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1c1d22] overflow-hidden">
                      <div className="h-full bg-[#6366f1] transition-all duration-500" style={{ width: `${structuralScore}%` }} />
                    </div>
                  </div>

                  {/* Row 3: Semantic Impact Grade */}
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

              {/* 2. REFINED ISSUES TIMELINE ROW (AMBER ALERT BOX) */}
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

              {/* 3. KEYWORD MAP CHIPS */}
              <div className="rounded-xl border border-[#22252a] bg-[#121316] p-6 space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#22252a] pb-2">
                  Keyword Mapping Status
                </h4>

                <div className="flex flex-wrap gap-2">
                  {/* Matched Keywords */}
                  {result.matchedKeywords.map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-[#141519] border border-[#22252a] text-[#f3f4f6]">
                      <Check size={12} className="text-[#6366f1]" />
                      {kw}
                    </span>
                  ))}
                  
                  {/* Missing Keywords */}
                  {result.missingKeywords.map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-[#1c1212] border border-[#3a1d1d] text-[#f87171]">
                      <AlertTriangle size={12} className="text-[#f87171]" />
                      Missing: {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* 4. ACTIONABLE FIXES */}
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
