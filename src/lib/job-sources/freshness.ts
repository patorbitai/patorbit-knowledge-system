"use strict";

/**
 * M7A — freshness state machine (pure, clock-injected, fully testable).
 *
 * States: active | probably_stale | expired | unknown.
 *
 * CRITICAL INVARIANT: a row's existence in the database is NOT evidence.
 * `active` requires recent, source-derived confirmation that the posting is
 * still present in the official feed. Every state must be explainable from
 * the evidence record (see `evaluateFreshness` reasons).
 *
 * Field provenance (kept strictly separate — no invented dates):
 *  - SOURCE-PROVIDED: `postedAt`, `validThrough` (null when the source
 *    supplies none).
 *  - PATORBIT OBSERVATION: `lastConfirmedAt`, `presentInSource`,
 *    `absentConsecutiveChecks`, `explicitClosure` (all derived from actual
 *    source responses, never fabricated).
 *
 * SLA values live in FRESHNESS_CONFIG — no magic numbers elsewhere.
 */

export type FreshnessState = "active" | "probably_stale" | "expired" | "unknown";

/** Centralized freshness SLA / threshold configuration. */
export const FRESHNESS_CONFIG = Object.freeze({
  /** `lastConfirmedAt` must be within this window to assert `active`. */
  ACTIVE_CONFIRMATION_MAX_AGE_MS: 72 * 60 * 60 * 1000, // 72 hours
  /** A source-listed posting older than this is `probably_stale` (aging). */
  POSTED_PROBABLY_STALE_AFTER_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
  /** Confirmed consecutive misses from the official feed before `expired`. */
  ABSENT_CONFIRMATIONS_REQUIRED: 2,
});

export interface FreshnessEvidence {
  /** Source explicitly reports the posting closed/removed (410, tombstone). */
  explicitClosure: boolean;
  /** SOURCE-PROVIDED expiration; null when the source supplies none. */
  validThrough: Date | null;
  /**
   * Was the posting present in the most recent official source response?
   * true = present, false = confirmed absent, null = never observed.
   */
  presentInSource: boolean | null;
  /** PATORBIT OBSERVATION timestamp of the last confirmed presence. */
  lastConfirmedAt: Date | null;
  /** Consecutive confirmed misses from the official feed (observation). */
  absentConsecutiveChecks: number;
  /** SOURCE-PROVIDED posted/created date; null when absent. */
  postedAt: Date | null;
}

export interface FreshnessEvaluation {
  state: FreshnessState;
  /** Stable machine-readable reasons explaining the state from evidence. */
  reasons: string[];
}

function ageMs(from: Date, now: Date): number {
  return now.getTime() - from.getTime();
}

/**
 * Evaluate freshness from source evidence. `now` is injected for
 * determinism; `config` is centralized (overridable for tests).
 */
export function evaluateFreshness(
  evidence: FreshnessEvidence,
  now: Date = new Date(),
  config: typeof FRESHNESS_CONFIG = FRESHNESS_CONFIG,
): FreshnessEvaluation {
  const reasons: string[] = [];

  // ── EXPIRED: explicit, source-derived termination signals ────────────────
  if (evidence.explicitClosure) {
    reasons.push("source_reported_closure");
    return { state: "expired", reasons };
  }
  if (evidence.validThrough !== null && evidence.validThrough.getTime() <= now.getTime()) {
    reasons.push("source_valid_through_passed");
    return { state: "expired", reasons };
  }
  if (evidence.absentConsecutiveChecks >= config.ABSENT_CONFIRMATIONS_REQUIRED) {
    reasons.push("confirmed_absent_from_source_feed");
    return { state: "expired", reasons };
  }

  // ── UNKNOWN: insufficient confirmation evidence ──────────────────────────
  if (evidence.presentInSource === null && evidence.lastConfirmedAt === null) {
    reasons.push("no_source_confirmation_evidence");
    return { state: "unknown", reasons };
  }

  // ── Confirmed absent (misses below the expiry threshold) ─────────────────
  if (evidence.presentInSource === false) {
    reasons.push("not_present_in_latest_source_response");
    return { state: "probably_stale", reasons };
  }

  // ── Present per source, but no observation timestamp → cannot explain ────
  if (evidence.lastConfirmedAt === null) {
    reasons.push("presence_claimed_without_confirmation_timestamp");
    return { state: "unknown", reasons };
  }

  const confirmationAge = ageMs(evidence.lastConfirmedAt, now);
  const confirmationRecent = confirmationAge <= config.ACTIVE_CONFIRMATION_MAX_AGE_MS;
  const postedKnown = evidence.postedAt !== null;
  const postedAging =
    postedKnown &&
    ageMs(evidence.postedAt as Date, now) > config.POSTED_PROBABLY_STALE_AFTER_MS;

  // ── PROBABLY_STALE: aging posting or aging confirmation ──────────────────
  if (postedAging) {
    reasons.push("source_posted_date_aging");
    if (!confirmationRecent) reasons.push("source_confirmation_aging");
    return { state: "probably_stale", reasons };
  }
  if (!confirmationRecent) {
    reasons.push("source_confirmation_aging");
    return { state: "probably_stale", reasons };
  }

  // ── ACTIVE: recent confirmation + present + no known expiration ──────────
  reasons.push("confirmed_present_within_sla");
  if (!postedKnown) reasons.push("source_provided_no_posted_date");
  return { state: "active", reasons };
}

/** Convenience wrapper: the state only. */
export function computeFreshness(
  evidence: FreshnessEvidence,
  now: Date = new Date(),
  config: typeof FRESHNESS_CONFIG = FRESHNESS_CONFIG,
): FreshnessState {
  return evaluateFreshness(evidence, now, config).state;
}
