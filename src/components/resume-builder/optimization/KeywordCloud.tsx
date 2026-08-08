"use client";

import { clsx } from "clsx";
import type { KeywordAnalysis } from "@/lib/ai/types";

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "#22d3ee" : score >= 60 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1" aria-label={`Keyword score: ${score} out of 100`}>
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
        <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
          {score}
        </text>
      </svg>
      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Match</p>
    </div>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────

type ChipVariant = "present" | "missing" | "recommended";

const CHIP_STYLES: Record<ChipVariant, string> = {
  present:     "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  missing:     "bg-rose-500/15    text-rose-300    border-rose-500/20",
  recommended: "bg-amber-500/15   text-amber-300   border-amber-500/20",
};

function Chip({ label, variant, count }: { label: string; variant: ChipVariant; count?: number }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md",
        "text-[10px] font-medium border",
        CHIP_STYLES[variant],
      )}
    >
      {label}
      {typeof count === "number" && count > 1 && (
        <span className="opacity-60 text-[9px]">×{count}</span>
      )}
    </span>
  );
}

// ── Chip group ────────────────────────────────────────────────────────────────

function ChipGroup({
  title,
  items,
  variant,
  density,
  emptyText,
}: {
  title: string;
  items: string[];
  variant: ChipVariant;
  density?: Record<string, number>;
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-2">
          {title}
        </p>
        <p className="text-[10px] text-slate-600 italic">{emptyText}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">{title}</p>
        <span className="text-[9px] text-slate-600">{items.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5" role="list" aria-label={title}>
        {items.map((kw) => (
          <div key={kw} role="listitem">
            <Chip
              label={kw}
              variant={variant}
              count={density?.[kw]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KeywordCloud ──────────────────────────────────────────────────────────────

export interface KeywordCloudProps {
  analysis: KeywordAnalysis;
}

export function KeywordCloud({ analysis }: KeywordCloudProps) {
  return (
    <div className="space-y-4" role="region" aria-label="Keyword analysis results">
      {/* Score */}
      <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <ScoreRing score={analysis.score} />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-white">Keyword Coverage</p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            {analysis.present.length} matched &middot;{" "}
            {analysis.missing.length} missing &middot;{" "}
            {analysis.recommended.length} recommended
          </p>
        </div>
      </div>

      {/* Present */}
      <ChipGroup
        title="Present in Resume"
        items={analysis.present}
        variant="present"
        density={analysis.density}
        emptyText="No matching keywords found."
      />

      {/* Missing */}
      <ChipGroup
        title="Missing from Resume"
        items={analysis.missing}
        variant="missing"
        emptyText="No missing keywords — great coverage!"
      />

      {/* Recommended */}
      <ChipGroup
        title="Recommended to Add"
        items={analysis.recommended}
        variant="recommended"
        emptyText="No additional keywords recommended."
      />
    </div>
  );
}
