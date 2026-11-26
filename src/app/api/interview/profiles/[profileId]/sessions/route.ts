"use strict";

import { NextRequest, NextResponse } from "next/server";
import { interviewSessionService } from "@/services/interview-session.service";
import { sessionStartSchema } from "@/lib/interview/schemas";
import { INTERVIEW_USAGE } from "@/lib/interview/constants";
import {
  interviewErrorResponse,
  requireInterviewCaller,
  withMeteredUsage,
} from "@/lib/interview/api";
import { checkAIRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ profileId: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { profileId } = await context.params;

  try {
    const sessions = await interviewSessionService.list(auth.caller.identityId, profileId);
    return NextResponse.json({ sessions }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "sessions:GET");
  }
}

/** POST — start a practice or mock session (metered per session type). */
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { profileId } = await context.params;

  const limit = checkAIRateLimit(auth.caller.userId);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const input = sessionStartSchema.parse(await req.json().catch(() => ({})));
    const feature =
      input.sessionType === "mock" ? INTERVIEW_USAGE.mock : INTERVIEW_USAGE.practice;

    const result = await withMeteredUsage(auth.caller.userId, feature, () =>
      interviewSessionService.start(auth.caller.identityId, profileId, {
        sessionType: input.sessionType,
        roundId: input.roundId ?? null,
        categories: input.categories,
        questionCount: input.questionCount,
      }),
    );
    if (!result.ok) return result.response;

    return NextResponse.json({ session: result.data, remaining: result.remaining }, { status: 201 });
  } catch (err) {
    return interviewErrorResponse(err, "sessions:POST");
  }
}
