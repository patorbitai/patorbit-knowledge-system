"use strict";

/**
 * M7A tests — freshness state machine (L), missing source dates (M),
 * source removal/expiry (N), SLA centralization, and the core invariant:
 * a database row alone NEVER yields `active`.
 */

import { describe, expect, it } from "vitest";
import {
  FRESHNESS_CONFIG,
  computeFreshness,
  evaluateFreshness,
  type FreshnessEvidence,
} from "@/lib/job-sources/freshness";

const NOW = new Date("2026-09-30T00:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function evidence(overrides: Partial<FreshnessEvidence> = {}): FreshnessEvidence {
  return {
    explicitClosure: false,
    validThrough: null,
    presentInSource: true,
    lastConfirmedAt: new Date(NOW.getTime() - HOUR),
    absentConsecutiveChecks: 0,
    postedAt: new Date(NOW.getTime() - 3 * DAY),
    ...overrides,
  };
}

describe("centralized SLA configuration", () => {
  it("keeps every threshold in one frozen config", () => {
    expect(FRESHNESS_CONFIG.ACTIVE_CONFIRMATION_MAX_AGE_MS).toBe(72 * HOUR);
    expect(FRESHNESS_CONFIG.POSTED_PROBABLY_STALE_AFTER_MS).toBe(30 * DAY);
    expect(FRESHNESS_CONFIG.ABSENT_CONFIRMATIONS_REQUIRED).toBe(2);
    expect(Object.isFrozen(FRESHNESS_CONFIG)).toBe(true);
  });

  it("uses the injected config, not hidden magic numbers", () => {
    const strict = {
      ...FRESHNESS_CONFIG,
      ACTIVE_CONFIRMATION_MAX_AGE_MS: HOUR,
    };
    const agingEvidence = evidence({
      lastConfirmedAt: new Date(NOW.getTime() - 2 * HOUR),
    });
    expect(computeFreshness(agingEvidence, NOW)).toBe("active");
    expect(computeFreshness(agingEvidence, NOW, strict)).toBe("probably_stale");
  });
});

describe("state rules (L)", () => {
  it("active: recent confirmation + present + no known expiration", () => {
    const result = evaluateFreshness(evidence(), NOW);
    expect(result.state).toBe("active");
    expect(result.reasons).toContain("confirmed_present_within_sla");
  });

  it("active: confirmation exactly at the SLA boundary", () => {
    const atBoundary = evidence({
      lastConfirmedAt: new Date(NOW.getTime() - FRESHNESS_CONFIG.ACTIVE_CONFIRMATION_MAX_AGE_MS),
    });
    expect(computeFreshness(atBoundary, NOW)).toBe("active");
    const pastBoundary = evidence({
      lastConfirmedAt: new Date(
        NOW.getTime() - FRESHNESS_CONFIG.ACTIVE_CONFIRMATION_MAX_AGE_MS - 1,
      ),
    });
    expect(computeFreshness(pastBoundary, NOW)).toBe("probably_stale");
  });

  it("probably_stale: the source posting is aging", () => {
    const result = evaluateFreshness(
      evidence({ postedAt: new Date(NOW.getTime() - 45 * DAY) }),
      NOW,
    );
    expect(result.state).toBe("probably_stale");
    expect(result.reasons).toContain("source_posted_date_aging");
  });

  it("probably_stale: source confirmation is aging", () => {
    const result = evaluateFreshness(
      evidence({ lastConfirmedAt: new Date(NOW.getTime() - 10 * DAY) }),
      NOW,
    );
    expect(result.state).toBe("probably_stale");
    expect(result.reasons).toContain("source_confirmation_aging");
  });

  it("probably_stale: confirmed absent once, but not yet expired", () => {
    const result = evaluateFreshness(
      evidence({ presentInSource: false, absentConsecutiveChecks: 1 }),
      NOW,
    );
    expect(result.state).toBe("probably_stale");
    expect(result.reasons).toContain("not_present_in_latest_source_response");
  });
});

describe("expired conditions (N)", () => {
  it("expired: explicit source closure overrides everything", () => {
    const result = evaluateFreshness(evidence({ explicitClosure: true }), NOW);
    expect(result.state).toBe("expired");
    expect(result.reasons).toEqual(["source_reported_closure"]);
  });

  it("expired: source-provided validThrough has passed", () => {
    const result = evaluateFreshness(
      evidence({ validThrough: new Date(NOW.getTime() - HOUR) }),
      NOW,
    );
    expect(result.state).toBe("expired");
    expect(result.reasons).toContain("source_valid_through_passed");
  });

  it("not expired: validThrough still in the future", () => {
    const result = evaluateFreshness(
      evidence({ validThrough: new Date(NOW.getTime() + DAY) }),
      NOW,
    );
    expect(result.state).toBe("active");
  });

  it("expired: consecutive absence reaches the configured rule", () => {
    expect(FRESHNESS_CONFIG.ABSENT_CONFIRMATIONS_REQUIRED).toBe(2);
    const oneMiss = evaluateFreshness(
      evidence({ presentInSource: false, absentConsecutiveChecks: 1 }),
      NOW,
    );
    expect(oneMiss.state).toBe("probably_stale");
    const twoMisses = evaluateFreshness(
      evidence({ presentInSource: false, absentConsecutiveChecks: 2 }),
      NOW,
    );
    expect(twoMisses.state).toBe("expired");
    expect(twoMisses.reasons).toContain("confirmed_absent_from_source_feed");
  });
});

describe("unknown / missing source dates (M)", () => {
  it("INVARIANT: a database row alone never yields active", () => {
    // Fresh timestamps on the row (firstSeenAt/lastSeenAt) but NO source
    // confirmation evidence — existence is not evidence.
    const result = evaluateFreshness(
      evidence({ presentInSource: null, lastConfirmedAt: null }),
      NOW,
    );
    expect(result.state).toBe("unknown");
    expect(result.reasons).toEqual(["no_source_confirmation_evidence"]);
  });

  it("unknown: presence claimed without a confirmation timestamp", () => {
    const result = evaluateFreshness(
      evidence({ presentInSource: true, lastConfirmedAt: null }),
      NOW,
    );
    expect(result.state).toBe("unknown");
    expect(result.reasons).toContain("presence_claimed_without_confirmation_timestamp");
  });

  it("active does not require a source-provided posted date (M)", () => {
    const result = evaluateFreshness(evidence({ postedAt: null }), NOW);
    expect(result.state).toBe("active");
    expect(result.reasons).toContain("source_provided_no_posted_date");
  });

  it("keeps source dates and observation timestamps independent", () => {
    // Old source date + fresh confirmation ⇒ aging rule wins (source evidence),
    // while observation staleness is judged only by lastConfirmedAt.
    expect(
      computeFreshness(evidence({ postedAt: new Date(NOW.getTime() - 60 * DAY) }), NOW),
    ).toBe("probably_stale");
    expect(
      computeFreshness(
        evidence({
          postedAt: null,
          lastConfirmedAt: new Date(NOW.getTime() - 6 * HOUR),
        }),
        NOW,
      ),
    ).toBe("active");
  });
});

describe("determinism (Q)", () => {
  it("same evidence + same clock ⇒ identical state and reasons", () => {
    const ev = evidence();
    const a = evaluateFreshness(ev, NOW);
    const b = evaluateFreshness(ev, NOW);
    expect(a).toEqual(b);
    expect(computeFreshness(ev, NOW)).toBe(a.state);
  });

  it("is a pure function of evidence (no hidden clock when now is injected)", () => {
    const ev = evidence({ postedAt: null, lastConfirmedAt: null, presentInSource: null });
    // Two calls years apart with the same injected now stay identical.
    expect(computeFreshness(ev, NOW)).toBe("unknown");
    expect(computeFreshness(ev, new Date("2030-01-01T00:00:00.000Z"))).toBe("unknown");
  });
});
