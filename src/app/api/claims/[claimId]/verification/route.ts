"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { handleApiError } from "@/lib/api-error";
import {
  verificationEventService,
  VerificationError,
} from "@/services/verification-event.service";
import { ClaimValidationError } from "@/services/claim.service";

interface RouteContext {
  params: Promise<{ claimId: string }>;
}

/**
 * /api/claims/[claimId]/verification — list history and create events.
 *
 * ADR-002 Phase 3: Verification is an append-only audit trail.
 * Every request authenticates the user, resolves their PI,
 * and verifies Claim ownership before any operation.
 */

export async function GET(_req: NextRequest, context: RouteContext) {
  const { claimId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );

    // Verify Claim ownership (via service's getById which enforces ownership)
    const { claimService } = await import("@/services/claim.service");
    await claimService.getById(claimId, identity.id);

    const history = await verificationEventService.getHistory(claimId);
    return NextResponse.json({ events: history }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof VerificationError || err instanceof ClaimValidationError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return handleApiError(err, "verification:GET");
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { claimId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );

    const event = await verificationEventService.createEvent(
      {
        claimId,
        evidenceRecordId: body.evidenceRecordId,
        eventType: body.eventType,
        reason: body.reason,
        outcome: body.outcome,
        metadata: body.metadata,
      },
      identity.id,
    );

    return NextResponse.json(event, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof VerificationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return handleApiError(err, "verification:POST");
  }
}
