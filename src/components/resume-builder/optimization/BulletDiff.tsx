"use client";

import { clsx } from "clsx";
import { CheckCircle2, X, ArrowDown } from "lucide-react";
import type { BulletSuggestion } from "@/lib/ai/types";

export interface BulletDiffProps {
  suggestion: BulletSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

export function BulletDiff({ suggestion, onAccept, onDismiss }: BulletDiffProps) {
  return (
    <article
      className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
      aria-label={`Bullet suggestion for: ${suggestion.original}`}
    >
      {/* Original */}
      <div className="px-3.5 pt-3 pb-2">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">
          Original
        </p>
        <p className="flex items-start gap-1.5 text-[11px] text-slate-500 leading-relaxed line-through decoration-slate-600">
          <span aria-hidden className="shrink-0 mt-0.5">•</span>
          {suggestion.original}
        </p>
      </div>

      {/* Arrow divider */}
      <div className="flex items-center justify-center py-1" aria-hidden>
        <ArrowDown className="w-3 h-3 text-violet-500/60" />
      </div>

      {/* Improved */}
      <div className="px-3.5 pb-2.5 rounded-b-none">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-violet-400 mb-1.5">
          Improved
        </p>
        <p className="flex items-start gap-1.5 text-[11px] text-white leading-relaxed font-medium">
          <span aria-hidden className="shrink-0 mt-0.5 text-violet-400">•</span>
          {suggestion.improved}
        </p>
      </div>

      {/* Reasoning */}
      <div className="mx-3.5 mb-3 px-2.5 py-2 rounded-lg bg-slate-800/50 border border-white/[0.04]">
        <p className="text-[10px] text-slate-400 leading-relaxed italic">
          {suggestion.reasoning}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-3.5 pb-3">
        <button
          onClick={onAccept}
          className={clsx(
            "flex-1 inline-flex items-center justify-center gap-1.5",
            "px-3 py-1.5 rounded-lg",
            "bg-violet-600/80 hover:bg-violet-600 active:scale-[0.98]",
            "text-[10px] font-semibold text-white",
            "transition-all border border-violet-500/30",
          )}
        >
          <CheckCircle2 className="w-3 h-3" aria-hidden />
          Accept
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss suggestion"
          className={clsx(
            "inline-flex items-center justify-center",
            "px-3 py-1.5 rounded-lg",
            "bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98]",
            "text-[10px] font-semibold text-slate-400 hover:text-slate-200",
            "transition-all border border-white/[0.06]",
          )}
        >
          <X className="w-3 h-3" aria-hidden />
        </button>
      </div>
    </article>
  );
}
