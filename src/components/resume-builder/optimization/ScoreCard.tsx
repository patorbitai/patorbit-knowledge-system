"use client";

import { clsx } from "clsx";
import type { ResumeScore, ScoreSuggestion } from "@/lib/ai/types";
import { AnalysisScore } from "@/components/resume-builder/AnalysisScore";
import { AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";
export { ScoreCardSkeleton } from "./shared";

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? "#22d3ee" : value >= 60 ? "#10b981" : value >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400">{label}</span>
        <span className="text-[11px] font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Suggestion item ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high:   { icon: AlertTriangle, color: "text-rose-400",   bg: "bg-rose-500/8",   label: "High" },
  medium: { icon: Lightbulb,     color: "text-amber-400",  bg: "bg-amber-500/8",  label: "Medium" },
  low:    { icon: CheckCircle2,  color: "text-slate-400",  bg: "bg-slate-500/8",  label: "Low" },
} as const;

function SuggestionGroup({
  priority,
  items,
}: {
  priority: ScoreSuggestion["priority"];
  items: ScoreSuggestion[];
}) {
  const cfg = PRIORITY_CONFIG[priority];
  const Icon = cfg.icon;

  return (
    <div className="space-y-1">
      <p className={clsx("text-[9px] font-semibold uppercase tracking-widest", cfg.color)}>
        {cfg.label}
      </p>
      {items.map((s, i) => (
        <div
          key={i}
          className={clsx("flex items-start gap-2 px-2.5 py-2 rounded-lg", cfg.bg)}
        >
          <Icon className={clsx("w-3 h-3 mt-0.5 shrink-0", cfg.color)} aria-hidden />
          <span className="text-[11px] text-slate-300 leading-relaxed">{s.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── ScoreCard ─────────────────────────────────────────────────────────────────

export interface ScoreCardProps {
  score: ResumeScore;
}

export function ScoreCard({ score }: ScoreCardProps) {
  const high   = score.suggestions.filter((s) => s.priority === "high");
  const medium = score.suggestions.filter((s) => s.priority === "medium");
  const low    = score.suggestions.filter((s) => s.priority === "low");

  return (
    <div className="space-y-4" role="region" aria-label="Resume score">
      {/* Overall */}
      <div className="flex items-center justify-center py-2">
        <AnalysisScore label="Overall Score" score={score.overall} size="lg" showAnimation />
      </div>

      {/* Breakdown */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 space-y-2.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Breakdown
        </p>
        <ScoreBar label="Impact"        value={score.breakdown.impact} />
        <ScoreBar label="Clarity"       value={score.breakdown.clarity} />
        <ScoreBar label="Completeness"  value={score.breakdown.completeness} />
        <ScoreBar label="ATS"           value={score.breakdown.ats} />
        <ScoreBar label="Tailoring"     value={score.breakdown.tailoring} />
      </div>

      {/* Suggestions */}
      {score.suggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Suggestions
          </p>
          {high.length   > 0 && <SuggestionGroup priority="high"   items={high} />}
          {medium.length > 0 && <SuggestionGroup priority="medium" items={medium} />}
          {low.length    > 0 && <SuggestionGroup priority="low"    items={low} />}
        </div>
      )}

      {score.suggestions.length === 0 && (
        <p className="text-[11px] text-slate-500 italic text-center py-2">
          No suggestions — your resume looks great!
        </p>
      )}
    </div>
  );
}
