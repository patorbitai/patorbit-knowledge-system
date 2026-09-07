"use strict";

import { describe, it, expect } from "vitest";
import { deriveTrust } from "../derivation";
import { TRUST_ALGORITHM_VERSION, scoreToTrustLevel } from "../types";
import type {
  TrustDerivationInput,
  CanonicalClaimForTrust,
  CanonicalEvidenceForTrust,
  CanonicalVerificationEventForTrust,
} from "../types";

// ── Fixtures ───────────────────────────────────────────────────

function makeClaim(overrides: Partial<CanonicalClaimForTrust> = {}): CanonicalClaimForTrust {
  return {
    id: "claim_1",
    professionalIdentityId: "pi_1",
    verificationStatus: "suggested",
    confidence: 0.5,
    claimType: "Skill",
    ...overrides,
  };
}

function makeEvidence(overrides: Partial<CanonicalEvidenceForTrust> = {}): CanonicalEvidenceForTrust {
  return {
    id: "ev_1",
    claimId: "claim_1",
    evidenceKind: "document",
    ...overrides,
  };
}

function makeEvent(overrides: Partial<CanonicalVerificationEventForTrust> = {}): CanonicalVerificationEventForTrust {
  return {
    id: "ve_1",
    claimId: "claim_1",
    evidenceRecordId: null,
    eventType: "verified",
    previousStatus: "under-review",
    resultingStatus: "verified",
    outcome: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function emptyInput(): TrustDerivationInput {
  return { claims: [], evidence: [], verificationEvents: [] };
}

// ── Tests ──────────────────────────────────────────────────────

describe("Trust Derivation Algorithm", () => {
  describe("Empty state", () => {
    it("returns score 0 and level Unrated for empty input", () => {
      const report = deriveTrust(emptyInput());
      expect(report.score).toBe(0);
      expect(report.level).toBe("Unrated");
      expect(report.algorithmVersion).toBe(TRUST_ALGORITHM_VERSION);
      expect(report.breakdown).toHaveLength(5);
      expect(report.summary.totalClaims).toBe(0);
    });

    it("includes algorithm version in every report", () => {
      const report = deriveTrust(emptyInput());
      expect(report.algorithmVersion).toBe("v1");
    });

    it("has derivedAt as ISO string", () => {
      const report = deriveTrust(emptyInput());
      expect(typeof report.derivedAt).toBe("string");
      expect(new Date(report.derivedAt).toISOString()).toBe(report.derivedAt);
    });
  });

  describe("Single unverified claim", () => {
    it("returns low score with neutral claim status", () => {
      const input: TrustDerivationInput = {
        claims: [makeClaim({ verificationStatus: "suggested" })],
        evidence: [],
        verificationEvents: [],
      };
      const report = deriveTrust(input);
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThan(50);
      expect(report.level).not.toBe("Excellent");
      expect(report.summary.totalClaims).toBe(1);
      expect(report.summary.verifiedClaims).toBe(0);
    });
  });

  describe("Verified claim", () => {
    it("returns higher score for verified claims", () => {
      const input: TrustDerivationInput = {
        claims: [makeClaim({ verificationStatus: "verified" })],
        evidence: [],
        verificationEvents: [],
      };
      const report = deriveTrust(input);
      expect(report.score).toBeGreaterThan(0);
      expect(report.summary.verifiedClaims).toBe(1);
      expect(report.reasons.some((r) => r.includes("verified"))).toBe(true);
    });
  });

  describe("Evidence coverage", () => {
    it("increases score when claims have evidence", () => {
      const withoutEvidence = deriveTrust({
        claims: [makeClaim({ verificationStatus: "accepted" })],
        evidence: [],
        verificationEvents: [],
      });
      const withEvidence = deriveTrust({
        claims: [makeClaim({ verificationStatus: "accepted" })],
        evidence: [makeEvidence()],
        verificationEvents: [],
      });
      expect(withEvidence.score).toBeGreaterThanOrEqual(withoutEvidence.score);
      expect(withEvidence.summary.claimsWithEvidence).toBe(1);
    });

    it("evidence does NOT equal verification", () => {
      const input: TrustDerivationInput = {
        claims: [makeClaim({ verificationStatus: "accepted" })],
        evidence: [makeEvidence()],
        verificationEvents: [],
      };
      const report = deriveTrust(input);
      // Evidence-only claim should NOT be counted as verified
      expect(report.summary.verifiedClaims).toBe(0);
    });
  });

  describe("Disputed claims", () => {
    it("reduces trust for disputed claims", () => {
      const neutral = deriveTrust({
        claims: [makeClaim({ verificationStatus: "accepted" })],
        evidence: [],
        verificationEvents: [],
      });
      const disputed = deriveTrust({
        claims: [makeClaim({ verificationStatus: "disputed" })],
        evidence: [],
        verificationEvents: [],
      });
      expect(disputed.score).toBeLessThanOrEqual(neutral.score);
      expect(disputed.reasons.some((r) => r.includes("disputed"))).toBe(true);
    });
  });

  describe("Revoked claims", () => {
    it("penalizes revoked claims", () => {
      const neutral = deriveTrust({
        claims: [makeClaim({ verificationStatus: "accepted" })],
        evidence: [],
        verificationEvents: [],
      });
      const revoked = deriveTrust({
        claims: [makeClaim({ verificationStatus: "revoked" })],
        evidence: [],
        verificationEvents: [],
      });
      expect(revoked.score).toBeLessThanOrEqual(neutral.score);
      expect(revoked.reasons.some((r) => r.includes("revoked"))).toBe(true);
    });
  });

  describe("Expired claims", () => {
    it("excludes expired claims from active verification", () => {
      const input: TrustDerivationInput = {
        claims: [makeClaim({ verificationStatus: "expired" })],
        evidence: [],
        verificationEvents: [],
      };
      const report = deriveTrust(input);
      expect(report.summary.verifiedClaims).toBe(0);
      expect(report.reasons.some((r) => r.includes("expired"))).toBe(true);
    });
  });

  describe("Mixed claim states", () => {
    it("correctly handles verified + disputed + accepted", () => {
      const input: TrustDerivationInput = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "verified" }),
          makeClaim({ id: "c2", verificationStatus: "disputed" }),
          makeClaim({ id: "c3", verificationStatus: "accepted" }),
        ],
        evidence: [],
        verificationEvents: [],
      };
      const report = deriveTrust(input);
      expect(report.summary.totalClaims).toBe(3);
      expect(report.summary.verifiedClaims).toBe(1);
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });
  });

  describe("Multiple claims with evidence", () => {
    it("handles multiple claims and evidence correctly", () => {
      const input: TrustDerivationInput = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "verified" }),
          makeClaim({ id: "c2", verificationStatus: "accepted" }),
        ],
        evidence: [
          makeEvidence({ id: "ev1", claimId: "c1" }),
          makeEvidence({ id: "ev2", claimId: "c2" }),
        ],
        verificationEvents: [],
      };
      const report = deriveTrust(input);
      expect(report.summary.claimsWithEvidence).toBe(2);
      expect(report.summary.evidenceCoveragePercent).toBe(100);
    });
  });

  describe("Determinism", () => {
    it("same input always produces same output", () => {
      const input: TrustDerivationInput = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "verified", confidence: 0.9 }),
          makeClaim({ id: "c2", verificationStatus: "accepted", confidence: 0.7 }),
        ],
        evidence: [makeEvidence({ id: "ev1", claimId: "c1" })],
        verificationEvents: [makeEvent({ id: "ve1", claimId: "c1" })],
      };
      const report1 = deriveTrust(input);
      const report2 = deriveTrust(input);
      expect(report1.score).toBe(report2.score);
      expect(report1.level).toBe(report2.level);
      expect(report1.breakdown).toEqual(report2.breakdown);
    });
  });

  describe("Score bounds", () => {
    it("score never exceeds 100", () => {
      const input: TrustDerivationInput = {
        claims: Array.from({ length: 50 }, (_, i) =>
          makeClaim({
            id: `c${i}`,
            verificationStatus: "verified",
            confidence: 1.0,
          })
        ),
        evidence: Array.from({ length: 50 }, (_, i) =>
          makeEvidence({ id: `ev${i}`, claimId: `c${i}` })
        ),
        verificationEvents: Array.from({ length: 50 }, (_, i) =>
          makeEvent({ id: `ve${i}`, claimId: `c${i}` })
        ),
      };
      const report = deriveTrust(input);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(report.score).toBeGreaterThanOrEqual(0);
    });

    it("score never goes below 0", () => {
      const input: TrustDerivationInput = {
        claims: Array.from({ length: 20 }, (_, i) =>
          makeClaim({
            id: `c${i}`,
            verificationStatus: "disputed",
            confidence: 0,
          })
        ),
        evidence: [],
        verificationEvents: [],
      };
      const report = deriveTrust(input);
      expect(report.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Algorithm version", () => {
    it("every result includes v1", () => {
      const report = deriveTrust(emptyInput());
      expect(report.algorithmVersion).toBe("v1");
    });
  });

  describe("Verification events", () => {
    it("counts verification events in summary", () => {
      const input: TrustDerivationInput = {
        claims: [makeClaim({ id: "c1" })],
        evidence: [],
        verificationEvents: [
          makeEvent({ id: "ve1", claimId: "c1", eventType: "requested" }),
          makeEvent({ id: "ve2", claimId: "c1", eventType: "verified" }),
        ],
      };
      const report = deriveTrust(input);
      expect(report.summary.totalVerificationEvents).toBe(2);
    });
  });

  describe("Trust levels", () => {
    it("maps scores to correct levels", () => {
      expect(scoreToTrustLevel(0)).toBe("Unrated");
      expect(scoreToTrustLevel(10)).toBe("Developing");
      expect(scoreToTrustLevel(50)).toBe("Established");
      expect(scoreToTrustLevel(70)).toBe("Strong");
      expect(scoreToTrustLevel(90)).toBe("Excellent");
    });
  });
});
