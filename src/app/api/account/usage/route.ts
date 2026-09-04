"use strict";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { usageService } from "@/services/usage.service";
import { entitlementService } from "@/services/entitlement.service";

/**
 * GET /api/account/usage
 *
 * Returns the current user's usage counts and limits for all tracked features.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const period = usageService.getCurrentPeriodKey();
  const entitlements = await entitlementService.getUserEntitlements(userId);

  const [aiGenerations, jobAnalysis, aiTailoring] = await Promise.all([
    usageService.getUsage(userId, "ai_generations", period),
    usageService.getUsage(userId, "job_analysis", period),
    usageService.getUsage(userId, "ai_tailoring", period),
  ]);

  // Resume count
  const resumeLimit = await entitlementService.checkResumeLimit(userId);

  return NextResponse.json({
    ai_generations: {
      current: aiGenerations,
      limit: entitlements.features.aiAdvanced ? -1 : 10,
    },
    job_analysis: {
      current: jobAnalysis,
      limit: entitlements.features.jobAnalysisAdvanced ? -1 : 5,
    },
    ai_tailoring: {
      current: aiTailoring,
      limit: entitlements.features.aiAdvanced ? -1 : 3,
    },
    resumeCount: {
      current: resumeLimit.current,
      max: resumeLimit.max,
      limit: resumeLimit.max,
    },
  });
}
