"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import {
  resumeService,
  ResumeNotFoundError,
} from "@/services/resume.service";

interface RouteContext {
  params: Promise<{ resumeId: string }>;
}

/** GET — return current share status for a resume. */
export async function GET(_req: NextRequest, context: RouteContext) {
  const { resumeId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(session.user.id);
    const status = await resumeService.getShareStatus(identity.id, resumeId);
    return NextResponse.json(status, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ResumeNotFoundError) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to get share status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST — enable or disable sharing. */
export async function POST(req: NextRequest, context: RouteContext) {
  const { resumeId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(session.user.id);
    const body = await req.json();
    const { action } = body;

    if (action === "enable") {
      const result = await resumeService.enableShare(identity.id, resumeId);
      return NextResponse.json(result, { status: 200 });
    }

    if (action === "disable") {
      const result = await resumeService.disableShare(identity.id, resumeId);
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action. Use 'enable' or 'disable'." }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof ResumeNotFoundError) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to update share settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
