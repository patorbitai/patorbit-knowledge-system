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

/* ── Evidence labels (shared by match dashboard + tailor review, §6) ────── */

import type { CareerProfile } from "@/types/career-profile";
import type {
  QualificationEvidenceKind,
  QualificationEvidenceRef,
} from "@/types/qualification-match";

const KIND_LABEL: Record<QualificationEvidenceKind, string> = {
  skill: "Skill",
  experience: "Experience",
  education: "Education",
  certification: "Certification",
  project: "Project",
  language: "Language",
};

const SOURCE_LABEL: Record<string, string> = {
  "resume-import": "from your resume",
  "user-input": "you entered this",
  "ai-extraction": "extracted by Patorbit",
  "linkedin-import": "from LinkedIn",
  "github-import": "from GitHub",
  "credential-check": "from a credential check",
};

/**
 * Turn provenance refs into the sentence a user can verify:
 * "Software Engineer — Acme — 2024 – 2026" instead of "resume:experience:exp_1x7".
 */
export function resolveEvidenceLabel(
  ev: QualificationEvidenceRef,
  profile: CareerProfile | null,
): string {
  if (profile) {
    switch (ev.itemKind) {
      case "experience": {
        const e = profile.experiences.find((x) => x.id === ev.itemId);
        if (e) {
          const end = e.current ? "Present" : e.endDate;
          const dates = [e.startDate, end].filter(Boolean).join(" – ");
          return [e.position, e.company, dates].filter(Boolean).join(" — ");
        }
        break;
      }
      case "education": {
        const e = profile.educations.find((x) => x.id === ev.itemId);
        if (e) return [e.degree, e.school, e.year].filter(Boolean).join(" — ");
        break;
      }
      case "skill": {
        const s = profile.skills.find((x) => x.id === ev.itemId);
        if (s) return s.category ? `${s.name} (${s.category})` : s.name;
        break;
      }
      case "project": {
        const p = profile.projects.find((x) => x.id === ev.itemId);
        if (p) return p.name;
        break;
      }
      case "certification": {
        const c = profile.certifications.find((x) => x.id === ev.itemId);
        if (c) return c.name;
        break;
      }
      case "language": {
        const l = profile.languages.find((x) => x.id === ev.itemId);
        if (l) return l.name;
        break;
      }
    }
  }
  return KIND_LABEL[ev.itemKind] ?? "Your profile";
}

/** Human label for where an evidence item came from ("you entered this"). */
export function evidenceSourceLabel(sourceType: string | undefined, fallback: string): string {
  return (sourceType && SOURCE_LABEL[sourceType]) || fallback;
}
