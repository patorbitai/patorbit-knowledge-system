"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";

const { findUniqueMock, upsertMock, findUniqueUsageMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  upsertMock: vi.fn(),
  findUniqueUsageMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    usageRecord: {
      findUnique: findUniqueUsageMock,
      upsert: upsertMock,
    },
    user: {
      findUnique: findUniqueMock,
    },
    professionalIdentity: {
      findUnique: vi.fn(),
    },
  },
}));

import { usageService, USAGE_LIMITS } from "../usage.service";
import { entitlementService } from "../entitlement.service";

describe("Usage Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getUsage ──────────────────────────────────────────────────────

  it("returns 0 when no usage record exists", async () => {
    findUniqueUsageMock.mockResolvedValue(null);
    const usage = await usageService.getUsage("u1", "ai_generations", "2026-03");
    expect(usage).toBe(0);
  });

  it("returns count from existing record", async () => {
    findUniqueUsageMock.mockResolvedValue({ count: 7 });
    const usage = await usageService.getUsage("u1", "ai_generations", "2026-03");
    expect(usage).toBe(7);
  });

  // ── checkAndIncrementUsage ────────────────────────────────────────

  it("allows incrementing when below free limit", async () => {
    vi.spyOn(entitlementService, "getUserEntitlements").mockResolvedValue({
      tier: "Free",
      status: "inactive",
      isActive: false,
      features: {} as any,
    });
    findUniqueUsageMock.mockResolvedValue({ count: 2 });
    upsertMock.mockResolvedValue({ count: 3 });

    const result = await usageService.checkAndIncrementUsage("u1", "ai_generations", "2026-03");
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(7);
  });

  it("blocks when free limit is reached", async () => {
    vi.spyOn(entitlementService, "getUserEntitlements").mockResolvedValue({
      tier: "Free",
      status: "inactive",
      isActive: false,
      features: {} as any,
    });
    findUniqueUsageMock.mockResolvedValue({ count: 10 });

    const result = await usageService.checkAndIncrementUsage("u1", "ai_generations", "2026-03");
    expect(result.allowed).toBe(false);
    expect(result.current).toBe(10);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(0);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("allows unlimited usage for Professional tier", async () => {
    vi.spyOn(entitlementService, "getUserEntitlements").mockResolvedValue({
      tier: "Professional",
      status: "active",
      isActive: true,
      features: {} as any,
    });
    findUniqueUsageMock.mockResolvedValue({ count: 50 });
    upsertMock.mockResolvedValue({ count: 51 });

    const result = await usageService.checkAndIncrementUsage("u1", "ai_generations", "2026-03");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(-1);
    expect(result.remaining).toBe(-1);
  });

  it("enforces job_analysis limits for Free tier", async () => {
    vi.spyOn(entitlementService, "getUserEntitlements").mockResolvedValue({
      tier: "Free",
      status: "inactive",
      isActive: false,
      features: {} as any,
    });
    findUniqueUsageMock.mockResolvedValue({ count: 5 });
    // job_analysis Free limit is 5

    const result = await usageService.checkAndIncrementUsage("u1", "job_analysis", "2026-03");
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(5);
  });

  it("allows unlimited job_analysis for Professional tier", async () => {
    vi.spyOn(entitlementService, "getUserEntitlements").mockResolvedValue({
      tier: "Professional",
      status: "active",
      isActive: true,
      features: {} as any,
    });
    findUniqueUsageMock.mockResolvedValue({ count: 20 });
    upsertMock.mockResolvedValue({ count: 21 });

    const result = await usageService.checkAndIncrementUsage("u1", "job_analysis", "2026-03");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(-1);
  });

  it("enforces ai_tailoring limits for Free tier", async () => {
    vi.spyOn(entitlementService, "getUserEntitlements").mockResolvedValue({
      tier: "Free",
      status: "inactive",
      isActive: false,
      features: {} as any,
    });
    findUniqueUsageMock.mockResolvedValue({ count: 3 });
    // ai_tailoring Free limit is 3

    const result = await usageService.checkAndIncrementUsage("u1", "ai_tailoring", "2026-03");
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(3);
  });

  // ── checkFeatureAccess ────────────────────────────────────────────

  it("allows basic AI for Free user within quota", async () => {
    vi.spyOn(entitlementService, "getUserEntitlements").mockResolvedValue({
      tier: "Free",
      status: "inactive",
      isActive: false,
      features: {} as any,
    });
    vi.spyOn(entitlementService, "hasFeature").mockResolvedValue(true);
    findUniqueUsageMock.mockResolvedValue({ count: 3 });
    upsertMock.mockResolvedValue({ count: 4 });

    const result = await usageService.checkFeatureAccess("u1", "ai_generations");
    expect(result.allowed).toBe(true);
  });

  it("blocks advanced AI for Free user (entitlement)", async () => {
    vi.spyOn(entitlementService, "hasFeature").mockResolvedValue(false);

    const result = await usageService.checkFeatureAccess("u1", "ai_advanced");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Professional subscription");
  });

  it("allows advanced AI for Pro user", async () => {
    vi.spyOn(entitlementService, "hasFeature").mockResolvedValue(true);

    const result = await usageService.checkFeatureAccess("u1", "ai_advanced");
    expect(result.allowed).toBe(true);
  });

  it("returns allowed for feature with no usage limit", async () => {
    vi.spyOn(entitlementService, "hasFeature").mockResolvedValue(true);

    const result = await usageService.checkFeatureAccess("u1", "career_insights");
    expect(result.allowed).toBe(true);
  });

  it("blocks feature with no entitlement", async () => {
    vi.spyOn(entitlementService, "hasFeature").mockResolvedValue(false);

    const result = await usageService.checkFeatureAccess("u1", "knowledge_graph");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Professional");
  });

  // ── USAGE_LIMITS completeness ─────────────────────────────────────

  it("has limits for all tracked features", () => {
    expect(USAGE_LIMITS.ai_generations).toBeDefined();
    expect(USAGE_LIMITS.ai_tailoring).toBeDefined();
    expect(USAGE_LIMITS.job_analysis).toBeDefined();
    expect(USAGE_LIMITS.evidence_uploads).toBeDefined();
  });

  it("Professional tier has unlimited for all features", () => {
    for (const [, limits] of Object.entries(USAGE_LIMITS)) {
      expect(limits.Professional).toBe(-1);
      expect(limits.Enterprise).toBe(-1);
    }
  });
});
