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
import crypto from "crypto";

/**
 * Derive TrustReport from canonical server-side data for the given identity.
 * SECURITY: This must NEVER accept client-supplied trust data.
 */
async function deriveTrustForIdentity(
  professionalIdentityId: string,
): Promise<ReturnType<typeof deriveTrust>> {
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

  const canonicalClaims: CanonicalClaimForTrust[] = claims.map((c) => ({
    id: c.id,
    professionalIdentityId: c.professionalIdentityId,
    verificationStatus: c.verificationStatus,
    confidence: c.confidence,
    claimType: c.claimType,
  }));

  const canonicalEvidence: CanonicalEvidenceForTrust[] = evidence.map((e) => ({
    id: e.id,
    claimId: e.claimId,
    evidenceKind: e.evidenceKind,
  }));

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

  return deriveTrust({
    claims: canonicalClaims,
    evidence: canonicalEvidence,
    verificationEvents: canonicalEvents,
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

  if (!identity || !identity.trustShareEnabled) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({
    enabled: true,
    token: identity.trustShareToken,
    shareUrl: `/trust/share/${identity.trustShareToken}`,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // SECURITY: trustReport is NEVER accepted from the client body.
    // Trust is always derived server-side from canonical data.

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
          trustShareEnabled: false,
          trustShareToken: null,
          trustReportCache: null,
        },
      });
      return NextResponse.json({ enabled: false });
    }

    // Derive TrustReport from canonical server-side data
    const trustReport = await deriveTrustForIdentity(identity.id);

    const token = crypto.randomUUID();
    await prisma.professionalIdentity.update({
      where: { id: identity.id },
      data: {
        trustShareEnabled: true,
        trustShareToken: token,
        trustReportCache: JSON.stringify(trustReport),
      },
    });

    return NextResponse.json({
      enabled: true,
      token,
      shareUrl: `/trust/share/${token}`,
    });
  } catch (err: unknown) {
    return handleApiError(err, "trust-share:POST");
  }
}
