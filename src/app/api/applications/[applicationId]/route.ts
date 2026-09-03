"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import {
  jobApplicationService,
  JobApplicationNotFoundError,
  JobApplicationValidationError,
  type UpdateJobApplicationInput,
} from "@/services/job-application.service";

/**
 * /api/applications/[applicationId] — get, update, delete one job application.
 *
 * C55: Job Application Workspace.
 * All operations are scoped through the authenticated session → ProfessionalIdentity.
 */

interface RouteContext {
  params: Promise<{ applicationId: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { applicationId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    const application = await jobApplicationService.get(identity.id, applicationId);
    return NextResponse.json(application, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof JobApplicationNotFoundError) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    const message =
      err instanceof Error ? err.message : "Failed to fetch application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { applicationId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    const body = (await req.json()) as UpdateJobApplicationInput;
    const application = await jobApplicationService.update(
      identity.id,
      applicationId,
      body,
    );
    return NextResponse.json(application, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof JobApplicationNotFoundError) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (err instanceof JobApplicationValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : "Failed to update application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  return PUT(req, context);
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { applicationId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    await jobApplicationService.delete(identity.id, applicationId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof JobApplicationNotFoundError) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    const message =
      err instanceof Error ? err.message : "Failed to delete application";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
