"use strict";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { deriveTrust } from "@/lib/trust/derivation";
import type {
  CanonicalClaimForTrust,
  CanonicalEvidenceForTrust,
  CanonicalVerificationEventForTrust,
} from "@/lib/trust/types";

/**
 * GET /api/trust
 *
 * Returns a server-derived TrustReport for the authenticated user's
 * ProfessionalIdentity. All data is loaded from the canonical database;
 * no client-supplied data is accepted.
 *
 * Security:
 *  - Requires authentication
 *  - Resolves ProfessionalIdentity from session (never trusts client)
 *  - Only returns data for the authenticated user's own identity
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Resolve the user's ProfessionalIdentity
    const identity = await prisma.professionalIdentity.findUnique({
      where: { userId: session.user.id },
    });

    if (!identity) {
      return NextResponse.json(
        { error: "ProfessionalIdentity not found" },
        { status: 404 }
      );
    }

    // 2. Load canonical Claims
    const claims = await prisma.claim.findMany({
      where: { professionalIdentityId: identity.id },
    });

    // 3. Load canonical EvidenceRecords (those belonging to this identity's claims)
    const claimIds = claims.map((c) => c.id);
    const evidence = claimIds.length > 0
      ? await prisma.evidenceRecord.findMany({
          where: { claimId: { in: claimIds } },
        })
      : [];

    // Also include unclaimed evidence (claimId is null) owned by this identity's claims
    const unclaimedEvidence = await prisma.evidenceRecord.findMany({
      where: { claimId: null },
    });

    // 4. Load canonical VerificationEvents for this identity's claims
    const verificationEvents = claimIds.length > 0
      ? await prisma.verificationEvent.findMany({
          where: { claimId: { in: claimIds } },
        })
      : [];

    // 5. Map to canonical input types
    const canonicalClaims: CanonicalClaimForTrust[] = claims.map((c) => ({
      id: c.id,
      professionalIdentityId: c.professionalIdentityId,
      verificationStatus: c.verificationStatus,
      confidence: c.confidence,
      claimType: c.claimType,
    }));

    const canonicalEvidence: CanonicalEvidenceForTrust[] = [
      ...evidence.map((e) => ({
        id: e.id,
        claimId: e.claimId,
        evidenceKind: e.evidenceKind,
      })),
      ...unclaimedEvidence.map((e) => ({
        id: e.id,
        claimId: e.claimId,
        evidenceKind: e.evidenceKind,
      })),
    ];

    const canonicalEvents: CanonicalVerificationEventForTrust[] =
      verificationEvents.map((ve) => ({
        id: ve.id,
        claimId: ve.claimId,
        evidenceRecordId: ve.evidenceRecordId,
        eventType: ve.eventType,
        previousStatus: ve.previousStatus,
        resultingStatus: ve.resultingStatus,
        outcome: ve.outcome,
        createdAt: ve.createdAt,
      }));

    // 6. Derive Trust (pure function, no side effects)
    const trustReport = deriveTrust({
      claims: canonicalClaims,
      evidence: canonicalEvidence,
      verificationEvents: canonicalEvents,
    });

    // 7. Return server-derived TrustReport
    return NextResponse.json(trustReport);
  } catch (err: unknown) {
    return handleApiError(err, "trust:GET");
  }
}
