"use strict";

import { NextRequest, NextResponse } from "next/server";
import { emailAttachSchema } from "@/lib/interview/schemas";
import { interviewEmailService } from "@/services/interview-email.service";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST — store the imported email alongside the profile it produced. */
export async function POST(req: NextRequest) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;

  try {
    const input = emailAttachSchema.parse(await req.json());
    const email = await interviewEmailService.attach(auth.caller.identityId, {
      interviewProfileId: input.interviewProfileId,
      content: input.content,
      subject: input.subject ?? null,
      sender: input.sender ?? null,
      sourceType: input.sourceType,
      extractedFields: input.extractedFields,
    });
    return NextResponse.json({ email }, { status: 201 });
  } catch (err) {
    return interviewErrorResponse(err, "emails:POST");
  }
}
