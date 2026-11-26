"use strict";

import { NextRequest, NextResponse } from "next/server";
import { interviewRoundService } from "@/services/interview-round.service";
import { interviewRoundCreateSchema } from "@/lib/interview/schemas";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ profileId: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { profileId } = await context.params;

  try {
    const rounds = await interviewRoundService.list(auth.caller.identityId, profileId);
    return NextResponse.json({ rounds }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "rounds:GET");
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { profileId } = await context.params;

  try {
    const input = interviewRoundCreateSchema.parse(await req.json());
    const round = await interviewRoundService.create(auth.caller.identityId, profileId, input);
    return NextResponse.json({ round }, { status: 201 });
  } catch (err) {
    return interviewErrorResponse(err, "rounds:POST");
  }
}
