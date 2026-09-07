"use strict";

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock prisma ────────────────────────────────────────────────
const mockPrisma = {
  claim: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return mockPrisma;
  },
}));

// ── Test data ──────────────────────────────────────────────────
const TEST_PI_ID = "pi_test_123";
const OTHER_PI_ID = "pi_other_456";

function makeClaim(overrides: Record<string, unknown> = {}) {
  return {
    id: "claim_1",
    professionalIdentityId: TEST_PI_ID,
    assertionText: "Worked at Google as Software Engineer",
    claimType: "Employment",
    sourceActivityId: "experience-0",
    confidence: 0.8,
    reasoning: "Directly stated in resume",
    verificationStatus: "suggested",
    reviewed: false,
    accepted: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────
describe("ClaimService", () => {
  let service: typeof import("@/services/claim.service").claimService;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import after mocks are set up
    const mod = await import("@/services/claim.service");
    service = mod.claimService;
  });

  describe("create", () => {
    it("creates a claim with valid input", async () => {
      const claim = makeClaim();
      mockPrisma.claim.create.mockResolvedValue(claim);

      const result = await service.create(TEST_PI_ID, {
        assertionText: "Worked at Google as Software Engineer",
        claimType: "Employment",
        sourceActivityId: "experience-0",
        confidence: 0.8,
        reasoning: "Directly stated in resume",
      });

      expect(result).toEqual(claim);
      expect(mockPrisma.claim.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          professionalIdentityId: TEST_PI_ID,
          assertionText: "Worked at Google as Software Engineer",
          claimType: "Employment",
          verificationStatus: "suggested",
          reviewed: false,
          accepted: false,
        }),
      });
    });

    it("rejects empty assertion text", async () => {
      await expect(
        service.create(TEST_PI_ID, {
          assertionText: "",
          claimType: "Employment",
        }),
      ).rejects.toThrow("Assertion text is required");
    });

    it("rejects invalid claim type", async () => {
      await expect(
        service.create(TEST_PI_ID, {
          assertionText: "Test claim",
          claimType: "InvalidType",
        }),
      ).rejects.toThrow("Invalid claim type");
    });

    it("rejects confidence out of range", async () => {
      await expect(
        service.create(TEST_PI_ID, {
          assertionText: "Test claim",
          claimType: "Skill",
          confidence: 1.5,
        }),
      ).rejects.toThrow("Confidence must be between 0 and 1");
    });

    it("accepts all valid claim types", async () => {
      const types = ["Employment", "Education", "Project", "Skill", "Certification", "Contribution"];
      for (const claimType of types) {
        mockPrisma.claim.create.mockResolvedValue(makeClaim({ claimType }));
        const result = await service.create(TEST_PI_ID, {
          assertionText: `Test ${claimType}`,
          claimType,
        });
        expect(result.claimType).toBe(claimType);
      }
    });
  });

  describe("getById", () => {
    it("returns a claim that belongs to the PI", async () => {
      const claim = makeClaim();
      mockPrisma.claim.findUnique.mockResolvedValue(claim);

      const result = await service.getById("claim_1", TEST_PI_ID);
      expect(result).toEqual(claim);
    });

    it("rejects a claim belonging to another PI", async () => {
      const claim = makeClaim({ professionalIdentityId: OTHER_PI_ID });
      mockPrisma.claim.findUnique.mockResolvedValue(claim);

      await expect(service.getById("claim_1", TEST_PI_ID)).rejects.toThrow(
        "Claim not found",
      );
    });

    it("rejects a nonexistent claim", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(null);

      await expect(service.getById("nonexistent", TEST_PI_ID)).rejects.toThrow(
        "Claim not found",
      );
    });
  });

  describe("list", () => {
    it("lists claims for a PI", async () => {
      const claims = [makeClaim(), makeClaim({ id: "claim_2" })];
      mockPrisma.claim.findMany.mockResolvedValue(claims);

      const result = await service.list(TEST_PI_ID);
      expect(result).toHaveLength(2);
      expect(mockPrisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { professionalIdentityId: TEST_PI_ID },
          orderBy: { createdAt: "desc" },
        }),
      );
    });

    it("filters by claim type", async () => {
      mockPrisma.claim.findMany.mockResolvedValue([]);

      await service.list(TEST_PI_ID, { claimType: "Skill" });
      expect(mockPrisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { professionalIdentityId: TEST_PI_ID, claimType: "Skill" },
        }),
      );
    });
  });

  describe("update", () => {
    it("updates a claim that belongs to the PI", async () => {
      const existing = makeClaim();
      const updated = { ...existing, assertionText: "Updated text" };
      mockPrisma.claim.findUnique.mockResolvedValue(existing);
      mockPrisma.claim.update.mockResolvedValue(updated);

      const result = await service.update("claim_1", TEST_PI_ID, {
        assertionText: "Updated text",
      });
      expect(result.assertionText).toBe("Updated text");
    });

    it("rejects updating a claim belonging to another PI", async () => {
      const claim = makeClaim({ professionalIdentityId: OTHER_PI_ID });
      mockPrisma.claim.findUnique.mockResolvedValue(claim);

      await expect(
        service.update("claim_1", TEST_PI_ID, { assertionText: "Hacked" }),
      ).rejects.toThrow("Claim not found");
    });

    it("prevents setting verified status directly", async () => {
      const existing = makeClaim();
      mockPrisma.claim.findUnique.mockResolvedValue(existing);

      await expect(
        service.update("claim_1", TEST_PI_ID, { verificationStatus: "verified" }),
      ).rejects.toThrow("Cannot set verification status to 'verified'");
    });

    it("allows setting evidence-added status", async () => {
      const existing = makeClaim();
      const updated = { ...existing, verificationStatus: "evidence-added" };
      mockPrisma.claim.findUnique.mockResolvedValue(existing);
      mockPrisma.claim.update.mockResolvedValue(updated);

      const result = await service.update("claim_1", TEST_PI_ID, {
        verificationStatus: "evidence-added",
      });
      expect(result.verificationStatus).toBe("evidence-added");
    });
  });

  describe("delete", () => {
    it("deletes a claim that belongs to the PI", async () => {
      const claim = makeClaim();
      mockPrisma.claim.findUnique.mockResolvedValue(claim);
      mockPrisma.claim.delete.mockResolvedValue(claim);

      await expect(service.delete("claim_1", TEST_PI_ID)).resolves.toBeUndefined();
      expect(mockPrisma.claim.delete).toHaveBeenCalledWith({ where: { id: "claim_1" } });
    });

    it("rejects deleting a claim belonging to another PI", async () => {
      const claim = makeClaim({ professionalIdentityId: OTHER_PI_ID });
      mockPrisma.claim.findUnique.mockResolvedValue(claim);

      await expect(service.delete("claim_1", TEST_PI_ID)).rejects.toThrow(
        "Claim not found",
      );
    });
  });

  describe("count", () => {
    it("counts claims for a PI", async () => {
      mockPrisma.claim.count.mockResolvedValue(5);

      const result = await service.count(TEST_PI_ID);
      expect(result).toBe(5);
    });
  });
});
