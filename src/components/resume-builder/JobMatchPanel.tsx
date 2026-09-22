"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import Link from "next/link";
import {
  useResumeBuilder,
  isResumeEffectivelyEmpty,
} from "@/store/resume-builder";
import type {
  QualificationClassification,
  QualificationMatchItem,
} from "@/types/qualification-match";
import type { CareerProfile } from "@/types/career-profile";
import type { Claim } from "@/types/resume";
import {
  classifySupport,
  evidenceSourceLabel,
  getSupportBadge,
  resolveEvidenceLabel,
} from "@/lib/provenance";
import {
  MATCH_METHODOLOGY,
  computeMatchCategories,
  computeOverallMatch,
  preferredSourceRefs,
} from "@/lib/match-score";
import { WhyThisChange } from "@/components/shared/WhyThisChange";
import { AddEvidenceModal } from "@/components/identity/AddEvidenceModal";
import { GapCorrectionModal } from "@/components/resume-builder/GapCorrectionModal";
import {
  applyRequirementCorrection,
  correctionField,
  type CorrectionKind,
} from "@/lib/gap-correction";
import { track, trackOnce } from "@/lib/analytics";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  HelpCircle,
  Loader2,
  PlusCircle,
  ShieldQuestion,
  Target,
  Upload,
  XCircle,
} from "lucide-react";

const CLASSIFICATION_META: Record<
  QualificationClassification,
  { label: string; groupLabel: string; icon: typeof CheckCircle2; chip: string; dot: string }
> = {
  PROVEN: {
    label: "Strong",
    groupLabel: "Strong matches",
    icon: CheckCircle2,
    chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  RELATED: {
    label: "Partial",
    groupLabel: "Partial matches",
    icon: ArrowRight,
    chip: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    dot: "bg-sky-400",
  },
  COMMUNICATION_GAP: {
    label: "Understated",
    groupLabel: "In your profile but understated",
    icon: AlertTriangle,
    chip: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
  },
  MISSING: {
    label: "No evidence",
    groupLabel: "No evidence found",
    icon: XCircle,
    chip: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dot: "bg-rose-400",
  },
};

const ORDER: QualificationClassification[] = [
  "PROVEN",
  "RELATED",
  "COMMUNICATION_GAP",
  "MISSING",
];

const SUMMARY_KEY: Record<QualificationClassification, "proven" | "related" | "communicationGap" | "missing"> = {
  PROVEN: "proven",
  RELATED: "related",
  COMMUNICATION_GAP: "communicationGap",
  MISSING: "missing",
};

/**
 * Real processing stages (§22) — each maps 1:1 to an actual pipeline step.
 * No fabricated progress: the checkmark appears when that step finishes.
 */
const STAGES = [
  "Reading your professional profile",
  "Extracting job requirements",
  "Matching experience & finding evidence",
  "Saving your analysis",
] as const;

function EvidenceRow({
  item,
  profile,
}: {
  item: QualificationMatchItem;
  profile: CareerProfile | null;
}) {
  if (item.evidence.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
        <ShieldQuestion className="w-3 h-3 shrink-0" />
        We couldn&apos;t find supporting experience in your profile — Patorbit won&apos;t pretend otherwise.
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {item.evidence.map((ev, i) => (
        <div key={i} className="flex flex-col gap-0.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-emerald-400/90">Supported by:</span>
            <span className="text-[10px] text-slate-200">{resolveEvidenceLabel(ev, profile)}</span>
            <span className="text-[9px] text-slate-600">·</span>
            <span className="text-[9px] text-slate-500">
              {evidenceSourceLabel(ev.source.sourceType, ev.itemKind)}
            </span>
          </div>
          <p className="text-[10px] text-slate-300">“{ev.text}”</p>
        </div>
      ))}
    </div>
  );
}

function MatchItemCard({
  item,
  profile,
  preferred,
}: {
  item: QualificationMatchItem;
  profile: CareerProfile | null;
  preferred?: boolean;
}) {
  // §24: count evidence inspections once per item per session.
  useEffect(() => {
    if (item.evidence.length > 0) {
      trackOnce("evidence_viewed", { item: item.id });
    }
  }, [item.id, item.evidence.length]);

  const meta = CLASSIFICATION_META[item.classification];
  const Icon = meta.icon;
  const evidenceLabels = item.evidence.map((ev) => resolveEvidenceLabel(ev, profile));
  const support =
    item.evidence.length === 0
      ? getSupportBadge("missing")
      : classifySupport({ hasEvidence: true, sourceType: item.evidence[0]?.source?.sourceType });
  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          <p className="text-[11px] text-slate-200 leading-snug">{item.requirement}</p>
          {preferred && (
            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md border border-violet-500/20 bg-violet-500/10 text-[8px] font-semibold text-violet-300 uppercase tracking-wide">
              Preferred
            </span>
          )}
        </div>
        <span className={clsx("shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-semibold", meta.chip)}>
          <Icon className="w-2.5 h-2.5" />
          {meta.label}
        </span>
      </div>
      <EvidenceRow item={item} profile={profile} />
      <WhyThisChange
        tone="dark"
        why={item.reason}
        evidence={evidenceLabels}
        support={support}
      />
    </div>
  );
}

/* ── §9: gap analysis — Missing vs Needs stronger evidence vs Development ─ */

function GapBucket({
  title,
  caption,
  tone,
  entries,
  onCorrect,
  ctaLabel,
}: {
  title: string;
  caption: string;
  tone: "amber" | "rose" | "violet";
  entries: QualificationMatchItem[];
  /** When present, each entry gets a correction CTA. */
  onCorrect?: (requirement: string) => void;
  ctaLabel?: string;
}) {
  if (entries.length === 0) return null;
  const tones = {
    amber: "border-amber-500/20 bg-amber-500/[0.06] text-amber-300",
    rose: "border-rose-500/20 bg-rose-500/[0.06] text-rose-300",
    violet: "border-violet-500/20 bg-violet-500/[0.06] text-violet-300",
  } as const;
  return (
    <div className={clsx("rounded-xl border px-3.5 py-3 space-y-2", tones[tone])}>
      <div>
        <p className="text-[11px] font-semibold">{title} ({entries.length})</p>
        <p className="text-[10px] text-slate-400 leading-relaxed">{caption}</p>
      </div>
      <ul className="space-y-1.5">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-1.5">
            <span className="text-[11px] text-slate-200 min-w-0">{e.requirement}</span>
            {onCorrect && (
              <button
                onClick={() => onCorrect(e.requirement)}
                className="shrink-0 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-2 py-1 text-[9px] font-semibold text-slate-200 transition-colors"
              >
                <PlusCircle className="w-3 h-3" />
                {ctaLabel}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GapsCard({
  items,
  onCorrectSkill,
  onCorrectOther,
}: {
  items: QualificationMatchItem[];
  /** Skills use the fast one-click path. */
  onCorrectSkill: (skillName: string) => void;
  /** Non-skill requirements open the typed correction modal (§P1.5). */
  onCorrectOther: (requirement: string) => void;
}) {
  useEffect(() => {
    trackOnce("gap_viewed");
  }, []);

  const understated = items.filter((i) => i.classification === "COMMUNICATION_GAP");
  const missing = items.filter((i) => i.classification === "MISSING");
  const missingSkills = missing.filter((i) => i.sourceGroup === "skill");
  const missingOther = missing.filter((i) => i.sourceGroup !== "skill");
  const total = understated.length + missing.length;

  if (total === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3" data-testid="gap-analysis">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-semibold text-emerald-300">No gaps found</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Every requirement we could classify is supported by evidence in your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="gap-analysis">
      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <Compass className="w-3 h-3" /> Skill gap analysis
      </h4>
      <GapBucket
        title="Needs stronger evidence"
        caption="Your profile contains related experience — your resume just doesn't state it clearly. Tailoring can surface it."
        tone="amber"
        entries={understated}
      />
      <GapBucket
        title="Missing"
        caption="We couldn't find supporting evidence in your profile for these requirements. We will not add them to your resume — but if you do have this, you can tell us and we'll record it as information you provided."
        tone="rose"
        entries={missingOther}
        onCorrect={onCorrectOther}
        ctaLabel="Add to my profile"
      />
      <GapBucket
        title="Development opportunity"
        caption="We couldn't find evidence for these skills. We recommend learning or gaining experience with them rather than adding them to your resume. Already have it? Say so."
        tone="violet"
        entries={missingSkills}
        onCorrect={onCorrectSkill}
        ctaLabel="Actually I have this"
      />
    </div>
  );
}

export function JobMatchPanel() {
  const jobDescription = useResumeBuilder((s) => s.jobDescription);
  const setJobDescription = useResumeBuilder((s) => s.setJobDescription);
  const qualificationMatch = useResumeBuilder((s) => s.qualificationMatch);
  const careerProfile = useResumeBuilder((s) => s.careerProfile);
  const jobProfile = useResumeBuilder((s) => s.jobProfile);
  const resume = useResumeBuilder((s) => s.resume);
  const activeJobApplicationId = useResumeBuilder((s) => s.activeJobApplicationId);
  const activeJobApplication = useResumeBuilder((s) => s.activeJobApplication);

  const [expanded, setExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stageIdx, setStageIdx] = useState(-1);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [jobTitleOverride, setJobTitleOverride] = useState<string | null>(null);
  const [jobCompanyOverride, setJobCompanyOverride] = useState<string | null>(null);
  const [showMethod, setShowMethod] = useState(false);
  const [claimToAddEvidence, setClaimToAddEvidence] = useState<Claim | null>(null);
  // §P1.5: pending non-skill correction.
  const [correctionRequirement, setCorrectionRequirement] = useState<string | null>(null);
  const [correctionKind, setCorrectionKind] = useState<CorrectionKind>("certification");

  // §3: derived prefill from the saved application context — user edits
  // simply take over via local override state (no sync effect needed).
  const jobTitle = jobTitleOverride ?? activeJobApplication?.title ?? "";
  const jobCompany = jobCompanyOverride ?? activeJobApplication?.companyName ?? "";
  const effectiveJd = jobDescription || activeJobApplication?.jobDescription || "";

  // §24: first view of a match result, once per session.
  useEffect(() => {
    if (qualificationMatch) {
      trackOnce("match_viewed", { score: computeOverallMatch(qualificationMatch) });
    }
  }, [qualificationMatch]);

  const resumeEmpty = isResumeEffectivelyEmpty(resume);
  const categories = useMemo(
    () => (qualificationMatch ? computeMatchCategories(qualificationMatch) : []),
    [qualificationMatch],
  );
  const preferredRefs = useMemo(() => preferredSourceRefs(jobProfile), [jobProfile]);
  const items: QualificationMatchItem[] = useMemo(
    () => qualificationMatch?.items ?? [],
    [qualificationMatch],
  );
  const responsibilityItems = useMemo(
    () => items.filter((i) => i.sourceGroup === "responsibility"),
    [items],
  );
  const nonResponsibilityItems = useMemo(
    () => items.filter((i) => i.sourceGroup !== "responsibility"),
    [items],
  );

  const summary = qualificationMatch?.summary;
  const supported = summary ? summary.proven + summary.related + summary.communicationGap : 0;
  const matchPercent = qualificationMatch ? computeOverallMatch(qualificationMatch) : 0;

  const yieldPaint = () => new Promise<void>((resolve) => setTimeout(resolve, 90));

  const handleAnalyze = async () => {
    const jd = effectiveJd;
    if (!jd.trim()) return;
    if (resumeEmpty) {
      setAnalysisError("Add your resume to start matching jobs. Your job description is kept.");
      return;
    }
    setIsAnalyzing(true);
    setStageIdx(0);
    setAnalysisError(null);
    track("job_analysis_started", { chars: jd.length });

    try {
      // Mirror the visible JD into the store so M2 extracts from what the
      // user sees (it may come prefilled from the active application).
      if (jobDescription !== jd) setJobDescription(jd);
      const state = useResumeBuilder.getState();

      // Stage 0: rebuild the Career Profile (M1) from the current resume.
      state.rebuildCareerProfile();
      await yieldPaint();
      setStageIdx(1);

      // Stage 1: extract structured job requirements (M2).
      state.rebuildJobProfile();
      await yieldPaint();
      setStageIdx(2);

      // Stage 2: deterministic requirement ↔ profile matching + evidence (M3).
      state.rebuildQualificationMatch();
      await yieldPaint();
      setStageIdx(3);

      // Stage 3: score + persist to the active application (§3/§7).
      const after = useResumeBuilder.getState();
      const match = after.qualificationMatch;
      if (match) {
        const score = computeOverallMatch(match);
        if (after.activeJobApplicationId) {
          await after.saveJobDescriptionToApplication(
            jd,
            jobTitle.trim() || undefined,
            jobCompany.trim() || undefined,
          );
          await after.saveQualificationMatchToApplication(match, score);
        }
        track("job_analysis_completed", { items: match.summary.total, score });
      }
      await yieldPaint();
      setStageIdx(4);
    } catch (err) {
      console.error(err);
      setAnalysisError(
        "We couldn't analyze this job description. Your resume and existing profile are safe — try again, or paste the complete job posting.",
      );
    } finally {
      setIsAnalyzing(false);
      setStageIdx(-1);
    }
  };

  /** §20/§P1.5: user corrects a "no evidence" verdict → master profile.
   *  Runs through the shared correction lib so provenance is ALWAYS
   *  user-provided/suggested — never silently verified (§P4). */
  const handleCorrectSkill = (skillName: string) => {
    const state = useResumeBuilder.getState();
    const result = applyRequirementCorrection(state.resume, {
      kind: "skill",
      text: skillName,
    });
    if (!result) return; // duplicate or empty — nothing to correct
    state.updateField("skills", result.resume.skills);
    state.updateField("claims", [
      ...(state.resume.claims ?? []),
      result.claim,
    ]);
    setClaimToAddEvidence(result.claim);
  };

  /** §P1.5: non-skill missing requirements open the typed correction modal. */
  const handleOpenCorrection = (requirement: string) => {
    setCorrectionRequirement(requirement);
    setCorrectionKind(suggestCorrectionKind(requirement));
  };

  const StatusDivider = ({ label, count, cls }: { label: string; count: number; cls: string }) => {
    if (count === 0) return null;
    return (
      <div className="flex items-center gap-2 pt-1">
        <span className={clsx("text-[9px] font-semibold uppercase tracking-wider", cls)}>
          {label} ({count})
        </span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
      >
        <span>Paste a job description to check compatibility</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3"
          >
            {/* §21: no resume yet */}
            {resumeEmpty && (
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-3.5 py-3 space-y-1.5">
                <p className="text-[11px] font-semibold text-cyan-200">
                  Add your resume to start matching jobs.
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Patorbit matches the job against your professional profile — without a resume there
                  is nothing to compare. Your job description stays right here.
                </p>
                <Link
                  href="/overview"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 px-3 py-1.5 text-[10px] font-semibold text-white transition-colors"
                >
                  <Upload className="w-3 h-3" /> Upload resume
                </Link>
              </div>
            )}

            {/* Job input (§3) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Target job <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="relative">
                  <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                  <input
                    value={jobTitle}
                    onChange={(e) => setJobTitleOverride(e.target.value)}
                    placeholder="Job title"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white pl-7 pr-2 py-2 outline-none focus:border-blue-500/50 placeholder:text-slate-600 transition-all"
                  />
                </div>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                  <input
                    value={jobCompany}
                    onChange={(e) => setJobCompanyOverride(e.target.value)}
                    placeholder="Company"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white pl-7 pr-2 py-2 outline-none focus:border-blue-500/50 placeholder:text-slate-600 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Job Description</label>
              <textarea
                value={effectiveJd}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={"Paste the full job description here...\n\nExample:\nSoftware Engineer\nAcme Inc.\n\nResponsibilities:\n- Build APIs\n- Collaborate with product teams\n\nRequirements:\n- 3+ years of software engineering\n- Python, React, PostgreSQL"}
                rows={4}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white px-3.5 py-2.5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder:text-slate-600 resize-none transition-all"
              />
              {!effectiveJd.trim() && (
                <p className="text-[10px] text-slate-600">
                  Add a job description to see how your experience matches.
                </p>
              )}
            </div>

            {/* Primary CTA (§3) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !effectiveJd.trim() || resumeEmpty}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] font-semibold transition-all disabled:opacity-50"
              >
                <Target className="w-3 h-3" />
                {isAnalyzing ? "Analyzing…" : "Analyze this job"}
              </button>
            </div>
            {activeJobApplicationId && (
              <p className="text-[9px] text-slate-600">
                This analysis will be saved to your job application.
              </p>
            )}

            {/* §22: real stages — each checkmark = a completed pipeline step */}
            {isAnalyzing && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 space-y-1.5">
                {STAGES.map((label, i) => {
                  const done = stageIdx > i;
                  const active = stageIdx === i;
                  return (
                    <div key={label} className="flex items-center gap-2 text-[11px]">
                      {done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : active ? (
                        <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0" />
                      )}
                      <span className={done ? "text-slate-300" : active ? "text-white" : "text-slate-600"}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {analysisError && (
              <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[10px] leading-relaxed text-rose-400">
                {analysisError}
              </div>
            )}

            {/* Results */}
            <AnimatePresence>
              {qualificationMatch && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Match overview — headline + transparent category breakdown (§7) */}
                  {summary && summary.total > 0 && (
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-slate-300">Match overview</span>
                        <span className="text-xl font-bold text-cyan-400 tabular-nums">{matchPercent}% match</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                          style={{ width: `${matchPercent}%` }}
                        />
                      </div>

                      {/* Category scores — only categories with data (§7) */}
                      {categories.length > 0 && (
                        <div className="mt-2.5 space-y-1">
                          {categories.map((c) => (
                            <div key={c.key} className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 w-32 shrink-0">{c.label}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-cyan-500/70"
                                  style={{ width: `${c.percent ?? 0}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-300 tabular-nums w-8 text-right">
                                {c.percent}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] text-slate-500 mt-1.5">
                        {supported} of {summary.total} job requirements are supported by your
                        profile. Expand any item below to see why.
                      </p>

                      <button
                        onClick={() => setShowMethod(!showMethod)}
                        className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-cyan-400/90 hover:text-cyan-300 transition-colors"
                      >
                        <HelpCircle className="w-3 h-3" />
                        How is this calculated?
                      </button>
                      {showMethod && (
                        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400 border-t border-white/[0.06] pt-1.5">
                          {MATCH_METHODOLOGY}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Verdict summary */}
                  {summary && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {ORDER.map((cls) => {
                        const meta = CLASSIFICATION_META[cls];
                        return (
                          <div key={cls} className="flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                            <span className={clsx("w-1.5 h-1.5 rounded-full", meta.dot)} />
                            <span className="text-[13px] font-semibold text-white">{summary[SUMMARY_KEY[cls]]}</span>
                            <span className="text-[8px] text-slate-500 uppercase tracking-wider">{meta.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* §8: responsibilities mapped to experience */}
                  {responsibilityItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Responsibilities → your experience ({responsibilityItems.length})
                      </h4>
                      <div className="space-y-2">
                        {responsibilityItems.map((item) => (
                          <div key={item.id} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <MatchItemCard
                              item={item}
                              profile={careerProfile}
                              preferred={preferredRefs.has(item.jobSource.sourceRef)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirement-by-requirement breakdown */}
                  {nonResponsibilityItems.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Requirement-by-requirement breakdown ({summary?.total ?? items.length} items)
                      </h4>
                      {ORDER.map((cls) => {
                        const meta = CLASSIFICATION_META[cls];
                        const group = nonResponsibilityItems.filter((i) => i.classification === cls);
                        if (group.length === 0) return null;
                        return (
                          <div key={cls} className="space-y-2">
                            <StatusDivider label={meta.groupLabel} count={group.length} cls={textColorFor(cls)} />
                            <div className="space-y-2">
                              {group.map((item) => (
                                <div key={item.id} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                  <MatchItemCard
                                    item={item}
                                    profile={careerProfile}
                                    preferred={preferredRefs.has(item.jobSource.sourceRef)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {items.length === 0 && (
                    <p className="text-[10px] text-slate-500">
                      No job items to evaluate yet. Add requirements or skills to the job description and analyze
                      again.
                    </p>
                  )}

                  {/* §9: gap analysis */}
                  {items.length > 0 && (
                    <GapsCard
                      items={items}
                      onCorrectSkill={handleCorrectSkill}
                      onCorrectOther={handleOpenCorrection}
                    />
                  )}

                  {/* Honest framing (§5/§26) */}
                  <p className="text-[9px] text-slate-600 leading-relaxed">
                    &ldquo;No evidence&rdquo; means we could not find support in your profile — it is not a
                    claim that you lack the skill. Nothing is added to your resume without your approval.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* §P1.5: typed correction for non-skill requirements → master profile */}
      <GapCorrectionModal
        open={!!correctionRequirement}
        requirement={correctionRequirement ?? ""}
        defaultKind={correctionKind}
        experienceLabels={(resume.experience ?? []).map(
          (e) => `${e.position || "Role"} — ${e.company || "Company"}`,
        )}
        onClose={() => setCorrectionRequirement(null)}
        onSaved={(claim) => {
          setCorrectionRequirement(null);
          setClaimToAddEvidence(claim);
        }}
      />

      {/* §20: user correction → master profile, then re-analyze */}
      <AddEvidenceModal
        claimId={claimToAddEvidence?.id ?? ""}
        claimAssertion={claimToAddEvidence?.assertionText ?? ""}
        open={!!claimToAddEvidence}
        onClose={() => {
          setClaimToAddEvidence(null);
          if (effectiveJd.trim() && !resumeEmpty) void handleAnalyze();
        }}
      />
    </div>
  );
}

function textColorFor(cls: QualificationClassification): string {
  return CLASSIFICATION_META[cls].chip.split(" ")[1] ?? "text-slate-400";
}

/** §P1.5: sensible default correction kind from the requirement's wording. */
function suggestCorrectionKind(requirement: string): CorrectionKind {
  const r = requirement.toLowerCase();
  if (/cert|licen|pmp|scrum|aws certified|azure certified/.test(r)) return "certification";
  if (/degree|b\.?s\.?|m\.?s\.?|bachelor|master|mba|phd|diploma|university|college/.test(r)) return "education";
  if (/\byear|experience with|worked with|hands-on|familiarity/.test(r)) return "experience-bullet";
  if (/\b(industry|domain|sector|domain expertise)\b/.test(r)) return "domain-skill";
  return "certification";
}
