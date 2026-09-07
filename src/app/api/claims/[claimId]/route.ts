"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { handleApiError } from "@/lib/api-error";
import {
  claimService,
  ClaimValidationError,
} from "@/services/claim.service";

interface RouteContext {
  params: Promise<{ claimId: string }>;
}

/**
 * /api/claims/[claimId] — get, update, or delete a specific Claim.
 *
 * Every request:
 *  1. Authenticates the user
 *  2. Resolves their ProfessionalIdentity
 *  3. Verifies the Claim belongs to that ProfessionalIdentity
 *  4. Rejects unauthorized access with 404 (not 403) to prevent existence leakage
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
    const claim = await claimService.getById(claimId, identity.id);
    return NextResponse.json(claim, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ClaimValidationError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return handleApiError(err, "claims:[claimId]:GET");
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
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

    const claim = await claimService.update(claimId, identity.id, {
      assertionText: body.assertionText,
      claimType: body.claimType,
      sourceActivityId: body.sourceActivityId,
      confidence: body.confidence,
      reasoning: body.reasoning,
      verificationStatus: body.verificationStatus,
      reviewed: body.reviewed,
      accepted: body.accepted,
    });

    return NextResponse.json(claim, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ClaimValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return handleApiError(err, "claims:[claimId]:PATCH");
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { claimId } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    await claimService.delete(claimId, identity.id);
    return NextResponse.json({ success: true, id: claimId }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ClaimValidationError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return handleApiError(err, "claims:[claimId]:DELETE");
  }
}
