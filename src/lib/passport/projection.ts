/**
 * Professional Passport Projection — ADR-002 Phase 6
 *
 * Pure, deterministic function that builds a ProfessionalPassport from
 * canonical server-side data. No DB calls, no auth, no side effects.
 *
 * The Passport is a PROJECTION — it presents what the canonical system
 * currently knows. It is NEVER the source of truth.
 *
 * Privacy rules:
 *  - email, phone, address are NEVER exposed
 *  - raw evidence documents are NEVER exposed
 *  - internal reasoning/confidence internals are NOT exposed
 *  - sourceActivityId is NOT exposed
 *  - conflicts are shown as neutral summaries, never accusatory
 */

import type {
  ProfessionalPassport,
  PassportProjectionInput,
  PassportClaimSummary,
  PassportConflictSummary,
  PassportEvidenceSummary,
  CanonicalClaimForPassport,
} from "./types";
import { PASSPORT_SCHEMA_VERSION } from "./types";

/**
 * Build a ProfessionalPassport from canonical server-side data.
 *
 * @param input - All canonical data needed for the Passport projection
 * @returns ProfessionalPassport - a public-safe, read-only projection
 */
export function buildPassport(input: PassportProjectionInput): ProfessionalPassport {
  const {
    displayName,
    headline,
    summary,
    location,
    claims,
    evidence,
    verificationEvents,
    conflicts,
    trustReport,
  } = input;

  // ── Identity (public-safe fields only) ───────────────────────

  const identity = {
    displayName: displayName || "Professional",
    headline: headline || null,
    summary: summary || null,
    location: location || null,
  };

  // ── Claims ───────────────────────────────────────────────────

  const claimsByClaimId = new Map<string, CanonicalClaimForPassport[]>();
  for (const claim of claims) {
    const list = claimsByClaimId.get(claim.id) ?? [];
    list.push(claim);
    claimsByClaimId.set(claim.id, list);
  }

  const evidenceByClaimId = new Map<string, number>();
  for (const ev of evidence) {
    if (!ev.claimId) continue;
    evidenceByClaimId.set(ev.claimId, (evidenceByClaimId.get(ev.claimId) ?? 0) + 1);
  }

  const latestEventByClaimId = new Map<string, string>();
  for (const event of verificationEvents) {
    const existing = latestEventByClaimId.get(event.claimId);
    if (!existing || event.createdAt > new Date(existing)) {
      latestEventByClaimId.set(event.claimId, event.eventType);
    }
  }

  const claimSummaries: PassportClaimSummary[] = claims.map((claim) => {
    const evCount = evidenceByClaimId.get(claim.id) ?? 0;
    return {
      id: claim.id,
      assertionText: claim.assertionText,
      claimType: claim.claimType,
      verificationStatus: claim.verificationStatus,
      confidence: claim.confidence,
      evidenceCount: evCount,
      hasEvidence: evCount > 0,
      latestVerificationEvent: latestEventByClaimId.get(claim.id) ?? null,
    };
  });

  // ── Trust ────────────────────────────────────────────────────

  const trust = trustReport
    ? {
        score: trustReport.score,
        level: trustReport.level,
        algorithmVersion: trustReport.algorithmVersion,
      }
    : null;

  // ── Conflicts (neutral summary, never accusatory) ────────────

  const conflictSummary: PassportConflictSummary = {
    activeConflicts: conflicts.filter((c) => c.status === "new" || c.status === "reviewing").length,
    dismissedConflicts: conflicts.filter((c) => c.status === "dismissed").length,
    resolvedConflicts: conflicts.filter((c) => c.status === "resolved").length,
  };

  // ── Evidence (aggregate counts, no raw documents) ────────────

  const evidenceKinds: Record<string, number> = {};
  for (const ev of evidence) {
    evidenceKinds[ev.evidenceKind] = (evidenceKinds[ev.evidenceKind] ?? 0) + 1;
  }

  const evidenceSummary: PassportEvidenceSummary = {
    totalEvidence: evidence.length,
    evidenceKinds,
  };

  // ── Assemble Passport ────────────────────────────────────────

  return {
    schemaVersion: PASSPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    identity,
    claims: claimSummaries,
    trust,
    conflicts: conflictSummary,
    evidence: evidenceSummary,
  };
}
