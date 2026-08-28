"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import {
  resumeService,
  ResumeNotFoundError,
  ResumeValidationError,
  type SaveResumeInput,
} from "@/services/resume.service";

/**
 * /api/resumes/[resumeId] — get, update, delete one resume.
 *
 * All operations are scoped through the authenticated session → Professional
 * Identity. A resume that does not exist for THIS identity is treated as 404 so
 * foreign resumes are never observable or mutable.
 *
 * Phase-0 updatedAt semantics (ADR-003 §updatedAt): the API returns updatedAt on
 * every response; writes are last-write-wins. Staleness/conflict detection is
 * deferred to Phase 1 — no optimistic-lock header is implemented yet.
 */

interface RouteContext {
  params: Promise<{ resumeId: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { resumeId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    const resume = await resumeService.get(identity.id, resumeId);
    return NextResponse.json(resume, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ResumeNotFoundError) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    const message =
      err instanceof Error ? err.message : "Failed to fetch resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { resumeId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    const body = (await req.json()) as Partial<SaveResumeInput>;
    const resume = await resumeService.update(identity.id, resumeId, body);
    return NextResponse.json(resume, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ResumeNotFoundError) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    if (err instanceof ResumeValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : "Failed to update resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  return PUT(req, context);
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { resumeId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    await resumeService.delete(identity.id, resumeId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ResumeNotFoundError) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    const message =
      err instanceof Error ? err.message : "Failed to delete resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
