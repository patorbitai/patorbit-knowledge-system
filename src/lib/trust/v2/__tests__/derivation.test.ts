"use strict";

import { describe, it, expect } from "vitest";
import { deriveTrustV2 } from "../derivation";
import { TRUST_ALGORITHM_VERSION_V2, scoreToTrustLevelV2 } from "../types";
import type {
  TrustDerivationInputV2,
  CanonicalClaimForTrustV2,
  CanonicalEvidenceForTrustV2,
  CanonicalVerificationEventForTrustV2,
  CanonicalConflictForTrust,
} from "../types";

// ── Fixtures ───────────────────────────────────────────────────

function makeClaim(overrides: Partial<CanonicalClaimForTrustV2> = {}): CanonicalClaimForTrustV2 {
  return {
    id: "claim_1",
    professionalIdentityId: "pi_1",
    verificationStatus: "suggested",
    confidence: 0.5,
    claimType: "Skill",
    assertionText: "Test claim",
    ...overrides,
  };
}

function makeEvidence(overrides: Partial<CanonicalEvidenceForTrustV2> = {}): CanonicalEvidenceForTrustV2 {
  return {
    id: "ev_1",
    claimId: "claim_1",
    evidenceKind: "document",
    ...overrides,
  };
}

function makeEvent(overrides: Partial<CanonicalVerificationEventForTrustV2> = {}): CanonicalVerificationEventForTrustV2 {
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

function makeConflict(overrides: Partial<CanonicalConflictForTrust> = {}): CanonicalConflictForTrust {
  return {
    id: "cf_1",
    professionalIdentityId: "pi_1",
    conflictType: "overlapping_dates",
    severity: "warning",
    claimIds: ["claim_1"],
    status: "new",
    ...overrides,
  };
}

function emptyInput(): TrustDerivationInputV2 {
  return { claims: [], evidence: [], verificationEvents: [], conflicts: [] };
}

// ── Tests ──────────────────────────────────────────────────────

describe("Trust v2 Derivation Algorithm", () => {
  // ── Empty state ────────────────────────────────────────────

  describe("Empty state", () => {
    it("returns score 0 and level Unrated for empty input", () => {
      const report = deriveTrustV2(emptyInput());
      expect(report.score).toBe(0);
      expect(report.level).toBe("Unrated");
      expect(report.algorithmVersion).toBe("v2");
      expect(report.claimTrusts).toHaveLength(0);
    });

    it("includes algorithm version v2", () => {
      const report = deriveTrustV2(emptyInput());
      expect(report.algorithmVersion).toBe("v2");
    });
  });

  // ── Evidence ───────────────────────────────────────────────

  describe("Evidence", () => {
    it("claim without evidence has score 0", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "suggested" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].evidenceSupport).toBe(0);
      expect(report.claimTrusts[0].evidenceLevel).toBe("self-asserted");
    });

    it("one attached evidence record gives 40 points", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "accepted" })],
        evidence: [makeEvidence()],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].evidenceSupport).toBe(40);
      expect(report.claimTrusts[0].evidenceLevel).toBe("attached");
    });

    it("two evidence records give 55 points", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim()],
        evidence: [makeEvidence({ id: "ev_1" }), makeEvidence({ id: "ev_2" })],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].evidenceSupport).toBe(55);
    });

    it("three evidence records give 63 points", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim()],
        evidence: [
          makeEvidence({ id: "ev_1" }),
          makeEvidence({ id: "ev_2" }),
          makeEvidence({ id: "ev_3" }),
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].evidenceSupport).toBe(63);
    });

    it("evidence support is capped at 70", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim()],
        evidence: Array.from({ length: 20 }, (_, i) =>
          makeEvidence({ id: `ev_${i}` })
        ),
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].evidenceSupport).toBeLessThanOrEqual(70);
    });

    it("evidence diversity multiplier applies", () => {
      const input1Kind: TrustDerivationInputV2 = {
        claims: [makeClaim()],
        evidence: [
          makeEvidence({ id: "ev_1", evidenceKind: "document" }),
          makeEvidence({ id: "ev_2", evidenceKind: "document" }),
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const input2Kinds: TrustDerivationInputV2 = {
        claims: [makeClaim()],
        evidence: [
          makeEvidence({ id: "ev_1", evidenceKind: "document" }),
          makeEvidence({ id: "ev_2", evidenceKind: "link" }),
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const report1 = deriveTrustV2(input1Kind);
      const report2 = deriveTrustV2(input2Kinds);
      expect(report2.claimTrusts[0].evidenceSupport).toBeGreaterThan(
        report1.claimTrusts[0].evidenceSupport
      );
    });

    it("evidence cap prevents multiplier from exceeding 70", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim()],
        evidence: [
          makeEvidence({ id: "ev_1", evidenceKind: "document" }),
          makeEvidence({ id: "ev_2", evidenceKind: "link" }),
          makeEvidence({ id: "ev_3", evidenceKind: "screenshot" }),
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].evidenceSupport).toBeLessThanOrEqual(70);
    });

    it("evidence review bonus adds 15 points", () => {
      const withoutReview: TrustDerivationInputV2 = {
        claims: [makeClaim()],
        evidence: [makeEvidence()],
        verificationEvents: [],
        conflicts: [],
      };
      const withReview: TrustDerivationInputV2 = {
        claims: [makeClaim()],
        evidence: [makeEvidence()],
        verificationEvents: [
          makeEvent({
            eventType: "evidence_reviewed",
            outcome: "supports",
            resultingStatus: "accepted",
          }),
        ],
        conflicts: [],
      };
      const report1 = deriveTrustV2(withoutReview);
      const report2 = deriveTrustV2(withReview);
      expect(report2.claimTrusts[0].evidenceSupport).toBeGreaterThan(
        report1.claimTrusts[0].evidenceSupport
      );
    });
  });

  // ── Verification ───────────────────────────────────────────

  describe("Verification strength", () => {
    it("verified claim has verification strength 30", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "verified" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(30);
    });

    it("accepted claim has verification strength 10", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "accepted" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(10);
    });

    it("disputed claim has verification strength 0", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "disputed" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(0);
    });

    it("revoked claim has verification strength 0", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "revoked" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(0);
    });

    it("expired claim has verification strength 5", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "expired" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(5);
    });
  });

  // ── Status caps ────────────────────────────────────────────

  describe("Status caps", () => {
    it("revoked claim is capped at 20", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "revoked" })],
        evidence: [
          makeEvidence({ id: "ev_1" }),
          makeEvidence({ id: "ev_2" }),
          makeEvidence({ id: "ev_3" }),
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].score).toBeLessThanOrEqual(20);
    });

    it("disputed claim is capped at 30", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "disputed" })],
        evidence: [
          makeEvidence({ id: "ev_1" }),
          makeEvidence({ id: "ev_2" }),
          makeEvidence({ id: "ev_3" }),
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].score).toBeLessThanOrEqual(30);
    });

    it("expired claim is capped at 40", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "expired" })],
        evidence: [
          makeEvidence({ id: "ev_1" }),
          makeEvidence({ id: "ev_2" }),
          makeEvidence({ id: "ev_3" }),
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].score).toBeLessThanOrEqual(40);
    });
  });

  // ── Conflicts ──────────────────────────────────────────────

  describe("Conflicts", () => {
    it("warning conflict reduces claim trust", () => {
      const withoutConflict: TrustDerivationInputV2 = {
        claims: [makeClaim({ id: "c1", verificationStatus: "accepted" })],
        evidence: [makeEvidence({ claimId: "c1" })],
        verificationEvents: [],
        conflicts: [],
      };
      const withConflict: TrustDerivationInputV2 = {
        claims: [makeClaim({ id: "c1", verificationStatus: "accepted" })],
        evidence: [makeEvidence({ claimId: "c1" })],
        verificationEvents: [],
        conflicts: [makeConflict({ claimIds: ["c1"], severity: "warning", status: "new" })],
      };
      const report1 = deriveTrustV2(withoutConflict);
      const report2 = deriveTrustV2(withConflict);
      expect(report2.claimTrusts[0].score).toBeLessThanOrEqual(
        report1.claimTrusts[0].score
      );
    });

    it("critical conflict caps claim at 60", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ id: "c1", verificationStatus: "verified" })],
        evidence: [
          makeEvidence({ id: "ev_1", claimId: "c1" }),
          makeEvidence({ id: "ev_2", claimId: "c1" }),
        ],
        verificationEvents: [],
        conflicts: [
          makeConflict({
            claimIds: ["c1"],
            severity: "critical",
            conflictType: "status_mismatch",
            status: "new",
          }),
        ],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].score).toBeLessThanOrEqual(60);
    });

    it("dismissed conflict has no impact", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ id: "c1", verificationStatus: "accepted" })],
        evidence: [makeEvidence({ claimId: "c1" })],
        verificationEvents: [],
        conflicts: [
          makeConflict({
            claimIds: ["c1"],
            severity: "warning",
            status: "dismissed",
          }),
        ],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].conflictPenalty).toBe(0);
    });

    it("conflict affects only the involved claims", () => {
      const input: TrustDerivationInputV2 = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "accepted", assertionText: "Claim A" }),
          makeClaim({ id: "c2", verificationStatus: "accepted", assertionText: "Claim B" }),
        ],
        evidence: [
          makeEvidence({ id: "ev_1", claimId: "c1" }),
          makeEvidence({ id: "ev_2", claimId: "c2" }),
        ],
        verificationEvents: [],
        conflicts: [
          makeConflict({ claimIds: ["c1"], severity: "warning", status: "new" }),
        ],
      };
      const report = deriveTrustV2(input);
      const c1 = report.claimTrusts.find((ct) => ct.claimId === "c1")!;
      const c2 = report.claimTrusts.find((ct) => ct.claimId === "c2")!;
      expect(c1.conflictPenalty).toBeGreaterThan(0);
      expect(c2.conflictPenalty).toBe(0);
    });
  });

  // ── Double-counting ────────────────────────────────────────

  describe("Double-counting protection", () => {
    it("most restrictive cap wins for disputed + critical conflict", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ id: "c1", verificationStatus: "disputed" })],
        evidence: [
          makeEvidence({ id: "ev_1", claimId: "c1" }),
          makeEvidence({ id: "ev_2", claimId: "c1" }),
        ],
        verificationEvents: [],
        conflicts: [
          makeConflict({
            claimIds: ["c1"],
            severity: "critical",
            conflictType: "status_mismatch",
            status: "new",
          }),
        ],
      };
      const report = deriveTrustV2(input);
      // disputed cap = 30, critical conflict cap = 60 → min = 30
      expect(report.claimTrusts[0].score).toBeLessThanOrEqual(30);
    });
  });

  // ── Aggregation ────────────────────────────────────────────

  describe("Aggregation", () => {
    it("average of multiple claims", () => {
      const input: TrustDerivationInputV2 = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "verified" }),
          makeClaim({ id: "c2", verificationStatus: "accepted" }),
        ],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts).toHaveLength(2);
      const avg = Math.round(
        (report.claimTrusts[0].score + report.claimTrusts[1].score) / 2
      );
      expect(report.score).toBe(avg);
    });

    it("returns 0 for no claims", () => {
      const report = deriveTrustV2(emptyInput());
      expect(report.score).toBe(0);
    });

    it("highest tier gate caps when revoked claim exists", () => {
      const input: TrustDerivationInputV2 = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "verified" }),
          makeClaim({ id: "c2", verificationStatus: "revoked" }),
        ],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.score).toBeLessThanOrEqual(89);
    });
  });

  // ── Highest tier ───────────────────────────────────────────

  describe("Highest tier requirements", () => {
    it("cannot reach Highly Supported with revoked claims", () => {
      const input: TrustDerivationInputV2 = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "verified" }),
          makeClaim({ id: "c2", verificationStatus: "revoked" }),
        ],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.level).not.toBe("Highly Supported");
    });

    it("cannot reach Highly Supported with critical conflicts", () => {
      const input: TrustDerivationInputV2 = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "verified" }),
          makeClaim({ id: "c2", verificationStatus: "verified" }),
        ],
        evidence: [],
        verificationEvents: [],
        conflicts: [
          makeConflict({
            claimIds: ["c1"],
            severity: "critical",
            conflictType: "status_mismatch",
            status: "new",
          }),
        ],
      };
      const report = deriveTrustV2(input);
      expect(report.score).toBeLessThanOrEqual(89);
    });
  });

  // ── Determinism ────────────────────────────────────────────

  describe("Determinism", () => {
    it("same input always produces same output", () => {
      const input: TrustDerivationInputV2 = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "verified", confidence: 0.9 }),
          makeClaim({ id: "c2", verificationStatus: "accepted", confidence: 0.7 }),
        ],
        evidence: [makeEvidence({ id: "ev1", claimId: "c1" })],
        verificationEvents: [makeEvent({ id: "ve1", claimId: "c1" })],
        conflicts: [],
      };
      const report1 = deriveTrustV2(input);
      const report2 = deriveTrustV2(input);
      expect(report1.score).toBe(report2.score);
      expect(report1.level).toBe(report2.level);
      expect(report1.claimTrusts).toEqual(report2.claimTrusts);
    });
  });

  // ── Bounds ─────────────────────────────────────────────────

  describe("Score bounds", () => {
    it("score never exceeds 100", () => {
      const input: TrustDerivationInputV2 = {
        claims: Array.from({ length: 20 }, (_, i) =>
          makeClaim({ id: `c${i}`, verificationStatus: "verified", confidence: 1.0 })
        ),
        evidence: Array.from({ length: 20 }, (_, i) =>
          makeEvidence({ id: `ev${i}`, claimId: `c${i}` })
        ),
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(report.score).toBeGreaterThanOrEqual(0);
    });

    it("score never goes below 0", () => {
      const input: TrustDerivationInputV2 = {
        claims: Array.from({ length: 5 }, (_, i) =>
          makeClaim({ id: `c${i}`, verificationStatus: "disputed", confidence: 0 })
        ),
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Trust levels ───────────────────────────────────────────

  describe("Trust levels", () => {
    it("maps scores to correct levels", () => {
      expect(scoreToTrustLevelV2(0)).toBe("Unrated");
      expect(scoreToTrustLevelV2(10)).toBe("Developing");
      expect(scoreToTrustLevelV2(50)).toBe("Supported");
      expect(scoreToTrustLevelV2(80)).toBe("Strong");
      expect(scoreToTrustLevelV2(95)).toBe("Highly Supported");
    });
  });

  // ── Summary ────────────────────────────────────────────────

  describe("Summary", () => {
    it("counts correctly", () => {
      const input: TrustDerivationInputV2 = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "verified" }),
          makeClaim({ id: "c2", verificationStatus: "accepted" }),
          makeClaim({ id: "c3", verificationStatus: "suggested" }),
        ],
        evidence: [
          makeEvidence({ id: "ev1", claimId: "c1" }),
          makeEvidence({ id: "ev2", claimId: "c2" }),
        ],
        verificationEvents: [makeEvent({ id: "ve1", claimId: "c1" })],
        conflicts: [makeConflict({ id: "cf1", claimIds: ["c1"], status: "new" })],
      };
      const report = deriveTrustV2(input);
      expect(report.summary.totalClaims).toBe(3);
      expect(report.summary.verifiedClaims).toBe(1);
      expect(report.summary.claimsWithEvidence).toBe(2);
      expect(report.summary.totalEvidence).toBe(2);
      expect(report.summary.totalVerificationEvents).toBe(1);
      expect(report.summary.activeConflicts).toBe(1);
    });
  });

  // ── Explanation ────────────────────────────────────────────

  describe("Explanation", () => {
    it("generates supporting factors for verified claims", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "verified" })],
        evidence: [makeEvidence()],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.supportingFactors.length).toBeGreaterThan(0);
    });

    it("generates reducing factors for unsupported claims", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "suggested" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.reducingFactors.length).toBeGreaterThan(0);
    });
  });
});
