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

// ══════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════

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

    it("marks insufficientData when fewer than 3 claims", () => {
      const report = deriveTrustV2(emptyInput());
      expect(report.summary.insufficientData).toBe(true);
    });
  });

  // ── Evidence ───────────────────────────────────────────────

  describe("Evidence", () => {
    it("claim without evidence is self-asserted with score 0", () => {
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

    it("two evidence records give 55 points (40 + 15)", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim()],
        evidence: [makeEvidence({ id: "ev_1" }), makeEvidence({ id: "ev_2" })],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].evidenceSupport).toBe(55);
    });

    it("three evidence records give 63 points (55 + 8)", () => {
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

    it("four evidence records give 66 points (63 + 3)", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim()],
        evidence: [
          makeEvidence({ id: "ev_1" }),
          makeEvidence({ id: "ev_2" }),
          makeEvidence({ id: "ev_3" }),
          makeEvidence({ id: "ev_4" }),
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].evidenceSupport).toBe(66);
    });

    it("evidence support is capped at 70 regardless of count", () => {
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

    it("same evidenceKind does not increase diversity", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim()],
        evidence: [
          makeEvidence({ id: "ev_1", evidenceKind: "document" }),
          makeEvidence({ id: "ev_2", evidenceKind: "document" }),
          makeEvidence({ id: "ev_3", evidenceKind: "document" }),
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      // 3 records, 1 kind → diversity ×1.0, base = 63
      expect(report.claimTrusts[0].evidenceSupport).toBe(63);
      expect(report.claimTrusts[0].evidenceDiversity).toBe(1);
    });

    it("2 distinct evidenceKind gives ×1.1 multiplier", () => {
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
      // 2 records, 1 kind: 55 × 1.0 = 55
      // 2 records, 2 kinds: 55 × 1.1 = 60.5 → 61
      expect(report1.claimTrusts[0].evidenceSupport).toBe(55);
      expect(report2.claimTrusts[0].evidenceSupport).toBe(61);
    });

    it("3+ distinct evidenceKind gives ×1.2 multiplier", () => {
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
      // 3 records, 3 kinds: 63 × 1.2 = 75.6 → capped to 70
      expect(report.claimTrusts[0].evidenceSupport).toBe(70);
      expect(report.claimTrusts[0].evidenceDiversity).toBe(3);
    });

    it("diversity multiplier never pushes evidence support above 70", () => {
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
      // Without review: 40 × 1.0 = 40
      // With review: 40 × 1.0 + 15 = 55
      expect(report1.claimTrusts[0].evidenceSupport).toBe(40);
      expect(report2.claimTrusts[0].evidenceSupport).toBe(55);
    });

    it("verified claim with attached-but-not-verified evidence is correctly classified", () => {
      // Claim is verified, but evidence itself is only "attached" (not reviewed)
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "verified" })],
        evidence: [makeEvidence()],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      // Evidence level should be "verified" because claim status is verified
      expect(report.claimTrusts[0].evidenceLevel).toBe("verified");
      // But evidence support is from the attached evidence (40), not from verification
      expect(report.claimTrusts[0].evidenceSupport).toBe(40);
      // Verification strength is separate (30)
      expect(report.claimTrusts[0].verificationStrength).toBe(30);
    });
  });

  // ── Verification ───────────────────────────────────────────

  describe("Verification strength", () => {
    it("verified = 30", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "verified" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(30);
    });

    it("accepted = 10", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "accepted" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(10);
    });

    it("evidence-added = 8", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "evidence-added" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(8);
    });

    it("under-review = 5", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "under-review" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(5);
    });

    it("suggested = 3", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "suggested" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(3);
    });

    it("expired = 5", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "expired" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(5);
    });

    it("rejected = 0", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "rejected" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(0);
    });

    it("disputed = 0", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "disputed" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(0);
    });

    it("revoked = 0", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "revoked" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(0);
    });

    it("historical verified event does NOT override current revoked status", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "revoked" })],
        evidence: [makeEvidence()],
        verificationEvents: [
          makeEvent({
            eventType: "verified",
            previousStatus: "under-review",
            resultingStatus: "verified",
            outcome: null,
          }),
          makeEvent({
            eventType: "revoked",
            previousStatus: "verified",
            resultingStatus: "revoked",
            outcome: null,
          }),
        ],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      // Current status is revoked → verification strength = 0, not 30
      expect(report.claimTrusts[0].verificationStrength).toBe(0);
      expect(report.claimTrusts[0].verificationStatus).toBe("revoked");
    });

    it("historical verified event does NOT override current disputed status", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "disputed" })],
        evidence: [makeEvidence()],
        verificationEvents: [
          makeEvent({
            eventType: "verified",
            previousStatus: "under-review",
            resultingStatus: "verified",
          }),
          makeEvent({
            eventType: "disputed",
            previousStatus: "verified",
            resultingStatus: "disputed",
          }),
        ],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].verificationStrength).toBe(0);
    });

    it("historical verified event does NOT override current expired status", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "expired" })],
        evidence: [makeEvidence()],
        verificationEvents: [
          makeEvent({
            eventType: "verified",
            previousStatus: "under-review",
            resultingStatus: "verified",
          }),
          makeEvent({
            eventType: "expired",
            previousStatus: "verified",
            resultingStatus: "expired",
          }),
        ],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      // expired = 5 (not penalized like revoked/disputed)
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

    it("rejected claim has NO special cap (uses default 100)", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ verificationStatus: "rejected" })],
        evidence: [
          makeEvidence({ id: "ev_1" }),
          makeEvidence({ id: "ev_2" }),
          makeEvidence({ id: "ev_3" }),
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      // Rejected has no special cap — verification strength is 0, so score is low
      // but the cap itself is 100 (default), not 15
      expect(report.claimTrusts[0].statusCap).toBe(100);
    });
  });

  // ── Conflicts ──────────────────────────────────────────────

  describe("Conflicts", () => {
    it("info conflict reduces claim trust by 3", () => {
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
        conflicts: [makeConflict({ claimIds: ["c1"], severity: "info", conflictType: "contradictory_title", status: "new" })],
      };
      const report1 = deriveTrustV2(withoutConflict);
      const report2 = deriveTrustV2(withConflict);
      // Without: ev(40) + vs(10) = 50
      // With: 50 - 3 = 47
      expect(report1.claimTrusts[0].score).toBe(50);
      expect(report2.claimTrusts[0].score).toBe(47);
      expect(report2.claimTrusts[0].conflictPenalty).toBe(3);
    });

    it("warning conflict reduces claim trust by 10", () => {
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
        conflicts: [makeConflict({ claimIds: ["c1"], severity: "warning", conflictType: "overlapping_dates", status: "new" })],
      };
      const report1 = deriveTrustV2(withoutConflict);
      const report2 = deriveTrustV2(withConflict);
      // Without: 40 + 10 = 50
      // With: 50 - 10 = 40
      expect(report1.claimTrusts[0].score).toBe(50);
      expect(report2.claimTrusts[0].score).toBe(40);
      expect(report2.claimTrusts[0].conflictPenalty).toBe(10);
    });

    it("critical conflict applies hard cap at 60 (no soft penalty)", () => {
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
      // ev(55) + vs(30) = 85, no soft penalty for critical, cap = 60
      expect(report.claimTrusts[0].conflictPenalty).toBe(0);
      expect(report.claimTrusts[0].criticalConflictCap).toBe(60);
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
      expect(report.claimTrusts[0].criticalConflictCap).toBe(100);
    });

    it("resolved conflict has no impact", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ id: "c1", verificationStatus: "accepted" })],
        evidence: [makeEvidence({ claimId: "c1" })],
        verificationEvents: [],
        conflicts: [
          makeConflict({
            claimIds: ["c1"],
            severity: "critical",
            status: "resolved",
          }),
        ],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].conflictPenalty).toBe(0);
      expect(report.claimTrusts[0].criticalConflictCap).toBe(100);
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
      expect(c1.conflictPenalty).toBe(10);
      expect(c2.conflictPenalty).toBe(0);
      expect(c2.score).toBeGreaterThan(c1.score);
    });

    // ── All 8 conflict types ───────────────────────────────

    describe("All 8 conflict types", () => {
      it("overlapping_dates (warning) applies -10 penalty", () => {
        const input: TrustDerivationInputV2 = {
          claims: [makeClaim({ id: "c1" })],
          evidence: [makeEvidence({ claimId: "c1" })],
          verificationEvents: [],
          conflicts: [makeConflict({ claimIds: ["c1"], conflictType: "overlapping_dates", severity: "warning", status: "new" })],
        };
        const report = deriveTrustV2(input);
        expect(report.claimTrusts[0].conflictPenalty).toBe(10);
      });

      it("contradictory_employer (warning) applies -10 penalty", () => {
        const input: TrustDerivationInputV2 = {
          claims: [makeClaim({ id: "c1" })],
          evidence: [makeEvidence({ claimId: "c1" })],
          verificationEvents: [],
          conflicts: [makeConflict({ claimIds: ["c1"], conflictType: "contradictory_employer", severity: "warning", status: "new" })],
        };
        const report = deriveTrustV2(input);
        expect(report.claimTrusts[0].conflictPenalty).toBe(10);
      });

      it("contradictory_title (info) applies -3 penalty", () => {
        const input: TrustDerivationInputV2 = {
          claims: [makeClaim({ id: "c1" })],
          evidence: [makeEvidence({ claimId: "c1" })],
          verificationEvents: [],
          conflicts: [makeConflict({ claimIds: ["c1"], conflictType: "contradictory_title", severity: "info", status: "new" })],
        };
        const report = deriveTrustV2(input);
        expect(report.claimTrusts[0].conflictPenalty).toBe(3);
      });

      it("contradictory_dates (warning) applies -10 penalty", () => {
        const input: TrustDerivationInputV2 = {
          claims: [makeClaim({ id: "c1" })],
          evidence: [makeEvidence({ claimId: "c1" })],
          verificationEvents: [],
          conflicts: [makeConflict({ claimIds: ["c1"], conflictType: "contradictory_dates", severity: "warning", status: "new" })],
        };
        const report = deriveTrustV2(input);
        expect(report.claimTrusts[0].conflictPenalty).toBe(10);
      });

      it("duplicate_credential (warning) applies -10 penalty", () => {
        const input: TrustDerivationInputV2 = {
          claims: [makeClaim({ id: "c1" })],
          evidence: [makeEvidence({ claimId: "c1" })],
          verificationEvents: [],
          conflicts: [makeConflict({ claimIds: ["c1"], conflictType: "duplicate_credential", severity: "warning", status: "new" })],
        };
        const report = deriveTrustV2(input);
        expect(report.claimTrusts[0].conflictPenalty).toBe(10);
      });

      it("education_inconsistency (info) applies -3 penalty", () => {
        const input: TrustDerivationInputV2 = {
          claims: [makeClaim({ id: "c1" })],
          evidence: [makeEvidence({ claimId: "c1" })],
          verificationEvents: [],
          conflicts: [makeConflict({ claimIds: ["c1"], conflictType: "education_inconsistency", severity: "info", status: "new" })],
        };
        const report = deriveTrustV2(input);
        expect(report.claimTrusts[0].conflictPenalty).toBe(3);
      });

      it("status_mismatch (critical) applies hard cap at 60", () => {
        const input: TrustDerivationInputV2 = {
          claims: [makeClaim({ id: "c1", verificationStatus: "verified" })],
          evidence: [
            makeEvidence({ id: "ev_1", claimId: "c1" }),
            makeEvidence({ id: "ev_2", claimId: "c1" }),
          ],
          verificationEvents: [],
          conflicts: [makeConflict({ claimIds: ["c1"], conflictType: "status_mismatch", severity: "critical", status: "new" })],
        };
        const report = deriveTrustV2(input);
        expect(report.claimTrusts[0].conflictPenalty).toBe(0);
        expect(report.claimTrusts[0].criticalConflictCap).toBe(60);
        expect(report.claimTrusts[0].score).toBeLessThanOrEqual(60);
      });

      it("location_inconsistency (info) applies -3 penalty", () => {
        const input: TrustDerivationInputV2 = {
          claims: [makeClaim({ id: "c1" })],
          evidence: [makeEvidence({ claimId: "c1" })],
          verificationEvents: [],
          conflicts: [makeConflict({ claimIds: ["c1"], conflictType: "location_inconsistency", severity: "info", status: "new" })],
        };
        const report = deriveTrustV2(input);
        expect(report.claimTrusts[0].conflictPenalty).toBe(3);
      });
    });
  });

  // ── Double-counting ────────────────────────────────────────

  describe("Double-counting protection", () => {
    it("most restrictive cap wins: disputed (30) < critical conflict cap (60)", () => {
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

    it("most restrictive cap wins: revoked (20) < expired (40)", () => {
      // A claim can't be both revoked and expired, but we test the cap logic
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ id: "c1", verificationStatus: "revoked" })],
        evidence: [
          makeEvidence({ id: "ev_1", claimId: "c1" }),
          makeEvidence({ id: "ev_2", claimId: "c1" }),
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts[0].score).toBeLessThanOrEqual(20);
    });

    it("expired (40) < critical conflict cap (60) → effective max is 40", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ id: "c1", verificationStatus: "expired" })],
        evidence: [
          makeEvidence({ id: "ev_1", claimId: "c1" }),
          makeEvidence({ id: "ev_2", claimId: "c1" }),
          makeEvidence({ id: "ev_3", claimId: "c1" }),
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
      // expired cap = 40, critical conflict cap = 60 → min = 40
      expect(report.claimTrusts[0].score).toBeLessThanOrEqual(40);
    });
  });

  // ── Aggregation ────────────────────────────────────────────

  describe("Aggregation", () => {
    it("returns 0 for no claims", () => {
      const report = deriveTrustV2(emptyInput());
      expect(report.score).toBe(0);
      expect(report.summary.insufficientData).toBe(true);
    });

    it("1 claim: returns that claim's score, marked insufficientData", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ id: "c1", verificationStatus: "verified" })],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.score).toBe(report.claimTrusts[0].score);
      expect(report.summary.insufficientData).toBe(true);
    });

    it("2 claims: average, marked insufficientData", () => {
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
      expect(report.summary.insufficientData).toBe(true);
    });

    it("3+ claims: average, NOT insufficientData", () => {
      const input: TrustDerivationInputV2 = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "verified" }),
          makeClaim({ id: "c2", verificationStatus: "accepted" }),
          makeClaim({ id: "c3", verificationStatus: "suggested" }),
        ],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.claimTrusts).toHaveLength(3);
      expect(report.summary.insufficientData).toBe(false);
    });

    it("equal-weight average: weak claim reduces strong claim average", () => {
      const input: TrustDerivationInputV2 = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "verified" }),
          makeClaim({ id: "c2", verificationStatus: "suggested" }),
        ],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      // verified = 30, suggested = 3 → average = 16.5 → 17
      const expected = Math.round((30 + 3) / 2);
      expect(report.score).toBe(expected);
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
      expect(report.score).toBeLessThanOrEqual(89);
      expect(report.level).not.toBe("Highly Supported");
    });

    it("cannot reach Highly Supported with disputed claims", () => {
      const input: TrustDerivationInputV2 = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "verified" }),
          makeClaim({ id: "c2", verificationStatus: "disputed" }),
        ],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      expect(report.score).toBeLessThanOrEqual(89);
    });

    it("cannot reach Highly Supported without any verified claim", () => {
      const input: TrustDerivationInputV2 = {
        claims: [
          makeClaim({ id: "c1", verificationStatus: "accepted" }),
          makeClaim({ id: "c2", verificationStatus: "accepted" }),
          makeClaim({ id: "c3", verificationStatus: "accepted" }),
        ],
        evidence: [],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      // All accepted = 10 each, average = 10
      // No verified claim → capped at 89
      expect(report.score).toBeLessThanOrEqual(89);
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

    it("boundary: score 39 → Developing, 40 → Supported", () => {
      expect(scoreToTrustLevelV2(39)).toBe("Developing");
      expect(scoreToTrustLevelV2(40)).toBe("Supported");
    });

    it("boundary: score 69 → Supported, 70 → Strong", () => {
      expect(scoreToTrustLevelV2(69)).toBe("Supported");
      expect(scoreToTrustLevelV2(70)).toBe("Strong");
    });

    it("boundary: score 89 → Strong, 90 → Highly Supported", () => {
      expect(scoreToTrustLevelV2(89)).toBe("Strong");
      expect(scoreToTrustLevelV2(90)).toBe("Highly Supported");
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
      expect(report.summary.insufficientData).toBe(false);
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

  // ── Security / Canonical ───────────────────────────────────

  describe("Security", () => {
    it("cross-user evidence does not affect Trust", () => {
      // User A's evidence should not appear in User B's Trust
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ id: "c1", professionalIdentityId: "pi_a" })],
        evidence: [
          makeEvidence({ id: "ev1", claimId: "c1" }),
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      // Only the evidence linked to c1 should be counted
      expect(report.claimTrusts[0].evidenceCount).toBe(1);
    });

    it("unclaimed evidence (claimId=null) does not appear in claim trust", () => {
      const input: TrustDerivationInputV2 = {
        claims: [makeClaim({ id: "c1" })],
        evidence: [
          makeEvidence({ id: "ev1", claimId: "c1" }),
          makeEvidence({ id: "ev2", claimId: null }), // unclaimed
        ],
        verificationEvents: [],
        conflicts: [],
      };
      const report = deriveTrustV2(input);
      // Only ev1 is linked to c1
      expect(report.claimTrusts[0].evidenceCount).toBe(1);
    });
  });
});
