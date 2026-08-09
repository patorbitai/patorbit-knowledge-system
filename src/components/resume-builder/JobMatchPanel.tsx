"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { useResumeBuilder } from "@/store/resume-builder";
import type {
  QualificationClassification,
  QualificationMatchItem,
} from "@/types/qualification-match";
import { CheckCircle2, XCircle, AlertTriangle, ShieldQuestion, ArrowRight, ChevronDown, ChevronUp, Target } from "lucide-react";

const CLASSIFICATION_META: Record<
  QualificationClassification,
  { label: string; icon: typeof CheckCircle2; chip: string; dot: string }
> = {
  PROVEN: {
    label: "Proven",
    icon: CheckCircle2,
    chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  RELATED: {
    label: "Related",
    icon: ArrowRight,
    chip: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    dot: "bg-sky-400",
  },
  COMMUNICATION_GAP: {
    label: "Comm. Gap",
    icon: AlertTriangle,
    chip: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
  },
  MISSING: {
    label: "Missing",
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

function EvidenceRow({ item }: { item: QualificationMatchItem }) {
  if (item.evidence.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
        <ShieldQuestion className="w-3 h-3" />
        No candidate evidence found for this item.
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {item.evidence.map((ev, i) => (
        <div key={i} className="flex flex-col gap-0.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-slate-500">{ev.itemKind}</span>
            <span className="text-[9px] text-slate-600">·</span>
            <span className="text-[9px] font-mono text-slate-500">{ev.source.sourceRef}</span>
          </div>
          <p className="text-[10px] text-slate-300">{ev.text}</p>
        </div>
      ))}
    </div>
  );
}

function MatchItemCard({ item }: { item: QualificationMatchItem }) {
  const meta = CLASSIFICATION_META[item.classification];
  const Icon = meta.icon;
  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] text-slate-200 leading-snug">{item.requirement}</p>
        <span className={clsx("shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-semibold", meta.chip)}>
          <Icon className="w-2.5 h-2.5" />
          {meta.label}
        </span>
      </div>
      <p className="text-[9px] text-slate-600">Source: {item.jobSource.sourceRef}</p>
      <EvidenceRow item={item} />
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

  const [expanded, setExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!jobDescription.trim()) return;
    setIsAnalyzing(true);
    // Deterministic, synchronous pipeline: M1 → M2 → M3. No AI call.
    try {
      rebuildViaStore();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const summary = qualificationMatch?.summary;
  const items: QualificationMatchItem[] = qualificationMatch?.items ?? [];

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
                {"Analyze Match"}
              </button>
            </div>

            {/* Results */}
            <AnimatePresence>
              {qualificationMatch && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
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
                        Qualification Match ({summary?.total ?? items.length} items)
                      </h4>
                      {ORDER.map((cls) => {
                        const meta = CLASSIFICATION_META[cls];
                        const group = items.filter((i) => i.classification === cls);
                        return (
                          <div key={cls} className="space-y-2">
                            <StatusDivider label={meta.label} count={group.length} cls={textColorFor(cls)} />
                            {group.map((item) => (
                              <div key={item.id} className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                <MatchItemCard item={item} />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {qualificationMatch && items.length === 0 && (
                    <p className="text-[10px] text-slate-500">
                      No job items to evaluate. Add requirements/skills to the job description.
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