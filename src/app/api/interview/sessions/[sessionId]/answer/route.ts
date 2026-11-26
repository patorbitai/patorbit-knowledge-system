"use strict";

import { NextRequest, NextResponse } from "next/server";
import { interviewSessionService } from "@/services/interview-session.service";
import { sessionAnswerSchema } from "@/lib/interview/schemas";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";
import { checkAIRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

/**
 * POST — submit one answer and receive its evaluation.
 * Answers are not separately metered: the session was already counted, and a
 * failed evaluation must not cost extra quota.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { sessionId } = await context.params;

  const limit = checkAIRateLimit(auth.caller.userId);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const input = sessionAnswerSchema.parse(await req.json());
    const session = await interviewSessionService.answer(
      auth.caller.identityId,
      sessionId,
      input,
    );
    return NextResponse.json({ session }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "sessions/answer:POST");
  }
}
