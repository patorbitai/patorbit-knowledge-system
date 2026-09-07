"use strict";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import { deriveTrustForUser } from "@/lib/trust/canonical-loader";

/**
 * GET /api/trust
 *
 * Returns a server-derived TrustReport for the authenticated user's
 * ProfessionalIdentity. All data is loaded from the canonical database;
 * no client-supplied data is accepted.
 *
 * Phase 8: Uses the single canonical Trust input loader (canonical-loader.ts)
 * to ensure identical results with Trust Share and Passport derivation.
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
    const trustReport = await deriveTrustForUser(session.user.id);
    return NextResponse.json(trustReport);
  } catch (err: unknown) {
    return handleApiError(err, "trust:GET");
  }
}
