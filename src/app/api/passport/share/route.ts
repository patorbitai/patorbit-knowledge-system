"use strict";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { buildPassport } from "@/lib/passport/projection";
import { deriveTrustForUser } from "@/lib/trust/canonical-loader";
import type {
  CanonicalClaimForPassport,
  CanonicalEvidenceForPassport,
  CanonicalVerificationEventForPassport,
  CanonicalConflictForPassport,
} from "@/lib/passport/types";
import crypto from "crypto";

/**
 * Derive a complete ProfessionalPassport from canonical server-side data.
 *
 * Phase 8: Trust is derived via the canonical loader to ensure parity with
 * GET /api/trust and Trust Share.
 *
 * SECURITY: This function NEVER accepts client-supplied data.
 * All data is loaded from PostgreSQL via authenticated session.
 */
async function derivePassportForIdentity(professionalIdentityId: string, userId: string) {
  // Load identity and user info
  const identity = await prisma.professionalIdentity.findUnique({
    where: { id: professionalIdentityId },
  });

  const user = identity
    ? await prisma.user.findUnique({ where: { id: identity.userId } })
    : null;

  // Derive Trust using the same path as GET /api/trust (P1-2 parity)
  const trustReport = await deriveTrustForUser(userId);

  // Load claims and evidence for Passport projection
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
    // Phase 8: Pass userId for canonical Trust loader parity
    const passport = await derivePassportForIdentity(identity.id, session.user.id);

    // P2-3 FIX: Always generate a new token on enable.
    // Old token becomes invalid after disable+re-enable.
    const token = crypto.randomUUID();

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
