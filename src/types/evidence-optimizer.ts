"use strict";

/**
 * M4 Evidence-Based Optimizer — Structured Types (Patorbit Phase 1).
 *
 * The optimizer receives:
 *  - Career Profile (M1) — candidate's verified professional evidence
 *  - Job Profile (M2) — structured job understanding
 *  - Qualification Match (M3) — PROVEN / RELATED / MISSING / COMMUNICATION_GAP
 *
 * And produces optimized resume content that is:
 *  - Traceable to existing candidate evidence
 *  - Validated against fabrication rules
 *  - Reviewable by the user before application
 */

import type { QualificationClassification } from "./qualification-match";

/* ── Single optimization change ─────────────────────────────────────────── */

export type OptimizerSection =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "general";

export type ChangeType =
  | "rewrite"
  | "reorder"
  | "emphasize"
  | "add-keyword"
  | "improve-impact"
  | "fix-communication-gap";

/**
 * A single optimized change proposed by the evidence-grounded optimizer.
 *
 * Every change MUST be traceable to existing candidate evidence.
 * The `qualification` field indicates which M3 classification this change
 * addresses, and `supportingEvidence` contains the evidence refs that
 * justify the change.
 */
export interface OptimizerChange {
  /** Unique ID for this change (client-generated). */
  id: string;
  /** Which resume section this change targets. */
  section: OptimizerSection;
  /** The original text (if modifying existing content). Empty for new additions. */
  original: string;
  /** The optimized text. Must be supported by candidate evidence. */
  optimized: string;
  /** Why this change was made. */
  reason: string;
  /** The M3 qualification classification this change addresses. */
  qualification: QualificationClassification;
  /** Evidence traceability — which career profile items support this change. */
  supportingEvidence: EvidenceRef[];
  /** Confidence that this change is supported by evidence (0-1). */
  confidence: number;
}

/**
 * Reference to a Career Profile item that supports an optimization change.
 */
export interface EvidenceRef {
  /** Career Profile item ID (e.g. skill ID, experience ID). */
  itemId: string;
  /** Type of career item (skill, experience, education, project, certification). */
  itemKind: "skill" | "experience" | "education" | "project" | "certification" | "language";
  /** Verbatim text from the career profile item that supports the change. */
  text: string;
  /** Original source type (resume-import, user-input, etc). */
  sourceType: string;
}

/* ── Complete optimization result ───────────────────────────────────────── */

export interface EvidenceOptimizerResult {
  /** The target role from the job description. */
  targetRole: string;
  /** Company name if available. */
  companyName: string;
  /** Overall match score before optimization (0-100). */
  preMatchScore: number;
  /** Overall match score after optimization (0-100). */
  postMatchScore: number;
  /** All proposed changes, grouped by section. */
  changes: OptimizerChange[];
  /** Summary of what the optimizer found. */
  summary: string;
  /** Items that are MISSING and cannot be optimized (honest gaps). */
  gaps: GapItem[];
  /** Timestamp of the optimization. */
  createdAt: string;
}

/**
 * A job requirement that the candidate genuinely lacks evidence for.
 * These are NOT fabricated — they represent honest gaps.
 */
export interface GapItem {
  /** The job requirement text. */
  requirement: string;
  /** Why it's missing (no evidence in career profile). */
  reason: string;
  /** The M3 classification (always "MISSING"). */
  classification: "MISSING";
  /** Optional suggestion for how the candidate could address this gap. */
  suggestion?: string;
}

/* ── Validation result ──────────────────────────────────────────────────── */

export interface ValidationResult {
  /** Whether all changes passed validation. */
  valid: boolean;
  /** Changes that introduced unsupported facts. */
  violations: ValidationViolation[];
  /** Total changes evaluated. */
  totalChanges: number;
  /** Changes that passed validation. */
  passedChanges: number;
}

export interface ValidationViolation {
  /** The change ID that violated fabrication rules. */
  changeId: string;
  /** What was detected as unsupported. */
  type: "unsupported-employer" | "unsupported-skill" | "unsupported-date" | "unsupported-metric" | "unsupported-education" | "unsupported-title" | "unsupported-certification";
  /** The unsupported text. */
  text: string;
  /** Description of the violation. */
  description: string;
}
