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
    professionalIdentity: {
      findUnique: vi.fn(),
    },
  },
}));

import { entitlementService, PLAN_FEATURES } from "../entitlement.service";

describe("Entitlement Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Tier resolution ────────────────────────────────────────────────

  it("resolves Free tier for free user", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Free",
      subscriptionStatus: "inactive",
    });
    const e = await entitlementService.getUserEntitlements("u1");

    expect(e.tier).toBe("Free");
    expect(e.isActive).toBe(false);
  });

  it("resolves Professional tier for active pro user", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Professional",
      subscriptionStatus: "active",
    });
    const e = await entitlementService.getUserEntitlements("u2");

    expect(e.tier).toBe("Professional");
    expect(e.isActive).toBe(true);
  });

  it("falls back to Free when subscription is canceled", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Professional",
      subscriptionStatus: "canceled",
    });
    const e = await entitlementService.getUserEntitlements("u3");

    expect(e.tier).toBe("Free");
    expect(e.isActive).toBe(false);
  });

  it("falls back to Free when subscription is past_due", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Professional",
      subscriptionStatus: "past_due",
    });
    const e = await entitlementService.getUserEntitlements("u4");

    // past_due is NOT active or trialing → Free
    expect(e.tier).toBe("Free");
    expect(e.isActive).toBe(false);
  });

  it("resolves Professional for trialing user", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Professional",
      subscriptionStatus: "trialing",
    });
    const e = await entitlementService.getUserEntitlements("u5");

    expect(e.tier).toBe("Professional");
    expect(e.isActive).toBe(true);
  });

  it("resolves Enterprise for active enterprise user", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Enterprise",
      subscriptionStatus: "active",
    });
    const e = await entitlementService.getUserEntitlements("u_ent");

    expect(e.tier).toBe("Enterprise");
    expect(e.isActive).toBe(true);
  });

  // ── Feature map completeness ───────────────────────────────────────

  it("Free tier has correct features", () => {
    const f = PLAN_FEATURES.Free;
    expect(f.maxResumes).toBe(2);
    expect(f.allTemplates).toBe(false);
    expect(f.aiBasic).toBe(true);
    expect(f.aiAdvanced).toBe(false);
    expect(f.jobAnalysisBasic).toBe(true);
    expect(f.jobAnalysisAdvanced).toBe(false);
    expect(f.qualificationMatchBasic).toBe(true);
    expect(f.qualificationMatchFull).toBe(false);
    expect(f.careerProfileBasic).toBe(true);
    expect(f.careerProfileFull).toBe(false);
    expect(f.careerInsights).toBe(false);
    expect(f.passport).toBe(false);
    expect(f.evidence).toBe(false);
    expect(f.knowledgeGraph).toBe(false);
    expect(f.trustScore).toBe(false);
    expect(f.careerTimeline).toBe(false);
    expect(f.atsBasic).toBe(true);
    expect(f.atsAdvanced).toBe(false);
    expect(f.pdfExport).toBe(true);
    expect(f.prioritySupport).toBe(false);
    expect(f.organizationFeatures).toBe(false);
    expect(f.apiAccess).toBe(false);
    expect(f.sso).toBe(false);
    expect(f.customIntegrations).toBe(false);
  });

  it("Professional tier has correct features", () => {
    const f = PLAN_FEATURES.Professional;
    expect(f.maxResumes).toBe(-1); // unlimited
    expect(f.allTemplates).toBe(true);
    expect(f.aiBasic).toBe(true);
    expect(f.aiAdvanced).toBe(true);
    expect(f.jobAnalysisBasic).toBe(true);
    expect(f.jobAnalysisAdvanced).toBe(true);
    expect(f.qualificationMatchFull).toBe(true);
    expect(f.careerProfileFull).toBe(true);
    expect(f.careerInsights).toBe(true);
    expect(f.passport).toBe(true);
    expect(f.evidence).toBe(true);
    expect(f.knowledgeGraph).toBe(true);
    expect(f.trustScore).toBe(true);
    expect(f.careerTimeline).toBe(true);
    expect(f.atsAdvanced).toBe(true);
    expect(f.pdfExport).toBe(true);
    expect(f.prioritySupport).toBe(true);
    // Enterprise-only features remain false
    expect(f.organizationFeatures).toBe(false);
    expect(f.apiAccess).toBe(false);
    expect(f.sso).toBe(false);
    expect(f.customIntegrations).toBe(false);
  });

  it("Enterprise tier has all features enabled", () => {
    const f = PLAN_FEATURES.Enterprise;
    expect(f.maxResumes).toBe(-1);
    expect(f.allTemplates).toBe(true);
    expect(f.aiAdvanced).toBe(true);
    expect(f.jobAnalysisAdvanced).toBe(true);
    expect(f.qualificationMatchFull).toBe(true);
    expect(f.careerProfileFull).toBe(true);
    expect(f.careerInsights).toBe(true);
    expect(f.passport).toBe(true);
    expect(f.evidence).toBe(true);
    expect(f.knowledgeGraph).toBe(true);
    expect(f.trustScore).toBe(true);
    expect(f.careerTimeline).toBe(true);
    expect(f.atsAdvanced).toBe(true);
    expect(f.pdfExport).toBe(true);
    expect(f.prioritySupport).toBe(true);
    expect(f.organizationFeatures).toBe(true);
    expect(f.apiAccess).toBe(true);
    expect(f.sso).toBe(true);
    expect(f.customIntegrations).toBe(true);
  });

  // ── hasFeature ─────────────────────────────────────────────────────

  it("hasFeature returns correct value for Free user", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Free",
      subscriptionStatus: "inactive",
    });
    expect(await entitlementService.hasFeature("u", "aiAdvanced")).toBe(false);
    expect(await entitlementService.hasFeature("u", "pdfExport")).toBe(true);
  });

  it("hasFeature returns correct value for Pro user", async () => {
    findUniqueMock.mockResolvedValue({
      subscriptionTier: "Professional",
      subscriptionStatus: "active",
    });
    expect(await entitlementService.hasFeature("u", "aiAdvanced")).toBe(true);
    expect(await entitlementService.hasFeature("u", "organizationFeatures")).toBe(false);
  });
});
