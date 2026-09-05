"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { handleApiError } from "@/lib/api-error";
import {
  resumeService,
  ResumeValidationError,
  ResumeIdConflictError,
  type SaveResumeInput,
} from "@/services/resume.service";
import { mapProfileToResume, isEmptyResumePayload, type ProfileData } from "@/lib/resume-seeding";
import { checkResumeLimit } from "@/lib/api-entitlement";

/**
 * /api/resumes — list and create the authenticated user's resumes.
 *
 * Phase 0 (ADR-003): server foundation only. Ownership is always derived from
 * the authenticated session → ProfessionalIdentity; the client can never supply
 * a professionalIdentityId or userId as authority.
 */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    const resumes = await resumeService.list(identity.id);
    return NextResponse.json({ resumes }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err, "resumes:GET");
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // C57: Server-side resume limit enforcement for Starter tier
    const limitCheck = await checkResumeLimit(session.user.id);
    if (!limitCheck.allowed) {
      return limitCheck.error!;
    }

    const body = (await req.json()) as SaveResumeInput;
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );

    // C36.1: Server-authoritative resume seeding.
    // If the client sends an empty resume payload, seed it from the
    // authenticated user's ProfessionalIdentity profile data.
    if (body.resume && typeof body.resume === "object" && isEmptyResumePayload(body.resume as Record<string, unknown>)) {
      const profileData = (identity.profileData as ProfileData | null) || null;
      if (profileData && typeof profileData === "object") {
        body.resume = mapProfileToResume(body.resume as Record<string, any>, profileData);
      }
    }

    const resume = await resumeService.create(identity.id, body);
    return NextResponse.json(resume, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof ResumeValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    // C16: Cross-identity duplicate — resumeId belongs to another user.
    // Return 409 so the client can generate a new resumeId.
    if (err instanceof ResumeIdConflictError) {
      return NextResponse.json(
        { error: "resumeId_conflict", message: err.message, resumeId: err.resumeId },
        { status: 409 },
      );
    }
    return handleApiError(err, "resumes:POST");
  }
}
