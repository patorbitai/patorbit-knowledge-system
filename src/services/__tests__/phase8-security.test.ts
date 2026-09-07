"use strict";

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock prisma ────────────────────────────────────────────────
const mockPrisma = {
  claim: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  verificationEvent: {
    create: vi.fn(),
  },
  evidenceRecord: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return mockPrisma;
  },
}));

// ── Test data ──────────────────────────────────────────────────
const TEST_PI_ID = "pi_123";
const OTHER_PI_ID = "pi_other";
const TEST_CLAIM_ID = "claim_1";
const TEST_EVIDENCE_ID = "ev_1";
const OTHER_EVIDENCE_ID = "ev_other";

function makeClaim(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_CLAIM_ID,
    professionalIdentityId: TEST_PI_ID,
    assertionText: "Worked at Google",
    claimType: "Employment",
    verificationStatus: "accepted",
    confidence: 0.8,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeEvidence(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_EVIDENCE_ID,
    userId: "user_123",
    claimId: TEST_CLAIM_ID,
    evidenceKind: "GitHub Repository",
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────

describe("Phase 8 — Security & Canonical Integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── P2-1: Claim Status Transition Bypass ─────────────────────

  describe("P2-1: Claim status transition enforcement", () => {
    it("rejects setting verificationStatus to 'disputed' via claim update", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(makeClaim());

      const { claimService } = await import("@/services/claim.service");
      await expect(
        claimService.update(TEST_CLAIM_ID, TEST_PI_ID, {
          verificationStatus: "disputed",
        }),
      ).rejects.toThrow("Cannot set verification status to 'disputed'");
    });

    it("rejects setting verificationStatus to 'revoked' via claim update", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(makeClaim());

      const { claimService } = await import("@/services/claim.service");
      await expect(
        claimService.update(TEST_CLAIM_ID, TEST_PI_ID, {
          verificationStatus: "revoked",
        }),
      ).rejects.toThrow("Cannot set verification status to 'revoked'");
    });

    it("rejects setting verificationStatus to 'expired' via claim update", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(makeClaim());

      const { claimService } = await import("@/services/claim.service");
      await expect(
        claimService.update(TEST_CLAIM_ID, TEST_PI_ID, {
          verificationStatus: "expired",
        }),
      ).rejects.toThrow("Cannot set verification status to 'expired'");
    });

    it("rejects setting verificationStatus to 'verified' via claim update", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(makeClaim());

      const { claimService } = await import("@/services/claim.service");
      await expect(
        claimService.update(TEST_CLAIM_ID, TEST_PI_ID, {
          verificationStatus: "verified",
        }),
      ).rejects.toThrow("Cannot set verification status to 'verified'");
    });

    it("rejects setting verificationStatus to 'evidence-added' via claim update", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(makeClaim());

      const { claimService } = await import("@/services/claim.service");
      await expect(
        claimService.update(TEST_CLAIM_ID, TEST_PI_ID, {
          verificationStatus: "evidence-added",
        }),
      ).rejects.toThrow("Cannot set verification status to 'evidence-added'");
    });

    it("rejects setting verificationStatus to 'under-review' via claim update", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(makeClaim());

      const { claimService } = await import("@/services/claim.service");
      await expect(
        claimService.update(TEST_CLAIM_ID, TEST_PI_ID, {
          verificationStatus: "under-review",
        }),
      ).rejects.toThrow("Cannot set verification status to 'under-review'");
    });

    it("allows setting verificationStatus to 'accepted' via claim update", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(
        makeClaim({ verificationStatus: "suggested" }),
      );
      mockPrisma.claim.update.mockResolvedValue(
        makeClaim({ verificationStatus: "accepted" }),
      );

      const { claimService } = await import("@/services/claim.service");
      const result = await claimService.update(TEST_CLAIM_ID, TEST_PI_ID, {
        verificationStatus: "accepted",
      });

      expect(result.verificationStatus).toBe("accepted");
    });

    it("allows setting verificationStatus to 'suggested' via claim update", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(makeClaim());
      mockPrisma.claim.update.mockResolvedValue(
        makeClaim({ verificationStatus: "suggested" }),
      );

      const { claimService } = await import("@/services/claim.service");
      const result = await claimService.update(TEST_CLAIM_ID, TEST_PI_ID, {
        verificationStatus: "suggested",
      });

      expect(result.verificationStatus).toBe("suggested");
    });

    it("still allows updating assertionText without touching verificationStatus", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(makeClaim());
      mockPrisma.claim.update.mockResolvedValue(
        makeClaim({ assertionText: "Updated text" }),
      );

      const { claimService } = await import("@/services/claim.service");
      const result = await claimService.update(TEST_CLAIM_ID, TEST_PI_ID, {
        assertionText: "Updated text",
      });

      expect(result.assertionText).toBe("Updated text");
    });

    it("still allows updating confidence without touching verificationStatus", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(makeClaim());
      mockPrisma.claim.update.mockResolvedValue(
        makeClaim({ confidence: 0.95 }),
      );

      const { claimService } = await import("@/services/claim.service");
      const result = await claimService.update(TEST_CLAIM_ID, TEST_PI_ID, {
        confidence: 0.95,
      });

      expect(result.confidence).toBe(0.95);
    });
  });

  // ── P2-2: Verification Evidence Ownership ────────────────────

  describe("P2-2: Verification evidence ownership validation", () => {
    it("rejects verification event with evidenceRecordId belonging to different claim", async () => {
      // Claim belongs to user, but evidence belongs to a different claim
      mockPrisma.claim.findUnique.mockResolvedValue(
        makeClaim({ verificationStatus: "under-review" }),
      );
      mockPrisma.evidenceRecord.findUnique.mockResolvedValue(
        makeEvidence({ claimId: "different_claim_id" }),
      );

      const { verificationEventService } = await import("@/services/verification-event.service");
      await expect(
        verificationEventService.createEvent(
          {
            claimId: TEST_CLAIM_ID,
            evidenceRecordId: OTHER_EVIDENCE_ID,
            eventType: "evidence_reviewed",
            outcome: "supports",
          },
          TEST_PI_ID,
        ),
      ).rejects.toThrow("Evidence record does not belong to this claim");
    });

    it("rejects verification event with nonexistent evidenceRecordId", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(
        makeClaim({ verificationStatus: "under-review" }),
      );
      mockPrisma.evidenceRecord.findUnique.mockResolvedValue(null);

      const { verificationEventService } = await import("@/services/verification-event.service");
      await expect(
        verificationEventService.createEvent(
          {
            claimId: TEST_CLAIM_ID,
            evidenceRecordId: "nonexistent_ev",
            eventType: "evidence_reviewed",
            outcome: "supports",
          },
          TEST_PI_ID,
        ),
      ).rejects.toThrow("Evidence record not found");
    });

    it("allows verification event with evidenceRecordId belonging to correct claim", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(
        makeClaim({ verificationStatus: "under-review" }),
      );
      mockPrisma.evidenceRecord.findUnique.mockResolvedValue(
        makeEvidence({ claimId: TEST_CLAIM_ID }),
      );
      mockPrisma.verificationEvent.create.mockResolvedValue({
        id: "ve_1",
        claimId: TEST_CLAIM_ID,
        evidenceRecordId: TEST_EVIDENCE_ID,
        eventType: "evidence_reviewed",
        previousStatus: "under-review",
        resultingStatus: "under-review",
        outcome: "supports",
        createdAt: new Date(),
      });
      mockPrisma.claim.update.mockResolvedValue({});

      const { verificationEventService } = await import("@/services/verification-event.service");
      const result = await verificationEventService.createEvent(
        {
          claimId: TEST_CLAIM_ID,
          evidenceRecordId: TEST_EVIDENCE_ID,
          eventType: "evidence_reviewed",
          outcome: "supports",
        },
        TEST_PI_ID,
      );

      expect(result.evidenceRecordId).toBe(TEST_EVIDENCE_ID);
    });

    it("allows verification event without evidenceRecordId", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(
        makeClaim({ verificationStatus: "accepted" }),
      );
      mockPrisma.verificationEvent.create.mockResolvedValue({
        id: "ve_2",
        claimId: TEST_CLAIM_ID,
        evidenceRecordId: null,
        eventType: "requested",
        previousStatus: "accepted",
        resultingStatus: "under-review",
        createdAt: new Date(),
      });
      mockPrisma.claim.update.mockResolvedValue({});

      const { verificationEventService } = await import("@/services/verification-event.service");
      const result = await verificationEventService.createEvent(
        {
          claimId: TEST_CLAIM_ID,
          eventType: "requested",
        },
        TEST_PI_ID,
      );

      expect(result.evidenceRecordId).toBeNull();
    });
  });
});
