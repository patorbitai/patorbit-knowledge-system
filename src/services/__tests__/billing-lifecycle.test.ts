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
    usageRecord: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    professionalIdentity: {
      findUnique: vi.fn(),
    },
  },
}));

import { entitlementService } from "../entitlement.service";

describe("Billing Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("grants Professional features for active subscriber", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Professional",
      subscriptionStatus: "active",
    });
    const e = await entitlementService.getUserEntitlements("u1");

    expect(e.tier).toBe("Professional");
    expect(e.isActive).toBe(true);
    expect(e.features.trustScore).toBe(true);
    expect(e.features.knowledgeGraph).toBe(true);
    expect(e.features.evidence).toBe(true);
    expect(e.features.maxResumes).toBe(-1);
    expect(e.features.aiAdvanced).toBe(true);
    expect(e.features.jobAnalysisAdvanced).toBe(true);
  });

  it("downgrades to Free when subscription is past_due", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Professional",
      subscriptionStatus: "past_due",
    });
    const e = await entitlementService.getUserEntitlements("u2");

    expect(e.tier).toBe("Free");
    expect(e.isActive).toBe(false);
    expect(e.features.trustScore).toBe(false);
    expect(e.features.maxResumes).toBe(2);
  });

  it("downgrades to Free after subscription is canceled", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Professional",
      subscriptionStatus: "canceled",
    });
    const e = await entitlementService.getUserEntitlements("u3");

    expect(e.tier).toBe("Free");
    expect(e.isActive).toBe(false);
    expect(e.features.trustScore).toBe(false);
    expect(e.features.knowledgeGraph).toBe(false);
    expect(e.features.passport).toBe(false);
    expect(e.features.maxResumes).toBe(2);
  });

  it("downgrades to Free when tier is free regardless of status", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Free",
      subscriptionStatus: "inactive",
    });
    const e = await entitlementService.getUserEntitlements("u4");

    expect(e.tier).toBe("Free");
    expect(e.features.pdfExport).toBe(true);
    expect(e.features.aiBasic).toBe(true);
  });

  it("preserves Professional access during trialing", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Professional",
      subscriptionStatus: "trialing",
    });
    const e = await entitlementService.getUserEntitlements("u5");

    expect(e.tier).toBe("Professional");
    expect(e.isActive).toBe(true);
    expect(e.features.aiAdvanced).toBe(true);
  });

  it("Enterprise tier gets organization features", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Enterprise",
      subscriptionStatus: "active",
    });
    const e = await entitlementService.getUserEntitlements("u6");

    expect(e.tier).toBe("Enterprise");
    expect(e.features.organizationFeatures).toBe(true);
    expect(e.features.apiAccess).toBe(true);
    expect(e.features.sso).toBe(true);
    expect(e.features.customIntegrations).toBe(true);
  });

  // ── DB case normalization ────────────────────────────────────

  it("resolves Professional from lowercase 'professional' in DB", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "professional",
      subscriptionStatus: "active",
    });
    const e = await entitlementService.getUserEntitlements("u_lower");

    expect(e.tier).toBe("Professional");
    expect(e.isActive).toBe(true);
    expect(e.features.aiAdvanced).toBe(true);
    expect(e.features.trustScore).toBe(true);
  });

  it("resolves Free from lowercase 'free' in DB", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "free",
      subscriptionStatus: "inactive",
    });
    const e = await entitlementService.getUserEntitlements("u_free_l");

    expect(e.tier).toBe("Free");
    expect(e.features.maxResumes).toBe(2);
    expect(e.features.aiAdvanced).toBe(false);
  });
});
