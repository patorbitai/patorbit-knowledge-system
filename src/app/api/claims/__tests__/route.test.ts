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
  create: vi.fn(),
  list: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
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
function makeRequest(body: unknown, method = "POST"): NextRequest {
  return new NextRequest("http://localhost/api/claims", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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
describe("/api/claims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("creates a claim for authenticated user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const { identityService } = await import("@/services/identity.service");
      vi.mocked(identityService.ensureProfessionalIdentity).mockResolvedValue(mockIdentity as any);

      mockClaimService.create.mockResolvedValue(mockClaim);

      const { POST } = await import("../route");
      const res = await POST(makeRequest({
        assertionText: "Worked at Google",
        claimType: "Employment",
      }));

      expect(res.status).toBe(201);
      expect(mockClaimService.create).toHaveBeenCalledWith("pi_123", {
        assertionText: "Worked at Google",
        claimType: "Employment",
        sourceActivityId: undefined,
        confidence: undefined,
        reasoning: undefined,
      });
    });

    it("rejects unauthenticated request", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { POST } = await import("../route");
      const res = await POST(makeRequest({
        assertionText: "Test",
        claimType: "Skill",
      }));

      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid input", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const { identityService } = await import("@/services/identity.service");
      vi.mocked(identityService.ensureProfessionalIdentity).mockResolvedValue(mockIdentity as any);

      mockClaimService.create.mockRejectedValue(
        new (await import("@/services/claim.service")).ClaimValidationError("Assertion text is required"),
      );

      const { POST } = await import("../route");
      const res = await POST(makeRequest({
        assertionText: "",
        claimType: "Skill",
      }));

      expect(res.status).toBe(400);
    });
  });

  describe("GET", () => {
    it("lists claims for authenticated user", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const { identityService } = await import("@/services/identity.service");
      vi.mocked(identityService.ensureProfessionalIdentity).mockResolvedValue(mockIdentity as any);

      mockClaimService.list.mockResolvedValue([mockClaim]);

      const { GET } = await import("../route");
      const res = await GET();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.claims).toHaveLength(1);
    });

    it("rejects unauthenticated request", async () => {
      const { getServerSession } = await import("next-auth");
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import("../route");
      const res = await GET();

      expect(res.status).toBe(401);
    });
  });
});
