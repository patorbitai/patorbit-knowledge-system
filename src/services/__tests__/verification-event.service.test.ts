"use strict";

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────
const mockPrisma = {
  verificationEvent: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
  },
  claim: {
    findUnique: vi.fn(),
    update: vi.fn(),
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

function makeClaim(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_CLAIM_ID,
    professionalIdentityId: TEST_PI_ID,
    assertionText: "Worked at Google",
    claimType: "Employment",
    verificationStatus: "accepted",
    ...overrides,
  };
}

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_1",
    claimId: TEST_CLAIM_ID,
    evidenceRecordId: null,
    eventType: "requested",
    previousStatus: "accepted",
    resultingStatus: "under-review",
    outcome: null,
    reason: null,
    actorId: "user_123",
    actorType: "user",
    metadata: null,
    createdAt: new Date("2026-09-07"),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────
describe("VerificationEventService", () => {
  let service: typeof import("@/services/verification-event.service").verificationEventService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/services/verification-event.service");
    service = mod.verificationEventService;
  });

  describe("createEvent", () => {
    it("creates a valid verification event and updates claim status", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(makeClaim());
      mockPrisma.verificationEvent.create.mockResolvedValue(makeEvent());
      mockPrisma.claim.update.mockResolvedValue({});

      const result = await service.createEvent(
        {
          claimId: TEST_CLAIM_ID,
          eventType: "requested",
          reason: "User requested verification",
          actorId: "user_123",
        },
        TEST_PI_ID,
      );

      expect(result).toBeDefined();
      expect(mockPrisma.verificationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            claimId: TEST_CLAIM_ID,
            eventType: "requested",
            previousStatus: "accepted",
            resultingStatus: "under-review",
          }),
        }),
      );
      expect(mockPrisma.claim.update).toHaveBeenCalledWith({
        where: { id: TEST_CLAIM_ID },
        data: { verificationStatus: "under-review" },
      });
    });

    it("rejects event for nonexistent claim", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(null);

      await expect(
        service.createEvent(
          { claimId: "nonexistent", eventType: "requested" },
          TEST_PI_ID,
        ),
      ).rejects.toThrow("Claim not found");
    });

    it("rejects event for claim belonging to another PI", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(
        makeClaim({ professionalIdentityId: OTHER_PI_ID }),
      );

      await expect(
        service.createEvent(
          { claimId: TEST_CLAIM_ID, eventType: "requested" },
          TEST_PI_ID,
        ),
      ).rejects.toThrow("Claim not found");
    });

    it("rejects invalid event type", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(makeClaim());

      await expect(
        service.createEvent(
          { claimId: TEST_CLAIM_ID, eventType: "invalid_type" },
          TEST_PI_ID,
        ),
      ).rejects.toThrow("Invalid event type");
    });

    it("rejects invalid status transition", async () => {
      // Claim is already "accepted" — cannot go directly to "verified"
      mockPrisma.claim.findUnique.mockResolvedValue(
        makeClaim({ verificationStatus: "accepted" }),
      );

      await expect(
        service.createEvent(
          { claimId: TEST_CLAIM_ID, eventType: "verified" },
          TEST_PI_ID,
        ),
      ).rejects.toThrow("Invalid status transition");
    });

    it("allows accepted → under-review via requested", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(
        makeClaim({ verificationStatus: "accepted" }),
      );
      mockPrisma.verificationEvent.create.mockResolvedValue(makeEvent());
      mockPrisma.claim.update.mockResolvedValue({});

      const result = await service.createEvent(
        { claimId: TEST_CLAIM_ID, eventType: "requested" },
        TEST_PI_ID,
      );

      expect(result.resultingStatus).toBe("under-review");
    });

    it("allows under-review → verified via verified event", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(
        makeClaim({ verificationStatus: "under-review" }),
      );
      mockPrisma.verificationEvent.create.mockResolvedValue(
        makeEvent({ eventType: "verified", previousStatus: "under-review", resultingStatus: "verified" }),
      );
      mockPrisma.claim.update.mockResolvedValue({});

      const result = await service.createEvent(
        { claimId: TEST_CLAIM_ID, eventType: "verified", reason: "Evidence reviewed and confirmed" },
        TEST_PI_ID,
      );

      expect(result.resultingStatus).toBe("verified");
      expect(result.previousStatus).toBe("under-review");
    });

    it("allows verified → revoked via revoked event", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(
        makeClaim({ verificationStatus: "verified" }),
      );
      mockPrisma.verificationEvent.create.mockResolvedValue(
        makeEvent({ eventType: "revoked", previousStatus: "verified", resultingStatus: "revoked" }),
      );
      mockPrisma.claim.update.mockResolvedValue({});

      const result = await service.createEvent(
        { claimId: TEST_CLAIM_ID, eventType: "revoked", reason: "Evidence found to be fabricated" },
        TEST_PI_ID,
      );

      expect(result.resultingStatus).toBe("revoked");
    });

    it("rejects invalid outcome for evidence_reviewed", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(
        makeClaim({ verificationStatus: "under-review" }),
      );

      await expect(
        service.createEvent(
          { claimId: TEST_CLAIM_ID, eventType: "evidence_reviewed", outcome: "invalid_outcome" },
          TEST_PI_ID,
        ),
      ).rejects.toThrow("Invalid outcome");
    });

    it("accepts valid outcome for evidence_reviewed", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(
        makeClaim({ verificationStatus: "under-review" }),
      );
      mockPrisma.verificationEvent.create.mockResolvedValue(
        makeEvent({ eventType: "evidence_reviewed", outcome: "supports" }),
      );
      mockPrisma.claim.update.mockResolvedValue({});

      const result = await service.createEvent(
        { claimId: TEST_CLAIM_ID, eventType: "evidence_reviewed", outcome: "supports" },
        TEST_PI_ID,
      );

      expect(result.outcome).toBe("supports");
      // evidence_reviewed keeps status at under-review
      expect(result.resultingStatus).toBe("under-review");
    });
  });

  describe("audit trail immutability", () => {
    it("preserves full event history across status transitions", async () => {
      // Simulate: accepted → under-review → verified → revoked
      const events = [];

      // Event 1: accepted → under-review
      mockPrisma.claim.findUnique.mockResolvedValueOnce(
        makeClaim({ verificationStatus: "accepted" }),
      );
      mockPrisma.verificationEvent.create.mockResolvedValueOnce(
        makeEvent({ id: "evt_1", eventType: "requested", previousStatus: "accepted", resultingStatus: "under-review" }),
      );
      mockPrisma.claim.update.mockResolvedValueOnce({});
      events.push(await service.createEvent(
        { claimId: TEST_CLAIM_ID, eventType: "requested" },
        TEST_PI_ID,
      ));

      // Event 2: under-review → verified
      mockPrisma.claim.findUnique.mockResolvedValueOnce(
        makeClaim({ verificationStatus: "under-review" }),
      );
      mockPrisma.verificationEvent.create.mockResolvedValueOnce(
        makeEvent({ id: "evt_2", eventType: "verified", previousStatus: "under-review", resultingStatus: "verified" }),
      );
      mockPrisma.claim.update.mockResolvedValueOnce({});
      events.push(await service.createEvent(
        { claimId: TEST_CLAIM_ID, eventType: "verified", reason: "Confirmed" },
        TEST_PI_ID,
      ));

      // Event 3: verified → revoked
      mockPrisma.claim.findUnique.mockResolvedValueOnce(
        makeClaim({ verificationStatus: "verified" }),
      );
      mockPrisma.verificationEvent.create.mockResolvedValueOnce(
        makeEvent({ id: "evt_3", eventType: "revoked", previousStatus: "verified", resultingStatus: "revoked" }),
      );
      mockPrisma.claim.update.mockResolvedValueOnce({});
      events.push(await service.createEvent(
        { claimId: TEST_CLAIM_ID, eventType: "revoked", reason: "Fabricated" },
        TEST_PI_ID,
      ));

      // Verify all events exist with correct data
      expect(events).toHaveLength(3);
      expect(events[0].eventType).toBe("requested");
      expect(events[0].resultingStatus).toBe("under-review");
      expect(events[1].eventType).toBe("verified");
      expect(events[1].resultingStatus).toBe("verified");
      expect(events[2].eventType).toBe("revoked");
      expect(events[2].resultingStatus).toBe("revoked");

      // Verify event 1 was NOT mutated (it still says verified, not revoked)
      expect(events[0].resultingStatus).toBe("under-review");
      expect(events[1].resultingStatus).toBe("verified");
    });
  });

  describe("getHistory", () => {
    it("returns chronological event history", async () => {
      const events = [makeEvent({ id: "evt_1" }), makeEvent({ id: "evt_2" })];
      mockPrisma.verificationEvent.findMany.mockResolvedValue(events);

      const result = await service.getHistory(TEST_CLAIM_ID);
      expect(result).toHaveLength(2);
      expect(mockPrisma.verificationEvent.findMany).toHaveBeenCalledWith({
        where: { claimId: TEST_CLAIM_ID },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("getLatest", () => {
    it("returns the most recent event", async () => {
      mockPrisma.verificationEvent.findFirst.mockResolvedValue(makeEvent({ id: "evt_latest" }));

      const result = await service.getLatest(TEST_CLAIM_ID);
      expect(result?.id).toBe("evt_latest");
    });
  });

  describe("isTransitionValid", () => {
    it("returns true for valid transitions", () => {
      expect(service.isTransitionValid("accepted", "under-review")).toBe(true);
      expect(service.isTransitionValid("under-review", "verified")).toBe(true);
      expect(service.isTransitionValid("verified", "revoked")).toBe(true);
      expect(service.isTransitionValid("verified", "expired")).toBe(true);
    });

    it("returns false for invalid transitions", () => {
      expect(service.isTransitionValid("accepted", "verified")).toBe(false);
      expect(service.isTransitionValid("suggested", "verified")).toBe(false);
      expect(service.isTransitionValid("verified", "accepted")).toBe(false);
    });
  });
});
