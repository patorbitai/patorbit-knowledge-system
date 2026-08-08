"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { Tag, Target, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import type { JdMatchResult, TailoringSuggestion } from "@/lib/ai/types";
import type { Resume } from "@/types/resume";
import { ErrorBox, MatchReportSkeleton } from "./shared";

// ── Score ring ────────────────────────────────────────────────────────────────

function MatchScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "#22d3ee" : score >= 60 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1" aria-label={`Match score: ${score} out of 100`}>
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
        <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>
          {score}
        </text>
      </svg>
      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Match</p>
    </div>
  );
}

// ── Keyword pill ──────────────────────────────────────────────────────────────

function KeywordPill({ word, variant }: { word: string; variant: "matched" | "missing" }) {
  return (
    <span
      className={clsx(
        "inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border",
        variant === "matched"
          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
          : "bg-rose-500/15    text-rose-300    border-rose-500/20",
      )}
    >
      {word}
    </span>
  );
}

// ── Keyword group ─────────────────────────────────────────────────────────────

function KeywordGroup({
  title,
  items,
  variant,
  emptyText,
}: {
  title: string;
  items: string[];
  variant: "matched" | "missing";
  emptyText: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">{title}</p>
        {items.length > 0 && (
          <span className="text-[9px] text-slate-600">{items.length}</span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-[10px] text-slate-600 italic">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5" role="list" aria-label={title}>
          {items.map((kw) => (
            <div key={kw} role="listitem">
              <KeywordPill word={kw} variant={variant} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Missing experience list ───────────────────────────────────────────────────

function MissingExperiences({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
        Missing Experience
      </p>
      <ul className="space-y-1" role="list">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500/60" aria-hidden />
            <span className="text-[11px] text-slate-400 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Suggestion type config ────────────────────────────────────────────────────

const TYPE_LABELS: Record<TailoringSuggestion["type"], string> = {
  "rewrite-bullet":  "Rewrite Bullet",
  "add-keyword":     "Add Keyword",
  "reorder-section": "Reorder Section",
  "update-summary":  "Update Summary",
};

const TYPE_COLORS: Record<TailoringSuggestion["type"], string> = {
  "rewrite-bullet":  "text-violet-400 bg-violet-500/10 border-violet-500/20",
  "add-keyword":     "text-cyan-400    bg-cyan-500/10    border-cyan-500/20",
  "reorder-section": "text-amber-400   bg-amber-500/10   border-amber-500/20",
  "update-summary":  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

// ── Suggestion card ───────────────────────────────────────────────────────────

interface SuggestionCardProps {
  suggestion: TailoringSuggestion;
  index: number;
}

function SuggestionCard({ suggestion, index }: SuggestionCardProps) {
  const typeStyle = TYPE_COLORS[suggestion.type];

  return (
    <article
      className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
      aria-label={`Tailoring suggestion ${index + 1}: ${TYPE_LABELS[suggestion.type]}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3.5 pt-3 pb-2">
        <span
          className={clsx(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border",
            typeStyle,
          )}
        >
          <Tag className="w-2.5 h-2.5" aria-hidden />
          {TYPE_LABELS[suggestion.type]}
        </span>
      </div>

      {/* Target */}
      <div className="px-3.5 pb-1.5">
        <div className="flex items-start gap-1.5">
          <Target className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" aria-hidden />
          <p className="text-[10px] text-slate-500 leading-relaxed italic truncate">
            {suggestion.target}
          </p>
        </div>
      </div>

      {/* Suggestion text */}
      <div className="px-3.5 pb-3">
        <div className="flex items-start gap-1.5">
          <Lightbulb className="w-3 h-3 text-amber-400/70 shrink-0 mt-0.5" aria-hidden />
          <p className="text-[11px] text-slate-300 leading-relaxed">{suggestion.suggestion}</p>
        </div>
      </div>

      {/* Actions — UI only, no implementation yet */}
      <div className="flex items-center gap-2 px-3.5 pb-3 pt-1 border-t border-white/[0.04]">
        <button
          className={clsx(
            "flex-1 inline-flex items-center justify-center gap-1.5",
            "px-3 py-1.5 rounded-lg text-[10px] font-semibold",
            "bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98]",
            "text-slate-400 hover:text-slate-200 border border-white/[0.06]",
            "transition-all",
          )}
          aria-label={`Accept suggestion: ${suggestion.suggestion}`}
        >
          Accept Later
        </button>
        <button
          className={clsx(
            "px-3 py-1.5 rounded-lg text-[10px] font-semibold",
            "bg-white/[0.03] hover:bg-white/[0.06] active:scale-[0.98]",
            "text-slate-600 hover:text-slate-400 border border-white/[0.05]",
            "transition-all",
          )}
          aria-label={`Dismiss suggestion: ${suggestion.suggestion}`}
        >
          Dismiss
        </button>
      </div>
    </article>
  );
}

// ── Collapsible suggestions list ──────────────────────────────────────────────

function TailoringSuggestions({ suggestions }: { suggestions: TailoringSuggestion[] }) {
  const [open, setOpen] = useState(true);
  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/[0.02] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Tailoring Suggestions
          </span>
          <span className="text-[9px] text-slate-600 tabular-nums">{suggestions.length}</span>
        </div>
        {open
          ? <ChevronUp className="w-3 h-3 text-slate-600" aria-hidden />
          : <ChevronDown className="w-3 h-3 text-slate-600" aria-hidden />}
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 space-y-2.5">
          {suggestions.map((s, i) => (
            <SuggestionCard key={i} suggestion={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── MatchReport ───────────────────────────────────────────────────────────────

export interface MatchReportProps {
  resume: Resume;
  result: JdMatchResult | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function MatchReport({ result, loading, error, onRetry }: MatchReportProps) {
  if (loading) {
    return <MatchReportSkeleton />;
  }

  if (error) {
    return <ErrorBox message={error} onRetry={onRetry} retryLabel="Retry" />;
  }

  if (!result) return null;

  return (
    <div className="space-y-4" role="region" aria-label="Job match report">
      {/* Score header */}
      <div className="flex items-center gap-4 px-3.5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <MatchScoreRing score={result.matchScore} />
        <div className="space-y-1">
          <p className="text-xs font-semibold text-white">Job Description Match</p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            {result.matchedKeywords.length} keywords matched &middot;{" "}
            {result.missingKeywords.length} missing
          </p>
          {result.missingExperiences.length > 0 && (
            <p className="text-[10px] text-amber-400/80">
              {result.missingExperiences.length} experience gap
              {result.missingExperiences.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
      </div>

      {/* Keywords */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 space-y-3.5">
        <KeywordGroup
          title="Matched Keywords"
          items={result.matchedKeywords}
          variant="matched"
          emptyText="No matching keywords found."
        />
        <KeywordGroup
          title="Missing Keywords"
          items={result.missingKeywords}
          variant="missing"
          emptyText="All key terms are covered!"
        />
      </div>

      {/* Missing experiences */}
      {result.missingExperiences.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
          <MissingExperiences items={result.missingExperiences} />
        </div>
      )}

      {/* Tailoring suggestions */}
      <TailoringSuggestions suggestions={result.tailoringSuggestions} />
    </div>
  );
}
