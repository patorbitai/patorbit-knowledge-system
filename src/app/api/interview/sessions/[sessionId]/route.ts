"use strict";

import { NextRequest, NextResponse } from "next/server";
import { interviewSessionService } from "@/services/interview-session.service";
import { sessionStateSchema } from "@/lib/interview/schemas";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

/** GET — resume a session (pause/resume and recovery use this). */
export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { sessionId } = await context.params;

  try {
    const session = await interviewSessionService.get(auth.caller.identityId, sessionId);
    return NextResponse.json({ session }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "sessions/[id]:GET");
  }
}

/** PATCH — pause, resume or abandon a session. */
export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { sessionId } = await context.params;

  try {
    const input = sessionStateSchema.parse(await req.json());
    const session = await interviewSessionService.setStatus(
      auth.caller.identityId,
      sessionId,
      input.status,
    );
    return NextResponse.json({ session }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "sessions/[id]:PATCH");
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { sessionId } = await context.params;

  try {
    await interviewSessionService.remove(auth.caller.identityId, sessionId);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "sessions/[id]:DELETE");
  }
}
