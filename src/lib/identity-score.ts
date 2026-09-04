import { prisma } from "@/lib/prisma";

export type IdentityScoreData = {
  score: number;
  resumeCompleteness: number;
  verifiedCredentials: number;
  passportClaims: number;
  aiUsed: boolean;
};

/**
 * Compute a real identity score from the user's Professional Identity and Resumes.
 *
 * This is a lightweight server-side computation for the overview dashboard.
 * The full Trust Score is computed client-side via TrustService (derived projection).
 */
export async function getIdentityScore(userId?: string): Promise<IdentityScoreData> {
  if (!userId) {
    return { score: 0, resumeCompleteness: 0, verifiedCredentials: 0, passportClaims: 0, aiUsed: false };
  }

  try {
    const identity = await prisma.professionalIdentity.findUnique({
      where: { userId },
      include: {
        resumes: {
          select: { payload: true },
        },
      },
    });

    if (!identity) {
      return { score: 0, resumeCompleteness: 0, verifiedCredentials: 0, passportClaims: 0, aiUsed: false };
    }

    // Resume completeness: based on how filled out the primary resume is
    let resumeCompleteness = 0;
    const primaryPayload = identity.resumes[0]?.payload as Record<string, unknown> | undefined;
    if (primaryPayload) {
      const checks = [
        !!primaryPayload.name,
        !!primaryPayload.title,
        !!primaryPayload.email,
        !!primaryPayload.summary,
        Array.isArray(primaryPayload.experience) && (primaryPayload.experience as unknown[]).length > 0,
        Array.isArray(primaryPayload.education) && (primaryPayload.education as unknown[]).length > 0,
        Array.isArray(primaryPayload.skills) && (primaryPayload.skills as unknown[]).length > 0,
        Array.isArray(primaryPayload.projects) && (primaryPayload.projects as unknown[]).length > 0,
        Array.isArray(primaryPayload.certifications) && (primaryPayload.certifications as unknown[]).length > 0,
      ];
      resumeCompleteness = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }

    // Verified credentials: count claims with evidence
    let verifiedCredentials = 0;
    let passportClaims = 0;
    if (primaryPayload) {
      const claims = (primaryPayload.claims as Array<Record<string, unknown>> | undefined) ?? [];
      passportClaims = claims.length;
      verifiedCredentials = claims.filter(
        (c) => c.verificationStatus === "verified" || c.verificationStatus === "evidence-added",
      ).length;
    }

    // Evidence count from server
    const evidenceCount = await prisma.evidenceRecord.count({ where: { userId } });

    // Overall score: weighted combination
    const completenessWeight = 0.35;
    const evidenceWeight = 0.30;
    const claimsWeight = 0.20;
    const verificationWeight = 0.15;

    const evidenceScore = Math.min(100, evidenceCount * 10); // 10 evidence items = 100%
    const claimsScore = Math.min(100, passportClaims * 15); // ~7 claims = 100%
    const verificationScore = passportClaims > 0
      ? Math.round((verifiedCredentials / passportClaims) * 100)
      : 0;

    const score = Math.round(
      resumeCompleteness * completenessWeight +
      evidenceScore * evidenceWeight +
      claimsScore * claimsWeight +
      verificationScore * verificationWeight,
    );

    return {
      score: Math.min(100, Math.max(0, score)),
      resumeCompleteness,
      verifiedCredentials,
      passportClaims,
      aiUsed: false, // TODO: track AI usage in identity context
    };
  } catch {
    return { score: 0, resumeCompleteness: 0, verifiedCredentials: 0, passportClaims: 0, aiUsed: false };
  }
}
