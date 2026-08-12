"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

import { entitlementService } from "../entitlement.service";

describe("EPIC-06 Phase 2: Subscription Feature Gating & Entitlements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("determines correct entitlements for Free user", async () => {
    findUniqueMock.mockResolvedValue({ subscriptionTier: "Free", subscriptionStatus: "inactive" });
    const entitlements = await entitlementService.getUserEntitlements("user_free");

    expect(entitlements.tier).toBe("Free");
    expect(entitlements.isActive).toBe(false);
    expect(entitlements.features.trustScore).toBe(false);
    expect(entitlements.features.knowledgeGraph).toBe(false);
    expect(entitlements.features.aiResumeBuilder).toBe(true);
  });

  it("determines correct entitlements for active Professional user", async () => {
    findUniqueMock.mockResolvedValue({ subscriptionTier: "Professional", subscriptionStatus: "active" });
    const entitlements = await entitlementService.getUserEntitlements("user_pro");

    expect(entitlements.tier).toBe("Professional");
    expect(entitlements.isActive).toBe(true);
    expect(entitlements.features.trustScore).toBe(true);
    expect(entitlements.features.knowledgeGraph).toBe(true);
    expect(entitlements.features.evidenceManagement).toBe(true);
    expect(entitlements.features.apiAccess).toBe(false);
  });

  it("determines correct entitlements for Enterprise user", async () => {
    findUniqueMock.mockResolvedValue({ subscriptionTier: "Enterprise", subscriptionStatus: "active" });
    const entitlements = await entitlementService.getUserEntitlements("user_ent");

    expect(entitlements.tier).toBe("Enterprise");
    expect(entitlements.isActive).toBe(true);
    expect(entitlements.features.apiAccess).toBe(true);
    expect(entitlements.features.sso).toBe(true);
  });

  it("falls back to Free features when subscription is canceled or inactive", async () => {
    findUniqueMock.mockResolvedValue({ subscriptionTier: "Professional", subscriptionStatus: "canceled" });
    const entitlements = await entitlementService.getUserEntitlements("user_canceled");

    expect(entitlements.tier).toBe("Free");
    expect(entitlements.isActive).toBe(false);
    expect(entitlements.features.trustScore).toBe(false);
  });
});
