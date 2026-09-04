"use client";

/**
 * M4 Evidence-Based Optimizer — Review UI (Patorbit Phase 1).
 *
 * Displays the evidence-grounded optimization results:
 *  - Pre/post match score comparison
 *  - Individual changes with evidence traceability
 *  - Accept/reject per change
 *  - Gap honesty (MISSING qualifications)
 *  - Confidence indicators
 */

import React, { useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Link2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { clsx } from "clsx";
import type {
  EvidenceOptimizerResult,
  OptimizerChange,
  GapItem,
} from "@/types/evidence-optimizer";

/* ── Qualification badge colors ──────────────────────────────────────────── */

const QUAL_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  PROVEN: {
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-400",
    label: "Proven",
  },
  RELATED: {
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-400",
    label: "Related",
  },
  COMMUNICATION_GAP: {
    bg: "bg-blue-500/10 border-blue-500/20",
    text: "text-blue-400",
    label: "Communication Gap",
  },
  MISSING: {
    bg: "bg-red-500/10 border-red-500/20",
    text: "text-red-400",
    label: "Missing",
  },
};

/* ── Confidence indicator ────────────────────────────────────────────────── */

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color =
    confidence >= 0.8
      ? "text-emerald-400"
      : confidence >= 0.5
        ? "text-amber-400"
        : "text-red-400";
  return (
    <span className={clsx("text-[10px] font-semibold tabular-nums", color)}>
      {Math.round(confidence * 100)}% confident
    </span>
  );
}

/* ── Single change card ──────────────────────────────────────────────────── */

function ChangeCard({
  change,
  accepted,
  onAccept,
  onReject,
}: {
  change: OptimizerChange;
  accepted: boolean | null;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const qual = QUAL_COLORS[change.qualification] || QUAL_COLORS.PROVEN;

  return (
    <div
      className={clsx(
        "rounded-xl border p-4 transition-all",
        accepted === true
          ? "border-emerald-500/30 bg-emerald-500/[0.04]"
          : accepted === false
            ? "border-red-500/20 bg-red-500/[0.02] opacity-60"
            : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={clsx(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              qual.bg,
              qual.text,
            )}
          >
            {qual.label}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-slate-500 capitalize">
            {change.section}
          </span>
          <ConfidenceBadge confidence={change.confidence} />
        </div>

        {/* Accept/reject buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onAccept}
            className={clsx(
              "rounded-lg p-1.5 transition-colors",
              accepted === true
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-gray-400 dark:text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400",
            )}
            title="Accept change"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <button
            onClick={onReject}
            className={clsx(
              "rounded-lg p-1.5 transition-colors",
              accepted === false
                ? "bg-red-500/20 text-red-400"
                : "text-gray-400 dark:text-slate-500 hover:bg-red-500/10 hover:text-red-400",
            )}
            title="Reject change"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Change content */}
      <div className="space-y-2">
        {change.original && (
          <div className="text-[11px] text-gray-500 dark:text-slate-500 line-through">
            {change.original}
          </div>
        )}
        <div className="flex items-center gap-2">
          {change.original && (
            <ArrowRight className="h-3 w-3 text-gray-400 dark:text-slate-500 shrink-0" />
          )}
          <p className="text-xs font-medium text-gray-800 dark:text-slate-200">
            {change.optimized}
          </p>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-slate-400 italic">
          {change.reason}
        </p>
      </div>

      {/* Evidence traceability */}
      {change.supportingEvidence.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        >
          <Link2 className="h-3 w-3" />
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {change.supportingEvidence.length} evidence source
          {change.supportingEvidence.length !== 1 ? "s" : ""}
        </button>
      )}

      {expanded && change.supportingEvidence.length > 0 && (
        <div className="mt-2 space-y-1 pl-5">
          {change.supportingEvidence.map((ev, i) => (
            <div
              key={`${ev.itemId}-${i}`}
              className="flex items-start gap-2 text-[10px] text-gray-500 dark:text-slate-500"
            >
              <ShieldCheck className="h-3 w-3 text-gray-400 dark:text-slate-500 shrink-0 mt-0.5" />
              <span>
                <span className="font-medium text-gray-600 dark:text-slate-400">
                  {ev.itemKind}
                </span>
                : &ldquo;{ev.text.slice(0, 80)}
                {ev.text.length > 80 ? "..." : ""}&rdquo;
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Gap item ────────────────────────────────────────────────────────────── */

function GapCard({ gap }: { gap: GapItem }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-800 dark:text-slate-200">
            {gap.requirement}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            {gap.reason}
          </p>
          {gap.suggestion && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
              💡 {gap.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main review component ───────────────────────────────────────────────── */

interface EvidenceOptimizerReviewProps {
  result: EvidenceOptimizerResult;
  onApply: (acceptedChanges: OptimizerChange[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function EvidenceOptimizerReview({
  result,
  onApply,
  onCancel,
  loading = false,
}: EvidenceOptimizerReviewProps) {
  const [decisions, setDecisions] = useState<Record<string, boolean | null>>({});

  const handleAccept = useCallback((id: string) => {
    setDecisions((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleReject = useCallback((id: string) => {
    setDecisions((prev) => ({ ...prev, [id]: false }));
  }, []);

  const handleAcceptAll = useCallback(() => {
    const allAccepted: Record<string, boolean | null> = {};
    for (const change of result.changes) {
      allAccepted[change.id] = true;
    }
    setDecisions(allAccepted);
  }, [result.changes]);

  const acceptedChanges = result.changes.filter(
    (c) => decisions[c.id] === true,
  );

  const hasDecisions = Object.keys(decisions).length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Evidence-Based Optimization
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
          Every change below is traced to your Career Profile evidence. No facts
          have been invented.
        </p>
      </div>

      {/* Score comparison */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-gray-400 dark:text-slate-500" />
          <span className="text-xs text-gray-500 dark:text-slate-400">Before:</span>
          <span className="text-sm font-bold text-gray-600 dark:text-slate-300 tabular-nums">
            {result.preMatchScore}%
          </span>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400 dark:text-slate-500" />
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span className="text-xs text-gray-500 dark:text-slate-400">After:</span>
          <span className="text-sm font-bold text-emerald-400 tabular-nums">
            {result.postMatchScore}%
          </span>
        </div>
        <span className="ml-auto text-[11px] text-gray-400 dark:text-slate-500">
          {result.changes.length} change{result.changes.length !== 1 ? "s" : ""} proposed
        </span>
      </div>

      {/* Summary */}
      {result.summary && (
        <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed px-1">
          {result.summary}
        </p>
      )}

      {/* Accept all / Reject all */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAcceptAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
        >
          <CheckCircle2 className="h-3 w-3" />
          Accept All
        </button>
        <span className="text-[10px] text-gray-400 dark:text-slate-500">
          Review each change individually below
        </span>
      </div>

      {/* Changes */}
      <div className="space-y-3">
        {result.changes.map((change) => (
          <ChangeCard
            key={change.id}
            change={change}
            accepted={decisions[change.id] ?? null}
            onAccept={() => handleAccept(change.id)}
            onReject={() => handleReject(change.id)}
          />
        ))}
      </div>

      {/* Gaps */}
      {result.gaps.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            Genuine Gaps ({result.gaps.length})
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            These job requirements have no supporting evidence in your Career
            Profile. They cannot be fabricated.
          </p>
          {result.gaps.map((gap, i) => (
            <GapCard key={`gap-${i}`} gap={gap} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 border border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.12] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onApply(acceptedChanges)}
          disabled={acceptedChanges.length === 0 || loading}
          className={clsx(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all",
            acceptedChanges.length > 0 && !loading
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
              : "bg-white/[0.05] text-gray-400 dark:text-slate-500 cursor-not-allowed",
          )}
        >
          {loading ? (
            <>
              <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Applying...
            </>
          ) : (
            <>
              Apply {acceptedChanges.length} Change
              {acceptedChanges.length !== 1 ? "s" : ""}
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
