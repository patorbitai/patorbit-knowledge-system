"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { handleApiError } from "@/lib/api-error";
import { conflictService } from "@/services/conflict.service";

/**
 * /api/conflicts — list and detect conflicts for the authenticated user's Claims.
 *
 * ADR-002 Phase 5: Conflict Detection Engine.
 * Conflicts are detected across Claims within the same ProfessionalIdentity.
 * Ownership is derived from session → PI.
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
    const conflicts = await conflictService.listConflicts(identity.id);
    return NextResponse.json({ conflicts }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err, "conflicts:GET");
  }
}

/**
 * POST /api/conflicts — run conflict detection for the authenticated user's Claims.
 *
 * No request body required. The server loads canonical Claims and runs
 * the pure detection algorithm. Newly detected conflicts are persisted.
 */
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await identityService.ensureProfessionalIdentity(
      session.user.id,
    );
    const result = await conflictService.detectConflicts(identity.id);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err, "conflicts:POST");
  }
}
