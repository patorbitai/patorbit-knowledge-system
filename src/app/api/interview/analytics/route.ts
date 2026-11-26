"use strict";

import { NextRequest, NextResponse } from "next/server";
import { interviewAnalyticsService } from "@/services/interview-analytics.service";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/interview/analytics?profileId=… — global or profile-scoped analytics.
 * Only completed sessions contribute; no sample data is ever returned.
 */
export async function GET(req: NextRequest) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;

  try {
    const profileId = req.nextUrl.searchParams.get("profileId");
    const analytics = profileId
      ? await interviewAnalyticsService.forProfile(auth.caller.identityId, profileId)
      : await interviewAnalyticsService.overview(auth.caller.identityId);
    return NextResponse.json({ analytics }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "analytics:GET");
  }
}
