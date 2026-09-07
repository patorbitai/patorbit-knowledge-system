"use strict";

import { prisma } from "@/lib/prisma";
import { PublicPassportView } from "@/components/identity/PublicPassportView";
import { ShieldCheck } from "lucide-react";
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

/**
 * Derive a Passport from canonical server-side data.
 * This ensures the public Passport always reflects the current state,
 * not a stale client-submitted cache.
 */
async function derivePassportFromCanonical(professionalIdentityId: string) {
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

  // Derive Trust
  const trustClaims: CanonicalClaimForTrust[] = claims.map((c) => ({
    id: c.id,
    professionalIdentityId: c.professionalIdentityId,
    verificationStatus: c.verificationStatus,
    confidence: c.confidence,
    claimType: c.claimType,
  }));

  const trustEvidence: CanonicalEvidenceForTrust[] = evidence.map((e) => ({
    id: e.id,
    claimId: e.claimId,
    evidenceKind: e.evidenceKind,
  }));

  const trustEvents: CanonicalVerificationEventForTrust[] = verificationEvents.map((ve) => ({
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
    claims: trustClaims,
    evidence: trustEvidence,
    verificationEvents: trustEvents,
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

export default async function PublicPassportSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Token lookup — no authentication required
  const identity = await prisma.professionalIdentity.findUnique({
    where: { passportShareToken: token },
    include: { user: true },
  });

  if (!identity || !identity.passportShareEnabled) {
    return (
      <main className="min-h-screen bg-[#070911] text-slate-300 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
          <h1 className="text-lg font-bold text-white">Passport Private or Unavailable</h1>
          <p className="text-xs text-slate-400">
            This Professional Passport link is invalid, has been revoked, or the passport is private.
          </p>
        </div>
      </main>
    );
  }

  // Derive Passport from canonical server-side data (NOT from cache)
  let passport;
  try {
    passport = await derivePassportFromCanonical(identity.id);
  } catch {
    return (
      <main className="min-h-screen bg-[#070911] text-slate-300 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
          <h1 className="text-lg font-bold text-white">Passport Data Error</h1>
          <p className="text-xs text-slate-400">Unable to load public passport data.</p>
        </div>
      </main>
    );
  }

  // Map Passport projection to the existing PublicPassportView props
  // The view expects Resume + Claim[] + Evidence[] shapes from the old client model
  const publicResume = {
    name: passport.identity.displayName,
    title: passport.identity.headline || "",
    email: "", // NEVER expose
    phone: "", // NEVER expose
    address: passport.identity.location || "",
    summary: passport.identity.summary || "",
    experience: [] as never[],
    education: [] as never[],
    skills: [] as never[],
    projects: [] as never[],
    certifications: [] as never[],
    languages: [] as never[],
    interests: [] as never[],
    achievements: [] as never[],
    references: [] as never[],
    portfolio: [] as never[],
  };

  // Map Passport claims back to the Claim[] shape for the existing view
  const publicClaims = passport.claims.map((c) => ({
    id: c.id,
    assertionText: c.assertionText,
    claimType: c.claimType,
    sourceActivityId: "",
    confidence: c.confidence,
    reasoning: "",
    verificationStatus: c.verificationStatus,
    reviewed: true,
    accepted: true,
    createdAt: new Date().toISOString(),
  }));

  // Evidence is only summarized in the Passport — we don't expose raw evidence
  const publicEvidence: never[] = [];

  return (
    <main className="min-h-screen bg-[#070911] text-slate-300 py-12 px-4 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              Professional Passport
            </span>
            <h1 className="text-2xl font-bold text-white mt-2">{passport.identity.displayName}&apos;s Passport</h1>
            <p className="text-xs text-slate-400 mt-1">
              Read-only professional identity derived from verified claims and evidence.
            </p>
          </div>
        </div>
        <PublicPassportView resume={publicResume as any} claims={publicClaims as any} evidence={publicEvidence} />
        <div className="text-center text-[10px] text-slate-600 mt-8">
          Passport generated {new Date(passport.generatedAt).toLocaleDateString()} · Schema {passport.schemaVersion}
          {passport.trust && <> · Trust {passport.trust.score}/100 ({passport.trust.level})</>}
        </div>
      </div>
    </main>
  );
}
