"use strict";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ──────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/services/identity.service", () => ({
  identityService: {
    ensureProfessionalIdentity: vi.fn(),
  },
}));

const mockVerificationService = {
  createEvent: vi.fn(),
  getHistory: vi.fn(),
  getLatest: vi.fn(),
  countEvents: vi.fn(),
};

vi.mock("@/services/verification-event.service", () => ({
  get verificationEventService() {
    return mockVerificationService;
  },
  VerificationError: class VerificationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "VerificationError";
    }
  },
}));

const mockClaimService = {
  getById: vi.fn(),
};

class MockClaimValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaimValidationError";
  }
}

vi.mock("@/services/claim.service", () => ({
  get claimService() {
    return mockClaimService;
  },
  ClaimValidationError: MockClaimValidationError,
}));

// ── Helpers ────────────────────────────────────────────────────
function makeContext(claimId: string) {
  return { params: Promise.resolve({ claimId }) };
}

const mockSession = {
  user: { id: "user_123", name: "Test User", email: "test@example.com" },
};

const mockIdentity = { id: "pi_123", userId: "user_123" };

const mockEvent = {
  id: "evt_1",
  claimId: "claim_1",
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
};

// ── Tests ──────────────────────────────────────────────────────
describe("/api/claims/[claimId]/verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("creates a verification event for authenticated user's claim", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const { identityService } = await import("@/services/identity.service");
      vi.mocked(identityService.ensureProfessionalIdentity).mockResolvedValue(mockIdentity as any);

      mockClaimService.getById.mockResolvedValue({ id: "claim_1", professionalIdentityId: "pi_123" });
      mockVerificationService.createEvent.mockResolvedValue(mockEvent);

      const { POST } = await import("../route");
      const res = await POST(
        new NextRequest("http://localhost/api/claims/claim_1/verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType: "requested", reason: "User request" }),
        }),
        makeContext("claim_1"),
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.eventType).toBe("requested");
    });

    it("rejects unauthenticated request", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { POST } = await import("../route");
      const res = await POST(
        new NextRequest("http://localhost/api/claims/claim_1/verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType: "requested" }),
        }),
        makeContext("claim_1"),
      );

      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid event type", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const { identityService } = await import("@/services/identity.service");
      vi.mocked(identityService.ensureProfessionalIdentity).mockResolvedValue(mockIdentity as any);

      mockClaimService.getById.mockResolvedValue({ id: "claim_1", professionalIdentityId: "pi_123" });
      mockVerificationService.createEvent.mockRejectedValue(
        new (await import("@/services/verification-event.service")).VerificationError("Invalid event type"),
      );

      const { POST } = await import("../route");
      const res = await POST(
        new NextRequest("http://localhost/api/claims/claim_1/verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType: "bogus" }),
        }),
        makeContext("claim_1"),
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET", () => {
    it("returns verification history for authenticated user's claim", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const { identityService } = await import("@/services/identity.service");
      vi.mocked(identityService.ensureProfessionalIdentity).mockResolvedValue(mockIdentity as any);

      mockClaimService.getById.mockResolvedValue({ id: "claim_1", professionalIdentityId: "pi_123" });
      mockVerificationService.getHistory.mockResolvedValue([mockEvent]);

      const { GET } = await import("../route");
      const res = await GET(
        new NextRequest("http://localhost/api/claims/claim_1/verification"),
        makeContext("claim_1"),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.events).toHaveLength(1);
      expect(body.events[0].eventType).toBe("requested");
    });

    it("rejects unauthenticated request", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import("../route");
      const res = await GET(
        new NextRequest("http://localhost/api/claims/claim_1/verification"),
        makeContext("claim_1"),
      );

      expect(res.status).toBe(401);
    });

    it("returns 404 for claim belonging to another user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const { identityService } = await import("@/services/identity.service");
      vi.mocked(identityService.ensureProfessionalIdentity).mockResolvedValue(mockIdentity as any);

      mockClaimService.getById.mockRejectedValue(
        new MockClaimValidationError("Claim not found"),
      );

      const { GET } = await import("../route");
      const res = await GET(
        new NextRequest("http://localhost/api/claims/claim_other/verification"),
        makeContext("claim_other"),
      );

      expect(res.status).toBe(404);
    });
  });
});
