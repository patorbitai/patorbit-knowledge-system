"use strict";

import { prisma } from "@/lib/prisma";
import { entitlementService } from "./entitlement.service";

// ─── Usage Limits per Feature per Tier ──────────────────────────────────────
//
// -1 = unlimited

export const USAGE_LIMITS: Record<
  string,
  { Free: number; Professional: number; Enterprise: number }
> = {
  ai_generations: {
    Free: 10,
    Professional: -1,
    Enterprise: -1,
  },
  ai_tailoring: {
    Free: 3,
    Professional: -1,
    Enterprise: -1,
  },
  job_analysis: {
    Free: 5,
    Professional: -1,
    Enterprise: -1,
  },
  evidence_uploads: {
    Free: 5,
    Professional: -1,
    Enterprise: -1,
  },
};

// ─── Feature keys that map to entitlement booleans ──────────────────────────
//
// When a feature has no explicit USAGE_LIMITS entry, we fall back to the
// entitlement boolean to decide access.

export const FEATURE_ENTITLEMENT_MAP: Record<string, string> = {
  ai_advanced: "aiAdvanced",
  job_analysis_advanced: "jobAnalysisAdvanced",
  qualification_match_full: "qualificationMatchFull",
  career_profile_full: "careerProfileFull",
  career_insights: "careerInsights",
  passport: "passport",
  evidence: "evidence",
  knowledge_graph: "knowledgeGraph",
  trust_score: "trustScore",
  career_timeline: "careerTimeline",
  ats_advanced: "atsAdvanced",
};

// ─── Service ────────────────────────────────────────────────────────────────

export const usageService = {
  /**
   * Current billing period key: "YYYY-MM".
   */
  getCurrentPeriodKey(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  },

  /**
   * Get current usage count for a feature in the given period.
   */
  async getUsage(
    userId: string,
    feature: string,
    period?: string,
  ): Promise<number> {
    const p = period || usageService.getCurrentPeriodKey();
    const record = await prisma.usageRecord.findUnique({
      where: {
        userId_feature_period: { userId, feature, period: p },
      },
    });
    return record?.count ?? 0;
  },

  /**
   * Check if a usage increment is allowed, and increment if so.
   *
   * Returns:
   * - allowed: whether the operation may proceed
   * - current: usage count after check (or before if blocked)
   * - limit: tier-specific limit (-1 = unlimited)
   * - remaining: -1 if unlimited, otherwise count of remaining uses
   */
  async checkAndIncrementUsage(
    userId: string,
    feature: string,
    period?: string,
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
  }> {
    const p = period || usageService.getCurrentPeriodKey();
    const entitlements = await entitlementService.getUserEntitlements(userId);
    const limits = USAGE_LIMITS[feature] || {
      Free: 10,
      Professional: -1,
      Enterprise: -1,
    };
    const limit = limits[entitlements.tier] ?? limits.Free;

    const currentCount = await usageService.getUsage(userId, feature, p);

    if (limit !== -1 && currentCount >= limit) {
      return {
        allowed: false,
        current: currentCount,
        limit,
        remaining: 0,
      };
    }

    const updated = await prisma.usageRecord.upsert({
      where: {
        userId_feature_period: { userId, feature, period: p },
      },
      update: { count: { increment: 1 } },
      create: { userId, feature, period: p, count: 1 },
    });

    const newCount = updated.count;
    const remaining =
      limit === -1 ? -1 : Math.max(0, limit - newCount);

    return {
      allowed: limit === -1 || newCount <= limit,
      current: newCount,
      limit,
      remaining,
    };
  },

  /**
   * Check a gated feature that has both an entitlement boolean AND an optional
   * usage limit. Used for features like "advanced AI" where the plan must
   * allow it AND the user must have remaining quota.
   */
  async checkFeatureAccess(
    userId: string,
    featureKey: string,
  ): Promise<{
    allowed: boolean;
    reason: string;
    current?: number;
    limit?: number;
    remaining?: number;
  }> {
    // 1. Check entitlement boolean
    const entitlementFeatureKey =
      FEATURE_ENTITLEMENT_MAP[featureKey] as keyof import("./entitlement.service").PlanFeatures | undefined;

    if (entitlementFeatureKey) {
      const has = await entitlementService.hasFeature(
        userId,
        entitlementFeatureKey,
      );
      if (!has) {
        return {
          allowed: false,
          reason: "This feature requires a Professional subscription.",
        };
      }
    }

    // 2. Check usage limit if one exists
    const usageFeature = featureKey as keyof typeof USAGE_LIMITS;
    if (USAGE_LIMITS[usageFeature]) {
      const result = await usageService.checkAndIncrementUsage(
        userId,
        usageFeature as string,
      );
      if (!result.allowed) {
        return {
          allowed: false,
          reason: `Monthly limit reached. Upgrade to Professional for unlimited access.`,
          current: result.current,
          limit: result.limit,
          remaining: result.remaining,
        };
      }
      return {
        allowed: true,
        reason: "",
        current: result.current,
        limit: result.limit,
        remaining: result.remaining,
      };
    }

    // 3. No usage limit — just entitlement check
    return { allowed: true, reason: "" };
  },
};
