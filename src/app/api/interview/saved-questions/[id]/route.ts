"use strict";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;

  try {
    const deleted = await prisma.savedPracticeQuestion.deleteMany({
      where: { id, professionalIdentityId: auth.caller.identityId },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Question not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "saved-questions/[id]:DELETE");
  }
}
