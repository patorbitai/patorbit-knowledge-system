"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";

const { findUniqueMock, upsertMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  upsertMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    usageRecord: {
      findUnique: findUniqueMock,
      upsert: upsertMock,
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { usageService, USAGE_LIMITS } from "../usage.service";
import { entitlementService } from "../entitlement.service";

describe("EPIC-06 Phase 3: Usage Metering & Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves current usage correctly", async () => {
    findUniqueMock.mockResolvedValue({ count: 3 });
    const usage = await usageService.getUsage("user_1", "ai_generations", "2026-03");
    expect(usage).toBe(3);
    expect(findUniqueMock).toHaveBeenCalled();
  });

  it("allows incrementing usage when below free limit", async () => {
    vi.spyOn(entitlementService, "getUserEntitlements").mockResolvedValue({
      tier: "Free",
      status: "inactive",
      isActive: false,
      features: {} as any,
    });
    findUniqueMock.mockResolvedValue({ count: 2 });
    upsertMock.mockResolvedValue({ count: 3 });

    const result = await usageService.checkAndIncrementUsage("user_free", "ai_generations", "2026-03");
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(7);
  });

  it("blocks usage when free limit is reached", async () => {
    vi.spyOn(entitlementService, "getUserEntitlements").mockResolvedValue({
      tier: "Free",
      status: "inactive",
      isActive: false,
      features: {} as any,
    });
    findUniqueMock.mockResolvedValue({ count: 10 });

    const result = await usageService.checkAndIncrementUsage("user_free", "ai_generations", "2026-03");
    expect(result.allowed).toBe(false);
    expect(result.current).toBe(10);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(0);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("allows unlimited usage for Professional tier (-1 limit)", async () => {
    vi.spyOn(entitlementService, "getUserEntitlements").mockResolvedValue({
      tier: "Professional",
      status: "active",
      isActive: true,
      features: {} as any,
    });
    findUniqueMock.mockResolvedValue({ count: 50 });
    upsertMock.mockResolvedValue({ count: 51 });

    const result = await usageService.checkAndIncrementUsage("user_pro", "ai_generations", "2026-03");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(-1);
    expect(result.remaining).toBe(-1);
  });
});
