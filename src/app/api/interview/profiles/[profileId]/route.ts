"use strict";

import { NextRequest, NextResponse } from "next/server";
import { interviewProfileService } from "@/services/interview-profile.service";
import { interviewProfileUpdateSchema } from "@/lib/interview/schemas";
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
    const profile = await interviewProfileService.get(auth.caller.identityId, profileId);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "profiles/[id]:GET");
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { profileId } = await context.params;

  try {
    const input = interviewProfileUpdateSchema.parse(await req.json());
    const profile = await interviewProfileService.update(auth.caller.identityId, profileId, input);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "profiles/[id]:PATCH");
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;
  const { profileId } = await context.params;

  try {
    await interviewProfileService.remove(auth.caller.identityId, profileId);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "profiles/[id]:DELETE");
  }
}
