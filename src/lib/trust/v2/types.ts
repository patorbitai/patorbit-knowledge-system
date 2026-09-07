/**
 * Trust v2 Types — ADR-002 Phase 9B
 *
 * Per-claim Trust model with evidence strength, verification,
 * conflict integration, and explainability.
 *
 * Trust definition:
 *   "How strongly Patorbit's canonical evidence and verification
 *    history support a person's professional claims."
 */

// ── Algorithm ──────────────────────────────────────────────────

export const TRUST_ALGORITHM_VERSION_V2 = "v2";

// ── Trust Levels ───────────────────────────────────────────────

export type TrustLevel =
  | "Unrated"
  | "Developing"
  | "Supported"
  | "Strong"
  | "Highly Supported";

/** Map a numeric score (0–100) to a human-readable Trust level. */
export function scoreToTrustLevelV2(score: number): TrustLevel {
  if (score >= 90) return "Highly Supported";
  if (score >= 70) return "Strong";
  if (score >= 40) return "Supported";
  if (score > 0) return "Developing";
  return "Unrated";
}

// ── Evidence Levels ────────────────────────────────────────────

export type EvidenceLevel =
  | "self-asserted"
  | "attached"
  | "reviewed"
  | "verified";

// ── Claim Trust Input ──────────────────────────────────────────

/** Canonical input for Trust v2 — extends v1 with conflicts. */
export interface TrustDerivationInputV2 {
  claims: CanonicalClaimForTrustV2[];
  evidence: CanonicalEvidenceForTrustV2[];
  verificationEvents: CanonicalVerificationEventForTrustV2[];
  conflicts: CanonicalConflictForTrust[];
}

export interface CanonicalClaimForTrustV2 {
  id: string;
  professionalIdentityId: string;
  verificationStatus: string;
  confidence: number;
  claimType: string;
  assertionText?: string; // for explainability
}

export interface CanonicalEvidenceForTrustV2 {
  id: string;
  claimId: string | null;
  evidenceKind: string;
}

export interface CanonicalVerificationEventForTrustV2 {
  id: string;
  claimId: string;
  evidenceRecordId: string | null;
  eventType: string;
  previousStatus: string | null;
  resultingStatus: string;
  outcome: string | null;
  createdAt: Date;
}

export interface CanonicalConflictForTrust {
  id: string;
  professionalIdentityId: string;
  conflictType: string;
  severity: string; // "info" | "warning" | "critical"
  claimIds: string[];
  status: string; // "new" | "reviewing" | "dismissed" | "resolved"
}

// ── Claim Trust Result ─────────────────────────────────────────

export interface ClaimTrust {
  claimId: string;
  claimType: string;
  assertionText: string;
  score: number;
  evidenceLevel: EvidenceLevel;
  evidenceCount: number;
  evidenceDiversity: number;
  evidenceSupport: number;
  verificationStrength: number;
  verificationStatus: string;
  conflictPenalty: number;
  activeConflictCount: number;
  statusCap: number;
  criticalConflictCap: number;
  gateBlocked: boolean;
  gateReason: string | null;
  factors: ClaimFactor[];
}

export interface ClaimFactor {
  type: "supporting" | "reducing" | "neutral";
  label: string;
  description: string;
  impact: number;
}

// ── Trust Factor (overall) ─────────────────────────────────────

export interface TrustFactor {
  type: "supporting" | "reducing" | "neutral";
  label: string;
  description: string;
}

// ── Trust Report v2 ────────────────────────────────────────────

export interface TrustSummaryV2 {
  totalClaims: number;
  verifiedClaims: number;
  claimsWithEvidence: number;
  claimsWithoutEvidence: number;
  totalEvidence: number;
  totalVerificationEvents: number;
  activeConflicts: number;
  evidenceCoveragePercent: number;
  verificationRate: number;
  /** True when fewer than 3 Claims exist — Trust is flagged as preliminary. */
  insufficientData: boolean;
}

export interface ServerTrustReportV2 {
  score: number;
  level: TrustLevel;
  algorithmVersion: "v2";
  derivedAt: string;
  claimTrusts: ClaimTrust[];
  summary: TrustSummaryV2;
  supportingFactors: TrustFactor[];
  reducingFactors: TrustFactor[];
}
