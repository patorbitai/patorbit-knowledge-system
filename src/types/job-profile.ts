"use strict";

/**
 * Job Profile — M2 Job Understanding (Patorbit Phase 1).
 *
 * The Job Profile is a structured, deterministic understanding of a job
 * description. It is DERIVED state: it is rebuilt from the raw job description
 * text alone. No matching happens here — M3 consumes this profile.
 *
 * Invariants enforced by construction in the builder:
 *  - Never invent job facts. Every item is either a faithful copy of text
 *    literally present in the JD or a rule-based extraction whose exact source
 *    text is preserved in `JobSource.sourceText`.
 *  - Every item carries provenance (`source`) pointing at the exact source
 *    line of the JD, with the verbatim text.
 *  - Implicit competencies are the ONLY derived items: behaviors implied by
 *    context (e.g. "cross-functional teams" → "Collaboration"). They are
 *    always marked `derived: true` with a `derivation` record.
 */

/* ── Provenance ─────────────────────────────────────────────────────────── */

export interface JobSource {
  /** Stable reference into the JD, e.g. "jd:line:3" or "jd:section:skills". */
  sourceRef: string;
  /** Verbatim text this item was extracted from (never paraphrased). */
  sourceText: string;
  /** Human-readable rule that produced this item. */
  method: string;
}

/* ── Derived marker ─────────────────────────────────────────────────────── */

export type JobDerivationKind = "implicit-competency";

export interface JobDerivation {
  kind: JobDerivationKind;
  /** Exact source text this item was derived from. */
  sourceText: string;
  /** Human-readable rule that produced this item. */
  method: string;
}

/* ── Items ──────────────────────────────────────────────────────────────── */

export interface JobRequirement {
  text: string;
  source: JobSource;
}

export interface JobResponsibility {
  text: string;
  source: JobSource;
}

export interface JobSkill {
  name: string;
  category?: "technology" | "tool" | "domain" | "general";
  source: JobSource;
}

export type JobSeniorityLevel =
  | "Junior"
  | "Mid"
  | "Senior"
  | "Lead"
  | "Principal"
  | "Director";

export interface JobSeniority {
  level?: JobSeniorityLevel;
  /** "5+" or "5" when the JD states a year count. */
  years?: string;
  source: JobSource;
}

export interface JobDomain {
  name: string;
  source: JobSource;
}

export interface JobQualification {
  text: string;
  source: JobSource;
}

export interface JobImplicitCompetency {
  /** Canonical competency name (from the rule lexicon). */
  name: string;
  /** Verbatim JD text that implied this competency. */
  context: string;
  source: JobSource;
  derived: true;
  derivation: JobDerivation;
}

/* ── The profile ────────────────────────────────────────────────────────── */

export interface JobProfile {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  /** Character count of the raw JD text. */
  sourceLength: number;
  /** First heading-like line of the JD, when present. */
  title?: string;
  requirements: JobRequirement[];
  responsibilities: JobResponsibility[];
  skills: JobSkill[];
  seniority: JobSeniority[];
  domain: JobDomain[];
  qualifications: JobQualification[];
  implicitCompetencies: JobImplicitCompetency[];
}
