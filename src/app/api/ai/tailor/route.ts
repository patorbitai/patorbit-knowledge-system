"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { resumeService } from "@/services/resume.service";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { usageService } from "@/services/usage.service";
import { getAIService } from "@/lib/ai/service";
import { AIError } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const MAX_BODY_BYTES = 150 * 1024;
const TIMEOUT_MS = 85_000;

async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new AIError("The AI request timed out. Please try again.", "TIMEOUT", { status: 408 })),
      TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * POST /api/ai/tailor
 *
 * C33.2: Server-authoritative tailoring.
 * Client sends { resumeId, jobDescription }.
 * Server loads the authoritative resume from the database.
 * AI receives server-sourced data — client cannot tamper with the source.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Please sign in." },
      { status: 401 },
    );
  }

  // 2. Rate limit
  const { allowed, retryAfter } = checkAIRateLimit(session.user.id);
  if (!allowed) {
    const r429 = NextResponse.json(
      { success: false, error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
    r429.headers.set("Retry-After", String(retryAfter));
    return r429;
  }

  // 2b. Usage metering for AI tailoring
  const usageCheck = await usageService.checkAndIncrementUsage(session.user.id, "ai_tailoring");
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Monthly AI tailoring limit reached for Free tier. Upgrade to Professional for unlimited.", code: "USAGE_LIMIT_REACHED" },
      { status: 429 },
    );
  }

  // 3. Body size guard
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: "Request body too large." }, { status: 413 });
  }

  // 4. Parse body
  let body: unknown;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON in request body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ success: false, error: "Request body must be a JSON object." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  // 5. Validate resumeId (client must supply resumeId, NOT full resume data)
  if (typeof payload.resumeId !== "string" || payload.resumeId.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid required field: resumeId." },
      { status: 400 },
    );
  }

  if (typeof payload.jobDescription !== "string" || payload.jobDescription.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "Missing required field: jobDescription." },
      { status: 400 },
    );
  }

  if (payload.jobDescription.trim().length < 50) {
    return NextResponse.json(
      { success: false, error: "Job description is too short. Please paste the full job posting." },
      { status: 400 },
    );
  }

  const resumeId = payload.resumeId.trim();
  const jobDescription = payload.jobDescription.trim();

  // 6. Load authoritative resume from the database
  try {
    const identity = await identityService.ensureProfessionalIdentity(session.user.id);

    // Load the resume owned by this ProfessionalIdentity — ownership is enforced.
    const serverResume = await resumeService.get(identity.id, resumeId);

    // Server-sourced authoritative data — NOT client-supplied.
    const authoritativeResume = serverResume.resume;

    // 7. Call AI with authoritative source
    const ai = getAIService();
    const result = await withTimeout(
      ai.tailorResume({
        resume: authoritativeResume as any,
        jobDescription,
      }),
    );

    // 8. Validate the AI response has essential fields
    if (typeof result !== "object" || result === null) {
      throw new AIError("AI returned an unexpected response.", "UPSTREAM", { status: 502 });
    }

    // Ensure matchAnalysis exists
    if (!result.matchAnalysis || typeof result.matchAnalysis !== "object") {
      result.matchAnalysis = {
        matchScore: 0,
        matchedSkills: [],
        partialMatches: [],
        missingSkills: [],
      };
    }

    // Ensure essential resume fields exist
    if (typeof result.name !== "string") result.name = "";
    if (typeof result.summary !== "string") result.summary = "";
    if (!Array.isArray(result.experience)) result.experience = [];
    if (!Array.isArray(result.education)) result.education = [];
    if (!Array.isArray(result.skills)) result.skills = [];
    if (!Array.isArray(result.projects)) result.projects = [];
    if (!Array.isArray(result.certifications)) result.certifications = [];

    return NextResponse.json({
      success: true,
      resume: result,
      matchAnalysis: result.matchAnalysis,
    });
  } catch (err) {
    if (err instanceof AIError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status },
      );
    }

    // If the resume was not found (or belongs to another user), return a safe error.
    const message = err instanceof Error ? err.message : "";
    if (message.includes("not found") || message.includes("NotFound")) {
      return NextResponse.json(
        { success: false, error: "Resume not found." },
        { status: 404 },
      );
    }

    // Check for User not found (stale session after DB reset)
    if (message.includes("User not found")) {
      return NextResponse.json(
        { success: false, error: "Your session has expired. Please sign in again." },
        { status: 401 },
      );
    }

    console.error("[POST /api/ai/tailor]", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong while tailoring the resume." },
      { status: 500 },
    );
  }
}
