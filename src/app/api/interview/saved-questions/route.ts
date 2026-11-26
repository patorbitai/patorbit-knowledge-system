"use strict";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { savedQuestionSchema } from "@/lib/interview/schemas";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";
import { InterviewValidationError } from "@/services/interview-profile.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;

  try {
    const questions = await prisma.savedPracticeQuestion.findMany({
      where: { professionalIdentityId: auth.caller.identityId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { interviewProfile: { select: { companyName: true, jobTitle: true } } },
    });
    return NextResponse.json(
      {
        questions: questions.map((question) => ({
          id: question.id,
          category: question.category,
          difficulty: question.difficulty,
          text: question.text,
          suggestedAnswer: question.suggestedAnswer,
          interviewProfileId: question.interviewProfileId,
          companyName: question.interviewProfile?.companyName ?? null,
          jobTitle: question.interviewProfile?.jobTitle ?? null,
          createdAt: question.createdAt.toISOString(),
        })),
      },
      { status: 200 },
    );
  } catch (err) {
    return interviewErrorResponse(err, "saved-questions:GET");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;

  try {
    const input = savedQuestionSchema.parse(await req.json());

    if (input.interviewProfileId) {
      const owned = await prisma.interviewProfile.findFirst({
        where: { id: input.interviewProfileId, professionalIdentityId: auth.caller.identityId },
        select: { id: true },
      });
      if (!owned) throw new InterviewValidationError("That interview profile was not found.");
    }

    const question = await prisma.savedPracticeQuestion.create({
      data: {
        professionalIdentityId: auth.caller.identityId,
        interviewProfileId: input.interviewProfileId ?? null,
        sessionId: input.sessionId ?? null,
        category: input.category,
        difficulty: input.difficulty ?? null,
        text: input.text,
        suggestedAnswer: input.suggestedAnswer ?? null,
      },
    });

    return NextResponse.json({ question: { id: question.id } }, { status: 201 });
  } catch (err) {
    return interviewErrorResponse(err, "saved-questions:POST");
  }
}
