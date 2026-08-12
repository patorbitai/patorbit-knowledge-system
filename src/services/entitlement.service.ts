"use strict";

import { prisma } from "@/lib/prisma";

export type SubscriptionTier = "Free" | "Professional" | "Enterprise";
export type SubscriptionStatus = "active" | "inactive" | "canceled" | "past_due" | "trialing" | "incomplete";

export interface UserEntitlements {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isActive: boolean;
  features: {
    aiResumeBuilder: boolean;
    basicAi: boolean;
    resumeExport: boolean;
    passport: boolean;
    unlimitedResumes: boolean;
    knowledgeGraph: boolean;
    trustScore: boolean;
    evidenceManagement: boolean;
    careerTimeline: boolean;
    advancedAi: boolean;
    apiAccess: boolean;
    sso: boolean;
  };
}

export const PLAN_FEATURES: Record<SubscriptionTier, UserEntitlements["features"]> = {
  Free: {
    aiResumeBuilder: true,
    basicAi: true,
    resumeExport: true,
    passport: true,
    unlimitedResumes: false,
    knowledgeGraph: false,
    trustScore: false,
    evidenceManagement: false,
    careerTimeline: false,
    advancedAi: false,
    apiAccess: false,
    sso: false,
  },
  Professional: {
    aiResumeBuilder: true,
    basicAi: true,
    resumeExport: true,
    passport: true,
    unlimitedResumes: true,
    knowledgeGraph: true,
    trustScore: true,
    evidenceManagement: true,
    careerTimeline: true,
    advancedAi: true,
    apiAccess: false,
    sso: false,
  },
  Enterprise: {
    aiResumeBuilder: true,
    basicAi: true,
    resumeExport: true,
    passport: true,
    unlimitedResumes: true,
    knowledgeGraph: true,
    trustScore: true,
    evidenceManagement: true,
    careerTimeline: true,
    advancedAi: true,
    apiAccess: true,
    sso: true,
  },
};

export const entitlementService = {
  async getUserEntitlements(userId: string): Promise<UserEntitlements> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    });

    const tier = (user?.subscriptionTier as SubscriptionTier) || "Free";
    const status = (user?.subscriptionStatus as SubscriptionStatus) || "inactive";
    const isActive = status === "active" || status === "trialing";
    const effectiveTier: SubscriptionTier = (isActive && tier !== "Free") ? tier : "Free";

    return {
      tier: effectiveTier,
      status,
      isActive,
      features: PLAN_FEATURES[effectiveTier],
    };
  },

  async hasFeature(userId: string, feature: keyof UserEntitlements["features"]): Promise<boolean> {
    const entitlements = await this.getUserEntitlements(userId);
    return entitlements.features[feature];
  },
};
