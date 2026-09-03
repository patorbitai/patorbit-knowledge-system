"use client";

import { clsx } from "clsx";
import { useResumeBuilder } from "@/store/resume-builder";
import { AnalysisScore, AnalysisStatusBadge } from "./AnalysisScore";
import { ProgressIndicator } from "./ProgressIndicator";
import { JobMatchPanel } from "./JobMatchPanel";
import { JobProfilePanel } from "./JobProfilePanel";
import { Sparkles, CheckCircle2, AlertTriangle, XCircle, Lightbulb, ChevronDown, ChevronUp, Briefcase, Target, FileSearch, Shield, GitBranch, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { isAnalysisComplete, isAnalysisInProgress, hasSufficientData } from "@/types/resume";
import type { ResumeAnalysis } from "@/types/resume";
import type { TrustScoreComponent } from "@/types/knowledge-graph";
import { computeResumeScoreDetail, computeTrustScoreDetail } from "@/lib/ai/scoring";

/* ── Trust Score Component Lookup ── */
/** Derive a trust component's score by label from the analysis result. */
function trustComponentScore(analysis: ResumeAnalysis | null, label: string): number | null {
  const component: TrustScoreComponent | undefined = analysis?.trustScore?.components?.find(
    (c) => c.label === label,
  );
  return component?.score ?? null;
}

/* ── Collapsible Card ── */
function CollapsibleCard({
  title, icon, color, children, defaultOpen = true, badge,
}: {
  title: string; icon: React.ReactNode; color: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string | number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-white dark:bg-gradient-to-br dark:from-[rgba(10,18,32,0.96)] dark:to-[rgba(7,14,26,0.92)] overflow-hidden shadow-xl transition-all duration-300">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer group">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/[0.08] shadow-sm transition-transform group-hover:scale-105" style={{ backgroundColor: `${color}18`, borderColor: `${color}30` }}>{icon}</span>
          <span className="text-xs font-bold text-gray-900 dark:text-[#f8fafc] tracking-tight">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge !== undefined && <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full min-w-[22px] text-center">{badge}</span>}
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 dark:text-[#94a3b8]" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-[#94a3b8]" />}
        </div>
      </button>
      {open && <div className="px-4 pb-4 space-y-3 pt-1">{children}</div>}
    </div>
  );
}

/* ── Missing Item ── */
function MissingItem({ icon, label, found }: { icon: React.ReactNode; label: string; found: boolean }) {
  return (
    <div className={clsx("flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all", found ? "bg-emerald-500/8 text-emerald-400/70" : "bg-amber-500/8 text-amber-400")}>
      <div className={clsx("flex h-5 w-5 items-center justify-center rounded", found ? "bg-emerald-500/10" : "bg-amber-500/10")}>{icon}</div>
      <span className="flex-1">{label}</span>
      {found ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-amber-500" />}
    </div>
  );
}

/* ── Suggestion Item ── */
function SuggestionItem({ text, type }: { text: string; type: "warning" | "info" | "positive" }) {
  const config = { warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/8" }, info: { icon: Lightbulb, color: "text-blue-400", bg: "bg-blue-500/8" }, positive: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/8" } };
  const c = config[type]; const Icon = c.icon;
  return (<div className={clsx("flex items-start gap-2 px-2.5 py-2 rounded-lg", c.bg)}><Icon className={clsx("w-3.5 h-3.5 mt-0.5 shrink-0", c.color)} /><span className="text-[11px] text-gray-600 dark:text-slate-300">{text}</span></div>);
}

/* ── Analysis Phase Progress ── */
function AnalysisProgress({ phases }: { phases: { key: string; label: string; status: string }[] }) {
  const activeIdx = phases.findIndex((p) => p.status === "active");
  return (
    <div className="space-y-2 py-2">
      {phases.map((phase, i) => {
        const isActive = phase.status === "active";
        const isComplete = phase.status === "complete";
        const isPending = phase.status === "pending";
        return (
          <div key={phase.key} className="flex items-center gap-2.5">
            <div className={clsx(
              "flex h-5 w-5 items-center justify-center rounded-full shrink-0 transition-all",
              isComplete && "bg-emerald-500/20 text-emerald-400",
              isActive && "bg-blue-500/20 text-blue-400",
              isPending && "bg-slate-500/10 text-slate-500",
            )}>
              {isComplete ? <CheckCircle2 className="w-3 h-3" /> : isActive ? <Loader2 className="w-3 h-3 animate-spin" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
            </div>
            <span className={clsx(
              "text-[11px] transition-colors",
              isComplete && "text-gray-600 dark:text-slate-300", isActive && "text-blue-600 dark:text-blue-300 font-medium", isPending && "text-gray-500 dark:text-slate-500",
            )}>{phase.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Simple Panel Copilot ── */
export function RightCopilot() {
  const resume = useResumeBuilder((s) => s.resume);
  const analysis = useResumeBuilder((s) => s.analysis);
  const analysisLoading = useResumeBuilder((s) => s.analysisLoading);
  const progress = useResumeBuilder((s) => s.progress);
  const startAnalysis = useResumeBuilder((s) => s.startAnalysis);

  const hasLinkedIn = !!resume.social.linkedin;
  const hasGitHub = !!resume.social.github;
  const hasPortfolio = !!resume.social.website;
  const hasSummary = !!resume.summary;
  const hasCertifications = resume.certifications.length > 0;
  const sufficient = hasSufficientData(resume);
  const completed = isAnalysisComplete(analysis);
  const inProgress = isAnalysisInProgress(analysis) || analysisLoading;

  const localResumeScore = computeResumeScoreDetail(resume);
  const localTrustScore = computeTrustScoreDetail(resume);
  const activeResumeScore = (analysis?.resumeScore?.overall !== null && analysis?.resumeScore?.overall !== undefined) ? analysis.resumeScore : localResumeScore;
  const activeTrustScore = (analysis?.trustScore?.overall !== null && analysis?.trustScore?.overall !== undefined) ? analysis.trustScore : localTrustScore;

  function getTrustCompScore(label: string): number | null {
    const comp = activeTrustScore?.components?.find((c) => c.label.toLowerCase().includes(label.toLowerCase()));
    return comp?.score ?? null;
  }

  const rawMissing = analysis?.missingSections || [];
  const filteredMissing = rawMissing.filter((s) => {
    const lower = s.toLowerCase();
    if (hasLinkedIn && (lower.includes("linkedin") || lower.includes("profile"))) return false;
    if (hasGitHub && (lower.includes("github") || lower.includes("profile"))) return false;
    if (hasSummary && (lower.includes("summary") || lower.includes("professional summary"))) return false;
    if (resume.education.length > 0 && lower.includes("education")) return false;
    if (resume.experience.length > 0 && lower.includes("experience")) return false;
    if (resume.certifications.length > 0 && lower.includes("certification")) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}        <div className="flex items-center justify-between px-4 pt-5 pb-3.5 border-b border-gray-200 dark:border-[rgba(148,163,184,.14)] shrink-0 bg-gray-50 dark:bg-[#070d18]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center text-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900 dark:text-[#f8fafc] tracking-tight">AI Career Copilot</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <p className="text-[10px] text-gray-500 dark:text-[#94a3b8] font-medium">Live Intelligence</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">

        {/* Status Banner */}
        {!sufficient && !inProgress && (
          <div className="rounded-2xl border border-[rgba(34,211,238,0.2)] bg-gradient-to-r from-[rgba(14,165,233,0.08)] to-[rgba(59,130,246,0.08)] px-4 py-3.5 text-center shadow-md">
            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">AI Assistant Ready</p>
            <p className="text-[11px] text-gray-500 dark:text-[#94a3b8] leading-relaxed">Fill in your experience & skills to unlock professional AI analysis and optimization.</p>
          </div>
        )}

        {sufficient && !completed && !inProgress && (
          <button onClick={startAnalysis} className="w-full rounded-2xl border border-[rgba(34,211,238,0.3)] bg-gradient-to-r from-[rgba(14,165,233,0.15)] via-[rgba(59,130,246,0.15)] to-[rgba(147,51,234,0.15)] px-4 py-3.5 text-center hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-blue-500/10">
            <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#22d3ee]" />
              Run AI Analysis
            </p>
          </button>
        )}

        {analysis?.dataSufficiencyNote && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <p className="text-[11px] text-amber-300 text-center font-medium">{analysis.dataSufficiencyNote}</p>
          </div>
        )}

        {/* C41: AI Actions Quick Reference */}
        <CollapsibleCard title="AI Actions" icon={<Sparkles className="w-3 h-3 text-cyan-400" />} color="#22d3ee" defaultOpen={!completed}>
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-relaxed">
              Use the section editor on the left to access AI features for each part of your resume.
            </p>
            <div className="space-y-1.5">
              {[
                { label: "Tailor to Job", desc: "Match your resume to a job description", header: true },
                { label: "Summary AI", desc: "Generate, rewrite, or improve tone" },
                { label: "Experience AI", desc: "Rewrite bullets, improve impact, generate achievements" },
                { label: "Skills AI", desc: "Suggest relevant skills for your role" },
                { label: "Project AI", desc: "Generate project descriptions" },
              ].map((action) => (
                <div key={action.label} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] dark:bg-white/[0.02]">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <div className="flex-1">
                    <span className="text-[11px] font-medium text-gray-700 dark:text-slate-300">{action.label}</span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 ml-1.5">{action.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        {/* C41: Trust & Factuality */}
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-3.5 py-3">
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/60 leading-relaxed">
            <strong className="dark:text-emerald-400/80">AI uses information already in your resume.</strong> It does not verify employment, education, or certifications. Missing skills are never invented. Review all AI-generated changes before saving.
          </p>
        </div>

        {/* Analysis Progress */}
        {inProgress && analysis?.phases && (
          <CollapsibleCard title="Analysis Progress" icon={<Loader2 className="w-3.5 h-3.5 text-[#22d3ee] animate-spin" />} color="#22d3ee" defaultOpen={true}>
            <AnalysisProgress phases={analysis.phases} />
          </CollapsibleCard>
        )}

        {/* Resume Score Card */}
        <CollapsibleCard title="Resume Score" icon={<Target className="w-3.5 h-3.5 text-cyan-400" />} color="#22d3ee" defaultOpen={true}>
          <div className="space-y-3 pt-1">
            <AnalysisScore label="Overall" score={activeResumeScore?.overall ?? null} size="md" statusLabel="Ready" />
            <AnalysisScore label="Grammar" score={activeResumeScore?.grammar ?? null} size="sm" statusLabel="Ready" />
            <AnalysisScore label="Readability" score={activeResumeScore?.readability ?? null} size="sm" statusLabel="Ready" />
            <AnalysisScore label="Keyword Match" score={activeResumeScore?.keywordMatch ?? null} size="sm" statusLabel="Ready" />
            <AnalysisScore label="Structure" score={activeResumeScore?.structure ?? null} size="sm" statusLabel="Ready" />
          </div>
        </CollapsibleCard>

        {/* Trust Score Card */}
        <CollapsibleCard title="Trust Score" icon={<Shield className="w-3.5 h-3.5 text-purple-400" />} color="#8b5cf6" defaultOpen={true}>
          <div className="space-y-3 pt-1">
            <AnalysisScore label="Overall Trust" score={activeTrustScore?.overall ?? null} size="md" statusLabel="Active" />
            <AnalysisScore label="Identity Verification" score={getTrustCompScore("Identity")} size="sm" statusLabel="Active" />
            <AnalysisScore label="Employment Evidence" score={getTrustCompScore("Employment")} size="sm" statusLabel="Active" />
            <AnalysisScore label="Education Evidence" score={getTrustCompScore("Education")} size="sm" statusLabel="Active" />
            <AnalysisScore label="Certifications" score={getTrustCompScore("Certifications")} size="sm" statusLabel="Active" />
            <AnalysisScore label="Social Proof" score={getTrustCompScore("Portfolio")} size="sm" statusLabel="Active" />
          </div>
        </CollapsibleCard>

        {/* Progress */}
        <CollapsibleCard title="Progress" icon={<Target className="w-3 h-3 text-blue-400" />} color="#3b82f6" defaultOpen={false}>
          <ProgressIndicator title="Resume Completed" value={progress()} color="#22d3ee" />
          <ProgressIndicator title="ATS Ready" value={analysis?.atsScore ?? (progress() > 50 ? 75 : 40)} color="#10b981" />
          <ProgressIndicator title="Trust Score" value={activeTrustScore?.overall ?? 0} color="#8b5cf6" />
        </CollapsibleCard>

        {/* Missing Items */}
        <CollapsibleCard title="Missing Items" icon={<AlertTriangle className="w-3 h-3 text-amber-400" />} color="#f59e0b" defaultOpen={true} badge={[!hasLinkedIn, !hasGitHub, !hasPortfolio, !hasSummary, !hasCertifications].filter(Boolean).length + filteredMissing.length}>
          <div className="space-y-1">
            <MissingItem icon={<Link2 className="w-2.5 h-2.5" />} label="LinkedIn URL" found={hasLinkedIn} />
            <MissingItem icon={<GitBranch className="w-2.5 h-2.5" />} label="GitHub URL" found={hasGitHub} />
            <MissingItem icon={<Link2 className="w-2.5 h-2.5" />} label="Portfolio / Website" found={hasPortfolio} />
            <MissingItem icon={<FileSearch className="w-2.5 h-2.5" />} label="Professional Summary" found={hasSummary} />
            <MissingItem icon={<AwardIcon className="w-2.5 h-2.5" />} label="Certifications" found={hasCertifications} />
          </div>
          {filteredMissing.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-white/[0.04]">
              {filteredMissing.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] text-amber-400/80 px-2.5 py-1 rounded-lg bg-amber-500/8">
                  <XCircle className="w-3 h-3 shrink-0" /><span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </CollapsibleCard>

        {/* Content Issues */}
        <CollapsibleCard title="Content Issues" icon={<AlertTriangle className="w-3 h-3 text-rose-400" />} color="#ef4444" defaultOpen={completed && ((analysis?.weakBulletPoints?.length ?? 0) > 0)} badge={completed ? [...(analysis?.weakBulletPoints || []), ...(analysis?.weakActionVerbs || []), ...(analysis?.missingMetrics || [])].length || undefined : undefined}>
          {completed ? (
            <>
              {analysis?.weakBulletPoints?.map((w, i) => <SuggestionItem key={`weak-${i}`} text={w} type="warning" />)}
              {analysis?.weakActionVerbs?.map((w, i) => <SuggestionItem key={`verb-${i}`} text={`Weak action verb: "${w}"`} type="warning" />)}
              {analysis?.missingMetrics?.map((m, i) => <SuggestionItem key={`metric-${i}`} text={m} type="info" />)}
            </>
          ) : (
            <div className="text-[11px] text-slate-500 italic text-center py-2">Complete your resume to detect content issues.</div>
          )}
        </CollapsibleCard>

        {/* AI Suggestions */}
        <CollapsibleCard title="AI Suggestions" icon={<Lightbulb className="w-3 h-3 text-blue-400" />} color="#3b82f6" defaultOpen={completed && (analysis?.suggestions?.length ?? 0) > 0}>
          {completed && (analysis?.suggestions?.length ?? 0) > 0 ? (
            analysis!.suggestions.map((s, i) => <SuggestionItem key={`sug-${i}`} text={s.suggestion} type="info" />)
          ) : completed ? (
            <div className="text-[11px] text-slate-500 italic text-center py-2">No suggestions. Your resume looks good!</div>
          ) : (
            <div className="text-[11px] text-slate-500 italic text-center py-2">Add resume content to get AI suggestions.</div>
          )}
        </CollapsibleCard>

        {/* Job Profile */}
        <CollapsibleCard title="Job Profile" icon={<FileSearch className="w-3 h-3 text-cyan-400" />} color="#06b6d4" defaultOpen={false}>
          <JobProfilePanel />
        </CollapsibleCard>

        {/* Job Match */}
        <CollapsibleCard title="Job Match" icon={<Briefcase className="w-3 h-3 text-purple-400" />} color="#8b5cf6" defaultOpen={false}>
          <JobMatchPanel />
        </CollapsibleCard>
      </div>
    </div>
  );
}

function AwardIcon({ className }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
}
