"use strict";

import { NextRequest, NextResponse } from "next/server";
import { interviewRoundService } from "@/services/interview-round.service";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ roundId: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { roundId } = await context.params;

  try {
    const round = await interviewRoundService.update(
      auth.caller.identityId,
      roundId,
      await req.json(),
    );
    return NextResponse.json({ round }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "rounds/[id]:PATCH");
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { roundId } = await context.params;

  try {
    await interviewRoundService.remove(auth.caller.identityId, roundId);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "rounds/[id]:DELETE");
  }
}
