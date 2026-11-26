"use strict";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAIService } from "@/lib/ai/service";
import { buildProfileContext } from "@/lib/interview/context";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";
import { InterviewNotFoundError } from "@/services/interview-profile.service";
import { checkAIRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

const explainSchema = z.object({ questionId: z.string().min(1).max(80) });

/** POST — "explain this question" in the practice workspace. */
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { sessionId } = await context.params;

  const limit = checkAIRateLimit(auth.caller.userId);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const { questionId } = explainSchema.parse(await req.json());
    const session = await prisma.practiceSession.findFirst({
      where: { id: sessionId, interviewProfile: { professionalIdentityId: auth.caller.identityId } },
    });
    if (!session) throw new InterviewNotFoundError("Practice session not found.");

    const questions = Array.isArray(session.questions)
      ? (session.questions as { id: string; question: string; category: string }[])
      : [];
    const question = questions.find((entry) => entry.id === questionId);
    if (!question) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Question not found." }, { status: 404 });
    }

    const profile = await prisma.interviewProfile.findUnique({ where: { id: session.interviewProfileId } });
    if (!profile) throw new InterviewNotFoundError("Interview profile not found.");
    const round = session.roundId
      ? await prisma.interviewRound.findUnique({ where: { id: session.roundId } })
      : null;

    const profileContext = await buildProfileContext(auth.caller.identityId, profile, round);
    const service = getAIService();
    const explanation = await service.interviewExplain({
      context: profileContext,
      question: question.question,
      category: question.category,
    });

    return NextResponse.json({ explanation: explanation.content }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "sessions/explain:POST");
  }
}
