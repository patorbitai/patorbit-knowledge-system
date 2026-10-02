"use strict";

/**
 * M7C — source observations: the PURE rules that turn feed checks into
 * freshness evidence. No I/O, no hidden clock, no AI, no embeddings.
 *
 * Two invariants are encoded here and proven by tests:
 *
 *  1. DATABASE EXISTENCE IS NOT FRESHNESS EVIDENCE — every state must be
 *     explainable from evidence fields (M7A's state machine, now fed by
 *     real per-feed observations instead of assumptions).
 *
 *  2. ABSENCE IS SCOPED TO THE EXACT FEED THAT WAS SUCCESSFULLY CHECKED —
 *     a failed / timed-out / rate-limited / malformed / partial response
 *     can never establish that a posting is gone. `evaluateFeedObservation`
 *     is the single gate deciding whether a check is allowed to count
 *     absences at all; the absence rules themselves only ever see postings
 *     of the one feed that produced the observation.
 */

import {
  type FreshnessEvidence,
} from "./freshness";
import type { SourceFeedPolicy } from "./types";

/* ── Observation completeness (the absence gate) ────────────────────────── */

/**
 * Stable machine codes for WHY a check cannot establish absence:
 *  - invalid_structure   : top-level shape wrong → corpus not enumerable;
 *  - skipped_rows        : ≥1 row malformed → a known posting could be the
 *                          row we failed to parse, so "missing" proves nothing;
 *  - partial_feed        : paginated feed not enumerated to its end;
 *  - pagination_failed   : a later page failed after earlier pages succeeded.
 */
export type IncompleteObservationReason =
  | "invalid_structure"
  | "skipped_rows"
  | "partial_feed"
  | "pagination_failed";

export interface FeedObservationAssessment {
  complete: boolean;
  /** null when complete; otherwise the stable reason code. */
  reason: IncompleteObservationReason | null;
}

export interface FeedObservationInput {
  feedPolicy: SourceFeedPolicy;
  /** Row- + payload-level skips across all fetched pages of this check. */
  skippedCount: number;
  /** A payload-level skip (index -1) means the top-level shape was wrong. */
  payloadLevelSkip: boolean;
  /** A later page failed after earlier pages succeeded. */
  paginationFailed?: boolean;
  /**
   * Enumeration ENDED: a single-response feed whose one response parsed, or
   * a paginated feed that reached an explicit empty end page.
   */
  exhausted: boolean;
}

/**
 * Decide whether a feed check is complete enough to establish absence.
 * Conservative by construction: anything short of a structurally-valid,
 * fully-enumerable response yields `complete: false`.
 */
export function evaluateFeedObservation(
  input: FeedObservationInput,
): FeedObservationAssessment {
  if (input.paginationFailed) {
    return { complete: false, reason: "pagination_failed" };
  }
  if (input.payloadLevelSkip) {
    return { complete: false, reason: "invalid_structure" };
  }
  if (input.skippedCount > 0) {
    return { complete: false, reason: "skipped_rows" };
  }
  if (input.feedPolicy === "paginated" && !input.exhausted) {
    return { complete: false, reason: "partial_feed" };
  }
  return { complete: true, reason: null };
}

/* ── Stored evidence shapes ─────────────────────────────────────────────── */

/** The evidence fields a single JobPosting row carries (M7C provenance). */
export interface StoredPostingEvidence {
  /** Last confirmed PRESENCE in a valid response of this posting's feed. */
  lastConfirmedAt: Date | null;
  /** Consecutive confirmed misses from THIS posting's feed (≥1 only from complete checks). */
  absentConsecutiveChecks: number;
}

/** A stored posting row as needed for freshness derivation. */
export interface StoredPosting extends StoredPostingEvidence {
  sourceKind: string;
  sourceFeedKey: string;
  externalId: string;
  /** SOURCE-PROVIDED date; null when the source supplied none. */
  postedAt: Date | null;
  /** SOURCE-PROVIDED expiration; null when the source supplied none. */
  validThrough: Date | null;
  /** Source explicitly reported the posting closed (never inferred). */
  explicitClosure?: boolean;
}

/* ── Evidence derivation ────────────────────────────────────────────────── */

/**
 * Freshness evidence for ONE source posting, scoped to its own feed:
 *  - present  ⇔ checks === 0 AND a confirmation timestamp exists;
 *  - absent   ⇔ checks ≥ 1 (only ever incremented by COMPLETE observations);
 *  - never confirmed ⇒ presentInSource null → "unknown", never "active".
 *
 * The resulting evidence feeds M7A's `evaluateFreshness` unchanged — the
 * state machine itself is untouched (active | probably_stale | expired |
 * unknown, 72h / 30d / 2-miss SLA).
 */
export function postingFreshnessEvidence(
  posting: StoredPosting,
): FreshnessEvidence {
  const neverConfirmed =
    posting.absentConsecutiveChecks === 0 && posting.lastConfirmedAt === null;
  const presentInSource = neverConfirmed
    ? null
    : posting.absentConsecutiveChecks === 0;
  return {
    explicitClosure: posting.explicitClosure ?? false,
    validThrough: posting.validThrough,
    presentInSource,
    lastConfirmedAt: posting.lastConfirmedAt,
    absentConsecutiveChecks: posting.absentConsecutiveChecks,
    postedAt: posting.postedAt,
  };
}

export interface JobEvidenceInput {
  /** The Job row's last presence confirmation (stamped only by observations). */
  jobLastConfirmedAt: Date | null;
  /** Every posting of the job, across every feed that ever showed it. */
  postings: readonly StoredPosting[];
}

export interface JobFreshnessEvidenceFields {
  explicitClosure: boolean;
  presentInSource: boolean | null;
  absentConsecutiveChecks: number;
  lastConfirmedAt: Date | null;
}

/**
 * Aggregate a canonical Job's evidence from its per-feed postings:
 *  - ANY feed still confirming presence ⇒ presentInSource true (one live
 *    source outweighs another feed's misses);
 *  - NO feed confirming but ≥1 confirmed miss ⇒ presentInSource false, with
 *    absentConsecutiveChecks = min over the MISSING feeds — so the job can
 *    only reach `expired` when EVERY known feed has missed ≥ the threshold;
 *  - otherwise ⇒ presentInSource null (no current evidence either way).
 *
 * `validThrough` / `postedAt` are intentionally NOT derived here: they are
 * SOURCE-PROVIDED fields supplied by the caller from the canonical posting.
 */
export function jobFreshnessEvidence(
  input: JobEvidenceInput,
): JobFreshnessEvidenceFields {
  const postings = input.postings;
  const anyPresent = postings.some(
    (p) => p.absentConsecutiveChecks === 0 && p.lastConfirmedAt !== null,
  );
  const missing = postings.filter((p) => p.absentConsecutiveChecks > 0);

  let presentInSource: boolean | null;
  let absentConsecutiveChecks = 0;
  if (anyPresent) {
    presentInSource = true;
  } else if (missing.length > 0) {
    presentInSource = false;
    absentConsecutiveChecks = Math.min(
      ...missing.map((p) => p.absentConsecutiveChecks),
    );
  } else {
    presentInSource = null;
  }

  return {
    explicitClosure: postings.some((p) => p.explicitClosure === true),
    presentInSource,
    absentConsecutiveChecks,
    lastConfirmedAt: input.jobLastConfirmedAt,
  };
}

/* ── Absence computation (feed-scoped) ──────────────────────────────────── */

export interface KnownPostingAbsence {
  id: string;
  externalId: string;
  absentConsecutiveChecks: number;
}

export interface AbsenceIncrement {
  id: string;
  nextAbsentConsecutiveChecks: number;
}

/**
 * Which known postings of THE CHECKED FEED were absent from a COMPLETE
 * observation, and their next consecutive-miss count.
 *
 * Feed scoping is the caller's responsibility (it passes only postings of
 * the feed that produced the observation); presence resets are NOT handled
 * here — they happen during persistence, when the posting is upserted.
 * Deterministic: stable id ordering.
 */
export function computeAbsentPostings(
  knownInFeed: readonly KnownPostingAbsence[],
  presentExternalIds: ReadonlySet<string>,
): AbsenceIncrement[] {
  return knownInFeed
    .filter((row) => !presentExternalIds.has(row.externalId))
    .map((row) => ({
      id: row.id,
      nextAbsentConsecutiveChecks: row.absentConsecutiveChecks + 1,
    }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/* ── Canonical posting selection (evidence dates only) ──────────────────── */

/**
 * Deterministic choice of the canonical posting for evidence dates
 * (postedAt / validThrough): prefer a posting still confirmed PRESENT
 * (earliest in stable source order), else the first in stable source order.
 * Only selects among stored rows — never invents a date.
 */
export function canonicalPostingForEvidence<
  T extends {
    sourceKind: string;
    sourceFeedKey: string;
    externalId: string;
    absentConsecutiveChecks: number;
    lastConfirmedAt: Date | null;
  },
>(rows: readonly T[]): T | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => {
    if (a.sourceKind !== b.sourceKind) return a.sourceKind < b.sourceKind ? -1 : 1;
    if (a.sourceFeedKey !== b.sourceFeedKey) return a.sourceFeedKey < b.sourceFeedKey ? -1 : 1;
    if (a.externalId !== b.externalId) return a.externalId < b.externalId ? -1 : 1;
    return 0;
  });
  const present = sorted.find(
    (row) =>
      row.absentConsecutiveChecks === 0 && row.lastConfirmedAt !== null,
  );
  return present ?? sorted[0];
}
