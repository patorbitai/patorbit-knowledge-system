"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { clsx } from "clsx";
import type { SupportBadge } from "@/lib/provenance";

export interface WhyThisChangeProps {
  /** Why Patorbit recommends this — one or two concise sentences. */
  why: string;
  /** The job requirement that triggered the recommendation. */
  requirement?: string;
  /** The user's supporting evidence ("Your Software Engineer experience, 2024–2026"). */
  evidence?: string[];
  /** Whether the recommendation is factual or inferred (§8, §10). */
  support?: SupportBadge;
  /** Label for the toggle, default "Why?". */
  toggleLabel?: string;
  /** Render inside the dark resume-builder surfaces (default) or light ones. */
  tone?: "dark" | "light";
  className?: string;
}

/**
 * The core AI-transparency interaction (§7, §10):
 *
 *   Why?  →  job requirement · your supporting evidence · reason ·
 *            factual-or-inferred badge
 *
 * Used by every surface that shows an AI-generated recommendation.
 */
export function WhyThisChange({
  why,
  requirement,
  evidence,
  support,
  toggleLabel = "Why?",
  tone = "dark",
  className,
}: WhyThisChangeProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={clsx(
          "inline-flex items-center gap-1 text-[11px] font-semibold transition-colors",
          tone === "dark"
            ? "text-cyan-400 hover:text-cyan-300"
            : "text-cyan-600 dark:text-cyan-400 hover:underline",
        )}
      >
        <HelpCircle className="w-3 h-3" />
        {toggleLabel}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div
          role="note"
          className={clsx(
            "mt-1.5 space-y-1.5 rounded-lg border px-3 py-2.5 text-[11px] leading-relaxed",
            tone === "dark"
              ? "border-white/[0.08] bg-white/[0.03] text-slate-300"
              : "border-gray-200 bg-gray-50 text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-slate-300",
          )}
        >
          {requirement && (
            <p>
              <span className={clsx("font-semibold", tone === "dark" ? "text-slate-200" : "text-gray-800 dark:text-white")}>
                Job requirement:
              </span>{" "}
              {requirement}
            </p>
          )}
          {evidence && evidence.length > 0 && (
            <p>
              <span className={clsx("font-semibold", tone === "dark" ? "text-slate-200" : "text-gray-800 dark:text-white")}>
                Your evidence:
              </span>{" "}
              {evidence.join(" · ")}
            </p>
          )}
          <p>
            <span className={clsx("font-semibold", tone === "dark" ? "text-slate-200" : "text-gray-800 dark:text-white")}>
              Why:
            </span>{" "}
            {why}
          </p>
          {support && (
            <p className="flex flex-wrap items-center gap-1.5">
              <span
                className={clsx(
                  "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                  support.chipClass,
                )}
              >
                {support.label}
              </span>
              <span className={clsx(tone === "dark" ? "text-slate-400" : "text-gray-500 dark:text-slate-400")}>
                {support.description}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
