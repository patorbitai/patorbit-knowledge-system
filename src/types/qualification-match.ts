"use strict";

/**
 * Qualification Match — M3 (Patorbit Phase 1).
 *
 * Deterministic classification of every candidate-evidence item (Career
 * Profile, M1) against the job's requirements/skills/qualifications (Job
 * Profile, M2). No AI, no guessing:
 *
 * Classification semantics:
 *  - `PROVEN`             — candidate evidence directly and literally satisfies the JD item.
 *  - `RELATED`            — candidate evidence is adjacent to but not an exact match.
 *  - `COMMUNICATION_GAP`  — the evidence exists in the candidate's data but is not surfaced
 *                           as a discrete skill/practice (i.e. it is under-represented).
 *  - `MISSING`            — no candidate evidence exists for this JD item.
 *
 * Invariants enforced by construction in the matcher:
 *  - Never invent candidate facts. Every classification is derived by rule from
 *    the verbatim JD item and the candidate's Career Profile items.
 *  - Every result carries provenance: the exact JD item (JobSource) plus the
 *    specific Career Profile items (`evidence[]`) that produced it, each with
 *    its own ProfileSource. A `MISSING` result carries an empty evidence list.
 *  - The matcher is a pure function: same inputs ⇒ deep-equal output.
 */

import type { ProfileSource } from "./career-profile";
import type { JobSource } from "./job-profile";

/* ── Classification ──────────────────────────────────────────────────────── */

export type QualificationClassification =
  | "PROVEN"
  | "RELATED"
  | "COMMUNICATION_GAP"
  | "MISSING";

/** Which Job Profile array produced an item. */
export type QualificationSourceGroup = "requirement" | "skill" | "qualification";

/* ── Evidence ────────────────────────────────────────────────────────────── */

/** The candidate Career item type that produced a match. */
export type QualificationEvidenceKind =
  | "skill"
  | "experience"
  | "education"
  | "certification"
  | "project"
  | "language";

export interface QualificationEvidenceRef {
  /** Career Profile item id, e.g. `cp_skill_...`. */
  itemId: string;
  /** Which Career Profile collection the item came from. */
  itemKind: QualificationEvidenceKind;
  /** Verbatim candidate text that matched (skill name, corpus sentence, ...). */
  text: string;
  /** The item's own provenance, pointing at the candidate source. */
  source: ProfileSource;
}

/* ── Result item ─────────────────────────────────────────────────────────── */

export interface QualificationMatchItem {
  id: string;
  /** The Job Profile collection this item came from. */
  sourceGroup: QualificationSourceGroup;
  classification: QualificationClassification;
  /** Verbatim JD text that was evaluated. */
  requirement: string;
  /** Provenance of the JD item. */
  jobSource: JobSource;
  /** Human-readable rule that produced this classification. */
  reason: string;
  /** Candidate evidence supporting the result. Empty ⇒ no candidate evidence. */
  evidence: QualificationEvidenceRef[];
}

/* ── Summary ─────────────────────────────────────────────────────────────── */

export interface QualificationMatchSummary {
  total: number;
  proven: number;
  related: number;
  communicationGap: number;
  missing: number;
}

/* ── The match ───────────────────────────────────────────────────────────── */

export interface QualificationMatch {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  careerProfileId: string;
  jobProfileId: string;
  items: QualificationMatchItem[];
  summary: QualificationMatchSummary;
}