"use strict";

import { prisma } from "@/lib/prisma";
import { entitlementService } from "./entitlement.service";

export const USAGE_LIMITS: Record<string, { Free: number; Professional: number; Enterprise: number }> = {
  ai_generations: {
    Free: 10,
    Professional: -1, // Unlimited
    Enterprise: -1,   // Unlimited
  },
  evidence_uploads: {
    Free: 5,
    Professional: -1,
    Enterprise: -1,
  },
};

export const usageService = {
  getCurrentPeriodKey(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  },

  async getUsage(userId: string, feature: string, period?: string): Promise<number> {
    const p = period || usageService.getCurrentPeriodKey();
    const record = await prisma.usageRecord.findUnique({
      where: {
        userId_feature_period: {
          userId,
          feature,
          period: p,
        },
      },
    });
    return record?.count ?? 0;
  },

  async checkAndIncrementUsage(
    userId: string,
    feature: string,
    period?: string
  ): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
    const p = period || usageService.getCurrentPeriodKey();
    const entitlements = await entitlementService.getUserEntitlements(userId);
    const limits = USAGE_LIMITS[feature] || { Free: 10, Professional: -1, Enterprise: -1 };
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
        userId_feature_period: {
          userId,
          feature,
          period: p,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        userId,
        feature,
        period: p,
        count: 1,
      },
    });

    const newCount = updated.count;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - newCount);

    return {
      allowed: limit === -1 || newCount <= limit,
      current: newCount,
      limit,
      remaining,
    };
  },
};
