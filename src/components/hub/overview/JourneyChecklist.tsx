"use client";

/**
 * First-session activation checklist (§2, §13, §14).
 *
 * Answers "What should I do next?" with a visible six-step progression and
 * a progress bar. Derived entirely from existing product state
 * (src/lib/journey.ts) — no extra persistence, no gamification.
 */

import Link from "next/link";
import { clsx } from "clsx";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  UserRound,
  Briefcase,
  ClipboardPaste,
  Target,
  Sparkles,
  Download,
  ListChecks,
} from "lucide-react";
import { ImportButton } from "@/components/resume-builder/ImportButton";
import { deriveJourney, type JourneyInput } from "@/lib/journey";

const STEP_ICONS = {
  profile: UserRound,
  experience: Briefcase,
  job: ClipboardPaste,
  match: Target,
  tailor: Sparkles,
  export: Download,
} as const;

export function JourneyChecklist({ input }: { input: JourneyInput }) {
  const journey = deriveJourney(input);

  if (journey.complete) {
    return (
      <section aria-labelledby="journey-heading" className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.05] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shrink-0">
            <ListChecks className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="journey-heading" className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              Journey complete — you&apos;re ready to apply
            </h2>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              Profile built, resume tailored, exported. Repeat steps 3–6 for every new role.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const current = journey.current;

  return (
    <section
      aria-labelledby="journey-heading"
      className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] overflow-hidden"
    >
      {/* Header + progress */}
      <div className="px-5 pt-5 pb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="journey-heading" className="text-sm font-bold text-gray-900 dark:text-white">
              Get started with Patorbit
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {journey.completedCount} of {journey.total} steps done — each one takes a couple of minutes.
            </p>
          </div>
          <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 tabular-nums" aria-label={`${journey.percent}% complete`}>
            {journey.percent}%
          </span>
        </div>
        <div
          className="h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden"
          role="progressbar"
          aria-valuenow={journey.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${journey.percent}%` }}
          />
        </div>
      </div>

      {/* Next action callout — the one thing to do now */}
      {current && (
        <div className="mx-5 mb-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
              Next: step {journey.steps.indexOf(current) + 1}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{current.title}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{current.description}</p>
          </div>
          {/* Step 2's action opens the file picker right here — no dead ends. */}
          {current.id === "experience" ? (
            <ImportButton variant="card" label="Upload resume" className="shrink-0" />
          ) : (
            <Link
              href={current.actionHref}
              className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-4 py-2 text-xs font-semibold text-white transition-all"
            >
              {current.actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Full progression */}
      <ol className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {journey.steps.map((step, i) => {
          const Icon = STEP_ICONS[step.id];
          const isCurrent = current?.id === step.id;
          return (
            <li key={step.id}>
              <Link
                href={step.actionHref}
                className={clsx(
                  "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-all",
                  step.complete
                    ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.05] hover:border-emerald-300"
                    : isCurrent
                    ? "border-cyan-300 dark:border-cyan-500/30 bg-cyan-50/60 dark:bg-cyan-500/[0.06] hover:border-cyan-400"
                    : "border-gray-100 dark:border-white/[0.05] bg-gray-50/60 dark:bg-white/[0.01] opacity-80 hover:opacity-100",
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {step.complete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className={clsx("h-4 w-4", isCurrent ? "text-cyan-500" : "text-gray-300 dark:text-slate-600")} />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tabular-nums">
                      {i + 1}.
                    </span>
                    <Icon className="h-3 w-3 text-gray-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                    <span
                      className={clsx(
                        "text-xs font-semibold truncate",
                        step.complete
                          ? "text-emerald-700 dark:text-emerald-300"
                          : isCurrent
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-slate-400",
                      )}
                    >
                      {step.title}
                    </span>
                  </span>
                  <span className="block text-[11px] text-gray-400 dark:text-slate-500 leading-snug mt-0.5 line-clamp-2">
                    {step.complete ? "Done — revisit any time." : step.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
