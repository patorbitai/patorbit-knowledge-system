/**
 * Trust v2 Derivation Algorithm — ADR-002 Phase 9B
 *
 * Pure, deterministic, side-effect-free function.
 * Derives a ServerTrustReportV2 from canonical server-side facts.
 *
 * Architecture:
 *   EvidenceSupport + VerificationStrength = BaseClaimTrust
 *   - ConflictPenalty (soft)
 *   → apply StatusCap (hard)
 *   → apply CriticalConflictCap (hard)
 *   → ClaimTrust
 *   → aggregate (average) → ProfessionalTrust
 *
 * Principles:
 *  - Evidence is NOT verification
 *  - Current Claim status is authoritative
 *  - Conflicts affect only the Claims they involve
 *  - Same underlying issue is never penalized twice
 *  - No AI dependency
 *  - No client inputs
 *  - Deterministic: same input → same output
 */

import type {
  TrustDerivationInputV2,
  ServerTrustReportV2,
  ClaimTrust,
  ClaimFactor,
  TrustFactor,
  TrustSummaryV2,
  EvidenceLevel,
  CanonicalClaimForTrustV2,
  CanonicalEvidenceForTrustV2,
  CanonicalVerificationEventForTrustV2,
  CanonicalConflictForTrust,
} from "./types";
import { TRUST_ALGORITHM_VERSION_V2, scoreToTrustLevelV2 } from "./types";

// ══════════════════════════════════════════════════════════════
// Constants — All values from approved Phase 9A design
// ══════════════════════════════════════════════════════════════

// Evidence baseline (RECOMMENDED)
const EV_BASELINE_SELF_ASSERTED = 0;
const EV_BASELINE_ATTACHED = 40;
const EV_BASELINE_REVIEWED = 55;
const EV_BASELINE_VERIFIED = 70;

// Evidence diminishing returns (RECOMMENDED)
const EV_RECORD_2 = 55;  // 40 + 15
const EV_RECORD_3 = 63;  // 55 + 8
const EV_RECORD_4 = 66;  // 63 + 3
const EV_RECORD_ADDITIONAL = 1;
const EV_CAP = 70;

// Diversity multipliers (RECOMMENDED)
const DIVERSITY_1_TYPE = 1.0;
const DIVERSITY_2_TYPES = 1.1;
const DIVERSITY_3_TYPES = 1.2;

// Evidence review bonus (RECOMMENDED)
const EV_REVIEW_BONUS = 15;

// Verification strength (DECIDED)
const VS_VERIFIED = 30;
const VS_ACCEPTED = 10;
const VS_EVIDENCE_ADDED = 8;
const VS_UNDER_REVIEW = 5;
const VS_SUGGESTED = 3;
const VS_EXPIRED = 5;
const VS_REJECTED = 0;
const VS_DISPUTED = 0;
const VS_REVOKED = 0;
const VS_DEFAULT = 3;

// Conflict penalties (RECOMMENDED)
const CONFLICT_PENALTY_INFO = 3;
const CONFLICT_PENALTY_WARNING = 10;
const CONFLICT_PENALTY_CRITICAL_SOFT = 20;

// Critical conflict cap (RECOMMENDED)
const CRITICAL_CONFLICT_CAP = 60;

// Status caps (RECOMMENDED)
const STATUS_CAP_REVOKED = 20;
const STATUS_CAP_DISPUTED = 30;
const STATUS_CAP_EXPIRED = 40;
const STATUS_CAP_REJECTED = 15;
const STATUS_CAP_DEFAULT = 100;

// Highest tier gate cap (RECOMMENDED)
const HIGHEST_TIER_GATE_CAP = 89;

// Minimum claims for meaningful trust (RECOMMENDED)
const MIN_CLAIMS_FOR_MEANINGFUL_TRUST = 3;

// ══════════════════════════════════════════════════════════════
// Main derivation function
// ══════════════════════════════════════════════════════════════

/**
 * Derive a TrustReportV2 from canonical facts.
 *
 * @param input - Server-sourced claims, evidence, verification events, conflicts
 * @returns ServerTrustReportV2 with per-claim breakdown and explanation
 */
export function deriveTrustV2(input: TrustDerivationInputV2): ServerTrustReportV2 {
  const { claims, evidence, verificationEvents, conflicts } = input;

  // Build lookup structures
  const evidenceByClaim = groupBy(evidence, (e) => e.claimId ?? "");
  const eventsByClaim = groupBy(verificationEvents, (e) => e.claimId);
  const activeConflicts = conflicts.filter(
    (c) => c.status === "new" || c.status === "reviewing"
  );
  const conflictsByClaimId = new Map<string, CanonicalConflictForTrust[]>();
  for (const conflict of activeConflicts) {
    for (const claimId of conflict.claimIds) {
      const list = conflictsByClaimId.get(claimId) ?? [];
      list.push(conflict);
      conflictsByClaimId.set(claimId, list);
    }
  }

  // Compute per-claim Trust
  const claimTrusts: ClaimTrust[] = claims.map((claim) =>
    computeClaimTrust(
      claim,
      evidenceByClaim.get(claim.id) ?? [],
      eventsByClaim.get(claim.id) ?? [],
      conflictsByClaimId.get(claim.id) ?? [],
    )
  );

  // Aggregate into Professional Trust
  const professionalScore = aggregateTrust(claimTrusts, activeConflicts);

  // Build summary
  const verifiedClaims = claims.filter((c) => c.verificationStatus === "verified").length;
  const claimsWithEvidence = new Set(
    evidence
      .filter((e) => e.claimId !== null)
      .map((e) => e.claimId!)
  ).size;

  const summary: TrustSummaryV2 = {
    totalClaims: claims.length,
    verifiedClaims,
    claimsWithEvidence,
    claimsWithoutEvidence: claims.length - claimsWithEvidence,
    totalEvidence: evidence.length,
    totalVerificationEvents: verificationEvents.length,
    activeConflicts: activeConflicts.length,
    evidenceCoveragePercent:
      claims.length > 0 ? Math.round((claimsWithEvidence / claims.length) * 100) : 0,
    verificationRate:
      claims.length > 0 ? Math.round((verifiedClaims / claims.length) * 100) : 0,
  };

  // Build explanation
  const { supportingFactors, reducingFactors } = buildExplanation(claimTrusts, summary);

  return {
    score: professionalScore,
    level: scoreToTrustLevelV2(professionalScore),
    algorithmVersion: "v2",
    derivedAt: new Date().toISOString(),
    claimTrusts,
    summary,
    supportingFactors,
    reducingFactors,
  };
}

// ══════════════════════════════════════════════════════════════
// Per-Claim Trust
// ══════════════════════════════════════════════════════════════

function computeClaimTrust(
  claim: CanonicalClaimForTrustV2,
  claimEvidence: CanonicalEvidenceForTrustV2[],
  claimEvents: CanonicalVerificationEventForTrustV2[],
  claimConflicts: CanonicalConflictForTrust[],
): ClaimTrust {
  const factors: ClaimFactor[] = [];

  // 1. Evidence Support (0–70)
  const evidenceSupport = computeEvidenceSupport(claimEvidence, claimEvents, factors);

  // 2. Verification Strength (0–30)
  const verificationStrength = computeVerificationStrength(
    claim.verificationStatus,
    factors,
  );

  // 3. Base Claim Trust
  const baseScore = evidenceSupport + verificationStrength;

  // 4. Apply soft conflict penalties
  const conflictPenalty = computeConflictPenalty(claimConflicts, factors);
  const afterConflict = Math.max(0, baseScore - conflictPenalty);

  // 5. Apply status cap (hard)
  const statusCap = getStatusCap(claim.verificationStatus);
  const afterStatusCap = Math.min(afterConflict, statusCap);

  // 6. Apply critical conflict cap (hard)
  const criticalConflictCap = getCriticalConflictCap(claimConflicts);
  const finalScore = clamp(afterStatusCap, criticalConflictCap);

  // Determine evidence level
  const evidenceLevel = determineEvidenceLevel(
    claim.verificationStatus,
    claimEvidence.length,
    claimEvents,
  );

  const gateBlocked = afterStatusCap < afterConflict || criticalConflictCap < afterStatusCap;
  let gateReason: string | null = null;
  if (criticalConflictCap < afterStatusCap) {
    gateReason = "Active critical conflict limits trust for this claim.";
  } else if (afterStatusCap < afterConflict) {
    gateReason = `Verification status '${claim.verificationStatus}' limits trust for this claim.`;
  }

  return {
    claimId: claim.id,
    claimType: claim.claimType,
    assertionText: claim.assertionText ?? "",
    score: finalScore,
    evidenceLevel,
    evidenceCount: claimEvidence.length,
    evidenceDiversity: new Set(claimEvidence.map((e) => e.evidenceKind)).size,
    evidenceSupport,
    verificationStrength,
    verificationStatus: claim.verificationStatus,
    conflictPenalty,
    activeConflictCount: claimConflicts.length,
    statusCap,
    criticalConflictCap,
    gateBlocked,
    gateReason,
    factors,
  };
}

// ══════════════════════════════════════════════════════════════
// Evidence Support
// ══════════════════════════════════════════════════════════════

function computeEvidenceSupport(
  evidence: CanonicalEvidenceForTrustV2[],
  events: CanonicalVerificationEventForTrustV2[],
  factors: ClaimFactor[],
): number {
  const count = evidence.length;

  // Diminishing returns
  let base: number;
  if (count === 0) {
    base = EV_BASELINE_SELF_ASSERTED;
  } else if (count === 1) {
    base = EV_BASELINE_ATTACHED;
  } else if (count === 2) {
    base = EV_RECORD_2;
  } else if (count === 3) {
    base = EV_RECORD_3;
  } else if (count === 4) {
    base = EV_RECORD_4;
  } else {
    base = Math.min(EV_CAP, EV_RECORD_4 + (count - 4) * EV_RECORD_ADDITIONAL);
  }

  // Diversity multiplier
  const distinctKinds = new Set(evidence.map((e) => e.evidenceKind)).size;
  let multiplier: number;
  if (distinctKinds >= 3) {
    multiplier = DIVERSITY_3_TYPES;
  } else if (distinctKinds >= 2) {
    multiplier = DIVERSITY_2_TYPES;
  } else {
    multiplier = DIVERSITY_1_TYPE;
  }

  // Evidence review bonus
  const hasReviewEvent = events.some(
    (e) =>
      e.eventType === "evidence_reviewed" &&
      e.outcome === "supports"
  );
  const reviewBonus = hasReviewEvent ? EV_REVIEW_BONUS : 0;

  const rawScore = Math.round(base * multiplier) + reviewBonus;
  const finalScore = Math.min(EV_CAP, rawScore);

  // Factors
  if (count === 0) {
    factors.push({
      type: "reducing",
      label: "No evidence",
      description: "This claim has no supporting evidence.",
      impact: 0,
    });
  } else {
    factors.push({
      type: "supporting",
      label: `${count} evidence record${count > 1 ? "s" : ""}`,
      description: `${count} evidence item(s) across ${distinctKinds} type(s) support this claim.`,
      impact: finalScore,
    });
  }

  if (hasReviewEvent) {
    factors.push({
      type: "supporting",
      label: "Evidence reviewed",
      description: "Evidence has been reviewed with a supporting outcome.",
      impact: EV_REVIEW_BONUS,
    });
  }

  return finalScore;
}

// ══════════════════════════════════════════════════════════════
// Verification Strength
// ══════════════════════════════════════════════════════════════

function computeVerificationStrength(
  status: string,
  factors: ClaimFactor[],
): number {
  let score: number;
  switch (status) {
    case "verified":      score = VS_VERIFIED; break;
    case "accepted":      score = VS_ACCEPTED; break;
    case "evidence-added": score = VS_EVIDENCE_ADDED; break;
    case "under-review":  score = VS_UNDER_REVIEW; break;
    case "suggested":     score = VS_SUGGESTED; break;
    case "expired":       score = VS_EXPIRED; break;
    case "rejected":      score = VS_REJECTED; break;
    case "disputed":      score = VS_DISPUTED; break;
    case "revoked":       score = VS_REVOKED; break;
    default:              score = VS_DEFAULT;
  }

  if (score > 0) {
    factors.push({
      type: "supporting",
      label: `Status: ${status}`,
      description: `Claim verification status is '${status}'.`,
      impact: score,
    });
  } else if (status === "revoked" || status === "disputed" || status === "rejected") {
    factors.push({
      type: "reducing",
      label: `Status: ${status}`,
      description: `Claim verification status is '${status}' — no verification credit.`,
      impact: 0,
    });
  }

  return score;
}

// ══════════════════════════════════════════════════════════════
// Conflict Penalty
// ══════════════════════════════════════════════════════════════

function computeConflictPenalty(
  conflicts: CanonicalConflictForTrust[],
  factors: ClaimFactor[],
): number {
  let maxPenalty = 0;

  for (const conflict of conflicts) {
    let penalty: number;
    switch (conflict.severity) {
      case "critical": penalty = CONFLICT_PENALTY_CRITICAL_SOFT; break;
      case "warning":  penalty = CONFLICT_PENALTY_WARNING; break;
      case "info":     penalty = CONFLICT_PENALTY_INFO; break;
      default:         penalty = 0;
    }
    maxPenalty = Math.max(maxPenalty, penalty);
  }

  if (maxPenalty > 0) {
    const activeCount = conflicts.length;
    factors.push({
      type: "reducing",
      label: `${activeCount} active conflict${activeCount > 1 ? "s" : ""}`,
      description: `Active conflict(s) reduce this claim's trust by up to ${maxPenalty} points.`,
      impact: -maxPenalty,
    });
  }

  return maxPenalty;
}

// ══════════════════════════════════════════════════════════════
// Status Cap
// ══════════════════════════════════════════════════════════════

function getStatusCap(status: string): number {
  switch (status) {
    case "revoked":  return STATUS_CAP_REVOKED;
    case "disputed": return STATUS_CAP_DISPUTED;
    case "expired":  return STATUS_CAP_EXPIRED;
    case "rejected": return STATUS_CAP_REJECTED;
    default:         return STATUS_CAP_DEFAULT;
  }
}

// ══════════════════════════════════════════════════════════════
// Critical Conflict Cap
// ══════════════════════════════════════════════════════════════

function getCriticalConflictCap(conflicts: CanonicalConflictForTrust[]): number {
  const hasCritical = conflicts.some(
    (c) =>
      c.severity === "critical" &&
      c.status !== "dismissed" &&
      c.status !== "resolved"
  );
  return hasCritical ? CRITICAL_CONFLICT_CAP : STATUS_CAP_DEFAULT;
}

// ══════════════════════════════════════════════════════════════
// Evidence Level
// ══════════════════════════════════════════════════════════════

function determineEvidenceLevel(
  status: string,
  evidenceCount: number,
  events: CanonicalVerificationEventForTrustV2[],
): EvidenceLevel {
  if (status === "verified") return "verified";

  const hasReviewEvent = events.some(
    (e) => e.eventType === "evidence_reviewed" && e.outcome === "supports"
  );
  if (hasReviewEvent) return "reviewed";
  if (evidenceCount > 0) return "attached";
  return "self-asserted";
}

// ══════════════════════════════════════════════════════════════
// Professional Trust Aggregation
// ══════════════════════════════════════════════════════════════

function aggregateTrust(
  claimTrusts: ClaimTrust[],
  activeConflicts: CanonicalConflictForTrust[],
): number {
  if (claimTrusts.length === 0) return 0;

  const sum = claimTrusts.reduce((s, ct) => s + ct.score, 0);
  const average = sum / claimTrusts.length;

  // Highest-tier gate: no disputed/revoked claims or critical conflicts allowed
  const hasRevoked = claimTrusts.some((ct) => ct.verificationStatus === "revoked");
  const hasDisputed = claimTrusts.some((ct) => ct.verificationStatus === "disputed");
  const hasCriticalConflict = activeConflicts.some(
    (c) => c.severity === "critical" && c.status !== "dismissed" && c.status !== "resolved"
  );

  if (hasRevoked || hasDisputed || hasCriticalConflict) {
    return clamp(Math.round(average), HIGHEST_TIER_GATE_CAP);
  }

  return clamp(Math.round(average));
}

// ══════════════════════════════════════════════════════════════
// Explanation
// ══════════════════════════════════════════════════════════════

function buildExplanation(
  claimTrusts: ClaimTrust[],
  summary: TrustSummaryV2,
): { supportingFactors: TrustFactor[]; reducingFactors: TrustFactor[] } {
  const supportingFactors: TrustFactor[] = [];
  const reducingFactors: TrustFactor[] = [];

  // Supporting
  if (summary.verifiedClaims > 0) {
    supportingFactors.push({
      type: "supporting",
      label: "Verified claims",
      description: `${summary.verifiedClaims} claim(s) have been independently verified.`,
    });
  }

  if (summary.claimsWithEvidence > 0) {
    supportingFactors.push({
      type: "supporting",
      label: "Evidence-backed claims",
      description: `${summary.claimsWithEvidence} of ${summary.totalClaims} claim(s) have supporting evidence.`,
    });
  }

  const diverseClaims = claimTrusts.filter((ct) => ct.evidenceDiversity >= 2);
  if (diverseClaims.length > 0) {
    supportingFactors.push({
      type: "supporting",
      label: "Diverse evidence",
      description: `${diverseClaims.length} claim(s) have evidence from multiple types.`,
    });
  }

  // Reducing
  const claimsWithoutEvidence = summary.totalClaims - summary.claimsWithEvidence;
  if (claimsWithoutEvidence > 0) {
    reducingFactors.push({
      type: "reducing",
      label: "Unsupported claims",
      description: `${claimsWithoutEvidence} claim(s) lack any supporting evidence.`,
    });
  }

  const expiredClaims = claimTrusts.filter((ct) => ct.verificationStatus === "expired");
  if (expiredClaims.length > 0) {
    reducingFactors.push({
      type: "reducing",
      label: "Expired claims",
      description: `${expiredClaims.length} claim(s) have expired verification.`,
    });
  }

  const revokedClaims = claimTrusts.filter((ct) => ct.verificationStatus === "revoked");
  if (revokedClaims.length > 0) {
    reducingFactors.push({
      type: "reducing",
      label: "Revoked claims",
      description: `${revokedClaims.length} claim(s) have been revoked.`,
    });
  }

  const disputedClaims = claimTrusts.filter((ct) => ct.verificationStatus === "disputed");
  if (disputedClaims.length > 0) {
    reducingFactors.push({
      type: "reducing",
      label: "Disputed claims",
      description: `${disputedClaims.length} claim(s) are under dispute.`,
    });
  }

  const conflictedClaims = claimTrusts.filter((ct) => ct.activeConflictCount > 0);
  if (conflictedClaims.length > 0) {
    reducingFactors.push({
      type: "reducing",
      label: "Active conflicts",
      description: `${conflictedClaims.length} claim(s) have active conflicts.`,
    });
  }

  return { supportingFactors, reducingFactors };
}

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════

function clamp(score: number, max: number = 100): number {
  return Math.max(0, Math.min(max, Math.round(score)));
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}
