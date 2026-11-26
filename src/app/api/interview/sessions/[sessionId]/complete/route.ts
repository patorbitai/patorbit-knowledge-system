"use strict";

import { NextRequest, NextResponse } from "next/server";
import { interviewSessionService } from "@/services/interview-session.service";
import { interviewPlanService } from "@/services/interview-plan.service";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";
import { checkAIRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

/** POST — finish the session and generate its report. */
export async function POST(_req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { sessionId } = await context.params;

  const limit = checkAIRateLimit(auth.caller.userId);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const session = await interviewSessionService.complete(auth.caller.identityId, sessionId);
    // Completing a session can change plan coverage.
    await interviewPlanService
      .refreshProgress(auth.caller.identityId, session.interviewProfileId)
      .catch(() => undefined);
    return NextResponse.json({ session }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "sessions/complete:POST");
  }
}
