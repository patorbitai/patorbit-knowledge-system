"use strict";

/**
 * GET /api/jobs/search — authenticated, deterministic job discovery across
 * the four M7A-approved sources (Greenhouse, Lever, Ashby, Arbeitnow).
 *
 * Contract:
 *  - 401 without an authenticated session (ownership: session-only; discovery
 *    is global data, no profile/resume is involved).
 *  - 400 with a stable machine `code` for invalid queries (never fetches).
 *  - 429 with the SHARED rate-limit shape (code RATE_LIMITED, retryAfter,
 *    Retry-After header) when the job-source limiter denies before any
 *    upstream call — the same contract M6 established for AI routes.
 *  - 200 with results + per-provider statuses (ok | failed | rate_limited):
 *    one failing source never fails the whole discovery operation.
 *
 * No AI: this route consumes zero ai_generations / ai_tailoring /
 * job_analysis usage — no usage service is ever touched.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { rateLimitResponse } from "@/lib/rate-limit";
import {
  JobSearchRateLimitedError,
  JobSearchValidationError,
  parseJobSearchQuery,
  searchJobs,
} from "@/services/job-discovery.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Please sign in." },
      { status: 401 },
    );
  }

  try {
    const input = parseJobSearchQuery(req.nextUrl.searchParams);
    const result = await searchJobs(session.user.id, input);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (err) {
    if (err instanceof JobSearchValidationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: 400 },
      );
    }
    if (err instanceof JobSearchRateLimitedError) {
      // Shared M6 shape: 429 + code RATE_LIMITED + retryAfter + Retry-After.
      return rateLimitResponse(err.retryAfter);
    }
    return handleApiError(err, "jobs:search:GET");
  }
}
