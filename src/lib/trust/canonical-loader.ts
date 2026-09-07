/**
 * Canonical Trust Input Loader — ADR-002 Phase 8 + Phase 9B
 *
 * Single authoritative server-side path for loading Trust inputs.
 * Fixes P1-1 (cross-user unclaimed evidence leak) and P1-2 (trust/share parity).
 *
 * Phase 9B: Extended to load ConflictRecords and derive Trust v2.
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
import { deriveTrustV2 } from "./v2/derivation";
import type {
  CanonicalClaimForTrust,
  CanonicalEvidenceForTrust,
  CanonicalVerificationEventForTrust,
  TrustDerivationInput,
} from "./types";
import type { ServerTrustReport } from "./types";
import type {
  TrustDerivationInputV2,
  ServerTrustReportV2,
} from "./v2/types";

/**
 * Load canonical Trust data scoped to a userId.
 *
 * This function:
 *  1. Resolves ProfessionalIdentity from userId (never trusts client-provided PI)
 *  2. Loads all Claims for that PI
 *  3. Loads EvidenceRecords belonging to the user's Claims
 *  4. Loads EvidenceRecords with claimId=null but ONLY where userId matches
 *  5. Loads VerificationEvents for the user's Claims
 *  6. Loads ConflictRecords for the user's ProfessionalIdentity (Phase 9B)
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
 * Load canonical Trust data V2 scoped to a userId — includes ConflictRecords.
 *
 * Phase 9B: Extends v1 loader with conflict data for Trust v2 derivation.
 *
 * @param userId - The authenticated user's ID (from session)
 * @returns TrustDerivationInputV2 with canonical, user-scoped data including conflicts
 */
export async function loadCanonicalTrustDataV2(
  userId: string,
): Promise<TrustDerivationInputV2> {
  // 1. Resolve ProfessionalIdentity from authenticated userId
  const identity = await prisma.professionalIdentity.findUnique({
    where: { userId },
  });

  if (!identity) {
    return { claims: [], evidence: [], verificationEvents: [], conflicts: [] };
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
  const unclaimedEvidence = await prisma.evidenceRecord.findMany({
    where: {
      claimId: null,
      userId,
    },
  });

  // 5. Load VerificationEvents for this user's Claims
  const verificationEvents = claimIds.length > 0
    ? await prisma.verificationEvent.findMany({
        where: { claimId: { in: claimIds } },
      })
    : [];

  // 6. Load ConflictRecords for this ProfessionalIdentity (Phase 9B)
  const conflicts = await prisma.conflictRecord.findMany({
    where: { professionalIdentityId: identity.id },
  });

  // Map to v2 canonical input types
  const canonicalClaims = claims.map((c) => ({
    id: c.id,
    professionalIdentityId: c.professionalIdentityId,
    verificationStatus: c.verificationStatus,
    confidence: c.confidence,
    claimType: c.claimType,
    assertionText: (c as Record<string, unknown>).assertionText as string | undefined,
  }));

  const canonicalEvidence = [
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

  const canonicalEvents = verificationEvents.map((ve) => ({
    id: ve.id,
    claimId: ve.claimId,
    evidenceRecordId: ve.evidenceRecordId,
    eventType: ve.eventType,
    previousStatus: ve.previousStatus,
    resultingStatus: ve.resultingStatus,
    outcome: ve.outcome,
    createdAt: ve.createdAt,
  }));

  const canonicalConflicts = conflicts.map((c) => ({
    id: c.id,
    professionalIdentityId: c.professionalIdentityId,
    conflictType: c.conflictType,
    severity: c.severity,
    claimIds: (c as Record<string, unknown>).claimIds as string[] ?? [],
    status: c.status,
  }));

  return {
    claims: canonicalClaims,
    evidence: canonicalEvidence,
    verificationEvents: canonicalEvents,
    conflicts: canonicalConflicts,
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

/**
 * Derive Trust v2 for an authenticated user.
 *
 * Phase 9B: Single entry point for Trust v2 derivation.
 * Uses canonical data loader with conflicts and the v2 derivation algorithm.
 *
 * @param userId - The authenticated user's ID (from session)
 * @returns ServerTrustReportV2 derived from canonical data including conflicts
 */
export async function deriveTrustForUserV2(
  userId: string,
): Promise<ServerTrustReportV2> {
  const input = await loadCanonicalTrustDataV2(userId);
  return deriveTrustV2(input);
}
