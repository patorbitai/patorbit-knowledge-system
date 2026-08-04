"use client";

import { clsx } from "clsx";
import { useResumeBuilder } from "@/store/resume-builder";
import { AnalysisScore, AnalysisStatusBadge } from "./AnalysisScore";
import { ProgressIndicator } from "./ProgressIndicator";
import { JobMatchPanel } from "./JobMatchPanel";
import { Sparkles, CheckCircle2, AlertTriangle, XCircle, Lightbulb, ChevronDown, ChevronUp, Briefcase, Target, FileSearch, Shield, GitBranch, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { isAnalysisComplete, isAnalysisInProgress, hasSufficientData } from "@/types/resume";

/* ── Collapsible Card ── */
function CollapsibleCard({
  title, icon, color, children, defaultOpen = true, badge,
}: {
  title: string; icon: React.ReactNode; color: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string | number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}15` }}>{icon}</span>
          <span className="text-xs font-medium text-slate-300">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {badge !== undefined && <span className="text-[10px] font-semibold text-white bg-white/[0.08] px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{badge}</span>}
          {open ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
        </div>
      </button>
      {open && <div className="px-3.5 pb-3 space-y-3">{children}</div>}
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
  return (<div className={clsx("flex items-start gap-2 px-2.5 py-2 rounded-lg", c.bg)}><Icon className={clsx("w-3.5 h-3.5 mt-0.5 shrink-0", c.color)} /><span className="text-[11px] text-slate-300">{text}</span></div>);
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
              isComplete && "text-slate-300", isActive && "text-blue-300 font-medium", isPending && "text-slate-500",
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-3 border-b border-white/[0.06] shrink-0">
        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <div>
          <h2 className="text-xs font-semibold text-white">AI Career Copilot</h2>
          <p className="text-[9px] text-slate-500">Live Analysis</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">

        {/* Status Banner */}
        {!sufficient && !inProgress && (
          <div className="rounded-xl border border-slate-500/20 bg-slate-500/8 px-3.5 py-3 text-center">
            <p className="text-[11px] text-slate-400">Complete your resume to receive AI insights.</p>
          </div>
        )}

        {sufficient && !completed && !inProgress && (
          <button onClick={startAnalysis} className="w-full rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-3 text-center hover:bg-blue-500/15 transition-colors cursor-pointer">
            <p className="text-[11px] text-blue-400 font-medium">Run AI Analysis</p>
          </button>
        )}

        {analysis?.dataSufficiencyNote && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3.5 py-2.5">
            <p className="text-[11px] text-amber-400 text-center">{analysis.dataSufficiencyNote}</p>
          </div>
        )}

        {/* Analysis Progress */}
        {inProgress && analysis?.phases && (
          <CollapsibleCard title="Analysis Progress" icon={<Loader2 className="w-3 h-3 text-blue-400 animate-spin" />} color="#3b82f6" defaultOpen={true}>
            <AnalysisProgress phases={analysis.phases} />
          </CollapsibleCard>
        )}

        {/* Resume Score Card */}
        <CollapsibleCard title="Resume Score" icon={<Target className="w-3 h-3 text-cyan-400" />} color="#22d3ee" defaultOpen={true}>
          {completed ? (
            <div className="space-y-2.5">
              <AnalysisScore label="Overall" score={analysis?.resumeScore?.overall ?? null} size="md" statusLabel="No Data" />
              <AnalysisScore label="Grammar" score={analysis?.resumeScore?.grammar ?? null} size="sm" statusLabel="No Content" />
              <AnalysisScore label="Readability" score={analysis?.resumeScore?.readability ?? null} size="sm" statusLabel="No Content" />
              <AnalysisScore label="Keyword Match" score={analysis?.resumeScore?.keywordMatch ?? null} size="sm" statusLabel="No Keywords" />
              <AnalysisScore label="Structure" score={analysis?.resumeScore?.structure ?? null} size="sm" statusLabel="No Content" />
            </div>
          ) : inProgress ? (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                Calculating scores...
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <AnalysisStatusBadge status="insufficient-data" />
            </div>
          )}
        </CollapsibleCard>

        {/* Trust Score Card */}
        <CollapsibleCard title="Trust Score" icon={<Shield className="w-3 h-3 text-purple-400" />} color="#8b5cf6" defaultOpen={true}>
          {completed ? (
            <div className="space-y-2.5">
              <AnalysisScore label="Overall Trust" score={analysis?.trustScore?.overall ?? null} size="md" statusLabel="Not Calculated" />
              <AnalysisScore label="Identity Verification" score={analysis?.trustScore?.identityVerification ?? null} size="sm" statusLabel="Not Verified" />
              <AnalysisScore label="Employment Evidence" score={analysis?.trustScore?.employmentEvidence ?? null} size="sm" statusLabel="No Employment" />
              <AnalysisScore label="Education Evidence" score={analysis?.trustScore?.educationEvidence ?? null} size="sm" statusLabel="No Education" />
              <AnalysisScore label="Certifications" score={analysis?.trustScore?.certifications ?? null} size="sm" statusLabel="No Certifications" />
              <AnalysisScore label="Social Proof" score={analysis?.trustScore?.socialProof ?? null} size="sm" statusLabel="Not Connected" />
            </div>
          ) : inProgress ? (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                Calculating trust score...
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <span className="text-[10px] text-slate-500 font-medium">Waiting for Resume Data</span>
            </div>
          )}
        </CollapsibleCard>

        {/* Progress */}
        <CollapsibleCard title="Progress" icon={<Target className="w-3 h-3 text-blue-400" />} color="#3b82f6" defaultOpen={false}>
          <ProgressIndicator title="Resume Completed" value={progress()} color="#22d3ee" />
          <ProgressIndicator title="ATS Ready" value={analysis?.atsScore ?? 0} color="#10b981" />
          <ProgressIndicator title="Trust Score" value={analysis?.trustScore?.overall ?? 0} color="#8b5cf6" />
        </CollapsibleCard>

        {/* Missing Items */}
        <CollapsibleCard title="Missing Items" icon={<AlertTriangle className="w-3 h-3 text-amber-400" />} color="#f59e0b" defaultOpen={true} badge={[!hasLinkedIn, !hasGitHub, !hasPortfolio, !hasSummary, !hasCertifications].filter(Boolean).length}>
          <div className="space-y-1">
            <MissingItem icon={<Link2 className="w-2.5 h-2.5" />} label="LinkedIn URL" found={hasLinkedIn} />
            <MissingItem icon={<GitBranch className="w-2.5 h-2.5" />} label="GitHub URL" found={hasGitHub} />
            <MissingItem icon={<Link2 className="w-2.5 h-2.5" />} label="Portfolio / Website" found={hasPortfolio} />
            <MissingItem icon={<FileSearch className="w-2.5 h-2.5" />} label="Professional Summary" found={hasSummary} />
            <MissingItem icon={<AwardIcon className="w-2.5 h-2.5" />} label="Certifications" found={hasCertifications} />
          </div>
          {analysis?.missingSections && analysis.missingSections.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-white/[0.04]">
              {analysis.missingSections.map((s, i) => (
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
