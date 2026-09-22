"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { useResumeBuilder } from "@/store/resume-builder";
import type {
  QualificationClassification,
  QualificationEvidenceKind,
  QualificationEvidenceRef,
  QualificationMatchItem,
} from "@/types/qualification-match";
import type { CareerProfile } from "@/types/career-profile";
import { classifySupport, getSupportBadge } from "@/lib/provenance";
import { WhyThisChange } from "@/components/shared/WhyThisChange";
import { track } from "@/lib/analytics";
import { CheckCircle2, XCircle, AlertTriangle, ShieldQuestion, ArrowRight, ChevronDown, ChevronUp, Target } from "lucide-react";

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
    label: "Missing",
    groupLabel: "Missing skills & requirements",
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

const KIND_LABEL: Record<QualificationEvidenceKind, string> = {
  skill: "Skill",
  experience: "Experience",
  education: "Education",
  certification: "Certification",
  project: "Project",
  language: "Language",
};

const SOURCE_LABEL: Record<string, string> = {
  "resume-import": "from your resume",
  "user-input": "you entered this",
  "ai-extraction": "extracted by Patorbit",
  "linkedin-import": "from LinkedIn",
  "github-import": "from GitHub",
  "credential-check": "from a credential check",
};

/**
 * Turn provenance refs into the sentence a user can verify:
 * "Software Engineer — Acme — 2024 – 2026" instead of "resume:experience:exp_1x7".
 */
function resolveEvidenceLabel(ev: QualificationEvidenceRef, profile: CareerProfile | null): string {
  if (profile) {
    switch (ev.itemKind) {
      case "experience": {
        const e = profile.experiences.find((x) => x.id === ev.itemId);
        if (e) {
          const end = e.current ? "Present" : e.endDate;
          const dates = [e.startDate, end].filter(Boolean).join(" – ");
          return [e.position, e.company, dates].filter(Boolean).join(" — ");
        }
        break;
      }
      case "education": {
        const e = profile.educations.find((x) => x.id === ev.itemId);
        if (e) return [e.degree, e.school, e.year].filter(Boolean).join(" — ");
        break;
      }
      case "skill": {
        const s = profile.skills.find((x) => x.id === ev.itemId);
        if (s) return s.category ? `${s.name} (${s.category})` : s.name;
        break;
      }
      case "project": {
        const p = profile.projects.find((x) => x.id === ev.itemId);
        if (p) return p.name;
        break;
      }
      case "certification": {
        const c = profile.certifications.find((x) => x.id === ev.itemId);
        if (c) return c.name;
        break;
      }
      case "language": {
        const l = profile.languages.find((x) => x.id === ev.itemId);
        if (l) return l.name;
        break;
      }
    }
  }
  return KIND_LABEL[ev.itemKind] ?? "Your profile";
}

function EvidenceRow({ item, profile }: { item: QualificationMatchItem; profile: CareerProfile | null }) {
  if (item.evidence.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
        <ShieldQuestion className="w-3 h-3" />
        Nothing in your profile supports this yet — Patorbit won&apos;t pretend otherwise.
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
              {SOURCE_LABEL[ev.source.sourceType] ?? ev.itemKind}
            </span>
          </div>
          <p className="text-[10px] text-slate-300">“{ev.text}”</p>
        </div>
      ))}
    </div>
  );
}

function MatchItemCard({ item, profile }: { item: QualificationMatchItem; profile: CareerProfile | null }) {
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
        <p className="text-[11px] text-slate-200 leading-snug">{item.requirement}</p>
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

/** Compute the deterministic M3 match by rebuilding M1 → M2 → M3 from the store. */
function rebuildViaStore() {
  const state = useResumeBuilder.getState();
  state.rebuildCareerProfile();
  state.rebuildJobProfile();
  state.rebuildQualificationMatch();
}

export function JobMatchPanel() {
  const jobDescription = useResumeBuilder((s) => s.jobDescription);
  const setJobDescription = useResumeBuilder((s) => s.setJobDescription);
  const qualificationMatch = useResumeBuilder((s) => s.qualificationMatch);
  const careerProfile = useResumeBuilder((s) => s.careerProfile);

  const [expanded, setExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalyze = () => {
    if (!jobDescription.trim()) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    track("job_analysis_started", { chars: jobDescription.length });
    // Deterministic, synchronous pipeline: M1 → M2 → M3. No AI call.
    try {
      rebuildViaStore();
      // Persist the match result to the active JobApplication.
      // This survives page reload and navigation.
      const state = useResumeBuilder.getState();
      const match = state.qualificationMatch;
      if (match) {
        const score = match.summary.total > 0
          ? Math.round(((match.summary.proven + match.summary.related) / match.summary.total) * 100)
          : 0;
        if (state.activeJobApplicationId) {
          state.saveQualificationMatchToApplication(match, score);
        }
        track("job_analysis_completed", { items: match.summary.total, score });
      }
    } catch (err) {
      console.error(err);
      setAnalysisError(
        "We couldn't analyze this job description. Your resume is untouched — try again, or paste the complete job posting.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const summary = qualificationMatch?.summary;
  const items: QualificationMatchItem[] = qualificationMatch?.items ?? [];
  // "Supported by your profile" = proven + related + communicationGap.
  // COMMUNICATION_GAP items have real evidence in free text — only the resume's
  // wording undersells them — so they count toward the match, not against it.
  const supported = summary
    ? summary.proven + summary.related + summary.communicationGap
    : 0;
  const matchPercent = summary && summary.total > 0
    ? Math.round((supported / summary.total) * 100)
    : 0;

  /* Status divider */
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
            {/* JD Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={4}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white px-3.5 py-2.5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder:text-slate-600 resize-none transition-all"
              />
            </div>

            {/* Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !jobDescription.trim()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] font-semibold transition-all disabled:opacity-50"
              >
                <Target className="w-3 h-3" />
                {isAnalyzing ? "Analyzing…" : "Analyze Match"}
              </button>
            </div>

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
                  {/* Match overview — the headline number, backed by the breakdown below */}
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
                      <p className="text-[10px] text-slate-500 mt-1.5">
                        {supported} of {summary.total} job requirements are supported by your
                        profile. Expand any item below to see why.
                      </p>
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

                  {/* Deterministic classification, grouped by verdict */}
                  {items.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Requirement-by-requirement breakdown ({summary?.total ?? items.length} items)
                      </h4>
                      {ORDER.map((cls) => {
                        const meta = CLASSIFICATION_META[cls];
                        const group = items.filter((i) => i.classification === cls);
                        return (
                          <div key={cls} className="space-y-2">
                            <StatusDivider label={meta.groupLabel} count={group.length} cls={textColorFor(cls)} />
                            {group.map((item) => (
                              <div key={item.id} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                <MatchItemCard item={item} profile={careerProfile} />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {qualificationMatch && items.length === 0 && (
                    <p className="text-[10px] text-slate-500">
                      No job items to evaluate yet. Add requirements or skills to the job description and analyze
                      again.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function textColorFor(cls: QualificationClassification): string {
  return CLASSIFICATION_META[cls].chip.split(" ")[1] ?? "text-slate-400";
}