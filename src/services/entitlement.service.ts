"use strict";

import { prisma } from "@/lib/prisma";

// ─── Tier & Status Types ────────────────────────────────────────────────────

export type SubscriptionTier = "Free" | "Professional" | "Enterprise";
export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete";

// ─── Feature Flags ──────────────────────────────────────────────────────────

export interface PlanFeatures {
  // Resume
  maxResumes: number; // -1 = unlimited

  // Templates
  allTemplates: boolean;

  // AI
  aiBasic: boolean;
  aiAdvanced: boolean;

  // Job analysis
  jobAnalysisBasic: boolean;
  jobAnalysisAdvanced: boolean;

  // Career intelligence
  qualificationMatchBasic: boolean;
  qualificationMatchFull: boolean;
  careerProfileBasic: boolean;
  careerProfileFull: boolean;
  careerInsights: boolean;

  // Professional Identity
  passport: boolean;
  evidence: boolean;
  knowledgeGraph: boolean;
  trustScore: boolean;
  careerTimeline: boolean;

  // ATS
  atsBasic: boolean;
  atsAdvanced: boolean;

  // Export
  pdfExport: boolean;

  // Support & Org
  prioritySupport: boolean;
  organizationFeatures: boolean;
  apiAccess: boolean;
  sso: boolean;
  customIntegrations: boolean;
}

// ─── Authoritative Plan Definitions ─────────────────────────────────────────

export const PLAN_FEATURES: Record<SubscriptionTier, PlanFeatures> = {
  Free: {
    maxResumes: 2,
    allTemplates: false,
    aiBasic: true,
    aiAdvanced: false,
    jobAnalysisBasic: true,
    jobAnalysisAdvanced: false,
    qualificationMatchBasic: true,
    qualificationMatchFull: false,
    careerProfileBasic: true,
    careerProfileFull: false,
    careerInsights: false,
    passport: false,
    evidence: false,
    knowledgeGraph: false,
    trustScore: false,
    careerTimeline: false,
    atsBasic: true,
    atsAdvanced: false,
    pdfExport: true,
    prioritySupport: false,
    organizationFeatures: false,
    apiAccess: false,
    sso: false,
    customIntegrations: false,
  },

  Professional: {
    maxResumes: -1, // unlimited
    allTemplates: true,
    aiBasic: true,
    aiAdvanced: true,
    jobAnalysisBasic: true,
    jobAnalysisAdvanced: true,
    qualificationMatchBasic: true,
    qualificationMatchFull: true,
    careerProfileBasic: true,
    careerProfileFull: true,
    careerInsights: true,
    passport: true,
    evidence: true,
    knowledgeGraph: true,
    trustScore: true,
    careerTimeline: true,
    atsBasic: true,
    atsAdvanced: true,
    pdfExport: true,
    prioritySupport: true,
    organizationFeatures: false,
    apiAccess: false,
    sso: false,
    customIntegrations: false,
  },

  Enterprise: {
    maxResumes: -1,
    allTemplates: true,
    aiBasic: true,
    aiAdvanced: true,
    jobAnalysisBasic: true,
    jobAnalysisAdvanced: true,
    qualificationMatchBasic: true,
    qualificationMatchFull: true,
    careerProfileBasic: true,
    careerProfileFull: true,
    careerInsights: true,
    passport: true,
    evidence: true,
    knowledgeGraph: true,
    trustScore: true,
    careerTimeline: true,
    atsBasic: true,
    atsAdvanced: true,
    pdfExport: true,
    prioritySupport: true,
    organizationFeatures: true,
    apiAccess: true,
    sso: true,
    customIntegrations: true,
  },
};

// ─── User Entitlements Response ─────────────────────────────────────────────

export interface UserEntitlements {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isActive: boolean;
  features: PlanFeatures;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const entitlementService = {
  /**
   * Resolve the effective tier for a user.
   *
   * - If subscription is active or trialing AND tier is not Free → use that tier.
   * - Otherwise → fall back to Free.
   */
  async getUserEntitlements(userId: string): Promise<UserEntitlements> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    });

    const tier = (user?.subscriptionTier as SubscriptionTier) || "Free";
    const status =
      (user?.subscriptionStatus as SubscriptionStatus) || "inactive";
    const isActive = status === "active" || status === "trialing";
    const effectiveTier: SubscriptionTier =
      isActive && tier !== "Free" ? tier : "Free";

    return {
      tier: effectiveTier,
      status,
      isActive,
      features: PLAN_FEATURES[effectiveTier],
    };
  },

  /**
   * Quick boolean check for a single feature.
   */
  async hasFeature(
    userId: string,
    feature: keyof PlanFeatures,
  ): Promise<boolean> {
    const entitlements = await this.getUserEntitlements(userId);
    return Boolean(entitlements.features[feature]);
  },

  /**
   * Check if user can create another resume.
   * Returns { allowed, current, max }.
   */
  async checkResumeLimit(
    userId: string,
  ): Promise<{ allowed: boolean; current: number; max: number }> {
    const entitlements = await this.getUserEntitlements(userId);
    const max = entitlements.features.maxResumes;

    if (max === -1) {
      return { allowed: true, current: 0, max: -1 };
    }

    // Count existing resumes
    const identity = await prisma.professionalIdentity.findUnique({
      where: { userId },
      select: {
        resumes: { select: { id: true } },
      },
    });

    const current = (identity as { resumes?: { id: string }[] } | null)?.resumes?.length ?? 0;
    return { allowed: current < max, current, max };
  },
};
