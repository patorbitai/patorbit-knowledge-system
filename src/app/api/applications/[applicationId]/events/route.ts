"use strict";

/**
 * /api/applications/[applicationId]/events — list and create lifecycle events
 * for a specific job application.
 *
 * M5: Application Outcome Loop.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { handleApiError } from "@/lib/api-error";
import {
  applicationEventService,
  type CreateEventInput,
} from "@/services/application-event.service";

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
    const events = await applicationEventService.listEvents(
      identity.id,
      applicationId,
    );
    return NextResponse.json({ events }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err, "application-events:GET");
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { applicationId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Omit<CreateEventInput, "applicationId">;
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );

    const event = await applicationEventService.recordEvent(identity.id, {
      ...body,
      applicationId,
    });

    // After recording an outcome event, update career memory
    if (
      body.eventType === "outcome_recorded" ||
      body.eventType === "interview_completed"
    ) {
      // Import dynamically to avoid circular deps
      const { careerMemoryService } = await import(
        "@/services/career-memory.service"
      );
      await careerMemoryService.analyzeAndUpdate(identity.id);
    }

    return NextResponse.json(event, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err, "application-events:POST");
  }
}
