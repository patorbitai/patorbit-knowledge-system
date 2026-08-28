"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import {
  resumeService,
  ResumeValidationError,
  type SaveResumeInput,
} from "@/services/resume.service";

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
    const message =
      err instanceof Error ? err.message : "Failed to fetch resumes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as SaveResumeInput;
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    const resume = await resumeService.create(identity.id, body);
    return NextResponse.json(resume, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof ResumeValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : "Failed to create resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
