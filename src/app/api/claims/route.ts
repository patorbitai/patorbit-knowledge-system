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

/**
 * /api/claims — list and create the authenticated user's Claims.
 *
 * ADR-002 Phase 2: Claims are first-class server entities under
 * ProfessionalIdentity. Ownership is derived from session → PI.
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
    const claims = await claimService.list(identity.id);
    return NextResponse.json({ claims }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err, "claims:GET");
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );

    const claim = await claimService.create(identity.id, {
      assertionText: body.assertionText,
      claimType: body.claimType,
      sourceActivityId: body.sourceActivityId,
      confidence: body.confidence,
      reasoning: body.reasoning,
    });

    return NextResponse.json(claim, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof ClaimValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return handleApiError(err, "claims:POST");
  }
}
