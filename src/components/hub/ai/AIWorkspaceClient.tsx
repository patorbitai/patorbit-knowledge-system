"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Target,
  FileText,
  BarChart3,
  PenLine,
  ChevronDown,
  ChevronRight,
  Loader2,
  ArrowRight,
  Plus,
  RotateCcw,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Search,
} from "lucide-react";
import { clsx } from "clsx";
import { useResumeBuilder } from "@/store/resume-builder";
import { useOptimization } from "@/lib/ai/useOptimization";
import { ScoreCard, ScoreCardSkeleton } from "@/components/resume-builder/optimization/ScoreCard";
import { MatchReport } from "@/components/resume-builder/optimization/MatchReport";
import { KeywordCloud } from "@/components/resume-builder/optimization/KeywordCloud";
import { TailorResumeModal } from "@/components/resume-builder/TailorResumeModal";
import { ErrorBox, LoadingRow } from "@/components/resume-builder/optimization/shared";
import { TEMPLATES } from "@/app/resume-builder/templates";
import type { Resume } from "@/types/resume";

// ── Types ──────────────────────────────────────────────────────────────────────

type JobApplication = {
  applicationId: string;
  title: string;
  companyName: string;
  jobDescription: string;
  status: string;
  resumeId: string | null;
  matchScore: number | null;
  createdAt: string;
};

interface AIWorkspaceClientProps {
  userName: string;
}

// ── Tab definitions ────────────────────────────────────────────────────────────

type TabId = "score" | "match" | "tailor";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; requiresJob: boolean }[] = [
  { id: "score", label: "Resume Score", icon: BarChart3, requiresJob: false },
  { id: "match", label: "Job Match", icon: Target, requiresJob: true },
  { id: "tailor", label: "Tailor Resume", icon: PenLine, requiresJob: true },
];

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center mb-4">
        <Sparkles className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No resumes yet
      </h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mb-6">
        AI tools work best when you have a resume to analyze. Create your first resume to get started.
      </p>
      <Link
        href="/resume-builder"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Resume
      </Link>
    </div>
  );
}

// ── Resume Selector ────────────────────────────────────────────────────────────

function ResumeSelector({
  resumes,
  selectedId,
  onSelect,
}: {
  resumes: Resume[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = resumes.find((r) => r.resumeId === selectedId);

  if (resumes.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors text-left"
      >
        <FileText className="w-4 h-4 text-cyan-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {selected?.resumeName || selected?.name || "Select a resume"}
          </p>
          {selected && (
            <p className="text-[11px] text-gray-500 dark:text-slate-500 truncate mt-0.5">
              {selected.experience?.length || 0} experiences &middot; {selected.skills?.length || 0} skills
            </p>
          )}
        </div>
        <ChevronDown className={clsx("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] shadow-xl overflow-hidden">
          {resumes.map((r) => (
            <button
              key={r.resumeId}
              onClick={() => { if (r.resumeId) onSelect(r.resumeId); setOpen(false); }}
              className={clsx(
                "flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors",
                r.resumeId === selectedId && "bg-cyan-50 dark:bg-cyan-500/10",
              )}
            >
              <FileText className={clsx("w-4 h-4 shrink-0", r.resumeId === selectedId ? "text-cyan-500" : "text-gray-400")} />
              <div className="flex-1 min-w-0">
                <p className={clsx("text-sm font-medium truncate", r.resumeId === selectedId ? "text-cyan-700 dark:text-cyan-300" : "text-gray-900 dark:text-white")}>
                  {r.resumeName || r.name || "Untitled Resume"}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-slate-500 truncate">
                  {r.experience?.length || 0} experiences &middot; {r.skills?.length || 0} skills
                </p>
              </div>
              {r.resumeId === selectedId && <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Job Selector ───────────────────────────────────────────────────────────────

function JobSelector({
  applications,
  selectedId,
  onSelect,
  loading,
}: {
  applications: JobApplication[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = applications.find((a) => a.applicationId === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors text-left"
      >
        <Briefcase className="w-4 h-4 text-violet-500 shrink-0" />
        <div className="flex-1 min-w-0">
          {selected ? (
            <>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {selected.title}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-slate-500 truncate mt-0.5">
                {selected.companyName}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {loading ? "Loading jobs..." : "Select a job (optional)"}
            </p>
          )}
        </div>
        <ChevronDown className={clsx("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          <button
            onClick={() => { onSelect(null); setOpen(false); }}
            className={clsx(
              "flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors border-b border-gray-100 dark:border-white/[0.04]",
              selectedId === null && "bg-violet-50 dark:bg-violet-500/10",
            )}
          >
            <span className="text-sm text-gray-500 dark:text-slate-400 italic">No job selected (resume-only analysis)</span>
          </button>
          {applications.map((a) => (
            <button
              key={a.applicationId}
              onClick={() => { onSelect(a.applicationId); setOpen(false); }}
              className={clsx(
                "flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors",
                a.applicationId === selectedId && "bg-violet-50 dark:bg-violet-500/10",
              )}
            >
              <Briefcase className={clsx("w-4 h-4 shrink-0", a.applicationId === selectedId ? "text-violet-500" : "text-gray-400")} />
              <div className="flex-1 min-w-0">
                <p className={clsx("text-sm font-medium truncate", a.applicationId === selectedId ? "text-violet-700 dark:text-violet-300" : "text-gray-900 dark:text-white")}>
                  {a.title}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-slate-500 truncate">
                  {a.companyName}
                </p>
              </div>
              {a.matchScore !== null && (
                <span className="text-[11px] font-semibold text-violet-500 tabular-nums">{a.matchScore}%</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── JD Input (lightweight inline) ──────────────────────────────────────────────

function InlineJDInput({
  value,
  onChange,
  onAnalyze,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}) {
  const canAnalyze = value.trim().length > 10 && !loading;
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        rows={4}
        placeholder="Or paste a job description here..."
        className="w-full resize-none rounded-xl px-3.5 py-3 bg-white/[0.03] border border-white/[0.08] text-[11px] text-slate-200 placeholder:text-slate-600 leading-relaxed focus:outline-none focus:ring-1 focus:border-violet-500/40 focus:ring-violet-500/20 transition-colors scrollbar-thin scrollbar-thumb-white/10"
      />
      <div className="flex justify-end">
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className={clsx(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all",
            canAnalyze
              ? "bg-violet-600/80 hover:bg-violet-600 active:scale-[0.97] text-white border border-violet-500/30"
              : "bg-white/[0.03] text-slate-600 border border-white/[0.05] cursor-not-allowed",
          )}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
          {loading ? "Analyzing..." : "Analyze Keywords"}
        </button>
      </div>
    </div>
  );
}

// ── Main AI Workspace ──────────────────────────────────────────────────────────

export default function AIWorkspaceClient({ userName }: AIWorkspaceClientProps) {
  const [mounted, setMounted] = useState(false);
  const resumes = useResumeBuilder((s) => s.resumes);
  const activeResumeId = useResumeBuilder((s) => s.activeResumeId);
  const switchResume = useResumeBuilder((s) => s.switchResume);

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("score");
  const [tailorOpen, setTailorOpen] = useState(false);

  // Job applications
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);

  // Optimization hook (score, match, keywords, bullets, summary)
  const opt = useOptimization();

  // JD text for manual input
  const [jdText, setJdText] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch job applications
  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications || []))
      .catch(() => setApplications([]))
      .finally(() => setAppsLoading(false));
  }, []);

  // Set default resume selection
  useEffect(() => {
    if (mounted && resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(activeResumeId || resumes[0]?.resumeId || null);
    }
  }, [mounted, resumes, activeResumeId, selectedResumeId]);

  const selectedResume = useMemo(
    () => resumes.find((r) => r.resumeId === selectedResumeId) || null,
    [resumes, selectedResumeId],
  );

  const selectedJob = useMemo(
    () => applications.find((a) => a.applicationId === selectedJobId) || null,
    [applications, selectedJobId],
  );

  const hasResumes = resumes.length > 0;

  // Handle resume selection
  const handleResumeSelect = useCallback((id: string) => {
    setSelectedResumeId(id);
    switchResume(id);
    // Reset results when switching resumes
    opt.resetScore();
    opt.resetMatch();
    opt.resetKeywords();
    setJdText("");
  }, [switchResume, opt]);

  // Handle job selection
  const handleJobSelect = useCallback((id: string | null) => {
    setSelectedJobId(id);
    opt.resetMatch();
    opt.resetKeywords();
    if (id) {
      const job = applications.find((a) => a.applicationId === id);
      if (job) setJdText(job.jobDescription);
    } else {
      setJdText("");
    }
  }, [applications, opt]);

  // Get effective JD
  const effectiveJD = useMemo(() => {
    if (selectedJob?.jobDescription) return selectedJob.jobDescription;
    if (jdText.trim()) return jdText.trim();
    return "";
  }, [selectedJob, jdText]);

  // Tab actions
  const handleScore = useCallback(() => {
    if (!selectedResume) return;
    opt.analyze(selectedResume, effectiveJD || undefined);
  }, [selectedResume, effectiveJD, opt]);

  const handleMatch = useCallback(() => {
    if (!selectedResume || !effectiveJD) return;
    opt.analyzeMatch(selectedResume, effectiveJD);
  }, [selectedResume, effectiveJD, opt]);

  const handleKeywords = useCallback(() => {
    if (!selectedResume || !effectiveJD) return;
    opt.analyzeKeywords(selectedResume, effectiveJD);
  }, [selectedResume, effectiveJD, opt]);

  const handleTailorApproved = useCallback(() => {
    setTailorOpen(false);
    opt.resetScore();
    opt.resetMatch();
  }, [opt]);

  const firstName = userName.split(" ")[0] || "there";
  const templateName = selectedResume
    ? TEMPLATES.find((t) => t.id === selectedResume.templateId)?.name || selectedResume.templateId
    : "";

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!mounted) return null;

  if (!hasResumes) return <EmptyState />;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <section className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-[#f8fafc]">
          AI Workspace
        </h1>
        <p className="text-sm text-gray-500 dark:text-[#94a3b8] max-w-xl">
          Analyze, match, and tailor your resume with AI assistance — without inventing experience.
        </p>
      </section>

      {/* Context selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ResumeSelector
          resumes={resumes}
          selectedId={selectedResumeId}
          onSelect={handleResumeSelect}
        />
        <JobSelector
          applications={applications}
          selectedId={selectedJobId}
          onSelect={handleJobSelect}
          loading={appsLoading}
        />
      </div>

      {/* Resume info chip */}
      {selectedResume && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <FileText className="w-3.5 h-3.5 text-cyan-500" />
          <span className="text-[11px] text-slate-400">
            <span className="font-medium text-slate-300">{selectedResume.resumeName || selectedResume.name || "Untitled"}</span>
            {templateName && <span className="ml-2 text-slate-500">&middot; {templateName}</span>}
            {selectedResume.experience?.length > 0 && (
              <span className="ml-2 text-slate-500">&middot; {selectedResume.experience.length} experience{selectedResume.experience.length !== 1 ? "s" : ""}</span>
            )}
          </span>
        </div>
      )}

      {/* JD manual input (when no job selected) */}
      {!selectedJobId && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-violet-400" />
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Job Description (optional)</p>
          </div>
          <p className="text-[11px] text-slate-500">
            Add a job description to unlock match analysis and tailoring.
          </p>
          <InlineJDInput
            value={jdText}
            onChange={setJdText}
            onAnalyze={handleKeywords}
            loading={opt.keywordsLoading}
          />
          {opt.keywordAnalysis && !opt.keywordsLoading && (
            <KeywordCloud analysis={opt.keywordAnalysis} />
          )}
          {opt.keywordsError && !opt.keywordsLoading && (
            <ErrorBox
              message={opt.keywordsError}
              onRetry={handleKeywords}
              retryLabel="Retry"
            />
          )}
        </div>
      )}

      {/* Job context summary */}
      {selectedJob && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Briefcase className="w-3.5 h-3.5 text-violet-400" />
            <p className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">Target Job</p>
          </div>
          <p className="text-sm font-medium text-white">{selectedJob.title}</p>
          <p className="text-[11px] text-slate-400">{selectedJob.companyName}</p>
          {selectedJob.matchScore !== null && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Last match:</span>
              <span className="text-[11px] font-bold text-violet-400">{selectedJob.matchScore}%</span>
            </div>
          )}
        </div>
      )}

      {/* Action tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const disabled = tab.requiresJob && !effectiveJD;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => !disabled && setActiveTab(tab.id)}
              disabled={disabled}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-semibold transition-all",
                active
                  ? "bg-cyan-600/80 text-white shadow-sm"
                  : disabled
                    ? "text-slate-600 cursor-not-allowed"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
              )}
              title={disabled ? "Add a job description to enable this action" : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {/* ── Score Tab ── */}
        {activeTab === "score" && (
          <div className="space-y-4">
            {!opt.score && !opt.scoreLoading && !opt.scoreError && (
              <div className="flex flex-col items-center py-12 text-center">
                <BarChart3 className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-300 mb-1">Resume Score</p>
                <p className="text-[11px] text-slate-500 max-w-sm mb-4">
                  Get an AI-powered analysis of your resume's impact, clarity, completeness, ATS optimization, and tailoring.
                </p>
                <button
                  onClick={handleScore}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Score My Resume
                </button>
              </div>
            )}
            {opt.scoreLoading && <ScoreCardSkeleton />}
            {opt.scoreError && !opt.scoreLoading && (
              <ErrorBox
                message={opt.scoreError}
                onRetry={handleScore}
                retryLabel="Retry Scoring"
              />
            )}
            {opt.score && !opt.scoreLoading && (
              <div className="space-y-3">
                <ScoreCard score={opt.score} />
                <div className="flex justify-center">
                  <button
                    onClick={handleScore}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:border-white/[0.12] transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Re-score
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Match Tab ── */}
        {activeTab === "match" && (
          <div className="space-y-4">
            {!opt.matchResult && !opt.matchLoading && !opt.matchError && effectiveJD && (
              <div className="flex flex-col items-center py-12 text-center">
                <Target className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-300 mb-1">Job Match Analysis</p>
                <p className="text-[11px] text-slate-500 max-w-sm mb-4">
                  Compare your resume against the job description to find matched keywords, missing skills, and improvement suggestions.
                </p>
                <button
                  onClick={handleMatch}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                >
                  <Target className="w-4 h-4" />
                  Analyze Match
                </button>
              </div>
            )}
            {opt.matchLoading && (
              <LoadingRow label="Analyzing job match..." />
            )}
            {opt.matchError && !opt.matchLoading && (
              <ErrorBox
                message={opt.matchError}
                onRetry={handleMatch}
                retryLabel="Retry Match"
              />
            )}
            {opt.matchResult && !opt.matchLoading && (
              <div className="space-y-3">
                <MatchReport
                  resume={selectedResume!}
                  result={opt.matchResult}
                  loading={false}
                  error={null}
                  onRetry={handleMatch}
                />
                {/* Tailor CTA */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setTailorOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                  >
                    <PenLine className="w-4 h-4" />
                    Tailor Resume to This Job
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {!effectiveJD && (
              <div className="flex flex-col items-center py-12 text-center">
                <Target className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-300 mb-1">Job Match Analysis</p>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  Select a job application above or paste a job description to compare your resume against a specific role.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tailor Tab ── */}
        {activeTab === "tailor" && (
          <div className="space-y-4">
            {effectiveJD && selectedResume && (
              <div className="flex flex-col items-center py-12 text-center">
                <PenLine className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-300 mb-1">Tailor Resume</p>
                <p className="text-[11px] text-slate-500 max-w-sm mb-4">
                  Generate a tailored version of your resume optimized for this specific job. 
                  <span className="block mt-1 text-emerald-400/80 font-medium">Your original resume stays unchanged.</span>
                </p>
                <button
                  onClick={() => setTailorOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                >
                  <PenLine className="w-4 h-4" />
                  Start Tailoring
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {!effectiveJD && (
              <div className="flex flex-col items-center py-12 text-center">
                <PenLine className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-300 mb-1">Tailor Resume</p>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  Select a job application or paste a job description to enable tailoring.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trust / factuality notice */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-400">Patorbit&apos;s commitment:</span>{" "}
          AI suggestions are based on your existing Professional Identity and resume content. 
          Patorbit never invents employers, skills, certifications, or experience you haven&apos;t provided.
          All changes require your explicit approval before being saved.
        </p>
      </div>

      {/* TailorResumeModal */}
      {selectedResume && (
        <TailorResumeModal
          open={tailorOpen}
          onClose={() => setTailorOpen(false)}
          initialJobDescription={effectiveJD || undefined}
          initialResumeId={selectedResumeId || undefined}
          applicationId={selectedJobId || undefined}
          onApproved={handleTailorApproved}
        />
      )}
    </div>
  );
}
