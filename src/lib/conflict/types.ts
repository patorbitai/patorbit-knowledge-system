/**
 * Conflict Detection Types — ADR-002 Phase 5
 *
 * Types for the pure conflict detection algorithm.
 * All types are independent of Prisma and database concerns.
 */

// ── Conflict Types ─────────────────────────────────────────────

export type ConflictType =
  | "overlapping_dates"
  | "contradictory_employer"
  | "contradictory_title"
  | "contradictory_dates"
  | "duplicate_credential"
  | "education_inconsistency"
  | "status_mismatch"
  | "location_inconsistency";

export type ConflictSeverity = "info" | "warning" | "critical";

export type ConflictStatus = "new" | "reviewing" | "dismissed" | "resolved";

// ── Canonical Input ────────────────────────────────────────────

/**
 * Minimal Claim representation needed by the conflict detection algorithm.
 * Sourced from the server-side Claim model.
 */
export interface CanonicalClaimForConflict {
  id: string;
  professionalIdentityId: string;
  assertionText: string;
  claimType: string;
  verificationStatus: string;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Detected Conflict ──────────────────────────────────────────

/**
 * A conflict detected between two or more Claims.
 * This is the output of the pure detection algorithm.
 */
export interface DetectedConflict {
  conflictType: ConflictType;
  severity: ConflictSeverity;
  description: string;
  claimIds: string[];
}

/**
 * The result of a conflict detection scan.
 */
export interface ConflictDetectionResult {
  /** Newly detected conflicts (not previously persisted). */
  newConflicts: DetectedConflict[];
  /** Total conflicts found in this scan. */
  totalDetected: number;
  /** Claims that were compared. */
  claimsCompared: number;
  /** When the detection was performed. */
  detectedAt: string;
}
