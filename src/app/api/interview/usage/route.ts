"use strict";

import { NextResponse } from "next/server";
import { entitlementService } from "@/services/entitlement.service";
import { usageService } from "@/services/usage.service";
import { INTERVIEW_USAGE } from "@/lib/interview/constants";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/interview/usage — plan tier and remaining interview quota. */
export async function GET() {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;

  try {
    const entitlements = await entitlementService.getUserEntitlements(auth.caller.userId);
    const [preparation, practice, mock] = await Promise.all([
      usageService.peekUsage(auth.caller.userId, INTERVIEW_USAGE.preparation),
      usageService.peekUsage(auth.caller.userId, INTERVIEW_USAGE.practice),
      usageService.peekUsage(auth.caller.userId, INTERVIEW_USAGE.mock),
    ]);

    return NextResponse.json(
      {
        tier: entitlements.tier,
        features: {
          advancedQuestions: entitlements.features.interviewAdvancedQuestions,
          detailedReports: entitlements.features.interviewDetailedReports,
        },
        usage: { preparation, practice, mock },
      },
      { status: 200 },
    );
  } catch (err) {
    return interviewErrorResponse(err, "usage:GET");
  }
}
