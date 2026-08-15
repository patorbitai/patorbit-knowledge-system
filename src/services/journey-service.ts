"use strict";

/**
 * Career Journey — Synthesis Engine (Phase 6E).
 *
 * Pure, deterministic, offline synthesis of the canonical Career Journey
 * (ADR-006) from the trusted identity: resume → claims → evidence.
 *
 * Constitutional laws enforced:
 *  - Law 4 (Explainability): every JourneyStatement references ≥1 real Claim
 *    and ≥1 real Evidence item. No statement is ever produced from a claim
 *    without supporting evidence.
 *  - Law 5 (No Fabrication): nothing is invented. Chapters derive from real
 *    resume sections; statement text is the claim's own assertionText;
 *    confidence is the claim's own confidence; provenance describes only
 *    sources that actually exist.
 *  - Law 6 (One Canonical Journey): a single deterministic journey per
 *    identity (journey id derived from the resume/identity id).
 *
 * No AI. No network. No database. No store. No UI.
 * The returned object satisfies `validateJourney()`.
 */

import type {
  Resume,
  Claim,
  Evidence,
  ClaimVerificationStatus,
  EvidenceStatus,
} from "@/types/resume";
import type {
  CareerJourney,
  JourneyChapter,
  JourneyStatement,
  JourneyProvenance,
  JourneySource,
  JourneyStatus,
} from "@/types/careerjourney";
import { JOURNEY_LIFECYCLE_ORDER } from "@/lib/careerjourney/lifecycle";

/** Initial lifecycle state for a freshly synthesized journey. */
const INITIAL_STATUS: JourneyStatus = JOURNEY_LIFECYCLE_ORDER[0];

/** Version of the synthesized journey artifact (increments on regeneration). */
const JOURNEY_VERSION = 1;

/** Claim states that must not appear in the canonical narrative. */
const UNSUPPORTED_CLAIM_STATUSES: ReadonlySet<ClaimVerificationStatus> = new Set([
  "revoked",
  "disputed",
  "expired",
]);

/** Evidence states that no longer support a claim. */
const UNSUPPORTED_EVIDENCE_STATUSES: ReadonlySet<EvidenceStatus> = new Set([
  "revoked",
  "expired",
]);

function identityIdFor(resume: Resume): string {
  return resume?.resumeId?.trim() || "unknown-identity";
}

function journeyIdFor(identityId: string): string {
  return `journey-${identityId}`;
}

/** Parse a date string to a timestamp; unparseable/missing dates sort last. */
function parseDate(value: string | undefined): number {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

/** Deterministic oldest-first ordering (missing dates sort last, stable). */
function compareByStartDate(a: { startDate?: string }, b: { startDate?: string }): number {
  const ta = parseDate(a.startDate);
  const tb = parseDate(b.startDate);
  if (ta !== tb) return ta - tb;
  return (a.startDate ?? "").localeCompare(b.startDate ?? "");
}

function evidenceFor(claimId: string, allEvidence: Evidence[]): Evidence[] {
  return allEvidence.filter((e) => e.claimId === claimId);
}

/**
 * Whether a claim is eligible for narrative (Law 4): accepted, not dead,
 * well-formed, and supported by at least one piece of live evidence.
 */
function isNarrativeEligible(claim: Claim, allEvidence: Evidence[]): boolean {
  if (!claim?.accepted) return false;
  if (UNSUPPORTED_CLAIM_STATUSES.has(claim.verificationStatus)) return false;
  if (
    typeof claim.confidence !== "number" ||
    !Number.isFinite(claim.confidence) ||
    claim.confidence < 0 ||
    claim.confidence > 1
  ) {
    return false;
  }
  if (!claim.assertionText || claim.assertionText.trim().length === 0) return false;
  return evidenceFor(claim.id, allEvidence).some(
    (e) => !UNSUPPORTED_EVIDENCE_STATUSES.has(e.status),
  );
}

/**
 * Build a JourneyStatement from one real claim + its live evidence (Law 4).
 * Returns null when the claim is not traceable to claims + evidence.
 */
function makeStatement(claim: Claim, allEvidence: Evidence[]): JourneyStatement | null {
  if (!isNarrativeEligible(claim, allEvidence)) return null;
  const evidence = evidenceFor(claim.id, allEvidence).filter(
    (e) => !UNSUPPORTED_EVIDENCE_STATUSES.has(e.status),
  );
  if (evidence.length === 0) return null;
  return {
    id: `statement-${claim.id}`,
    statement: claim.assertionText.trim(),
    confidence: claim.confidence,
    claims: [claim],
    evidence,
  };
}

/** De-duplicate claims by id (first occurrence wins) without mutating input. */
function dedupeClaims(claims: Claim[]): Claim[] {
  const seen = new Set<string>();
  const out: Claim[] = [];
  for (const c of claims ?? []) {
    if (!c || !c.id || seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

/**
 * Build the chapter backbone from real resume data, attaching traceable
 * statements where a claim's sourceActivityId matches the activity exactly.
 * Claims that are supported but unattributable land in a final
 * "Supported Claims" chapter. Empty identities yield one honest empty chapter.
 */
function buildChapters(resume: Resume, claims: Claim[], allEvidence: Evidence[]): JourneyChapter[] {
  const chapters: JourneyChapter[] = [];
  let sequence = 0;
  const usedClaimIds = new Set<string>();

  const pushChapter = (title: string, statements: JourneyStatement[]) => {
    sequence += 1;
    chapters.push({ id: `chapter-${sequence}`, title, sequence, statements });
  };

  const statementsForActivity = (activityId: string): JourneyStatement[] => {
    const out: JourneyStatement[] = [];
    for (const claim of claims) {
      if (usedClaimIds.has(claim.id)) continue;
      if (claim.sourceActivityId !== activityId) continue;
      const stmt = makeStatement(claim, allEvidence);
      if (stmt) {
        out.push(stmt);
        usedClaimIds.add(claim.id);
      }
    }
    return out;
  };

  // 1. Chronology — one chapter per real role, oldest first.
  const experience = [...(resume?.experience ?? [])].sort(compareByStartDate);
  for (const exp of experience) {
    const title = exp.position?.trim() || exp.company?.trim() || "Experience";
    pushChapter(title, statementsForActivity(exp.id));
  }

  // 2. Other real sections present in the resume.
  const education = resume?.education ?? [];
  if (education.length > 0) {
    const statements: JourneyStatement[] = [];
    for (const edu of education) statements.push(...statementsForActivity(edu.id));
    pushChapter("Education", statements);
  }

  const projects = resume?.projects ?? [];
  if (projects.length > 0) {
    const statements: JourneyStatement[] = [];
    for (const proj of projects) statements.push(...statementsForActivity(proj.id));
    pushChapter("Projects", statements);
  }

  const certifications = resume?.certifications ?? [];
  if (certifications.length > 0) {
    const statements: JourneyStatement[] = [];
    for (const cert of certifications) statements.push(...statementsForActivity(cert.id));
    pushChapter("Certifications", statements);
  }

  // 3. Supported claims that could not be attributed to a specific activity.
  const unattributed = claims.filter(
    (c) => !usedClaimIds.has(c.id) && isNarrativeEligible(c, allEvidence),
  );
  if (unattributed.length > 0) {
    const statements = unattributed
      .map((c) => makeStatement(c, allEvidence))
      .filter((s): s is JourneyStatement => s !== null);
    pushChapter("Supported Claims", statements);
  }

  // 4. Honest fallback for an empty identity — a single empty chapter.
  if (chapters.length === 0) {
    pushChapter("Career Overview", []);
  }

  return chapters;
}

/**
 * Deterministic strongest-proof selection: the highest-confidence supported
 * statement; ties broken by earliest createdAt, then claim id.
 */
function selectStrongestProof(statements: JourneyStatement[]): JourneyStatement | null {
  if (statements.length === 0) return null;
  const sorted = [...statements].sort((a, b) => {
    const ca = a.claims[0];
    const cb = b.claims[0];
    if (cb.confidence !== ca.confidence) return cb.confidence - ca.confidence;
    const ta = ca.createdAt ?? "";
    const tb = cb.createdAt ?? "";
    if (ta !== tb) return ta.localeCompare(tb);
    return ca.id.localeCompare(cb.id);
  });
  return sorted[0];
}

/**
 * Synthesize the canonical Career Journey (ADR-006) from the trusted
 * identity's real data. Deterministic for identical inputs except for the
 * regeneration timestamp. Always returns a valid journey — never throws.
 */
export function synthesizeCareerJourney(
  resume: Resume,
  claims: Claim[] = [],
  evidence: Evidence[] = [],
): CareerJourney {
  const identityId = identityIdFor(resume);
  const uniqueClaims = dedupeClaims(claims);
  const chapters = buildChapters(resume, uniqueClaims, evidence);
  const allStatements = chapters.flatMap((c) => c.statements);

  return {
    id: journeyIdFor(identityId),
    version: JOURNEY_VERSION,
    chapters,
    lastRegeneratedAt: new Date().toISOString(),
    identityId,
    status: INITIAL_STATUS,
    strongestProof: selectStrongestProof(allStatements),
  };
}

/**
 * Provenance for the synthesized journey (ADR-006 Law 4 traceability).
 * Describes only sources that actually exist in the resume — deterministic
 * counts and fixed engine weights; no invented source information.
 */
export function buildJourneyProvenance(resume: Resume): JourneyProvenance {
  const identityId = identityIdFor(resume);
  const journeyId = journeyIdFor(identityId);
  const sources: JourneySource[] = [];

  const push = (type: JourneySource["type"], description: string, impactFactor: number) => {
    sources.push({ type, description, impactFactor });
  };

  const experience = resume?.experience ?? [];
  const education = resume?.education ?? [];
  const projects = resume?.projects ?? [];
  const skills = resume?.skills ?? [];
  const certifications = resume?.certifications ?? [];
  const portfolio = resume?.portfolio ?? [];

  if (experience.length > 0) {
    push("experience", `${experience.length} work experience entr${experience.length === 1 ? "y" : "ies"}`, 0.6);
  }
  if (education.length > 0) {
    push("education", `${education.length} education entr${education.length === 1 ? "y" : "ies"}`, 0.4);
  }
  if (projects.length > 0) {
    push("projects", `${projects.length} project${projects.length === 1 ? "" : "s"}`, 0.4);
  }
  if (skills.length > 0) {
    push("skills", `${skills.length} skill${skills.length === 1 ? "" : "s"}`, 0.3);
  }
  if (certifications.length > 0) {
    push("certifications", `${certifications.length} certification${certifications.length === 1 ? "" : "s"}`, 0.4);
  }
  if (portfolio.length > 0) {
    push("portfolio", `${portfolio.length} portfolio item${portfolio.length === 1 ? "" : "s"}`, 0.3);
  }
  if (resume?.social?.github?.trim()) {
    push("github", "GitHub profile link", 0.3);
  }

  // The resume is the canonical input source of the synthesized identity.
  push("resume", "User-provided resume data", 1.0);

  return {
    id: `provenance-${identityId}`,
    journeyId,
    sources,
    createdAt: new Date().toISOString(),
  };
}
