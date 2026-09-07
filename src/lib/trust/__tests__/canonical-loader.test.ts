"use strict";

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock prisma ────────────────────────────────────────────────
const mockPrisma = {
  professionalIdentity: {
    findUnique: vi.fn(),
  },
  claim: {
    findMany: vi.fn(),
  },
  evidenceRecord: {
    findMany: vi.fn(),
  },
  verificationEvent: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return mockPrisma;
  },
}));

// Mock deriveTrust to return a predictable result
vi.mock("@/lib/trust/derivation", () => ({
  deriveTrust: vi.fn((input) => ({
    score: input.claims.length > 0 ? 50 : 0,
    level: input.claims.length > 0 ? "Established" : "Unrated",
    algorithmVersion: "v1",
    breakdown: [],
    reasons: [],
    derivedAt: new Date().toISOString(),
    summary: {
      totalClaims: input.claims.length,
      verifiedClaims: 0,
      claimsWithEvidence: input.evidence.length,
      claimsWithoutEvidence: 0,
      totalEvidence: input.evidence.length,
      totalVerificationEvents: input.verificationEvents.length,
      evidenceCoveragePercent: 0,
      verificationRate: 0,
    },
  })),
}));

// ── Test data ──────────────────────────────────────────────────
const USER_A = "user_a";
const PI_A = "pi_a";

function makeIdentity(userId: string, piId: string) {
  return { id: piId, userId };
}

function makeClaim(id: string, piId: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    professionalIdentityId: piId,
    assertionText: `Claim ${id}`,
    claimType: "Skill",
    verificationStatus: "accepted",
    confidence: 0.8,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeEvidence(id: string, userId: string, claimId: string | null = null) {
  return {
    id,
    userId,
    claimId,
    evidenceKind: "GitHub Repository",
  };
}

// ── Tests ──────────────────────────────────────────────────────

describe("Canonical Trust Input Loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadCanonicalTrustData", () => {
    it("returns empty data when no ProfessionalIdentity exists", async () => {
      mockPrisma.professionalIdentity.findUnique.mockResolvedValue(null);

      const { loadCanonicalTrustData } = await import("@/lib/trust/canonical-loader");
      const result = await loadCanonicalTrustData("nonexistent_user");

      expect(result.claims).toHaveLength(0);
      expect(result.evidence).toHaveLength(0);
      expect(result.verificationEvents).toHaveLength(0);
    });

    it("loads claims scoped to the user's ProfessionalIdentity", async () => {
      mockPrisma.professionalIdentity.findUnique.mockResolvedValue(makeIdentity(USER_A, PI_A));
      mockPrisma.claim.findMany.mockResolvedValue([
        makeClaim("c1", PI_A),
        makeClaim("c2", PI_A),
      ]);
      // When claims exist: 1st call = claimed evidence, 2nd call = unclaimed evidence
      mockPrisma.evidenceRecord.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.verificationEvent.findMany.mockResolvedValue([]);

      const { loadCanonicalTrustData } = await import("@/lib/trust/canonical-loader");
      const result = await loadCanonicalTrustData(USER_A);

      expect(result.claims).toHaveLength(2);
      expect(mockPrisma.claim.findMany).toHaveBeenCalledWith({
        where: { professionalIdentityId: PI_A },
      });
    });

    it("P1-1 FIX: scopes unclaimed evidence to authenticated userId only", async () => {
      mockPrisma.professionalIdentity.findUnique.mockResolvedValue(makeIdentity(USER_A, PI_A));
      // No claims → only ONE evidenceRecord.findMany call (unclaimed evidence)
      mockPrisma.claim.findMany.mockResolvedValue([]);
      mockPrisma.evidenceRecord.findMany.mockResolvedValueOnce([
        makeEvidence("ev_a1", USER_A),
      ]);
      mockPrisma.verificationEvent.findMany.mockResolvedValue([]);

      const { loadCanonicalTrustData } = await import("@/lib/trust/canonical-loader");
      const result = await loadCanonicalTrustData(USER_A);

      // Should only include User A's unclaimed evidence
      expect(result.evidence).toHaveLength(1);
      expect(result.evidence[0].id).toBe("ev_a1");

      // Verify the unclaimed evidence query was scoped to userId
      const unclaimedCall = mockPrisma.evidenceRecord.findMany.mock.calls[0][0];
      expect(unclaimedCall.where).toEqual({
        claimId: null,
        userId: USER_A,
      });
    });

    it("P1-1 FIX: does NOT include other users' unclaimed evidence", async () => {
      mockPrisma.professionalIdentity.findUnique.mockResolvedValue(makeIdentity(USER_A, PI_A));
      // No claims → only ONE evidenceRecord.findMany call (unclaimed evidence)
      mockPrisma.claim.findMany.mockResolvedValue([]);
      // User A has no unclaimed evidence
      mockPrisma.evidenceRecord.findMany.mockResolvedValueOnce([]);
      mockPrisma.verificationEvent.findMany.mockResolvedValue([]);

      const { loadCanonicalTrustData } = await import("@/lib/trust/canonical-loader");
      const result = await loadCanonicalTrustData(USER_A);

      // User A should see 0 evidence — User B's unclaimed evidence must NOT appear
      expect(result.evidence).toHaveLength(0);

      // Verify the query was scoped to USER_A
      const unclaimedCall = mockPrisma.evidenceRecord.findMany.mock.calls[0][0];
      expect(unclaimedCall.where.userId).toBe(USER_A);
    });

    it("includes claimed evidence belonging to user's own claims", async () => {
      mockPrisma.professionalIdentity.findUnique.mockResolvedValue(makeIdentity(USER_A, PI_A));
      mockPrisma.claim.findMany.mockResolvedValue([makeClaim("c1", PI_A)]);
      // When claims exist: 1st call = claimed evidence, 2nd call = unclaimed evidence
      mockPrisma.evidenceRecord.findMany
        .mockResolvedValueOnce([makeEvidence("ev_c1", USER_A, "c1")])
        .mockResolvedValueOnce([]);
      mockPrisma.verificationEvent.findMany.mockResolvedValue([]);

      const { loadCanonicalTrustData } = await import("@/lib/trust/canonical-loader");
      const result = await loadCanonicalTrustData(USER_A);

      expect(result.evidence).toHaveLength(1);
      expect(result.evidence[0].id).toBe("ev_c1");
    });

    it("loads verification events scoped to user's claims", async () => {
      mockPrisma.professionalIdentity.findUnique.mockResolvedValue(makeIdentity(USER_A, PI_A));
      mockPrisma.claim.findMany.mockResolvedValue([makeClaim("c1", PI_A)]);
      mockPrisma.evidenceRecord.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.verificationEvent.findMany.mockResolvedValue([
        {
          id: "ve1",
          claimId: "c1",
          evidenceRecordId: null,
          eventType: "requested",
          previousStatus: "accepted",
          resultingStatus: "under-review",
          outcome: null,
          createdAt: new Date(),
        },
      ]);

      const { loadCanonicalTrustData } = await import("@/lib/trust/canonical-loader");
      const result = await loadCanonicalTrustData(USER_A);

      expect(result.verificationEvents).toHaveLength(1);
      expect(result.verificationEvents[0].id).toBe("ve1");
    });
  });

  describe("deriveTrustForUser", () => {
    it("returns a TrustReport derived from canonical data", async () => {
      mockPrisma.professionalIdentity.findUnique.mockResolvedValue(makeIdentity(USER_A, PI_A));
      mockPrisma.claim.findMany.mockResolvedValue([makeClaim("c1", PI_A)]);
      mockPrisma.evidenceRecord.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.verificationEvent.findMany.mockResolvedValue([]);

      const { deriveTrustForUser } = await import("@/lib/trust/canonical-loader");
      const result = await deriveTrustForUser(USER_A);

      expect(result.score).toBe(50);
      expect(result.algorithmVersion).toBe("v1");
      expect(result.level).toBe("Established");
    });

    it("returns empty TrustReport when no PI exists", async () => {
      mockPrisma.professionalIdentity.findUnique.mockResolvedValue(null);

      const { deriveTrustForUser } = await import("@/lib/trust/canonical-loader");
      const result = await deriveTrustForUser("nonexistent");

      expect(result.score).toBe(0);
    });
  });
});
