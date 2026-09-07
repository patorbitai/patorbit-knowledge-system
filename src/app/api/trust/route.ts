"use strict";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { deriveTrustForUserV2 } from "@/lib/trust/canonical-loader";

/**
 * GET /api/trust
 *
 * Returns a server-derived TrustReportV2 for the authenticated user's
 * ProfessionalIdentity. All data is loaded from the canonical database;
 * no client-supplied data is accepted.
 *
 * Phase 9B: Returns Trust v2 (per-claim breakdown with evidence/verification/conflict integration).
 *
 * Security:
 *  - Requires authentication
 *  - Resolves ProfessionalIdentity from session (never trusts client)
 *  - Only returns data for the authenticated user's own identity
 *  - Unclaimed evidence scoped to authenticated userId (P1-1 fix)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const trustReport = await deriveTrustForUserV2(session.user.id);
    return NextResponse.json(trustReport);
  } catch (err: unknown) {
    return handleApiError(err, "trust:GET");
  }
}
