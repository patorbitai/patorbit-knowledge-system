"use strict";

/**
 * Career Profile — M1 Foundation (Patorbit Phase 1).
 *
 * The Career Profile is the long-term canonical source of truth for a
 * candidate's professional evidence. It is DERIVED state: it is rebuilt
 * deterministically from the canonical Resume (the editable source) plus any
 * available Claims/Evidence. The Resume remains the editable source of truth.
 *
 * Invariants enforced by construction in the builder:
 *  - Never invent candidate information. Anything not present in the source
 *    data is absent from the profile.
 *  - Every item preserves provenance (`source`) pointing at the exact source
 *    item, plus optional links to existing Claim/Evidence ids (reused, never
 *    duplicated).
 *  - Provenance does NOT equal verification. Everything the resume states is
 *    "candidate-stated"; nothing is automatically "independently-verified".
 *  - Anything derived from free text (leadership signals, measurable
 *    outcomes, industry derivations, technology splits, bullet splits) is
 *    explicitly marked `derived` with a `derivation` record preserving the
 *    exact source text.
 */

import type { CareerStage, Claim, Evidence } from "./resume";

/* ── Provenance ─────────────────────────────────────────────────────────── */

/** Where an item's data entered the system. */
export type ProfileSourceType =
  | "resume-import"
  | "user-input"
  | "ai-extraction"
  | "linkedin-import"
  | "github-import"
  | "credential-check";

export interface ProfileSource {
  sourceType: ProfileSourceType;
  /** Stable reference into the source data, e.g. "resume:experience:exp_1x7". */
  sourceRef: string;
  /** ISO timestamp when this item entered the profile. */
  capturedAt: string;
  /** Optional human-readable note about the source. */
  note?: string;
  /** Existing Claim ids that support this item (reused, not duplicated). */
  claimIds: string[];
  /** Existing Evidence ids that support this item (reused, not duplicated). */
  evidenceIds: string[];
}

/* ── Verification (NOT provenance) ──────────────────────────────────────── */

export type VerificationState = "candidate-stated" | "independently-verified";

export interface ProfileVerification {
  state: VerificationState;
  /** Present only when state === "independently-verified". */
  verifiedBy?: string;
  verifiedAt?: string;
}

/* ── Derived data ───────────────────────────────────────────────────────── */

export type DerivationKind =
  | "leadership"
  | "outcome"
  | "industry"
  | "technology"
  | "achievement";

export interface Derivation {
  kind: DerivationKind;
  /** Exact source text this item was derived from. */
  sourceText: string;
  /** Human-readable rule that produced this item. */
  method: string;
}

/* ── Base item ──────────────────────────────────────────────────────────── */

export interface ProfileItem {
  id: string;
  source: ProfileSource;
  verification: ProfileVerification;
  /** True when this item was derived from free text (never invented). */
  derived: boolean;
  derivation?: Derivation;
}

/* ── Domain items ───────────────────────────────────────────────────────── */

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

/** A single canonical skill. Technologies are skills with category "Technology". */
export interface CareerSkill extends ProfileItem {
  name: string;
  category: string;
  proficiency?: SkillLevel;
  years?: string;
}

export interface CareerExperience extends ProfileItem {
  company: string;
  position: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current: boolean;
  industry?: string;
  /** Prose description of the role. */
  summary?: string;
  /** Achievement bullets, in source order. */
  achievements: string[];
}

export interface CareerEducation extends ProfileItem {
  school: string;
  degree: string;
  field?: string;
  year?: string;
  gpa?: string;
  honors?: string;
}

export interface CareerProject extends ProfileItem {
  name: string;
  description?: string;
  role?: string;
  link?: string;
  dates?: { start?: string; end?: string };
}

export interface CareerCertification extends ProfileItem {
  name: string;
  issuer?: string;
  date?: string;
  link?: string;
}

export interface CareerLanguage extends ProfileItem {
  name: string;
  proficiency?: string;
}

/** Derived from experience.industry values. Contexts lists the source refs. */
export interface CareerIndustry extends ProfileItem {
  name: string;
  /** sourceRefs of the experiences that stated this industry. */
  contexts: string[];
}

/** Derived from leadership signals in experience text. */
export interface CareerLeadership extends ProfileItem {
  /** The exact source text that carried the leadership signal. */
  context: string;
  role?: string;
  teamSize?: string;
}

/** Derived measurable outcome, extracted only from metrics present in text. */
export interface CareerOutcome extends ProfileItem {
  /** The exact source line containing the metric. */
  description: string;
  metric?: string;
  unit?: string;
}

/* ── The profile ────────────────────────────────────────────────────────── */

export interface CareerProfileIdentity {
  name: string;
  title?: string;
  summary?: string;
  careerStage?: CareerStage;
  social: {
    linkedin: string;
    github: string;
    website: string;
    twitter: string;
    portfolio: string;
    stackoverflow: string;
  };
  source: ProfileSource;
  verification: ProfileVerification;
}

export interface CareerProfile {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  identity: CareerProfileIdentity;
  experiences: CareerExperience[];
  educations: CareerEducation[];
  projects: CareerProject[];
  /** Single canonical skill collection; technologies are category "Technology". */
  skills: CareerSkill[];
  certifications: CareerCertification[];
  languages: CareerLanguage[];
  industries: CareerIndustry[];
  leadership: CareerLeadership[];
  outcomes: CareerOutcome[];
}

/** Convenience type used by tests and future consumers. */
export type { Claim, Evidence };
