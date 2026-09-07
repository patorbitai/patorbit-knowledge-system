"use strict";

/**
 * Canonical Trust Input Loader — ADR-002 Phase 8
 *
 * Single authoritative server-side path for loading Trust inputs.
 * Fixes P1-1 (cross-user unclaimed evidence leak) and P1-2 (trust/share parity).
 *
 * Both GET /api/trust and Trust Share derivation MUST use this loader.
 * Same DB state → same Trust inputs → same TrustReport.
 *
 * SECURITY:
 *  - Resolves ProfessionalIdentity from authenticated userId (never trusts client)
 *  - Loads evidence scoped to BOTH the user's claims AND the authenticated userId
 *  - Prevents cross-user unclaimed evidence contamination
 *  - No client-provided identity ID accepted
 */

import { prisma } from "@/lib/prisma";
import { deriveTrust } from "./derivation";
import type {
  CanonicalClaimForTrust,
  CanonicalEvidenceForTrust,
  CanonicalVerificationEventForTrust,
  TrustDerivationInput,
} from "./types";
import type { ServerTrustReport } from "./types";

/**
 * Load canonical Trust data scoped to a userId.
 *
 * This function:
 *  1. Resolves ProfessionalIdentity from userId (never trusts client-provided PI)
 *  2. Loads all Claims for that PI
 *  3. Loads EvidenceRecords belonging to the user's Claims
 *  4. Loads EvidenceRecords with claimId=null but ONLY where userId matches
 *  5. Loads VerificationEvents for the user's Claims
 *
 * @param userId - The authenticated user's ID (from session)
 * @returns TrustDerivationInput with canonical, user-scoped data
 */
export async function loadCanonicalTrustData(
  userId: string,
): Promise<TrustDerivationInput> {
  // 1. Resolve ProfessionalIdentity from authenticated userId
  const identity = await prisma.professionalIdentity.findUnique({
    where: { userId },
  });

  if (!identity) {
    return { claims: [], evidence: [], verificationEvents: [] };
  }

  // 2. Load canonical Claims
  const claims = await prisma.claim.findMany({
    where: { professionalIdentityId: identity.id },
  });

  const claimIds = claims.map((c) => c.id);

  // 3. Load EvidenceRecords belonging to this user's Claims
  const claimedEvidence = claimIds.length > 0
    ? await prisma.evidenceRecord.findMany({
        where: { claimId: { in: claimIds } },
      })
    : [];

  // 4. Load unclaimed evidence OWNED BY THIS USER ONLY
  //    P1-1 FIX: Previously loaded ALL users' unclaimed evidence.
  //    Now scoped to authenticated userId to prevent cross-user contamination.
  const unclaimedEvidence = await prisma.evidenceRecord.findMany({
    where: {
      claimId: null,
      userId, // <-- CRITICAL: scope to authenticated user
    },
  });

  // 5. Load VerificationEvents for this user's Claims
  const verificationEvents = claimIds.length > 0
    ? await prisma.verificationEvent.findMany({
        where: { claimId: { in: claimIds } },
      })
    : [];

  // Map to canonical input types
  const canonicalClaims: CanonicalClaimForTrust[] = claims.map((c) => ({
    id: c.id,
    professionalIdentityId: c.professionalIdentityId,
    verificationStatus: c.verificationStatus,
    confidence: c.confidence,
    claimType: c.claimType,
  }));

  const canonicalEvidence: CanonicalEvidenceForTrust[] = [
    ...claimedEvidence.map((e) => ({
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

  return {
    claims: canonicalClaims,
    evidence: canonicalEvidence,
    verificationEvents: canonicalEvents,
  };
}

/**
 * Derive Trust for an authenticated user.
 *
 * Combines canonical data loading + pure Trust derivation.
 * This is the single entry point that all Trust consumers MUST use.
 *
 * @param userId - The authenticated user's ID (from session)
 * @returns ServerTrustReport derived from canonical data
 */
export async function deriveTrustForUser(
  userId: string,
): Promise<ServerTrustReport> {
  const input = await loadCanonicalTrustData(userId);
  return deriveTrust(input);
}
