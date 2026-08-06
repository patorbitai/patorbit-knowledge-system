"use strict";

import type {
  CareerJourney,
  JourneyChapter,
  JourneyStatement,
  JourneyProvenance,
  JourneySource,
  JourneyConfig,
  JourneyStatus,
} from "@/types/careerjourney";

/** Valid lifecycle states for a Journey. */
const JOURNEY_STATUSES: ReadonlySet<JourneyStatus> = new Set<JourneyStatus>([
  "draft",
  "reviewing",
  "approved",
  "published",
]);

/**
 * Career Journey — Validation.
 *
 * Pure validation functions for the Career Journey domain model (Step 1B).
 * They return structured results; they never throw for ordinary validation
 * failures. Every function enforces the ADR-006 invariants:
 *
 *   identityId required
 *   version required
 *   journey contains chapters
 *   chapter sequence strictly increasing
 *   unique chapter ids
 *   unique statement ids
 *   statement must reference at least one claim
 *   statement must reference supporting evidence
 *   provenance required
 *   confidence within configured bounds
 *
 * IDs are treated as immutable identity — they may not change after creation.
 * The absence of an `id` field anywhere in the domain is itself an invariant
 * violation (stable identity is a prerequisite for versioning, provenance,
 * diffing, and traceability).
 */

/** A single validation finding. `path` locates the offending field. */
export interface JourneyValidationIssue {
  /** Dotted path to the offending value, e.g. "chapters[0].statements[2]". */
  path: string;
  /** Human-readable description of the problem. */
  message: string;
}

/** Structured result — empty `issues` means valid. */
export interface JourneyValidationResult {
  valid: boolean;
  issues: JourneyValidationIssue[];
}

/** Default configuration when none is provided. */
export const DEFAULT_JOURNEY_CONFIG: JourneyConfig = {
  maxChapters: 50,
  minStatementConfidence: 0,
  allowRegeneration: true,
};

function ok(): JourneyValidationResult {
  return { valid: true, issues: [] };
}

function fail(...issues: JourneyValidationIssue[]): JourneyValidationResult {
  return { valid: false, issues };
}

function push(result: JourneyValidationResult, issue: JourneyValidationIssue): void {
  result.issues.push(issue);
  result.valid = false;
}

function isValidId(id: unknown): id is string {
  return typeof id === "string" && id.trim().length > 0;
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Validate an individual JourneyStatement. */
export function validateStatement(
  statement: JourneyStatement | null | undefined,
  config: JourneyConfig = DEFAULT_JOURNEY_CONFIG,
): JourneyValidationResult {
  if (statement === null || statement === undefined) {
    return fail({ path: "statement", message: "Statement is required." });
  }

  const result: JourneyValidationResult = { valid: true, issues: [] };

  // Stable identity is a prerequisite for everything else.
  if (!isValidId(statement.id)) {
    push(result, { path: "statement.id", message: "Statement id is required and must be a non-empty string." });
  }

  if (typeof statement.statement !== "string" || statement.statement.trim().length === 0) {
    push(result, { path: "statement.statement", message: "Statement text is required." });
  }

  // Confidence bounds.
  if (!isFiniteNumber(statement.confidence)) {
    push(result, { path: "statement.confidence", message: "Confidence must be a finite number." });
  } else if (statement.confidence < 0 || statement.confidence > 1) {
    push(result, { path: "statement.confidence", message: "Confidence must be within [0, 1]." });
  } else if (statement.confidence < config.minStatementConfidence) {
    push(result, {
      path: "statement.confidence",
      message: `Confidence ${statement.confidence} is below the minimum ${config.minStatementConfidence}.`,
    });
  }

  // Statement must reference at least one claim.
  if (!Array.isArray(statement.claims) || statement.claims.length === 0) {
    push(result, { path: "statement.claims", message: "Statement must reference at least one claim." });
  }

  // Statement must reference supporting evidence.
  if (!Array.isArray(statement.evidence) || statement.evidence.length === 0) {
    push(result, { path: "statement.evidence", message: "Statement must reference supporting evidence." });
  }

  return result;
}

/** Validate a single JourneyChapter. */
export function validateChapter(
  chapter: JourneyChapter | null | undefined,
  config: JourneyConfig = DEFAULT_JOURNEY_CONFIG,
): JourneyValidationResult {
  if (chapter === null || chapter === undefined) {
    return fail({ path: "chapter", message: "Chapter is required." });
  }

  const result: JourneyValidationResult = { valid: true, issues: [] };

  // Stable identity is a prerequisite for versioning/provenance.
  if (!isValidId(chapter.id)) {
    push(result, { path: "chapter.id", message: "Chapter id is required and must be a non-empty string." });
  }

  if (typeof chapter.title !== "string" || chapter.title.trim().length === 0) {
    push(result, { path: "chapter.title", message: "Chapter title is required." });
  }

  if (!isFiniteNumber(chapter.sequence)) {
    push(result, { path: "chapter.sequence", message: "Chapter sequence must be a finite number." });
  }

  // A chapter may be empty — it can serve as a semantic divider (e.g.
  // "Leadership Transition") with no statements of its own.
  if (!Array.isArray(chapter.statements)) {
    push(result, { path: "chapter.statements", message: "Chapter statements must be an array." });
  } else {
    chapter.statements.forEach((s, i) => {
      const sv = validateStatement(s, config);
      if (!sv.valid) {
        for (const issue of sv.issues) {
          push(result, { path: `chapter.statements[${i}].${issue.path}`, message: issue.message });
        }
      }
    });

    // Unique statement ids within a chapter.
    const seen = new Set<string>();
    chapter.statements.forEach((s, i) => {
      if (isValidId(s.id)) {
        if (seen.has(s.id)) {
          push(result, { path: `chapter.statements[${i}].id`, message: `Duplicate statement id "${s.id}".` });
        }
        seen.add(s.id);
      }
    });
  }

  return result;
}

/** Validate a full CareerJourney (chapters, ordering, provenance). */
export function validateJourney(
  journey: CareerJourney | null | undefined,
  config: JourneyConfig = DEFAULT_JOURNEY_CONFIG,
): JourneyValidationResult {
  if (journey === null || journey === undefined) {
    return fail({ path: "journey", message: "Journey is required." });
  }

  const result: JourneyValidationResult = { valid: true, issues: [] };

  if (!isValidId(journey.id)) {
    push(result, { path: "journey.id", message: "Journey id is required and must be a non-empty string." });
  }

  if (!isValidId(journey.identityId)) {
    push(result, { path: "journey.identityId", message: "identityId is required and must be a non-empty string." });
  }

  if (!isFiniteNumber(journey.version)) {
    push(result, { path: "journey.version", message: "version is required and must be a finite number." });
  }

  // status must be a valid lifecycle state.
  if (!JOURNEY_STATUSES.has(journey.status as JourneyStatus)) {
    push(result, { path: "journey.status", message: `status must be one of: draft, reviewing, approved, published.` });
  }

  // strongestProof, when present, must itself be a valid statement.
  if (journey.strongestProof !== null && journey.strongestProof !== undefined) {
    const spv = validateStatement(journey.strongestProof, config);
    if (!spv.valid) {
      for (const issue of spv.issues) {
        push(result, { path: `journey.strongestProof.${issue.path}`, message: issue.message });
      }
    }
  }

  if (!Array.isArray(journey.chapters) || journey.chapters.length === 0) {
    push(result, { path: "journey.chapters", message: "Journey must contain at least one chapter." });
    return result;
  }

  if (journey.chapters.length > config.maxChapters) {
    push(result, {
      path: "journey.chapters",
      message: `Journey has ${journey.chapters.length} chapters, exceeding the maximum ${config.maxChapters}.`,
    });
  }

  // Validate each chapter, collect all issue paths.
  journey.chapters.forEach((c, i) => {
    const cv = validateChapter(c, config);
    if (!cv.valid) {
      for (const issue of cv.issues) {
        push(result, { path: `journey.chapters[${i}].${issue.path}`, message: issue.message });
      }
    }
  });

  // Unique chapter ids across the whole journey.
  const chapterIds = new Set<string>();
  journey.chapters.forEach((c, i) => {
    if (isValidId(c.id)) {
      if (chapterIds.has(c.id)) {
        push(result, { path: `journey.chapters[${i}].id`, message: `Duplicate chapter id "${c.id}".` });
      }
      chapterIds.add(c.id);
    }
  });

  // Strictly increasing chapter sequence.
  for (let i = 1; i < journey.chapters.length; i++) {
    const prev = journey.chapters[i - 1].sequence;
    const curr = journey.chapters[i].sequence;
    if (!isFiniteNumber(prev) || !isFiniteNumber(curr)) continue; // flagged above
    if (curr <= prev) {
      push(result, {
        path: `journey.chapters[${i}].sequence`,
        message: `Chapter sequence must be strictly increasing; ${curr} is not greater than ${prev}.`,
      });
    }
  }

  return result;
}

/** Validate JourneyProvenance (required, references a journey, non-empty sources). */
export function validateProvenance(
  provenance: JourneyProvenance | null | undefined,
): JourneyValidationResult {
  if (provenance === null || provenance === undefined) {
    return fail({ path: "provenance", message: "Provenance is required." });
  }

  const result: JourneyValidationResult = { valid: true, issues: [] };

  if (!isValidId(provenance.id)) {
    push(result, { path: "provenance.id", message: "Provenance id is required." });
  }

  if (!isValidId(provenance.journeyId)) {
    push(result, { path: "provenance.journeyId", message: "Provenance must reference a journey (journeyId required)." });
  }

  if (!Array.isArray(provenance.sources) || provenance.sources.length === 0) {
    push(result, { path: "provenance.sources", message: "Provenance must contain at least one source." });
  } else {
    provenance.sources.forEach((s: JourneySource, i) => {
      if (!isValidId(s.type)) {
        push(result, { path: `provenance.sources[${i}].type`, message: "Source type is required." });
      }
      if (!isFiniteNumber(s.impactFactor)) {
        push(result, { path: `provenance.sources[${i}].impactFactor`, message: "Source impactFactor must be a finite number." });
      } else if (s.impactFactor < 0 || s.impactFactor > 1) {
        push(result, { path: `provenance.sources[${i}].impactFactor`, message: "Source impactFactor must be within [0, 1]." });
      }
    });
  }

  return result;
}
