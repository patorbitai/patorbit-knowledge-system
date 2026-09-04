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
   * Normalize DB tier strings to canonical PascalCase.
   * DB defaults may store "free" / "professional" (lowercase) while the
   * entitlement system uses "Free" / "Professional" (PascalCase).
   */
  normalizeTier(raw: string | null | undefined): SubscriptionTier {
    const lower = (raw || "").toLowerCase();
    if (lower === "professional") return "Professional";
    if (lower === "enterprise") return "Enterprise";
    return "Free";
  },

  async getUserEntitlements(userId: string): Promise<UserEntitlements> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    });

    const tier = this.normalizeTier(user?.subscriptionTier);
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

  /** Features whose values are numeric (not boolean). */
  numericFeatures: new Set<keyof PlanFeatures>([
    "maxResumes",
  ]),

  /**
   * Quick boolean check for a single feature.
   * Handles both boolean and numeric feature values correctly.
   */
  async hasFeature(
    userId: string,
    feature: keyof PlanFeatures,
  ): Promise<boolean> {
    const entitlements = await this.getUserEntitlements(userId);
    const value = entitlements.features[feature];

    if (this.numericFeatures.has(feature)) {
      // Numeric: -1 means unlimited (available), > 0 means available, 0 means not available
      return typeof value === "number" && value !== 0;
    }

    // Boolean feature
    return value === true;
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
