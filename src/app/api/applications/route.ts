"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import {
  jobApplicationService,
  JobApplicationValidationError,
  type CreateJobApplicationInput,
} from "@/services/job-application.service";

/**
 * /api/applications — list and create the authenticated user's job applications.
 *
 * C55: Job Application Workspace.
 * Ownership is derived from the authenticated session → ProfessionalIdentity.
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
    const applications = await jobApplicationService.list(identity.id);
    return NextResponse.json({ applications }, { status: 200 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch applications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as CreateJobApplicationInput;
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );

    const application = await jobApplicationService.create(identity.id, body);
    return NextResponse.json(application, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof JobApplicationValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : "Failed to create application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
