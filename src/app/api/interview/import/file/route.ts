"use strict";

import { NextRequest, NextResponse } from "next/server";
import {
  FileTooLargeError,
  UnsupportedFileError,
  parseUploadedFile,
} from "@/lib/interview/text-parse";
import { MAX_UPLOAD_BYTES } from "@/lib/interview/constants";
import { interviewEmailService } from "@/services/interview-email.service";
import { interviewErrorResponse, requireInterviewCaller } from "@/lib/interview/api";
import { checkAIRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/interview/import/file — parse an uploaded .txt/.eml/.pdf/.docx and
 * extract interview details from it. Parsing happens server-side; the file is
 * never written to disk.
 */
export async function POST(req: NextRequest) {
  const auth = await requireInterviewCaller();
  if (!auth.ok) return auth.response;

  const limit = checkAIRateLimit(auth.caller.userId);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Choose a file to upload." },
        { status: 400 },
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "FILE_TOO_LARGE", message: "Files must be 8 MB or smaller." },
        { status: 413 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const parsed = await parseUploadedFile(file.name, bytes);
    if (!parsed.text.trim()) {
      return NextResponse.json(
        { error: "EMPTY_DOCUMENT", message: "No readable text was found in that file." },
        { status: 400 },
      );
    }

    const result = await interviewEmailService.extract({
      content: parsed.text,
      subject: parsed.subject ?? file.name,
      sender: parsed.sender ?? null,
      sourceType: "upload",
    });

    return NextResponse.json(
      { ...result, fileKind: parsed.kind, subject: parsed.subject ?? file.name, sender: parsed.sender ?? null },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof FileTooLargeError) {
      return NextResponse.json({ error: "FILE_TOO_LARGE", message: err.message }, { status: 413 });
    }
    if (err instanceof UnsupportedFileError) {
      return NextResponse.json({ error: "UNSUPPORTED_FILE", message: err.message }, { status: 415 });
    }
    return interviewErrorResponse(err, "import/file:POST");
  }
}
