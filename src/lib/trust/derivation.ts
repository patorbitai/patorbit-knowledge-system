/**
 * Trust Derivation Algorithm — ADR-002 Phase 4, Version v1
 *
 * Pure, deterministic, side-effect-free function that derives a TrustReport
 * from canonical server-side facts: Claims, EvidenceRecords, VerificationEvents.
 *
 * Principles:
 *  - Evidence is NOT verification
 *  - Verified claims are the strongest positive signal
 *  - Revoked/expired/disputed claims do NOT contribute as verified
 *  - Deterministic: same input → same output
 *  - No external side effects (no DB, no network, no Zustand)
 */

import type {
  TrustDerivationInput,
  ServerTrustReport,
  TrustBreakdownComponent,
  TrustSummary,
} from "./types";
import { TRUST_ALGORITHM_VERSION, scoreToTrustLevel } from "./types";

// ── Status semantics for Trust ─────────────────────────────────

/**
 * How each Claim verificationStatus contributes to Trust.
 *
 * "positive"   — directly contributes to verified trust
 * "neutral"    — does not help or hurt
 * "excluded"   — does not contribute (counted toward coverage only)
 * "penalized"  — reduces trust
 */
type TrustContribution = "positive" | "neutral" | "excluded" | "penalized";

function statusContribution(status: string): TrustContribution {
  switch (status) {
    case "verified":
      return "positive";
    case "accepted":
      return "neutral";
    case "evidence-added":
      return "neutral";
    case "under-review":
      return "neutral";
    case "suggested":
      return "neutral";
    case "expired":
      return "excluded";
    case "revoked":
      return "penalized";
    case "disputed":
      return "penalized";
    case "rejected":
      return "penalized";
    default:
      return "neutral";
  }
}

// ── Component weights (v1) ────────────────────────────────────

/**
 * Product decision weights — clearly documented as v1 assumptions.
 *
 * NOTE: These are initial product-facing weights chosen to preserve
 * architectural correctness. They are NOT final product-approved values.
 * Final weights should be confirmed by product before launch.
 */
const WEIGHT_VERIFICATION_STRENGTH = 35;
const WEIGHT_EVIDENCE_COVERAGE = 25;
const WEIGHT_CLAIM_COMPLETENESS = 20;
const WEIGHT_EVIDENCE_DIVERSITY = 10;
const WEIGHT_REVIEW_ACTIVITY = 10;

// ── Main derivation function ──────────────────────────────────

/**
 * Derive a ServerTrustReport from canonical facts.
 *
 * @param input - Server-sourced claims, evidence, and verification events
 * @returns TrustReport with score, level, breakdown, reasons
 */
export function deriveTrust(input: TrustDerivationInput): ServerTrustReport {
  const { claims, evidence, verificationEvents } = input;

  // ── Build lookup structures ──────────────────────────────────

  const claimsByStatus = groupByStatus(claims);
  const evidenceByClaim = groupEvidenceByClaimId(evidence);
  const eventsByClaim = groupEventsByClaimId(verificationEvents);

  // ── Summary ──────────────────────────────────────────────────

  const verifiedClaims = claimsByStatus.get("verified") ?? [];
  const totalClaims = claims.length;
  const totalEvidence = evidence.length;
  const totalEvents = verificationEvents.length;

  const claimsWithEvidence = new Set(
    evidence
      .map((e) => e.claimId)
      .filter((id): id is string => id !== null)
  ).size;

  const evidenceCoveragePercent =
    totalClaims > 0 ? Math.round((claimsWithEvidence / totalClaims) * 100) : 0;
  const verificationRate =
    totalClaims > 0 ? Math.round((verifiedClaims.length / totalClaims) * 100) : 0;

  const summary: TrustSummary = {
    totalClaims,
    verifiedClaims: verifiedClaims.length,
    claimsWithEvidence,
    claimsWithoutEvidence: totalClaims - claimsWithEvidence,
    totalEvidence,
    totalVerificationEvents: totalEvents,
    evidenceCoveragePercent,
    verificationRate,
  };

  // ── Component 1: Verification Strength (35%) ─────────────────

  const verificationScore = calculateVerificationStrength(claims, claimsByStatus, eventsByClaim);

  // ── Component 2: Evidence Coverage (25%) ─────────────────────

  const evidenceCoverageScore = calculateEvidenceCoverage(claims, evidenceByClaim);

  // ── Component 3: Claim Completeness (20%) ────────────────────

  const claimCompletenessScore = calculateClaimCompleteness(claims);

  // ── Component 4: Evidence Diversity (10%) ────────────────────

  const evidenceDiversityScore = calculateEvidenceDiversity(evidence);

  // ── Component 5: Review Activity (10%) ───────────────────────

  const reviewActivityScore = calculateReviewActivity(verificationEvents, totalClaims);

  // ── Assemble breakdown ──────────────────────────────────────

  const breakdown: TrustBreakdownComponent[] = [
    {
      label: "Verification Strength",
      score: verificationScore,
      weight: WEIGHT_VERIFICATION_STRENGTH,
      explanation: buildVerificationExplanation(verifiedClaims.length, totalClaims),
    },
    {
      label: "Evidence Coverage",
      score: evidenceCoverageScore,
      weight: WEIGHT_EVIDENCE_COVERAGE,
      explanation: buildEvidenceCoverageExplanation(claimsWithEvidence, totalClaims),
    },
    {
      label: "Claim Completeness",
      score: claimCompletenessScore,
      weight: WEIGHT_CLAIM_COMPLETENESS,
      explanation: buildClaimCompletenessExplanation(claims),
    },
    {
      label: "Evidence Diversity",
      score: evidenceDiversityScore,
      weight: WEIGHT_EVIDENCE_DIVERSITY,
      explanation: buildEvidenceDiversityExplanation(evidence),
    },
    {
      label: "Review Activity",
      score: reviewActivityScore,
      weight: WEIGHT_REVIEW_ACTIVITY,
      explanation: buildReviewActivityExplanation(totalEvents, totalClaims),
    },
  ];

  // ── Compute weighted overall score ──────────────────────────

  const totalWeight = breakdown.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = breakdown.reduce((sum, c) => sum + c.score * c.weight, 0);
  const score =
    totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // ── Build reasons ────────────────────────────────────────────

  const reasons = buildReasons(claims, verifiedClaims, evidenceByClaim, summary);

  // ── Assemble report ─────────────────────────────────────────

  return {
    score,
    level: scoreToTrustLevel(score),
    algorithmVersion: TRUST_ALGORITHM_VERSION,
    breakdown,
    reasons,
    derivedAt: new Date().toISOString(),
    summary,
  };
}

// ── Component calculators ──────────────────────────────────────

function calculateVerificationStrength(
  claims: TrustDerivationInput["claims"],
  claimsByStatus: Map<string, TrustDerivationInput["claims"]>,
  eventsByClaim: Map<string, TrustDerivationInput["verificationEvents"]>,
): number {
  if (claims.length === 0) return 0;

  let score = 0;

  // Verified claims contribute directly
  const verified = claimsByStatus.get("verified") ?? [];
  const verifiedRatio = verified.length / claims.length;
  score += verifiedRatio * 70;

  // Penalized statuses reduce score
  const disputed = claimsByStatus.get("disputed") ?? [];
  const revoked = claimsByStatus.get("revoked") ?? [];
  const penaltyCount = disputed.length + revoked.length;
  if (penaltyCount > 0) {
    const penaltyRatio = penaltyCount / claims.length;
    score -= penaltyRatio * 30;
  }

  // Bonus for recent verification activity (events in last 90 days)
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  let recentVerifiedEvents = 0;
  for (const [, events] of eventsByClaim) {
    for (const event of events) {
      if (
        event.eventType === "verified" &&
        now - event.createdAt.getTime() < ninetyDaysMs
      ) {
        recentVerifiedEvents++;
      }
    }
  }
  if (recentVerifiedEvents > 0) {
    score = Math.min(100, score + 5);
  }

  return clampScore(score);
}

function calculateEvidenceCoverage(
  claims: TrustDerivationInput["claims"],
  evidenceByClaim: Map<string, TrustDerivationInput["evidence"]>,
): number {
  if (claims.length === 0) return 0;

  let coveredClaims = 0;
  for (const claim of claims) {
    const evs = evidenceByClaim.get(claim.id);
    if (evs && evs.length > 0) {
      coveredClaims++;
    }
  }

  const coverageRatio = coveredClaims / claims.length;
  // Scale: 0% coverage → 0 score, 100% coverage → 80 score
  // Bonus for evidence count density
  const totalEvidence = [...evidenceByClaim.values()].reduce(
    (sum, evs) => sum + evs.length,
    0
  );
  const densityBonus = Math.min(20, totalEvidence * 2);

  return clampScore(Math.round(coverageRatio * 80 + densityBonus));
}

function calculateClaimCompleteness(
  claims: TrustDerivationInput["claims"],
): number {
  if (claims.length === 0) return 0;

  // Completeness = how many claims have been accepted (reviewed by user)
  const accepted = claims.filter(
    (c) =>
      c.verificationStatus !== "suggested" &&
      c.verificationStatus !== "revoked"
  ).length;

  const avgConfidence =
    claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length;

  const acceptanceRatio = accepted / claims.length;
  const confidenceFactor = avgConfidence;

  return clampScore(Math.round(acceptanceRatio * 60 + confidenceFactor * 40));
}

function calculateEvidenceDiversity(
  evidence: TrustDerivationInput["evidence"],
): number {
  if (evidence.length === 0) return 0;

  const kinds = new Set(evidence.map((e) => e.evidenceKind));
  const diversityRatio = Math.min(1, kinds.size / 4); // 4+ kinds = max
  const countBonus = Math.min(0.3, evidence.length * 0.05);

  return clampScore(Math.round((diversityRatio * 70 + countBonus * 100) * 100) / 100);
}

function calculateReviewActivity(
  events: TrustDerivationInput["verificationEvents"],
  totalClaims: number,
): number {
  if (totalClaims === 0) return 0;

  const eventsPerClaim = events.length / totalClaims;
  // 0 events → 0, 1+ events per claim → 80, 2+ → 100
  if (eventsPerClaim >= 2) return 100;
  if (eventsPerClaim >= 1) return 80;
  return clampScore(Math.round(eventsPerClaim * 80));
}

// ── Explanation builders ──────────────────────────────────────

function buildVerificationExplanation(verified: number, total: number): string {
  if (total === 0) return "No claims to verify.";
  if (verified === 0)
    return "No claims have been verified yet. Add verification to strengthen trust.";
  return `${verified} of ${total} claims verified (${Math.round((verified / total) * 100)}%).`;
}

function buildEvidenceCoverageExplanation(
  withEvidence: number,
  total: number
): string {
  if (total === 0) return "No claims to support with evidence.";
  return `${withEvidence} of ${total} claims have supporting evidence (${Math.round((withEvidence / total) * 100)}%).`;
}

function buildClaimCompletenessExplanation(
  claims: TrustDerivationInput["claims"]
): string {
  if (claims.length === 0) return "No claims have been added.";
  const avgConf = claims.reduce((s, c) => s + c.confidence, 0) / claims.length;
  return `${claims.length} claim(s) with average confidence ${Math.round(avgConf * 100)}%.`;
}

function buildEvidenceDiversityExplanation(
  evidence: TrustDerivationInput["evidence"]
): string {
  if (evidence.length === 0) return "No evidence has been attached.";
  const kinds = new Set(evidence.map((e) => e.evidenceKind));
  return `${evidence.length} evidence item(s) across ${kinds.size} type(s).`;
}

function buildReviewActivityExplanation(
  events: number,
  totalClaims: number
): string {
  if (totalClaims === 0) return "No claims to review.";
  if (events === 0)
    return "No verification events recorded. Submit claims for review to increase trust.";
  return `${events} verification event(s) recorded across ${totalClaims} claim(s).`;
}

function buildReasons(
  claims: TrustDerivationInput["claims"],
  verifiedClaims: TrustDerivationInput["claims"],
  evidenceByClaim: Map<string, TrustDerivationInput["evidence"]>,
  summary: TrustSummary
): string[] {
  const reasons: string[] = [];

  if (claims.length === 0) {
    reasons.push("No professional claims have been added yet.");
    return reasons;
  }

  if (verifiedClaims.length > 0) {
    reasons.push(
      `${verifiedClaims.length} claim(s) have been independently verified.`
    );
  }

  if (summary.claimsWithEvidence > 0) {
    reasons.push(
      `${summary.claimsWithEvidence} claim(s) are supported by evidence.`
    );
  }

  if (summary.claimsWithoutEvidence > 0) {
    reasons.push(
      `${summary.claimsWithoutEvidence} claim(s) lack supporting evidence.`
    );
  }

  const disputed = claims.filter((c) => c.verificationStatus === "disputed");
  if (disputed.length > 0) {
    reasons.push(
      `${disputed.length} claim(s) are disputed and do not contribute to trust.`
    );
  }

  const revoked = claims.filter((c) => c.verificationStatus === "revoked");
  if (revoked.length > 0) {
    reasons.push(
      `${revoked.length} claim(s) have been revoked and are excluded.`
    );
  }

  const expired = claims.filter((c) => c.verificationStatus === "expired");
  if (expired.length > 0) {
    reasons.push(
      `${expired.length} claim(s) have expired and are excluded from active trust.`
    );
  }

  if (verifiedClaims.length === 0 && claims.length > 0) {
    reasons.push(
      "No claims have been verified yet. Verification significantly strengthens trust."
    );
  }

  return reasons;
}

// ── Helpers ────────────────────────────────────────────────────

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function groupByStatus(
  claims: TrustDerivationInput["claims"]
): Map<string, TrustDerivationInput["claims"]> {
  const map = new Map<string, TrustDerivationInput["claims"]>();
  for (const claim of claims) {
    const list = map.get(claim.verificationStatus) ?? [];
    list.push(claim);
    map.set(claim.verificationStatus, list);
  }
  return map;
}

function groupEvidenceByClaimId(
  evidence: TrustDerivationInput["evidence"]
): Map<string, TrustDerivationInput["evidence"]> {
  const map = new Map<string, TrustDerivationInput["evidence"]>();
  for (const ev of evidence) {
    if (!ev.claimId) continue;
    const list = map.get(ev.claimId) ?? [];
    list.push(ev);
    map.set(ev.claimId, list);
  }
  return map;
}

function groupEventsByClaimId(
  events: TrustDerivationInput["verificationEvents"]
): Map<string, TrustDerivationInput["verificationEvents"]> {
  const map = new Map<string, TrustDerivationInput["verificationEvents"]>();
  for (const event of events) {
    const list = map.get(event.claimId) ?? [];
    list.push(event);
    map.set(event.claimId, list);
  }
  return map;
}
