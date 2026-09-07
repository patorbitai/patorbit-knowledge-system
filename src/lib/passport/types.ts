/**
 * Professional Passport Types — ADR-002 Phase 6
 *
 * The Passport is a projection/read model derived from canonical
 * ProfessionalIdentity + Claims + Evidence + Verification + Conflicts + Trust.
 *
 * It is NEVER the source of truth. It presents what the canonical
 * system currently knows, with appropriate verification context.
 */

/**
 * Minimal Trust report shape required by Passport projection.
 * Accepts both Trust v1 (ServerTrustReport) and v2 (ServerTrustReportV2).
 * Structural typing: any object with score, level, algorithmVersion is accepted.
 */
export interface TrustReportForPassport {
  score: number;
  level: string;
  algorithmVersion: string;
}

// ── Passport Schema ────────────────────────────────────────────

export const PASSPORT_SCHEMA_VERSION = "v1";

// ── Identity Section ───────────────────────────────────────────

export interface PassportIdentity {
  displayName: string;
  headline: string | null;
  summary: string | null;
  location: string | null;
}

// ── Claim Summary ──────────────────────────────────────────────

export interface PassportClaimSummary {
  id: string;
  assertionText: string;
  claimType: string;
  verificationStatus: string;
  confidence: number;
  evidenceCount: number;
  hasEvidence: boolean;
  latestVerificationEvent: string | null;
}

// ── Trust Summary ──────────────────────────────────────────────

export interface PassportTrustSummary {
  score: number;
  level: string;
  algorithmVersion: string;
}

// ── Conflict Summary ───────────────────────────────────────────

export interface PassportConflictSummary {
  activeConflicts: number;
  dismissedConflicts: number;
  resolvedConflicts: number;
}

// ── Evidence Summary ───────────────────────────────────────────

export interface PassportEvidenceSummary {
  totalEvidence: number;
  evidenceKinds: Record<string, number>;
}

// ── Full Passport ──────────────────────────────────────────────

export interface ProfessionalPassport {
  /** Passport schema version (separate from Trust algorithm version). */
  schemaVersion: string;
  /** When this Passport projection was generated. */
  generatedAt: string;
  /** Identity section — public-safe fields only. */
  identity: PassportIdentity;
  /** Claims with evidence/verification context. */
  claims: PassportClaimSummary[];
  /** Trust derived from canonical data. */
  trust: PassportTrustSummary | null;
  /** Conflict summary — neutral, never accusatory. */
  conflicts: PassportConflictSummary;
  /** Evidence aggregate — counts only, no raw documents. */
  evidence: PassportEvidenceSummary;
}

// ── Canonical Input ────────────────────────────────────────────

/**
 * Minimal Claim representation needed by the Passport projection.
 */
export interface CanonicalClaimForPassport {
  id: string;
  assertionText: string;
  claimType: string;
  verificationStatus: string;
  confidence: number;
  createdAt: Date;
}

/**
 * Minimal Evidence representation needed by the Passport projection.
 */
export interface CanonicalEvidenceForPassport {
  id: string;
  claimId: string | null;
  evidenceKind: string;
  metadata: string;
}

/**
 * Minimal VerificationEvent representation.
 */
export interface CanonicalVerificationEventForPassport {
  claimId: string;
  eventType: string;
  resultingStatus: string;
  createdAt: Date;
}

/**
 * Minimal ConflictRecord representation.
 */
export interface CanonicalConflictForPassport {
  status: string;
  severity: string;
}

/**
 * Complete input for the Passport projection.
 */
export interface PassportProjectionInput {
  displayName: string;
  headline: string | null;
  summary: string | null;
  location: string | null;
  claims: CanonicalClaimForPassport[];
  evidence: CanonicalEvidenceForPassport[];
  verificationEvents: CanonicalVerificationEventForPassport[];
  conflicts: CanonicalConflictForPassport[];
  trustReport: TrustReportForPassport | null;
}
