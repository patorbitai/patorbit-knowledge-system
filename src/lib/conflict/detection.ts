/**
 * Conflict Detection Algorithm — ADR-002 Phase 5
 *
 * Pure, deterministic, side-effect-free function that detects
 * inconsistencies between Claims within the same ProfessionalIdentity.
 *
 * Principles (from MASTER_ARCHITECTURE §9):
 *  - Conflicts should be surfaced, NOT silently resolved
 *  - Never use "latest uploaded evidence wins"
 *  - Possible legitimate explanations exist for apparent conflicts
 *  - The system surfaces "CONFLICT / CLARIFICATION REQUIRED"
 *  - The user decides how to handle each conflict
 *
 * This algorithm detects:
 *  - Overlapping employment date ranges
 *  - Contradictory employer names for overlapping periods
 *  - Contradictory job titles for overlapping periods
 *  - Contradictory date ranges (same employer, different dates)
 *  - Duplicate credentials (same certification/education)
 *  - Education inconsistencies (same degree, different field/school)
 *  - Status mismatches (verified claim contradicts disputed claim)
 *  - Location inconsistencies (same employer, different locations)
 */

import type {
  CanonicalClaimForConflict,
  DetectedConflict,
  ConflictDetectionResult,
  ConflictType,
  ConflictSeverity,
} from "./types";

// ── Main detection function ────────────────────────────────────

/**
 * Detect conflicts across a set of Claims belonging to the same ProfessionalIdentity.
 *
 * @param claims - All Claims for a single ProfessionalIdentity
 * @returns ConflictDetectionResult with detected conflicts
 */
export function detectConflicts(
  claims: CanonicalClaimForConflict[],
): ConflictDetectionResult {
  const conflicts: DetectedConflict[] = [];

  // Group claims by type for type-specific comparisons
  const byType = groupByType(claims);

  // Employment claims: date overlap, contradictory employer/title/dates/location
  const employment = byType.get("Employment") ?? [];
  conflicts.push(...detectEmploymentConflicts(employment));

  // Education claims: duplicate/inconsistent education
  const education = byType.get("Education") ?? [];
  conflicts.push(...detectEducationConflicts(education));

  // Certification claims: duplicate credentials
  const certifications = byType.get("Certification") ?? [];
  conflicts.push(...detectCertificationConflicts(certifications));

  // Skill claims: contradictory proficiency (info-level)
  const skills = byType.get("Skill") ?? [];
  conflicts.push(...detectSkillConflicts(skills));

  // Cross-type: status mismatches (verified claim contradicts disputed claim about same topic)
  conflicts.push(...detectStatusMismatches(claims));

  return {
    newConflicts: conflicts,
    totalDetected: conflicts.length,
    claimsCompared: claims.length,
    detectedAt: new Date().toISOString(),
  };
}

// ── Employment Conflict Detection ──────────────────────────────

function detectEmploymentConflicts(
  claims: CanonicalClaimForConflict[],
): DetectedConflict[] {
  const conflicts: DetectedConflict[] = [];

  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      const a = claims[i];
      const b = claims[j];

      const parsedA = parseEmploymentAssertion(a.assertionText);
      const parsedB = parseEmploymentAssertion(b.assertionText);

      if (!parsedA || !parsedB) continue;

      // Check for overlapping date ranges
      if (parsedA.startDate && parsedA.endDate && parsedB.startDate && parsedB.endDate) {
        const aStart = new Date(parsedA.startDate).getTime();
        const aEnd = new Date(parsedA.endDate).getTime();
        const bStart = new Date(parsedB.startDate).getTime();
        const bEnd = new Date(parsedB.endDate).getTime();

        if (!isNaN(aStart) && !isNaN(aEnd) && !isNaN(bStart) && !isNaN(bEnd)) {
          const overlaps = aStart < bEnd && bStart < aEnd;

          if (overlaps) {
            // Check if employer names are contradictory
            if (
              parsedA.employer &&
              parsedB.employer &&
              normalizedSimilarity(parsedA.employer, parsedB.employer) < 0.6
            ) {
              conflicts.push({
                conflictType: "contradictory_employer",
                severity: "warning",
                description: `Claims suggest employment at different employers during overlapping periods: "${parsedA.employer}" and "${parsedB.employer}". This could indicate part-time work, consulting, or a data entry error.`,
                claimIds: [a.id, b.id],
              });
            }

            // Check if job titles are contradictory
            if (
              parsedA.title &&
              parsedB.title &&
              normalizedSimilarity(parsedA.title, parsedB.title) < 0.5
            ) {
              conflicts.push({
                conflictType: "contradictory_title",
                severity: "info",
                description: `Claims suggest different job titles during overlapping periods: "${parsedA.title}" and "${parsedB.title}". This could indicate a promotion, role change, or concurrent positions.`,
                claimIds: [a.id, b.id],
              });
            }

            // Check if locations are contradictory
            if (
              parsedA.location &&
              parsedB.location &&
              normalizedSimilarity(parsedA.location, parsedB.location) < 0.5
            ) {
              conflicts.push({
                conflictType: "location_inconsistency",
                severity: "info",
                description: `Claims suggest different locations during overlapping periods: "${parsedA.location}" and "${parsedB.location}". This could indicate remote work, relocation, or multiple offices.`,
                claimIds: [a.id, b.id],
              });
            }
          }

          // Check for contradictory dates (same employer, different date ranges)
          if (
            parsedA.employer &&
            parsedB.employer &&
            normalizedSimilarity(parsedA.employer, parsedB.employer) >= 0.6
          ) {
            if (aStart !== bStart || aEnd !== bEnd) {
              conflicts.push({
                conflictType: "contradictory_dates",
                severity: "warning",
                description: `Claims about "${parsedA.employer}" have different date ranges. This could indicate a correction, resume update, or data entry error.`,
                claimIds: [a.id, b.id],
              });
            }
          }
        }
      }
    }
  }

  return conflicts;
}

// ── Education Conflict Detection ───────────────────────────────

function detectEducationConflicts(
  claims: CanonicalClaimForConflict[],
): DetectedConflict[] {
  const conflicts: DetectedConflict[] = [];

  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      const a = claims[i];
      const b = claims[j];

      const parsedA = parseEducationAssertion(a.assertionText);
      const parsedB = parseEducationAssertion(b.assertionText);

      if (!parsedA || !parsedB) continue;

      // Same school but different degree/field
      if (
        parsedA.school &&
        parsedB.school &&
        normalizedSimilarity(parsedA.school, parsedB.school) >= 0.6
      ) {
        if (
          parsedA.degree &&
          parsedB.degree &&
          normalizedSimilarity(parsedA.degree, parsedB.degree) < 0.6
        ) {
          conflicts.push({
            conflictType: "education_inconsistency",
            severity: "info",
            description: `Claims about "${parsedA.school}" mention different degrees: "${parsedA.degree}" and "${parsedB.degree}". This could indicate multiple degrees or a data entry error.`,
            claimIds: [a.id, b.id],
          });
        }
      }

      // Same degree but different school
      if (
        parsedA.degree &&
        parsedB.degree &&
        normalizedSimilarity(parsedA.degree, parsedB.degree) >= 0.6 &&
        parsedA.school &&
        parsedB.school &&
        normalizedSimilarity(parsedA.school, parsedB.school) < 0.4
      ) {
        conflicts.push({
          conflictType: "duplicate_credential",
          severity: "warning",
          description: `Claims mention the same degree ("${parsedA.degree}") from different institutions: "${parsedA.school}" and "${parsedB.school}". This could indicate a transfer, dual enrollment, or data entry error.`,
          claimIds: [a.id, b.id],
        });
      }
    }
  }

  return conflicts;
}

// ── Certification Conflict Detection ───────────────────────────

function detectCertificationConflicts(
  claims: CanonicalClaimForConflict[],
): DetectedConflict[] {
  const conflicts: DetectedConflict[] = [];

  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      const a = claims[i];
      const b = claims[j];

      // Similar certification names could be duplicates
      if (normalizedSimilarity(a.assertionText, b.assertionText) >= 0.7) {
        conflicts.push({
          conflictType: "duplicate_credential",
          severity: "warning",
          description: `Two claims appear to reference the same or very similar certification: "${a.assertionText}" and "${b.assertionText}". This could be a duplicate entry.`,
          claimIds: [a.id, b.id],
        });
      }
    }
  }

  return conflicts;
}

// ── Skill Conflict Detection ───────────────────────────────────

function detectSkillConflicts(
  claims: CanonicalClaimForConflict[],
): DetectedConflict[] {
  const conflicts: DetectedConflict[] = [];

  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      const a = claims[i];
      const b = claims[j];

      // Similar skill names with very different confidence levels
      // Uses a lower threshold (0.3) because skill assertions are often short
      if (normalizedSimilarity(a.assertionText, b.assertionText) >= 0.3) {
        const confDiff = Math.abs(a.confidence - b.confidence);
        if (confDiff > 0.4) {
          conflicts.push({
            conflictType: "status_mismatch",
            severity: "info",
            description: `Two claims about similar skills have very different confidence levels (${Math.round(a.confidence * 100)}% vs ${Math.round(b.confidence * 100)}%). This could indicate self-assessment inconsistency.`,
            claimIds: [a.id, b.id],
          });
        }
      }
    }
  }

  return conflicts;
}

// ── Cross-type Status Mismatch Detection ───────────────────────

function detectStatusMismatches(
  claims: CanonicalClaimForConflict[],
): DetectedConflict[] {
  const conflicts: DetectedConflict[] = [];

  // Find verified claims and disputed claims that might be about the same topic
  const verified = claims.filter((c) => c.verificationStatus === "verified");
  const disputed = claims.filter((c) => c.verificationStatus === "disputed");

  for (const v of verified) {
    for (const d of disputed) {
      if (v.claimType === d.claimType && normalizedSimilarity(v.assertionText, d.assertionText) >= 0.5) {
        conflicts.push({
          conflictType: "status_mismatch",
          severity: "critical",
          description: `A verified claim ("${v.assertionText}") appears to contradict a disputed claim ("${d.assertionText}"). This requires review to determine which claim is accurate.`,
          claimIds: [v.id, d.id],
        });
      }
    }
  }

  return conflicts;
}

// ── Assertion Parsers ──────────────────────────────────────────

interface ParsedEmployment {
  employer?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

/**
 * Best-effort extraction of employment details from assertion text.
 * Returns null if the assertion doesn't look like an employment claim.
 */
function parseEmploymentAssertion(text: string): ParsedEmployment | null {
  const lower = text.toLowerCase();

  // Must contain some employment signal
  const signals = ["worked", "employed", "engineer", "developer", "manager", "analyst", "lead", "director", "consultant", "at ", "role"];
  const hasSignal = signals.some((s) => lower.includes(s));
  if (!hasSignal && !lower.includes("–") && !lower.includes("-")) return null;

  const result: ParsedEmployment = {};

  // Extract dates (YYYY-MM-DD, YYYY-MM, "from X to Y", etc.)
  const dateRangeMatch = text.match(/(\d{4}[-/]\d{1,2}(?:[-/]\d{1,2})?)\s*(?:–|-|to)\s*(\d{4}[-/]\d{1,2}(?:[-/]\d{1,2})?|present|current)/i);
  if (dateRangeMatch) {
    result.startDate = dateRangeMatch[1];
    result.endDate = dateRangeMatch[2].toLowerCase() === "present" || dateRangeMatch[2].toLowerCase() === "current"
      ? new Date().toISOString().slice(0, 10)
      : dateRangeMatch[2];
  }

  // Extract employer (after "at ", "with ", "for ")
  const employerMatch = text.match(/(?:at|with|for)\s+([A-Z][A-Za-z\s&.]+?)(?:\s+(?:as|from|in|,)|\s*$)/);
  if (employerMatch) {
    result.employer = employerMatch[1].trim();
  }

  // Extract title (after "as ", or known title patterns)
  const titleMatch = text.match(/(?:as|role[:\s]+|title[:\s]+)\s*([A-Z][A-Za-z\s]+?)(?:\s+(?:at|from|in|,)|\s*$)/);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }

  // Extract location (after "in ", or common city patterns)
  const locationMatch = text.match(/(?:in|located in|based in)\s+([A-Z][A-Za-z\s,]+?)(?:\s+(?:from|as|at)|\s*$)/);
  if (locationMatch) {
    result.location = locationMatch[1].trim();
  }

  return result;
}

interface ParsedEducation {
  school?: string;
  degree?: string;
  field?: string;
}

/**
 * Best-effort extraction of education details from assertion text.
 */
function parseEducationAssertion(text: string): ParsedEducation | null {
  const lower = text.toLowerCase();
  const signals = ["graduated", "degree", "bachelor", "master", "phd", "university", "college", "studied", "education", "diploma", "certification"];
  const hasSignal = signals.some((s) => lower.includes(s));
  if (!hasSignal) return null;

  const result: ParsedEducation = {};

  // Extract school (after "from ", or known university patterns)
  const schoolMatch = text.match(/(?:from|at)\s+([A-Z][A-Za-z\s&.]+?)(?:\s+(?:with|in|,)|\s*$)/);
  if (schoolMatch) {
    result.school = schoolMatch[1].trim();
  }

  // Extract degree
  const degreePatterns = ["bachelor", "master", "phd", "doctorate", "mba", "b.s.", "b.a.", "m.s.", "m.a.", "diploma"];
  for (const pattern of degreePatterns) {
    if (lower.includes(pattern)) {
      result.degree = pattern.charAt(0).toUpperCase() + pattern.slice(1);
      break;
    }
  }

  // Extract field (after "in " following degree)
  const fieldMatch = text.match(/(?:in|of)\s+([A-Z][A-Za-z\s]+?)(?:\s+(?:from|at|with|,)|\s*$)/);
  if (fieldMatch && !fieldMatch[1].toLowerCase().includes("university")) {
    result.field = fieldMatch[1].trim();
  }

  return result;
}

// ── Helpers ────────────────────────────────────────────────────

function groupByType(
  claims: CanonicalClaimForConflict[],
): Map<string, CanonicalClaimForConflict[]> {
  const map = new Map<string, CanonicalClaimForConflict[]>();
  for (const claim of claims) {
    const list = map.get(claim.claimType) ?? [];
    list.push(claim);
    map.set(claim.claimType, list);
  }
  return map;
}

/**
 * Simple normalized similarity: 0 = completely different, 1 = identical.
 * Uses normalized lowercase Jaccard similarity on character bigrams.
 */
function normalizedSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb) return 1;

  const bigramsA = bigrams(na);
  const bigramsB = bigrams(nb);
  if (bigramsA.size === 0 && bigramsB.size === 0) return 1;
  if (bigramsA.size === 0 || bigramsB.size === 0) return 0;

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }

  const union = bigramsA.size + bigramsB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function bigrams(s: string): Set<string> {
  const result = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) {
    result.add(s.slice(i, i + 2));
  }
  return result;
}
