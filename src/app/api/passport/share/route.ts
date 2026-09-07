"use strict";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { buildPassport } from "@/lib/passport/projection";
import { deriveTrust } from "@/lib/trust/derivation";
import type {
  CanonicalClaimForPassport,
  CanonicalEvidenceForPassport,
  CanonicalVerificationEventForPassport,
  CanonicalConflictForPassport,
} from "@/lib/passport/types";
import type {
  CanonicalClaimForTrust,
  CanonicalEvidenceForTrust,
  CanonicalVerificationEventForTrust,
} from "@/lib/trust/types";
import crypto from "crypto";

/**
 * Derive a complete ProfessionalPassport from canonical server-side data.
 *
 * SECURITY: This function NEVER accepts client-supplied data.
 * All data is loaded from PostgreSQL via authenticated session.
 */
async function derivePassportForIdentity(professionalIdentityId: string) {
  // Load all canonical data
  const identity = await prisma.professionalIdentity.findUnique({
    where: { id: professionalIdentityId },
  });

  const user = identity
    ? await prisma.user.findUnique({ where: { id: identity.userId } })
    : null;

  const claims = await prisma.claim.findMany({
    where: { professionalIdentityId },
  });

  const claimIds = claims.map((c) => c.id);

  const evidence = claimIds.length > 0
    ? await prisma.evidenceRecord.findMany({
        where: { claimId: { in: claimIds } },
      })
    : [];

  const verificationEvents = claimIds.length > 0
    ? await prisma.verificationEvent.findMany({
        where: { claimId: { in: claimIds } },
      })
    : [];

  const conflicts = await prisma.conflictRecord.findMany({
    where: { professionalIdentityId },
  });

  // Derive Trust from canonical data
  const canonicalTrustClaims: CanonicalClaimForTrust[] = claims.map((c) => ({
    id: c.id,
    professionalIdentityId: c.professionalIdentityId,
    verificationStatus: c.verificationStatus,
    confidence: c.confidence,
    claimType: c.claimType,
  }));

  const canonicalTrustEvidence: CanonicalEvidenceForTrust[] = evidence.map((e) => ({
    id: e.id,
    claimId: e.claimId,
    evidenceKind: e.evidenceKind,
  }));

  const canonicalTrustEvents: CanonicalVerificationEventForTrust[] = verificationEvents.map((ve) => ({
    id: ve.id,
    claimId: ve.claimId,
    evidenceRecordId: ve.evidenceRecordId,
    eventType: ve.eventType,
    previousStatus: ve.previousStatus,
    resultingStatus: ve.resultingStatus,
    outcome: ve.outcome,
    createdAt: ve.createdAt,
  }));

  const trustReport = deriveTrust({
    claims: canonicalTrustClaims,
    evidence: canonicalTrustEvidence,
    verificationEvents: canonicalTrustEvents,
  });

  // Map to Passport projection input
  const passportClaims: CanonicalClaimForPassport[] = claims.map((c) => ({
    id: c.id,
    assertionText: c.assertionText,
    claimType: c.claimType,
    verificationStatus: c.verificationStatus,
    confidence: c.confidence,
    createdAt: c.createdAt,
  }));

  const passportEvidence: CanonicalEvidenceForPassport[] = evidence.map((e) => ({
    id: e.id,
    claimId: e.claimId,
    evidenceKind: e.evidenceKind,
    metadata: e.metadata,
  }));

  const passportEvents: CanonicalVerificationEventForPassport[] = verificationEvents.map((ve) => ({
    claimId: ve.claimId,
    eventType: ve.eventType,
    resultingStatus: ve.resultingStatus,
    createdAt: ve.createdAt,
  }));

  const passportConflicts: CanonicalConflictForPassport[] = conflicts.map((c) => ({
    status: c.status,
    severity: c.severity,
  }));

  // Extract identity profile from profileData if available
  let profileData: Record<string, unknown> = {};
  if (identity?.profileData && typeof identity.profileData === "object") {
    profileData = identity.profileData as Record<string, unknown>;
  }

  return buildPassport({
    displayName: (user?.name as string) || (profileData.name as string) || "Professional",
    headline: (profileData.title as string) || null,
    summary: (profileData.summary as string) || null,
    location: (profileData.address as string) || null,
    claims: passportClaims,
    evidence: passportEvidence,
    verificationEvents: passportEvents,
    conflicts: passportConflicts,
    trustReport,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identity = await prisma.professionalIdentity.findUnique({
    where: { userId: session.user.id },
  });

  if (!identity || !identity.passportShareEnabled || !identity.passportShareToken) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({
    enabled: true,
    token: identity.passportShareToken,
    shareUrl: `/passport/share/${identity.passportShareToken}`,
  });
}

/**
 * POST /api/passport/share
 *
 * Enable or disable passport sharing.
 *
 * SECURITY: The client-submitted `passportData` parameter is IGNORED.
 * The server derives Passport data from canonical Claims + Evidence +
 * VerificationEvents + Conflicts + Trust derivation.
 *
 * The client cannot influence the content of the public Passport.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // SECURITY: passportData is NEVER accepted from the client body.
    // Passport is always derived server-side from canonical data.

    let identity = await prisma.professionalIdentity.findUnique({
      where: { userId: session.user.id },
    });

    if (!identity) {
      identity = await prisma.professionalIdentity.create({
        data: { userId: session.user.id },
      });
    }

    if (action === "disable") {
      await prisma.professionalIdentity.update({
        where: { id: identity.id },
        data: {
          passportShareEnabled: false,
          passportShareToken: null,
          passportDataCache: null,
        },
      });
      return NextResponse.json({ enabled: false });
    }

    // Derive Passport from canonical server-side data
    const passport = await derivePassportForIdentity(identity.id);

    // Generate a secure share token (reuse existing if present)
    const token = identity.passportShareToken || crypto.randomUUID();

    await prisma.professionalIdentity.update({
      where: { id: identity.id },
      data: {
        passportShareEnabled: true,
        passportShareToken: token,
        passportDataCache: JSON.stringify(passport),
      },
    });

    return NextResponse.json({
      enabled: true,
      token,
      shareUrl: `/passport/share/${token}`,
    });
  } catch (err: unknown) {
    return handleApiError(err, "passport-share:POST");
  }
}
