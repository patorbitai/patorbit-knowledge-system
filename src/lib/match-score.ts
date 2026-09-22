"use strict";

/**
 * Match scoring (§7) — transparent, category-aware, deterministic.
 *
 * Everything here derives from the M3 QualificationMatch output. No black
 * box: the methodology string is exactly what the dashboard shows users, and
 * categories that have zero items report `null` so the UI can omit them
 * instead of faking precision.
 */

import type { JobProfile } from "@/types/job-profile";
import type {
  QualificationMatch,
  QualificationSourceGroup,
} from "@/types/qualification-match";

/** "Supported" = proven + related + communicationGap (evidence exists in the profile). */
export function countSupported(match: QualificationMatch): number {
  const s = match.summary;
  return s.proven + s.related + s.communicationGap;
}

/** Overall match percent, rounded. 0 when the JD produced no classifiable items. */
export function computeOverallMatch(match: QualificationMatch): number {
  const s = match.summary;
  if (s.total === 0) return 0;
  return Math.round((countSupported(match) / s.total) * 100);
}

export interface MatchCategoryScore {
  key: QualificationSourceGroup;
  label: string;
  supported: number;
  total: number;
  /** null when nothing in this category could be calculated — UI omits it (§7). */
  percent: number | null;
}

const CATEGORY_LABELS: Record<QualificationSourceGroup, string> = {
  skill: "Skills",
  requirement: "Experience & requirements",
  responsibility: "Responsibilities",
  qualification: "Education & credentials",
};

const CATEGORY_ORDER: QualificationSourceGroup[] = [
  "skill",
  "requirement",
  "responsibility",
  "qualification",
];

/**
 * Per-category scores. A category with no items returns percent: null —
 * never 0% or 100% for an empty set (that would be fake precision).
 */
export function computeMatchCategories(
  match: QualificationMatch,
): MatchCategoryScore[] {
  return CATEGORY_ORDER.map((key) => {
    const items = match.items.filter((i) => i.sourceGroup === key);
    const supported = items.filter(
      (i) => i.classification !== "MISSING",
    ).length;
    return {
      key,
      label: CATEGORY_LABELS[key],
      supported,
      total: items.length,
      percent: items.length > 0 ? Math.round((supported / items.length) * 100) : null,
    };
  }).filter((c) => c.total > 0);
}

/**
 * Plain-language methodology shown under "How is this calculated?" (§7).
 * Keep in sync with computeOverallMatch.
 */
export const MATCH_METHODOLOGY =
  "Each requirement the job states is compared against your professional " +
  "profile using a fixed rule engine — no AI guessing. A requirement counts " +
  "as supported when your profile holds direct evidence for it (strong or " +
  "partial) or when the evidence is present in your experience text but not " +
  "listed as a discrete skill. Overall match = supported requirements ÷ all " +
  "classifiable requirements. Categories with nothing to calculate are hidden " +
  "rather than shown as 0%. \"No evidence\" means we could not find support " +
  "in your profile — it is not a claim that you lack the skill.";

/**
 * Source refs (jd:line:N / jd:skill:N) that the Job Profile flagged as
 * preferred/nice-to-have (§4), so the dashboard can badge them without
 * re-parsing the JD.
 */
export function preferredSourceRefs(jobProfile: JobProfile | null): Set<string> {
  const refs = new Set<string>();
  if (!jobProfile) return refs;
  // Only the item's OWN verbatim ref is safe: requirements, responsibilities
  // and qualifications share the jd:line:N space, so array indices would
  // mislabel other kinds' items.
  for (const r of jobProfile.requirements) {
    if (r.preferred) refs.add(r.source.sourceRef);
  }
  for (const q of jobProfile.qualifications) {
    if (q.preferred) refs.add(q.source.sourceRef);
  }
  for (const s of jobProfile.skills) {
    if (s.preferred) refs.add(s.source.sourceRef);
  }
  return refs;
}
