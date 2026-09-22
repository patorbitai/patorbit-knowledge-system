/**
 * Provenance in user language (§5, §8)
 *
 * Patorbit's underlying model (claims, evidence, confidence scores, profile
 * provenance) stays intact — this module translates it into language a
 * first-time user understands:
 *
 *   0.87 confidence        →  "High"
 *   resume-derived fact    →  "Supported"
 *   AI-extracted/derived   →  "Inferred"
 *   user-typed value       →  "User-provided"
 *   no backing evidence    →  "Missing"
 *
 * The invariant from §8: inferred or missing information is never presented
 * as fact. Every label states what backs the item.
 */

export type ConfidenceWord = "High" | "Medium" | "Low";
export type ConfidenceTone = "high" | "medium" | "low";

/** Map a 0–1 confidence score to a word. Pure — unit tested. */
export function confidenceWord(score: number): ConfidenceWord {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

export function confidenceTone(score: number): ConfidenceTone {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

export const CONFIDENCE_TONE_CLASS: Record<ConfidenceTone, string> = {
  high: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-rose-600 dark:text-rose-400",
};

/* ── Support levels (§8) ──────────────────────────────────────────────────── */

export type SupportLevel = "user-provided" | "supported" | "inferred" | "missing";

export interface SupportBadge {
  level: SupportLevel;
  /** Short label for chips/badges. */
  label: string;
  /** One-line explanation for the "Why?" expansion. */
  description: string;
  /** Tailwind color classes for the chip. */
  chipClass: string;
}

const SUPPORT_BADGES: Record<SupportLevel, SupportBadge> = {
  "user-provided": {
    level: "user-provided",
    label: "You entered this",
    description: "This information was entered by you directly, so Patorbit treats it exactly as you wrote it.",
    chipClass: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20",
  },
  supported: {
    level: "supported",
    label: "Supported",
    description: "Backed directly by something in your profile — a resume entry, credential, or attached evidence.",
    chipClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
  },
  inferred: {
    level: "inferred",
    label: "Inferred",
    description:
      "Reasoned from information already in your profile — not stated verbatim. Review it before relying on it.",
    chipClass: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20",
  },
  missing: {
    level: "missing",
    label: "Not supported yet",
    description: "Nothing in your profile supports this. Patorbit will not present it as fact.",
    chipClass: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20",
  },
};

export function getSupportBadge(level: SupportLevel): SupportBadge {
  return SUPPORT_BADGES[level];
}

/**
 * Classify how well an item is supported. Pure — unit tested.
 *
 * Order matters: user-entered data is labelled as such even when it also has
 * evidence, and derived items are always "inferred" — never "supported".
 */
export function classifySupport(input: {
  hasEvidence: boolean;
  derived?: boolean;
  sourceType?: string;
}): SupportBadge {
  if (input.sourceType === "user-input") return getSupportBadge("user-provided");
  if (!input.hasEvidence) return getSupportBadge("missing");
  if (input.derived) return getSupportBadge("inferred");
  return getSupportBadge("supported");
}
