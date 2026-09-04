"use strict";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { entitlementService } from "@/services/entitlement.service";
import type { PlanFeatures } from "@/services/entitlement.service";

// ─── Auth Check ─────────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  userId: string;
}

/**
 * Verify the request is authenticated. Returns the user or a 401 response.
 */
export async function requireAuth(): Promise<
  { user: AuthenticatedUser; error?: never } | { user?: never; error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 },
      ),
    };
  }
  return { user: { userId: session.user.id } };
}

// ─── Feature Gate ───────────────────────────────────────────────────────────

export async function requireFeature(
  userId: string,
  feature: keyof PlanFeatures,
): Promise<{ allowed: boolean; error?: NextResponse }> {
  const has = await entitlementService.hasFeature(userId, feature);
  if (!has) {
    return {
      allowed: false,
      error: NextResponse.json(
        {
          success: false,
          error: `This feature requires a Professional subscription.`,
          code: "FEATURE_RESTRICTED",
          feature,
        },
        { status: 403 },
      ),
    };
  }
  return { allowed: true };
}

// ─── Resume Limit ───────────────────────────────────────────────────────────

export async function checkResumeLimit(
  userId: string,
): Promise<{ allowed: boolean; error?: NextResponse; current?: number; max?: number }> {
  const result = await entitlementService.checkResumeLimit(userId);
  if (!result.allowed) {
    return {
      allowed: false,
      current: result.current,
      max: result.max,
      error: NextResponse.json(
        {
          success: false,
          error: `Free plan allows up to ${result.max} resumes. Upgrade to Professional for unlimited.`,
          code: "RESUME_LIMIT_REACHED",
          current: result.current,
          max: result.max,
        },
        { status: 403 },
      ),
    };
  }
  return { allowed: true, current: result.current, max: result.max };
}

// ─── Usage Gate ─────────────────────────────────────────────────────────────

export async function checkUsageLimit(
  userId: string,
  feature: string,
): Promise<{
  allowed: boolean;
  error?: NextResponse;
  current?: number;
  limit?: number;
  remaining?: number;
}> {
  const { usageService } = await import("@/services/usage.service");
  const result = await usageService.checkAndIncrementUsage(userId, feature);

  if (!result.allowed) {
    return {
      allowed: false,
      current: result.current,
      limit: result.limit,
      remaining: result.remaining,
      error: NextResponse.json(
        {
          success: false,
          error: `Monthly ${feature.replace(/_/g, " ")} limit reached. Upgrade to Professional for unlimited.`,
          code: "USAGE_LIMIT_REACHED",
          feature,
          current: result.current,
          limit: result.limit,
          remaining: result.remaining,
        },
        { status: 429 },
      ),
    };
  }

  return {
    allowed: true,
    current: result.current,
    limit: result.limit,
    remaining: result.remaining,
  };
}
