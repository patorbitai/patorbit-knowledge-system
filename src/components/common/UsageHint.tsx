"use client";

/**
 * UsageHint (M6) — small truthful quota indicator next to a metered AI action.
 *
 * Shows "N of M" for the counter that action actually charges:
 *   ai_generations → AI generation actions
 *   job_analysis   → job-analysis actions
 *   ai_tailoring   → tailoring actions
 *
 * Hides itself when:
 *   - the user is unauthenticated or usage failed to load (no data), or
 *   - the limit is unlimited (-1), or
 *   - the requested counter is missing from the payload.
 *
 * Reads exclusively from FeatureAccessProvider's usage counters (which are
 * refreshed after every metered AI call), so the number is never stale state
 * held by an individual button.
 */

import { useFeatureAccess } from "@/components/providers/FeatureAccessProvider";

export type UsageFeatureKey = "ai_generations" | "job_analysis" | "ai_tailoring";

const FEATURE_LABELS: Record<UsageFeatureKey, string> = {
  ai_generations: "AI generation actions",
  job_analysis: "job-analysis actions",
  ai_tailoring: "tailoring actions",
};

interface UsageHintProps {
  feature: UsageFeatureKey;
  /** Optional extra class for layout (inline next to a button, etc.). */
  className?: string;
}

export function UsageHint({ feature, className }: UsageHintProps) {
  const { usage } = useFeatureAccess();
  const counter = usage?.[feature];

  // Hidden when unavailable, unauthenticated, or unlimited.
  if (!counter || counter.limit === -1) return null;

  const exhausted = counter.current >= counter.limit;

  return (
    <span
      data-testid={`usage-hint-${feature}`}
      className={
        className ??
        "text-[10px] font-medium text-gray-400 dark:text-slate-500 whitespace-nowrap"
      }
      title={`${counter.current} of ${counter.limit} ${FEATURE_LABELS[feature]} used this month`}
    >
      <span className={exhausted ? "text-red-400 dark:text-red-500" : undefined}>
        {counter.current}
      </span>
      {" / "}
      {counter.limit} {FEATURE_LABELS[feature]}
      {exhausted ? " — limit reached" : ""}
    </span>
  );
}
