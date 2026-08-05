"use strict";

import type { GraphService } from "./graph-service";
import type {
  ClaimNode,
  EvidenceNode,
  VerifierNode,
  TrustScoreComponent,
  TrustSnapshot,
  TrustReport,
  VerificationSummary,
  EvidenceCoverage,
  WeakClaim,
  EdgeType,
  NodeId,
} from "@/types/knowledge-graph";

/**
 * Trust Service — verification and trust scoring.
 *
 * This is the second layer of the architecture. It consumes the GraphService
 * to evaluate the trustworthiness of claims, compute scores, and identify
 * verification gaps. No opinion about what the data "means" — only whether
 * it can be believed.
 *
 * Layer: Trust = Verification
 */
export class TrustService {
  private graph: GraphService;

  constructor(graphService: GraphService) {
    this.graph = graphService;
  }

  // -----------------------------------------------------------------
  //  Trust Score
  // -----------------------------------------------------------------

  /**
   * Canonical trust API.
   *
   * All new consumers should use `calculateTrustReport()`.
   *
   * `calculateTrustScore()` exists only for backward compatibility and
   * returns `report.snapshot`.
   */

  /**
   * Compute a rich trust report — including the lightweight snapshot,
   * verification summary, evidence coverage, weak claims, and generation timestamp.
   *
   * This is the canonical aggregation method used internally. Existing consumers
   * that only need the score call calculateTrustScore(), which extracts the snapshot
   * from the report.
   */
  calculateTrustReport(): TrustReport {
    const snapshot = this._calculateScoreSnapshot();
    const verificationSummary = this.getVerificationSummary();
    const evidenceCoverage = this.getEvidenceCoverage();
    const weakClaims = this.findWeakClaims();

    return {
      snapshot,
      verificationSummary,
      evidenceCoverage,
      weakClaims,
      generatedAt: snapshot.calculatedAt, // reuse snapshot timestamp
    };
  }

  /** Public lightweight version returning just the score snapshot (backward compatible). */
  calculateTrustScore(): TrustSnapshot {
    return this._calculateScoreSnapshot();
  }

  // -----------------------------------------------------------------
  //  Private — score snapshot
  // -----------------------------------------------------------------

  /**
   * Compute an overall trust score for the entire profile (0–100).
   * This is the actual scoring implementation; both public methods surface it.
   */
  private _calculateScoreSnapshot(): TrustSnapshot {
    const components: TrustScoreComponent[] = [
      this.scoreIdentity(),
      this.scoreSkills(),
      this.scoreExperience(),
      this.scoreEducation(),
      this.scoreCertifications(),
      this.scoreReferences(),
      this.scorePortfolio(),
      this.scoreClaims(),
    ];

    const valid = components.filter(
      (c): c is TrustScoreComponent & { score: number } =>
        c.status === "scored" && c.score !== null
    );
    const weightedSum = valid.reduce((s, c) => s + c.score * c.weight, 0);
    const totalWeight = valid.reduce((s, c) => s + c.weight, 0);
    const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;

    return {
      overall,
      components,
      calculatedAt: new Date().toISOString(),
    };
  }

  /** Get a per-domain breakdown of trust levels. */
  getTrustBreakdown(): Array<{
    domain: string;
    score: number | null;
    status: "strong" | "moderate" | "weak" | "missing";
  }> {
    const score = this.calculateTrustScore();
    return score.components.map((c) => {
      let status: "strong" | "moderate" | "weak" | "missing";
      if (c.score === null) status = "missing";
      else if (c.score >= 70) status = "strong";
      else if (c.score >= 40) status = "moderate";
      else status = "weak";
      return { domain: c.label, score: c.score, status };
    });
  }

  // -----------------------------------------------------------------
  //  Verification Summary
  // -----------------------------------------------------------------

  /** Aggregate verification status across all claims. */
  getVerificationSummary(): VerificationSummary {
    const claims = this.graph.findClaims();
    const verified = claims.filter((c) => c.verificationStatus === "verified").length;
    const pending = claims.filter((c) => c.verificationStatus === "pending").length;
    const unverified = claims.filter((c) => c.verificationStatus === "unverified").length;
    const disputed = claims.filter((c) => c.verificationStatus === "disputed").length;
    const expired = claims.filter((c) => c.verificationStatus === "expired").length;
    const total = claims.length;
    const coverage = total > 0 ? Math.round(((verified + pending) / total) * 100) : 0;

    return { total, verified, pending, unverified, disputed, expired, coverage };
  }

  // -----------------------------------------------------------------
  //  Evidence Coverage
  // -----------------------------------------------------------------

  /** Measure how well claims are supported by evidence. */
  getEvidenceCoverage(): EvidenceCoverage {
    const claims = this.graph.findClaims();
    const allEvidence = this.graph.findEvidence();

    const evidenceByFormat: Record<string, number> = {};
    for (const ev of allEvidence) {
      evidenceByFormat[ev.format] = (evidenceByFormat[ev.format] ?? 0) + 1;
    }

    const claimsWithEvidence = new Set<NodeId>();
    for (const ev of allEvidence) {
      const claimEdges = this.graph.getIncomingEdges(ev.id, "SUPPORTED_BY");
      for (const e of claimEdges) claimsWithEvidence.add(e.sourceNodeId);
    }

    const total = claims.length;
    const withEv = claimsWithEvidence.size;
    const withoutEv = total - withEv;

    // Strongest/weakest claim types
    const typeMap = new Map<string, { total: number; withEvidence: number }>();
    for (const c of claims) {
      const entry = typeMap.get(c.claimType) ?? { total: 0, withEvidence: 0 };
      entry.total++;
      if (claimsWithEvidence.has(c.id)) entry.withEvidence++;
      typeMap.set(c.claimType, entry);
    }

    const sorted = [...typeMap.entries()]
      .map(([type, { total, withEvidence }]) => ({
        type,
        pct: total > 0 ? (withEvidence / total) * 100 : 0,
      }))
      .sort((a, b) => b.pct - a.pct);

    return {
      totalClaims: total,
      claimsWithEvidence: withEv,
      claimsWithoutEvidence: withoutEv,
      coveragePercent: total > 0 ? Math.round((withEv / total) * 100) : 0,
      evidenceByFormat,
      strongestAreas: sorted.filter((s) => s.pct > 50).map((s) => s.type),
      weakestAreas: sorted.filter((s) => s.pct <= 50).map((s) => s.type),
    };
  }

  // -----------------------------------------------------------------
  //  Weak Claims
  // -----------------------------------------------------------------

  /** Find claims that need attention (unverified, low confidence, disputed). */
  findWeakClaims(): WeakClaim[] {
    const weak: WeakClaim[] = [];

    for (const claim of this.graph.findClaims()) {
      const evidence = this.graph.findEvidenceForClaim(claim.id);
      const reasons: string[] = [];

      if (claim.verificationStatus === "disputed") {
        reasons.push("Claim has been disputed");
      }
      if (claim.verificationStatus === "expired") {
        reasons.push("Evidence has expired — re-verify");
      }
      if (evidence.length === 0) {
        reasons.push("No supporting evidence");
      }
      if (claim.confidence < 0.5) {
        reasons.push("Low self-assessed confidence");
      }
      if (claim.hasMetric && evidence.length === 0) {
        reasons.push("Claim includes a metric but no evidence to support it");
      }

      if (reasons.length === 0) continue;

      const priority: "high" | "medium" | "low" =
        claim.verificationStatus === "disputed"
          ? "high"
          : reasons.length >= 2
            ? "high"
            : claim.verificationStatus === "expired"
              ? "medium"
              : "low";

      weak.push({ claim, reasons, evidenceCount: evidence.length, priority });
    }

    weak.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

    return weak;
  }

  // -----------------------------------------------------------------
  //  Private — scoring components
  // -----------------------------------------------------------------

  private scoreIdentity(): TrustScoreComponent {
    const p = this.graph.getProfile();
    let score = 0;
    const parts: string[] = [];
    if (p.label) { score += 25; parts.push("Name"); }
    if (p.email) { score += 20; parts.push("Email"); }
    if (p.phone) { score += 15; parts.push("Phone"); }
    if (p.social.linkedin) { score += 15; parts.push("LinkedIn"); }
    if (p.social.github) { score += 10; parts.push("GitHub"); }
    if (p.summary) { score += 15; parts.push("Summary"); }

    if (parts.length === 0) {
      return { label: "Identity", score: null, maxScore: 100, weight: 15, status: "missing", explanation: "No identity information provided.", improvementTip: "Add your name, email, and phone number.", potentialGain: 100 };
    }
    return { label: "Identity", score, maxScore: 100, weight: 15, status: "scored", explanation: `Verified: ${parts.join(", ")}.`, improvementTip: score < 100 ? "Complete all social profile links for maximum trust." : undefined, potentialGain: 100 - score };
  }

  private scoreSkills(): TrustScoreComponent {
    const skills = this.graph.findSkills();
    if (skills.length === 0) {
      return { label: "Skills", score: null, maxScore: 100, weight: 15, status: "missing", explanation: "No skills listed.", improvementTip: "Add your technical and professional skills.", potentialGain: 100 };
    }
    const withProficiency = skills.filter((s) => s.proficiency !== "Intermediate" || skills.indexOf(s) > 0).length;
    const categorized = skills.filter((s) => s.category).length;
    const score = Math.min(100, 20 + Math.min(skills.length * 5, 40) + Math.min(withProficiency * 2, 20) + Math.min(categorized * 3, 20));
    return { label: "Skills", score, maxScore: 100, weight: 15, status: "scored", explanation: `${skills.length} skill(s) listed.`, improvementTip: score < 100 ? "Add proficiency levels and categories for all skills." : undefined, potentialGain: 100 - score };
  }

  private scoreExperience(): TrustScoreComponent {
    const roles = this.graph.findRoles();
    if (roles.length === 0) {
      return { label: "Experience", score: null, maxScore: 100, weight: 20, status: "missing", explanation: "No experience entries.", improvementTip: "Add your work history.", potentialGain: 100 };
    }
    const withOrgs = roles.filter((r) => this.graph.getEdges(r.id, "WORKED_AT").length > 0).length;
    const withAchievements = roles.filter((r) => this.graph.getIncomingEdges(r.id, "ACCOMPLISHED").length > 0).length;
    const score = Math.min(100, 20 + roles.length * 10 + withOrgs * 10 + withAchievements * 15 + (roles.some((r) => r.isCurrent) ? 10 : 0));
    return { label: "Experience", score, maxScore: 100, weight: 20, status: "scored", explanation: `${roles.length} role(s) with ${withAchievements} having achievements.`, improvementTip: score < 100 ? "Add achievements and bullet points to each role." : undefined, potentialGain: 100 - score };
  }

  private scoreEducation(): TrustScoreComponent {
    const edu = this.graph.findEducations();
    if (edu.length === 0) {
      return { label: "Education", score: null, maxScore: 100, weight: 10, status: "missing", explanation: "No education entries.", improvementTip: "Add your educational background.", potentialGain: 100 };
    }
    const hasDetails = edu.some((e) => e.gpa || e.honors);
    const score = Math.min(100, 30 + edu.length * 15 + (hasDetails ? 15 : 0));
    return { label: "Education", score, maxScore: 100, weight: 10, status: "scored", explanation: `${edu.length} degree(s) listed.`, improvementTip: score < 100 ? "Add GPA, honors, or activities for a complete profile." : undefined, potentialGain: 100 - score };
  }

  private scoreCertifications(): TrustScoreComponent {
    const certs = this.graph.findCertifications();
    if (certs.length === 0) {
      return { label: "Certifications", score: null, maxScore: 100, weight: 10, status: "missing", explanation: "No certifications.", improvementTip: "Add relevant certifications to boost credibility.", potentialGain: 100 };
    }
    const withLinks = certs.filter((c) => c.url).length;
    const score = Math.min(100, 30 + certs.length * 10 + withLinks * 15);
    return { label: "Certifications", score, maxScore: 100, weight: 10, status: "scored", explanation: `${certs.length} certification(s).`, improvementTip: score < 100 ? "Add credential verification links." : undefined, potentialGain: 100 - score };
  }

  private scoreReferences(): TrustScoreComponent {
    const refs = this.graph.findReferences();
    if (refs.length === 0) {
      return { label: "References", score: null, maxScore: 100, weight: 5, status: "missing", explanation: "No references.", improvementTip: "Add professional references.", potentialGain: 100 };
    }
    const withEmail = refs.filter((r) => r.email).length;
    const score = Math.min(100, 20 + refs.length * 15 + withEmail * 10);
    return { label: "References", score, maxScore: 100, weight: 5, status: "scored", explanation: `${refs.length} reference(s).`, improvementTip: undefined, potentialGain: 100 - score };
  }

  private scorePortfolio(): TrustScoreComponent {
    const profile = this.graph.getProfile();
    const projects = this.graph.findProjects();
    const hasGH = !!profile.social.github;
    const hasWebsite = !!profile.social.website || !!profile.social.portfolio;

    if (!hasGH && !hasWebsite && projects.length === 0) {
      return { label: "Portfolio", score: null, maxScore: 100, weight: 10, status: "missing", explanation: "No portfolio or projects.", improvementTip: "Connect GitHub or add a portfolio link.", potentialGain: 100 };
    }
    let score = 0;
    if (hasGH) score += 30;
    if (hasWebsite) score += 25;
    score += Math.min(projects.length * 10, 45);
    return { label: "Portfolio", score, maxScore: 100, weight: 10, status: "scored", explanation: `${hasGH ? "GitHub. " : ""}${hasWebsite ? "Portfolio. " : ""}${projects.length} project(s).`.trim(), improvementTip: score < 100 ? "Add more portfolio items or pinned repositories." : undefined, potentialGain: 100 - score };
  }

  private scoreClaims(): TrustScoreComponent {
    const claims = this.graph.findClaims();
    if (claims.length === 0) {
      return { label: "Claims & Verification", score: null, maxScore: 100, weight: 15, status: "missing", explanation: "No claims have been verified.", improvementTip: "Mark key assertions as claims and attach evidence.", potentialGain: 100 };
    }
    const verified = claims.filter((c) => c.verificationStatus === "verified").length;
    const withEvidence = claims.filter((c) => this.graph.findEvidenceForClaim(c.id).length > 0).length;
    const score = Math.min(100, Math.round((verified / claims.length) * 50) + Math.round((withEvidence / claims.length) * 50));
    return { label: "Claims & Verification", score, maxScore: 100, weight: 15, status: "scored", explanation: `${verified}/${claims.length} claims verified, ${withEvidence} with evidence.`, improvementTip: score < 100 ? "Add supporting evidence to unverified claims." : undefined, potentialGain: 100 - score };
  }
}
