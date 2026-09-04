"use strict";

/**
 * M4 Evidence-Based Optimizer — API Route (Patorbit Phase 1).
 *
 * This route:
 *  1. Receives resume + job description
 *  2. Computes Career Profile (M1) deterministically
 *  3. Computes Job Profile (M2) deterministically
 *  4. Computes Qualification Match (M3) deterministically
 *  5. Runs evidence-grounded AI optimization with anti-fabrication validation
 *  6. Returns traceable, reviewable optimization changes
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAIService } from "@/lib/ai/service";
import { buildCareerProfile } from "@/lib/career-profile";
import { buildJobProfile } from "@/lib/job-profile";
import { buildQualificationMatch } from "@/lib/qualification-match";
import { entitlementService } from "@/services/entitlement.service";
import type { Resume } from "@/types/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // 1. Authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Please sign in." },
      { status: 401 },
    );
  }

  // 2. Entitlement check — evidence optimization is Professional-only
  const entitlements = await entitlementService.getUserEntitlements(session.user.id);
  if (!entitlements.features.careerProfileFull) {
    return NextResponse.json(
      {
        success: false,
        error: "Evidence-Based Optimization requires a Professional subscription.",
        code: "ENTITLEMENT_REQUIRED",
      },
      { status: 403 },
    );
  }

  // 3. Parse request
  let body: unknown;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

  const { resume, jobDescription } = (typeof body === "object" && body !== null
    ? body
    : {}) as { resume?: Resume; jobDescription?: string };

  if (!resume || !jobDescription) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: resume, jobDescription." },
      { status: 400 },
    );
  }

  if (jobDescription.trim().length < 20) {
    return NextResponse.json(
      { success: false, error: "Job description is too short. Please provide a more detailed description." },
      { status: 400 },
    );
  }

  try {
    // 4. Compute M1 — Career Profile (deterministic)
    const careerProfile = buildCareerProfile(resume);

    // 5. Compute M2 — Job Profile (deterministic)
    const jobProfile = buildJobProfile(jobDescription);

    // 6. Compute M3 — Qualification Match (deterministic)
    const qualificationMatch = buildQualificationMatch(careerProfile, jobProfile);

    // 7. Run M4 — Evidence-grounded AI optimization
    const service = getAIService();
    const result = await service.evidenceOptimize({
      resume,
      careerProfile,
      jobProfile,
      qualificationMatch,
      jobDescription,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("[API /ai/evidence-optimize] Error:", err);
    return NextResponse.json(
      { success: false, error: "Evidence optimization failed. Please try again." },
      { status: 500 },
    );
  }
}
