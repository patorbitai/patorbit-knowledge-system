"use client";

import { clsx } from "clsx";
import { AlertTriangle, RotateCcw, Loader2 } from "lucide-react";

// ── Skeleton shimmer ──────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx("animate-pulse rounded-md bg-white/[0.06]", className)}
      aria-hidden="true"
    />
  );
}

// ── Error box ─────────────────────────────────────────────────────────────────

export interface ErrorBoxProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Use "sm" for inline entry-level errors inside small containers */
  size?: "sm" | "md";
}

export function ErrorBox({
  message,
  onRetry,
  retryLabel = "Try again",
  size = "md",
}: ErrorBoxProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-500/20 bg-rose-500/[0.08] px-3.5 py-3 space-y-2"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className={clsx("text-rose-400 shrink-0 mt-0.5", size === "sm" ? "w-3 h-3" : "w-4 h-4")}
          aria-hidden
        />
        <p
          className={clsx(
            "text-rose-300 leading-relaxed",
            size === "sm" ? "text-[10px]" : "text-[11px]",
          )}
        >
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className={clsx(
            "inline-flex items-center gap-1.5 font-semibold text-rose-400",
            "hover:text-rose-300 transition-colors",
            size === "sm" ? "text-[10px]" : "text-[10px]",
          )}
        >
          <RotateCcw className="w-2.5 h-2.5" aria-hidden />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

// ── Inline loading row ────────────────────────────────────────────────────────

export function LoadingRow({ label }: { label: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-5"
      role="status"
      aria-label={label}
    >
      <Loader2 className="w-4 h-4 text-violet-400 animate-spin" aria-hidden />
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

// ── ScoreCard skeleton ────────────────────────────────────────────────────────

export function ScoreCardSkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label="Loading resume score…"
    >
      {/* Radial gauge placeholder */}
      <div className="flex justify-center py-2">
        <Skeleton className="w-[88px] h-[88px] rounded-full" />
      </div>

      {/* Breakdown bars */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 space-y-2.5">
        <Skeleton className="h-2.5 w-16 mb-1" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-2 w-14" />
              <Skeleton className="h-2 w-5" />
            </div>
            <Skeleton className="h-1 w-full" />
          </div>
        ))}
      </div>

      {/* Suggestion placeholders */}
      <div className="space-y-2">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

// ── KeywordCloud skeleton ─────────────────────────────────────────────────────

export function KeywordCloudSkeleton() {
  const groups = [5, 3, 5] as const;
  const widths = ["w-12", "w-20", "w-16", "w-14", "w-18"] as const;

  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label="Analysing keywords…"
    >
      {/* Score header */}
      <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <Skeleton className="w-14 h-14 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-40" />
        </div>
      </div>

      {/* Three chip groups */}
      {groups.map((count, g) => (
        <div key={g} className="space-y-1.5">
          <Skeleton className="h-2 w-24" />
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className={clsx("h-5 rounded-md", widths[i % widths.length])} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MatchReport skeleton ──────────────────────────────────────────────────────

export function MatchReportSkeleton() {
  const chipWidths = ["w-12", "w-20", "w-16", "w-14", "w-24"] as const;

  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label="Analysing job match…"
    >
      {/* Score header */}
      <div className="flex items-center gap-4 px-3.5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <Skeleton className="w-16 h-16 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-2.5 w-28" />
        </div>
      </div>

      {/* Keyword groups */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 space-y-4">
        {[0, 1].map((g) => (
          <div key={g} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-2 w-24" />
              <Skeleton className="h-2 w-4" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: g === 1 ? 3 : 5 }).map((_, i) => (
                <Skeleton key={i} className={clsx("h-5 rounded-md", chipWidths[i % chipWidths.length])} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions box */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-white/[0.04]">
          <Skeleton className="h-2.5 w-32" />
        </div>
        <div className="px-3.5 py-3 space-y-2.5">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
