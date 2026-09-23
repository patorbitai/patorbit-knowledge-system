"use strict";

/**
 * Resume Planner — the deliberate layer between "the user's professional
 * information" and "what the renderer draws" (architecture §2).
 *
 * The planner NEVER mutates the Resume (master data stays untouched) and
 * NEVER invents content. It only selects, orders, emphasizes and budgets
 * material the user already has, using the deterministic job analysis
 * (QualificationMatch) when a job is in play.
 */

/* ── Sections ─────────────────────────────────────────────────────────── */

/** Sections the rendering system can draw. Kept in sync with the factory. */
export type SectionType =
  | "summary"
  | "experience"
  | "skills"
  | "projects"
  | "education"
  | "certs"
  | "achievements"
  | "languages"
  | "interests";

/** Role-aware layout strategy (§5). One engine, different priorities. */
export type RoleStrategyId =
  | "general"
  | "product"
  | "engineering"
  | "executive"
  | "creative";

export type SectionEmphasis = "highlight" | "normal" | "compact";

export type Density = "compact" | "balanced" | "spacious";

/* ── Content plan (§3) ────────────────────────────────────────────────── */

export interface PlannedSection {
  type: SectionType;
  /** Higher = the role strategy wants it more prominent (already reflected
   *  in array order; priority kept for UI explanations and quality checks). */
  priority: number;
  emphasis: SectionEmphasis;
  /** Plain-language reason for the placement. Job-aware when a match exists. */
  reason: string;
  /** Max entries rendered (undefined = render all). */
  maxItems?: number;
  /** Max bullets rendered per entry of this section (undefined = all). */
  maxBulletsPerItem?: number;
}

export interface SkillGroup {
  label: string;
  /** Skill names, highlighted-first within the group. */
  skills: string[];
}

export interface ResumeContentPlan {
  version: 1;
  roleStrategy: RoleStrategyId;
  /** Target role/company when previewing for a specific job (§22). */
  targetRole?: string;
  targetCompany?: string;
  /** True when the plan used a deterministic job analysis for emphasis. */
  jobAware: boolean;
  /** Ordered, renderable sections (empty sections already dropped). */
  sections: PlannedSection[];
  /** Skill names from the user's profile that the job supports. Profile-backed only. */
  highlightedSkills: string[];
  /** Experience entry ids that carry supported evidence for the target job. */
  highlightedExperienceIds: string[];
  relevantProjectIds: string[];
  relevantCertificationIds: string[];
  /** Section types omitted entirely (e.g. interests on a job-specific resume). */
  excludedSections: SectionType[];
  /** Sections rendered with reduced weight (e.g. education for seniors). */
  compressedSections: SectionType[];
  skillGroups: SkillGroup[];
  /** Hard budget for the skills list (§13 keyword-wall guard). */
  maxSkills: number;
  /** Significant normalized tokens used for relevance scoring (§4). Derived
   *  ONLY from non-MISSING match items — never from unsupported requirements. */
  emphasisTokens: string[];
  /** 1 or 2 — never "force one page" by shrinking type (§9). */
  pageTarget: 1 | 2;
  density: Density;
}

/* ── Layout plan (§4 of the target architecture) ──────────────────────── */

export interface ResumeLayoutPlan {
  version: 1;
  /** Final section order for the renderer. */
  sectionOrder: SectionType[];
  /** Density mapped onto the renderer's spacing scale. */
  spacingDensity: "compact" | "normal" | "spacious";
  pageTarget: 1 | 2;
  /** Per-section reasons for the "why this layout?" UI. */
  reasons: Record<SectionType, string>;
}

/* ── Quality check (§20) ──────────────────────────────────────────────── */

export type QualitySeverity = "positive" | "info" | "warn";

export interface QualityIssue {
  /** Stable id so the UI can dedupe/track. */
  id: string;
  severity: QualitySeverity;
  /** Actionable, plain-language. No arbitrary overall score, ever. */
  message: string;
  hint?: string;
}

export interface QualityInput {
  resume: {
    name: string;
    email: string;
    phone: string;
    summary: string;
    experience: Array<{ bulletPoints: string[] }>;
    skills: Array<{ name: string }>;
  };
  plan: ResumeContentPlan;
  /** Measured page count from the preview, when available. */
  pageCount?: number;
  /** Fraction (0–1) of the last page that is filled, when measured. */
  lastPageFill?: number;
  /** Resolved body font size in px, when known. */
  bodyFontSize?: number;
}
