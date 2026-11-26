"use strict";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { interviewPlanService } from "@/services/interview-plan.service";
import { INTERVIEW_USAGE, QUESTION_CATEGORIES } from "@/lib/interview/constants";
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

const planRequestSchema = z.object({
  roundId: z.string().max(64).nullish(),
  categories: z.array(z.enum(QUESTION_CATEGORIES)).max(6).default([]),
});

export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { profileId } = await context.params;

  try {
    const plan = await interviewPlanService.getLatest(auth.caller.identityId, profileId);
    return NextResponse.json({ plan }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "plan:GET");
  }
}

/** POST — generate a preparation plan (metered: one preparation generation). */
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { profileId } = await context.params;

  const limit = checkAIRateLimit(auth.caller.userId);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const input = planRequestSchema.parse(await req.json().catch(() => ({})));

    const result = await withMeteredUsage(
      auth.caller.userId,
      INTERVIEW_USAGE.preparation,
      () =>
        interviewPlanService.generate(auth.caller.identityId, profileId, {
          roundId: input.roundId ?? null,
          categories: input.categories,
        }),
    );
    if (!result.ok) return result.response;

    return NextResponse.json({ plan: result.data, remaining: result.remaining }, { status: 201 });
  } catch (err) {
    return interviewErrorResponse(err, "plan:POST");
  }
}
