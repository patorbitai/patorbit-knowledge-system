"use strict";

/**
 * Role-aware resume structure (§5).
 *
 * One rendering system, five layout strategies. Each strategy is an ordered
 * priority list of sections plus compaction/drop rules. The strategy never
 * invents content — it decides what the user's existing content is worth
 * emphasizing for a kind of role.
 */

import type { RoleStrategyId, SectionType } from "./types";

export interface RoleStrategy {
  id: RoleStrategyId;
  label: string;
  /** Section types from most to least prominent. */
  order: SectionType[];
  /** Sections reduced in weight when the person is beyond early career. */
  compressWhenExperienced: SectionType[];
  /** Sections dropped for this strategy outright (still in the profile). */
  drop: SectionType[];
  /** Job-title keywords used to detect the strategy from a target role. */
  titleHints: string[];
  /** Template family archetypes that pair with this structure (§6). */
  recommendedFamilies: string[];
}

export const ROLE_STRATEGIES: Record<RoleStrategyId, RoleStrategy> = {
  general: {
    id: "general",
    label: "General / Corporate",
    order: [
      "summary",
      "experience",
      "skills",
      "education",
      "projects",
      "certs",
      "achievements",
      "languages",
      "interests",
    ],
    compressWhenExperienced: ["education", "interests"],
    drop: [],
    titleHints: [],
    recommendedFamilies: ["classic-ats", "modern-professional"],
  },
  product: {
    id: "product",
    label: "Product / Business",
    // Summary → Experience → Impact → Relevant skills → Education → Projects
    order: [
      "summary",
      "experience",
      "achievements",
      "skills",
      "projects",
      "education",
      "certs",
      "languages",
      "interests",
    ],
    compressWhenExperienced: ["education"],
    drop: [],
    titleHints: [
      "product manager",
      "product owner",
      "program manager",
      "product lead",
      "product director",
      "business manager",
      "operations manager",
      "strategy",
    ],
    recommendedFamilies: ["modern-professional", "classic-ats"],
  },
  engineering: {
    id: "engineering",
    label: "Engineering / Technical",
    // Summary → Technical skills → Experience → Projects → Education → Certs
    order: [
      "summary",
      "skills",
      "experience",
      "projects",
      "education",
      "certs",
      "achievements",
      "languages",
      "interests",
    ],
    compressWhenExperienced: ["education"],
    drop: [],
    titleHints: [
      "engineer",
      "engineering",
      "developer",
      "software",
      "backend",
      "frontend",
      "full stack",
      "fullstack",
      "devops",
      "sre",
      "data scientist",
      "data engineer",
      "machine learning",
      "ml ",
      "platform",
      "infrastructure",
      "qa",
      "test automation",
      "mobile",
    ],
    recommendedFamilies: ["technical", "classic-ats"],
  },
  executive: {
    id: "executive",
    label: "Executive / Senior",
    // Executive summary → Core competencies → Leadership/experience →
    // Selected achievements → Education
    order: [
      "summary",
      "skills",
      "experience",
      "achievements",
      "projects",
      "education",
      "certs",
      "languages",
      "interests",
    ],
    compressWhenExperienced: ["education"],
    drop: ["interests"],
    titleHints: [
      "chief",
      "ceo",
      "cto",
      "cfo",
      "coo",
      "cmo",
      "vp ",
      "vice president",
      "head of",
      "director",
      "managing director",
      "general manager",
      "founder",
      "partner",
      "president",
    ],
    recommendedFamilies: ["executive", "modern-professional"],
  },
  creative: {
    id: "creative",
    label: "Creative",
    // Summary → Experience → Selected work/projects → Skills → Portfolio links
    order: [
      "summary",
      "experience",
      "projects",
      "achievements",
      "skills",
      "education",
      "languages",
      "interests",
    ],
    compressWhenExperienced: ["education"],
    drop: [],
    titleHints: [
      "designer",
      "design",
      "creative",
      "marketing",
      "brand",
      "content",
      "copywriter",
      "ui/ux",
      "ux ",
      "ui ",
      "art director",
      "illustrator",
      "motion",
      "visual",
    ],
    recommendedFamilies: ["creative", "modern-professional"],
  },
};

/**
 * Detect the role strategy from a target job title first, then from the
 * user's own headline. First match wins against a fixed keyword list —
 * deterministic, no AI. Defaults to "general".
 */
export function detectRoleStrategy(
  jobTitle?: string,
  profileTitle?: string,
): RoleStrategyId {
  const candidates = [jobTitle ?? "", profileTitle ?? ""];
  // Longest hints first so "product manager" beats a stray "product".
  const all = (Object.keys(ROLE_STRATEGIES) as RoleStrategyId[]).flatMap(
    (id) =>
      ROLE_STRATEGIES[id].titleHints.map((hint) => ({
        id,
        // No trim: hints like "ml " and "vp " rely on the trailing space as
        // a word boundary ("html" must not match "ml").
        hint: hint.toLowerCase(),
      })),
  );
  all.sort((a, b) => b.hint.length - a.hint.length);

  for (const raw of candidates) {
    const text = raw.toLowerCase();
    if (!text.trim()) continue;
    for (const { id, hint } of all) {
      if (text.includes(hint)) {
        return id;
      }
    }
  }
  return "general";
}
