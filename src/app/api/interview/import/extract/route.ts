"use strict";

import { NextRequest, NextResponse } from "next/server";
import { emailExtractSchema } from "@/lib/interview/schemas";
import { interviewEmailService } from "@/services/interview-email.service";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";
import { checkAIRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 200 * 1024;

/**
 * POST /api/interview/import/extract — extract interview details from pasted
 * or uploaded email text. Nothing is saved here; the user reviews first.
 *
 * Extraction is not metered as a preparation generation: it is cheap, and a
 * failed extraction must never cost the user quota.
 */
export async function POST(req: NextRequest) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "PAYLOAD_TOO_LARGE", message: "Paste at most 40,000 characters." },
      { status: 413 },
    );
  }

  const limit = checkAIRateLimit(auth.caller.userId);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const input = emailExtractSchema.parse(await req.json());
    const result = await interviewEmailService.extract(input);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return interviewErrorResponse(err, "import/extract:POST");
  }
}
