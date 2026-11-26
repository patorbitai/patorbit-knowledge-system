"use strict";

import { NextRequest, NextResponse } from "next/server";
import { interviewProfileService } from "@/services/interview-profile.service";
import { interviewProfileCreateSchema } from "@/lib/interview/schemas";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/interview/profiles — the caller's interview profiles. */
export async function GET() {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;

  try {
    const profiles = await interviewProfileService.list(auth.caller.identityId);
    return NextResponse.json({ profiles }, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "profiles:GET");
  }
}

/** POST /api/interview/profiles — create a profile (and its first round). */
export async function POST(req: NextRequest) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const input = interviewProfileCreateSchema.parse(body);
    const profile = await interviewProfileService.create(auth.caller.identityId, input);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    return interviewErrorResponse(err, "profiles:POST");
  }
}
