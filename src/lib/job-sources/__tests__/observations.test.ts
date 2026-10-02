"use strict";

/**
 * M7C — observations module tests (pure, zero I/O, injected clock).
 *
 * These prove the two M7C invariants at the unit level:
 *  1. only a structurally-valid, fully-enumerable response can establish
 *     absence (the completeness gate);
 *  2. freshness states are derived from evidence fields only — database
 *     existence is never freshness evidence.
 *
 * ZERO live API calls: this module performs no I/O at all.
 */

import { describe, it, expect } from "vitest";
import {
  canonicalPostingForEvidence,
  computeAbsentPostings,
  evaluateFeedObservation,
  jobFreshnessEvidence,
  postingFreshnessEvidence,
  type StoredPosting,
} from "@/lib/job-sources/observations";
import { evaluateFreshness, FRESHNESS_CONFIG } from "@/lib/job-sources/freshness";

const NOW = new Date("2026-10-01T12:00:00.000Z");
const RECENT = new Date("2026-10-01T06:00:00.000Z"); // 6h before NOW
const OLD = new Date("2026-09-20T00:00:00.000Z"); // 11 days before NOW

function posting(over: Partial<StoredPosting> = {}): StoredPosting {
  return {
    sourceKind: "greenhouse",
    sourceFeedKey: "greenhouse:acme",
    externalId: "9001",
    lastConfirmedAt: RECENT,
    absentConsecutiveChecks: 0,
    postedAt: new Date("2026-09-25T00:00:00.000Z"),
    validThrough: null,
    ...over,
  };
}

/* ── Completeness gate (§11/§12) ────────────────────────────────────────── */

describe("evaluateFeedObservation — the absence gate", () => {
  it("accepts a structurally-valid single-response feed as complete", () => {
    expect(
      evaluateFeedObservation({
        feedPolicy: "single_response",
        skippedCount: 0,
        payloadLevelSkip: false,
        exhausted: true,
      }),
    ).toEqual({ complete: true, reason: null });
  });

  it("rejects a payload-level structural failure (invalid_structure)", () => {
    expect(
      evaluateFeedObservation({
        feedPolicy: "single_response",
        skippedCount: 1,
        payloadLevelSkip: true,
        exhausted: true,
      }),
    ).toEqual({ complete: false, reason: "invalid_structure" });
  });

  it("rejects any skipped rows (skipped_rows) — a known posting could be the malformed row", () => {
    expect(
      evaluateFeedObservation({
        feedPolicy: "single_response",
        skippedCount: 1,
        payloadLevelSkip: false,
        exhausted: true,
      }),
    ).toEqual({ complete: false, reason: "skipped_rows" });
  });

  it("rejects a non-final page of a paginated feed (partial_feed)", () => {
    expect(
      evaluateFeedObservation({
        feedPolicy: "paginated",
        skippedCount: 0,
        payloadLevelSkip: false,
        exhausted: false,
      }),
    ).toEqual({ complete: false, reason: "partial_feed" });
  });

  it("accepts a paginated feed only when enumeration reached its end", () => {
    expect(
      evaluateFeedObservation({
        feedPolicy: "paginated",
        skippedCount: 0,
        payloadLevelSkip: false,
        exhausted: true,
      }),
    ).toEqual({ complete: true, reason: null });
  });

  it("a mid-pagination failure outranks every other reason (pagination_failed)", () => {
    expect(
      evaluateFeedObservation({
        feedPolicy: "paginated",
        skippedCount: 2,
        payloadLevelSkip: false,
        paginationFailed: true,
        exhausted: false,
      }),
    ).toEqual({ complete: false, reason: "pagination_failed" });
  });

  it("an EMPTY complete feed is still complete (mass absence is legitimate)", () => {
    expect(
      evaluateFeedObservation({
        feedPolicy: "single_response",
        skippedCount: 0,
        payloadLevelSkip: false,
        exhausted: true,
      }).complete,
    ).toBe(true);
  });
});

/* ── Posting evidence (§7) ──────────────────────────────────────────────── */

describe("postingFreshnessEvidence — per-feed evidence", () => {
  it("never confirmed ⇒ unknown (a row alone is never 'active')", () => {
    const evidence = postingFreshnessEvidence(
      posting({ lastConfirmedAt: null, absentConsecutiveChecks: 0 }),
    );
    expect(evidence.presentInSource).toBeNull();
    const evaluation = evaluateFreshness(evidence, NOW);
    expect(evaluation.state).toBe("unknown");
    expect(evaluation.reasons).toContain("no_source_confirmation_evidence");
  });

  it("recent presence ⇒ active with the SLA reason", () => {
    const evaluation = evaluateFreshness(postingFreshnessEvidence(posting()), NOW);
    expect(evaluation).toEqual({
      state: "active",
      reasons: ["confirmed_present_within_sla"],
    });
  });

  it("one confirmed absence ⇒ probably_stale (not expired)", () => {
    const evidence = postingFreshnessEvidence(
      posting({ absentConsecutiveChecks: 1 }),
    );
    expect(evidence.presentInSource).toBe(false);
    const evaluation = evaluateFreshness(evidence, NOW);
    expect(evaluation.state).toBe("probably_stale");
    expect(evaluation.reasons).toContain("not_present_in_latest_source_response");
  });

  it("two confirmed absences ⇒ expired (the M7A two-miss policy)", () => {
    const evaluation = evaluateFreshness(
      postingFreshnessEvidence(posting({ absentConsecutiveChecks: 2 })),
      NOW,
    );
    expect(evaluation.state).toBe("expired");
    expect(evaluation.reasons).toContain("confirmed_absent_from_source_feed");
  });

  it("stale confirmation ⇒ probably_stale at read time", () => {
    const evaluation = evaluateFreshness(
      postingFreshnessEvidence(posting({ lastConfirmedAt: OLD })),
      NOW,
    );
    expect(evaluation.state).toBe("probably_stale");
    expect(evaluation.reasons).toContain("source_confirmation_aging");
  });

  it("aging posted date ⇒ probably_stale (30-day SLA)", () => {
    const evaluation = evaluateFreshness(
      postingFreshnessEvidence(posting({ postedAt: new Date("2026-08-15T00:00:00Z") })),
      NOW,
    );
    expect(evaluation.state).toBe("probably_stale");
    expect(evaluation.reasons).toContain("source_posted_date_aging");
  });

  it("missing posted date stays missing — active is allowed without one", () => {
    const evaluation = evaluateFreshness(
      postingFreshnessEvidence(posting({ postedAt: null })),
      NOW,
    );
    expect(evaluation.state).toBe("active");
    expect(evaluation.reasons).toContain("source_provided_no_posted_date");
  });

  it("source-provided validThrough in the past ⇒ expired even while present", () => {
    const evaluation = evaluateFreshness(
      postingFreshnessEvidence(
        posting({ validThrough: new Date("2026-09-30T00:00:00Z") }),
      ),
      NOW,
    );
    expect(evaluation.state).toBe("expired");
    expect(evaluation.reasons).toContain("source_valid_through_passed");
  });

  it("explicit source closure overrides everything ⇒ expired", () => {
    const evaluation = evaluateFreshness(
      postingFreshnessEvidence(posting({ explicitClosure: true })),
      NOW,
    );
    expect(evaluation.state).toBe("expired");
    expect(evaluation.reasons).toContain("source_reported_closure");
  });

  it("the SLA thresholds are the M7A values — nothing was retuned", () => {
    expect(FRESHNESS_CONFIG.ACTIVE_CONFIRMATION_MAX_AGE_MS).toBe(72 * 60 * 60 * 1000);
    expect(FRESHNESS_CONFIG.POSTED_PROBABLY_STALE_AFTER_MS).toBe(
      30 * 24 * 60 * 60 * 1000,
    );
    expect(FRESHNESS_CONFIG.ABSENT_CONFIRMATIONS_REQUIRED).toBe(2);
  });
});

/* ── Job-level evidence aggregation (§7/§9) ─────────────────────────────── */

describe("jobFreshnessEvidence — per-job aggregation across feeds", () => {
  it("ANY feed still confirming ⇒ present, regardless of another feed's miss", () => {
    const fields = jobFreshnessEvidence({
      jobLastConfirmedAt: RECENT,
      postings: [
        posting({ sourceFeedKey: "greenhouse:acme", absentConsecutiveChecks: 0 }),
        posting({
          sourceKind: "lever",
          sourceFeedKey: "lever:acme",
          absentConsecutiveChecks: 3, // missing three times on another feed
        }),
      ],
    });
    expect(fields.presentInSource).toBe(true);
    expect(fields.absentConsecutiveChecks).toBe(0);
  });

  it("NO feed confirming but ≥1 miss ⇒ absent with the MINIMUM miss count", () => {
    const fields = jobFreshnessEvidence({
      jobLastConfirmedAt: RECENT,
      postings: [
        posting({ absentConsecutiveChecks: 1 }),
        posting({ externalId: "9002", absentConsecutiveChecks: 2 }),
      ],
    });
    expect(fields.presentInSource).toBe(false);
    // min = 1 ⇒ probably_stale, NOT expired: not every feed has missed twice.
    expect(fields.absentConsecutiveChecks).toBe(1);
  });

  it("EVERY feed missing ≥2 ⇒ miss count reaches the expiry threshold", () => {
    const fields = jobFreshnessEvidence({
      jobLastConfirmedAt: OLD,
      postings: [
        posting({ absentConsecutiveChecks: 2 }),
        posting({
          sourceKind: "lever",
          sourceFeedKey: "lever:acme",
          absentConsecutiveChecks: 4,
        }),
      ],
    });
    expect(fields.presentInSource).toBe(false);
    expect(fields.absentConsecutiveChecks).toBe(2);
    const evaluation = evaluateFreshness(
      { ...fields, validThrough: null, postedAt: null },
      NOW,
    );
    expect(evaluation.state).toBe("expired");
    expect(evaluation.reasons).toContain("confirmed_absent_from_source_feed");
  });

  it("no confirmed presence and no miss ⇒ present is null (unknown)", () => {
    const fields = jobFreshnessEvidence({
      jobLastConfirmedAt: null,
      postings: [posting({ lastConfirmedAt: null, absentConsecutiveChecks: 0 })],
    });
    expect(fields.presentInSource).toBeNull();
    expect(fields.absentConsecutiveChecks).toBe(0);
    const evaluation = evaluateFreshness(
      { ...fields, validThrough: null, postedAt: null },
      NOW,
    );
    expect(evaluation.state).toBe("unknown");
  });

  it("an explicit closure on ANY posting propagates to the job", () => {
    const fields = jobFreshnessEvidence({
      jobLastConfirmedAt: RECENT,
      postings: [
        posting(),
        posting({ externalId: "9002", explicitClosure: true }),
      ],
    });
    expect(fields.explicitClosure).toBe(true);
  });

  it("carries the job's own confirmation stamp through", () => {
    const fields = jobFreshnessEvidence({
      jobLastConfirmedAt: OLD,
      postings: [posting()],
    });
    expect(fields.lastConfirmedAt).toEqual(OLD);
  });
});

/* ── Feed-scoped absence computation (§9) ───────────────────────────────── */

describe("computeAbsentPostings — only NOT-present rows of the checked feed", () => {
  const known = [
    { id: "p1", externalId: "a", absentConsecutiveChecks: 0 },
    { id: "p2", externalId: "b", absentConsecutiveChecks: 1 },
    { id: "p3", externalId: "c", absentConsecutiveChecks: 0 },
  ];

  it("increments exactly the postings missing from the observation", () => {
    const result = computeAbsentPostings(known, new Set(["a"]));
    expect(result).toEqual([
      { id: "p2", nextAbsentConsecutiveChecks: 2 },
      { id: "p3", nextAbsentConsecutiveChecks: 1 },
    ]);
  });

  it("a fully present feed increments nothing", () => {
    expect(computeAbsentPostings(known, new Set(["a", "b", "c"]))).toEqual([]);
  });

  it("an empty observation marks every known posting absent", () => {
    const result = computeAbsentPostings(known, new Set());
    expect(result.map((r) => r.nextAbsentConsecutiveChecks)).toEqual([1, 2, 1]);
  });

  it("is deterministic — stable ordering across repeated calls", () => {
    expect(computeAbsentPostings(known, new Set(["a"]))).toEqual(
      computeAbsentPostings(known, new Set(["a"])),
    );
  });

  it("never decrements: a present posting is simply not touched here", () => {
    const streaked = [{ id: "p1", externalId: "a", absentConsecutiveChecks: 2 }];
    expect(computeAbsentPostings(streaked, new Set(["a"]))).toEqual([]);
  });
});

/* ── Canonical selection (evidence dates only) ──────────────────────────── */

describe("canonicalPostingForEvidence — deterministic date selection", () => {
  it("prefers a posting still confirmed present, in stable source order", () => {
    const rows = [
      posting({
        sourceKind: "greenhouse",
        sourceFeedKey: "greenhouse:acme",
        absentConsecutiveChecks: 2,
        postedAt: new Date("2026-09-01T00:00:00Z"),
      }),
      posting({
        sourceKind: "lever",
        sourceFeedKey: "lever:acme",
        externalId: "lev-1",
        absentConsecutiveChecks: 0,
        postedAt: new Date("2026-09-20T00:00:00Z"),
      }),
    ];
    expect(canonicalPostingForEvidence(rows)?.sourceKind).toBe("lever");
  });

  it("falls back to stable source order when nothing is present", () => {
    const rows = [
      posting({
        sourceKind: "lever",
        sourceFeedKey: "lever:acme",
        absentConsecutiveChecks: 1,
      }),
      posting({
        sourceKind: "ashby",
        sourceFeedKey: "ashby:acme",
        absentConsecutiveChecks: 1,
      }),
    ];
    expect(canonicalPostingForEvidence(rows)?.sourceKind).toBe("ashby");
  });

  it("returns null for an empty row set (never invents a source)", () => {
    expect(canonicalPostingForEvidence([])).toBeNull();
  });

  it("is a pure function of the rows (same rows ⇒ same choice)", () => {
    const rows = [
      posting({ externalId: "b" }),
      posting({ sourceKind: "lever", sourceFeedKey: "lever:acme", externalId: "a" }),
    ];
    expect(canonicalPostingForEvidence(rows)?.externalId).toBe(
      canonicalPostingForEvidence(rows)?.externalId,
    );
  });
});
