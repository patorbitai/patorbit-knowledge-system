/**
 * Server-Side Trust Types — ADR-002 Phase 4
 *
 * These types are the canonical Trust domain, derived exclusively from
 * server-side Claim + EvidenceRecord + VerificationEvent data.
 *
 * They are independent of the KnowledgeGraph and the client-side TrustService.
 */

// ── Algorithm ──────────────────────────────────────────────────

export const TRUST_ALGORITHM_VERSION = "v1";

// ── Trust Levels ───────────────────────────────────────────────

export type TrustLevel =
  | "Unrated"
  | "Developing"
  | "Established"
  | "Strong"
  | "Excellent";

/** Map a numeric score (0–100) to a human-readable Trust level. */
export function scoreToTrustLevel(score: number): TrustLevel {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Established";
  if (score > 0) return "Developing";
  return "Unrated";
}

// ── Canonical input types ──────────────────────────────────────

/**
 * Canonical Claim data required by the Trust derivation algorithm.
 * Sourced from the server-side Claim model (Prisma).
 */
export interface CanonicalClaimForTrust {
  id: string;
  professionalIdentityId: string;
  verificationStatus: string; // suggested | accepted | evidence-added | under-review | verified | expired | revoked | disputed
  confidence: number; // 0–1
  claimType: string;
}

/**
 * Canonical EvidenceRecord data required by Trust derivation.
 * Sourced from the server-side EvidenceRecord model (Prisma).
 */
export interface CanonicalEvidenceForTrust {
  id: string;
  claimId: string | null;
  evidenceKind: string;
}

/**
 * Canonical VerificationEvent data required by Trust derivation.
 * Sourced from the server-side VerificationEvent model (Prisma).
 */
export interface CanonicalVerificationEventForTrust {
  id: string;
  claimId: string;
  evidenceRecordId: string | null;
  eventType: string;
  previousStatus: string | null;
  resultingStatus: string;
  outcome: string | null;
  createdAt: Date;
}

/**
 * The complete input for the Trust derivation algorithm.
 * All data must be server-sourced and ownership-verified.
 */
export interface TrustDerivationInput {
  claims: CanonicalClaimForTrust[];
  evidence: CanonicalEvidenceForTrust[];
  verificationEvents: CanonicalVerificationEventForTrust[];
}

// ── Trust Breakdown ────────────────────────────────────────────

export interface TrustBreakdownComponent {
  label: string;
  score: number;
  weight: number;
  explanation: string;
}

// ── Trust Report (server-derived) ──────────────────────────────

export interface ServerTrustReport {
  /** Overall trust score (0–100). */
  score: number;
  /** Human-readable trust level. */
  level: TrustLevel;
  /** Algorithm version used. */
  algorithmVersion: string;
  /** Weighted component breakdown. */
  breakdown: TrustBreakdownComponent[];
  /** Human-readable reasons explaining the score. */
  reasons: string[];
  /** When the trust was derived (ISO 8601). */
  derivedAt: string;
  /** Summary counts. */
  summary: TrustSummary;
}

/** Aggregate counts surfaced in the report. */
export interface TrustSummary {
  totalClaims: number;
  verifiedClaims: number;
  claimsWithEvidence: number;
  claimsWithoutEvidence: number;
  totalEvidence: number;
  totalVerificationEvents: number;
  evidenceCoveragePercent: number;
  verificationRate: number;
}
