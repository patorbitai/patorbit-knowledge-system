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

const mockClaimService = {
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/services/claim.service", () => ({
  get claimService() {
    return mockClaimService;
  },
  ClaimValidationError: class ClaimValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ClaimValidationError";
    }
  },
}));

// ── Helpers ────────────────────────────────────────────────────
function makeContext(claimId: string) {
  return { params: Promise.resolve({ claimId }) };
}

const mockSession = {
  user: { id: "user_123", name: "Test User", email: "test@example.com" },
};

const mockIdentity = { id: "pi_123", userId: "user_123" };

const mockClaim = {
  id: "claim_1",
  professionalIdentityId: "pi_123",
  assertionText: "Worked at Google",
  claimType: "Employment",
  sourceActivityId: null,
  confidence: 0.5,
  reasoning: null,
  verificationStatus: "suggested",
  reviewed: false,
  accepted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Tests ──────────────────────────────────────────────────────
describe("/api/claims/[claimId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns a claim owned by the user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const { identityService } = await import("@/services/identity.service");
      vi.mocked(identityService.ensureProfessionalIdentity).mockResolvedValue(mockIdentity as any);

      mockClaimService.getById.mockResolvedValue(mockClaim);

      const { GET } = await import("../route");
      const res = await GET(new NextRequest("http://localhost/api/claims/claim_1"), makeContext("claim_1"));

      expect(res.status).toBe(200);
    });

    it("returns 404 for claim belonging to another user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const { identityService } = await import("@/services/identity.service");
      vi.mocked(identityService.ensureProfessionalIdentity).mockResolvedValue(mockIdentity as any);

      mockClaimService.getById.mockRejectedValue(
        new (await import("@/services/claim.service")).ClaimValidationError("Claim not found"),
      );

      const { GET } = await import("../route");
      const res = await GET(new NextRequest("http://localhost/api/claims/claim_other"), makeContext("claim_other"));

      expect(res.status).toBe(404);
    });

    it("rejects unauthenticated request", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import("../route");
      const res = await GET(new NextRequest("http://localhost/api/claims/claim_1"), makeContext("claim_1"));

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH", () => {
    it("updates a claim owned by the user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const { identityService } = await import("@/services/identity.service");
      vi.mocked(identityService.ensureProfessionalIdentity).mockResolvedValue(mockIdentity as any);

      const updated = { ...mockClaim, assertionText: "Updated" };
      mockClaimService.update.mockResolvedValue(updated);

      const { PATCH } = await import("../route");
      const res = await PATCH(
        new NextRequest("http://localhost/api/claims/claim_1", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assertionText: "Updated" }),
        }),
        makeContext("claim_1"),
      );

      expect(res.status).toBe(200);
    });

    it("rejects unauthenticated request", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { PATCH } = await import("../route");
      const res = await PATCH(
        new NextRequest("http://localhost/api/claims/claim_1", { method: "PATCH" }),
        makeContext("claim_1"),
      );

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE", () => {
    it("deletes a claim owned by the user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const { identityService } = await import("@/services/identity.service");
      vi.mocked(identityService.ensureProfessionalIdentity).mockResolvedValue(mockIdentity as any);

      mockClaimService.delete.mockResolvedValue(undefined);

      const { DELETE } = await import("../route");
      const res = await DELETE(
        new NextRequest("http://localhost/api/claims/claim_1", { method: "DELETE" }),
        makeContext("claim_1"),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("rejects unauthenticated request", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { DELETE } = await import("../route");
      const res = await DELETE(
        new NextRequest("http://localhost/api/claims/claim_1", { method: "DELETE" }),
        makeContext("claim_1"),
      );

      expect(res.status).toBe(401);
    });

    it("returns 404 for claim belonging to another user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const { identityService } = await import("@/services/identity.service");
      vi.mocked(identityService.ensureProfessionalIdentity).mockResolvedValue(mockIdentity as any);

      mockClaimService.delete.mockRejectedValue(
        new (await import("@/services/claim.service")).ClaimValidationError("Claim not found"),
      );

      const { DELETE } = await import("../route");
      const res = await DELETE(
        new NextRequest("http://localhost/api/claims/claim_other", { method: "DELETE" }),
        makeContext("claim_other"),
      );

      expect(res.status).toBe(404);
    });
  });
});
