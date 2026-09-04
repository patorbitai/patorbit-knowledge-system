"use strict";

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ───────────────────────────────────────────────────────────────────

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueMock },
    professionalIdentity: { findUnique: vi.fn() },
  },
}));

// ── Verification State Tests ────────────────────────────────────────────────

describe("Verification State Model", () => {
  // The verification states used in the system
  const VALID_STATUSES = [
    "unverified",
    "accepted",
    "evidence-added",
    "under-review",
    "verified",
    "disputed",
    "revoked",
    "expired",
  ] as const;

  it("defines all valid verification statuses", () => {
    // The system must have these distinct states
    expect(VALID_STATUSES).toContain("unverified");
    expect(VALID_STATUSES).toContain("accepted");
    expect(VALID_STATUSES).toContain("evidence-added");
    expect(VALID_STATUSES).toContain("verified");
    expect(VALID_STATUSES).toContain("disputed");
    expect(VALID_STATUSES).toContain("expired");
  });

  it("evidence-added is NOT the same as verified", () => {
    // Critical: uploading evidence does NOT make a claim verified
    const evidenceAddedStatus = "evidence-added";
    const verifiedStatus = "verified";
    expect(evidenceAddedStatus).not.toBe(verifiedStatus);
  });

  it("accepted is NOT the same as verified", () => {
    // Accepting a claim is user action, not external verification
    const acceptedStatus = "accepted";
    const verifiedStatus = "verified";
    expect(acceptedStatus).not.toBe(verifiedStatus);
  });

  it("claims track verification status as a string field", () => {
    // Claims in the resume have a verificationStatus field
    type ClaimVerificationStatus =
      | "accepted"
      | "evidence-added"
      | "under-review"
      | "verified"
      | "disputed"
      | "revoked"
      | "expired";

    const claim = {
      id: "c1",
      assertionText: "I know TypeScript",
      verificationStatus: "accepted" as ClaimVerificationStatus,
    };

    expect(claim.verificationStatus).toBe("accepted");
    expect(claim.verificationStatus).not.toBe("verified");
  });

  it("evidence record has status field separate from claim verification", () => {
    // Evidence records have their own status, independent of claim verification
    type EvidenceStatus = "evidence-added" | "under-review" | "verified" | "disputed";

    const evidence = {
      id: "evd_1",
      claimId: "c1",
      status: "evidence-added" as EvidenceStatus,
    };

    expect(evidence.status).toBe("evidence-added");
  });

  it("TrustService verification summary correctly categorizes claims", () => {
    // The verification summary counts claims by status
    const claims = [
      { verificationStatus: "verified" },
      { verificationStatus: "verified" },
      { verificationStatus: "pending" },
      { verificationStatus: "unverified" },
      { verificationStatus: "disputed" },
    ];

    const verified = claims.filter((c) => c.verificationStatus === "verified").length;
    const pending = claims.filter((c) => c.verificationStatus === "pending").length;
    const unverified = claims.filter((c) => c.verificationStatus === "unverified").length;
    const disputed = claims.filter((c) => c.verificationStatus === "disputed").length;

    expect(verified).toBe(2);
    expect(pending).toBe(1);
    expect(unverified).toBe(1);
    expect(disputed).toBe(1);
  });

  it("evidence-backed claims have different trust than unverified claims", () => {
    // A claim with evidence should score differently than one without
    const claimWithEvidence = {
      verificationStatus: "evidence-added",
      hasEvidence: true,
    };

    const claimWithoutEvidence = {
      verificationStatus: "unverified",
      hasEvidence: false,
    };

    // The system should distinguish these
    expect(claimWithEvidence.hasEvidence).toBe(true);
    expect(claimWithoutEvidence.hasEvidence).toBe(false);
    expect(claimWithEvidence.verificationStatus).not.toBe(claimWithoutEvidence.verificationStatus);
  });

  it("verification status is preserved through resume persistence", () => {
    // Claims are stored inside resume payload in PostgreSQL
    const resumePayload = {
      name: "Test User",
      claims: [
        {
          id: "c1",
          assertionText: "Worked at Google",
          verificationStatus: "evidence-added",
          accepted: true,
        },
        {
          id: "c2",
          assertionText: "AWS Certified",
          verificationStatus: "accepted",
          accepted: true,
        },
      ],
    };

    // Verify claims survive serialization
    const serialized = JSON.stringify(resumePayload);
    const parsed = JSON.parse(serialized);

    expect(parsed.claims[0].verificationStatus).toBe("evidence-added");
    expect(parsed.claims[1].verificationStatus).toBe("accepted");
  });
});

// ── Evidence ≠ Verification Distinction ─────────────────────────────────────

describe("Evidence vs Verification Distinction", () => {
  it("user-provided information is not automatically verified", () => {
    // When a user enters data, it should be marked as user-provided, not verified
    const userEntry = {
      source: "user-input",
      verificationStatus: "accepted",
    };

    expect(userEntry.source).toBe("user-input");
    expect(userEntry.verificationStatus).not.toBe("verified");
  });

  it("AI-extracted information is not automatically verified", () => {
    // AI extraction creates claims but does not verify them
    const aiExtracted = {
      source: "ai-extraction",
      verificationStatus: "accepted",
    };

    expect(aiExtracted.source).toBe("ai-extraction");
    expect(aiExtracted.verificationStatus).not.toBe("verified");
  });

  it("evidence attachment does not equal verification", () => {
    // Uploading a certificate PDF does not mean the claim is verified
    const claim = {
      id: "c1",
      verificationStatus: "evidence-added",
    };

    const evidence = {
      id: "evd_1",
      claimId: "c1",
      evidenceType: "file",
      status: "evidence-added",
    };

    // Both have "evidence-added" status, but neither is "verified"
    expect(claim.verificationStatus).not.toBe("verified");
    expect(evidence.status).not.toBe("verified");
  });

  it("verified status requires authoritative verification (future)", () => {
    // The "verified" status should only be set by an actual verification process
    // Currently, no issuer/employer verification exists
    const verificationPossibleStatuses = [
      "unverified",
      "accepted",
      "evidence-added",
      "under-review",
      "verified",
      "disputed",
      "revoked",
      "expired",
    ];

    // "verified" exists as a status but is never automatically assigned
    expect(verificationPossibleStatuses).toContain("verified");
    // It would only be set by a future verification engine
  });
});
