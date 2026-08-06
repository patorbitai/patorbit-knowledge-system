"use strict";

import { describe, it, expect } from "vitest";
import { resumeToGraph } from "../graph-mapper";
import { GraphService } from "../graph-service";
import { TrustService } from "../trust-service";
import type { Resume, Claim, Evidence } from "@/types/resume";

/**
 * Constitutional pipeline integration proof (Phase 0).
 *
 * Proves, end-to-end, that the ADR-006 pipeline is alive at the
 * graph → trust layer:
 *
 *   Resume → resumeToGraph → GraphService → TrustService
 *
 * This is NOT a coordinator test and NOT a store test. It exercises the
 * pure services only.
 */

function makeClaim(id: string, accepted: boolean): Claim {
  return {
    id,
    assertionText: "Led migration of the payment platform.",
    claimType: "Project",
    sourceActivityId: "project-0",
    confidence: 0.9,
    reasoning: "Backed by project evidence.",
    verificationStatus: "accepted",
    reviewed: true,
    accepted,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function makeEvidence(id: string, claimId: string): Evidence {
  return {
    id,
    claimId,
    evidenceType: "file",
    evidenceKind: "Screenshots",
    content: "evd_blob_key",
    format: "image/png",
    metadata: { fileName: "payment-migration.png" },
    uploadedBy: "self",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "evidence-added",
    confidence: 0.8,
    notes: "",
    visibility: "private",
    consent: true,
  };
}

function makeResume(claims: Claim[]): Resume {
  return {
    name: "Test User",
    title: "Developer",
    email: "test@example.com",
    phone: "+1-555-123-4567",
    address: "",
    nationality: "",
    pronouns: "",
    summary: "",
    social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
    achievements: [],
    references: [],
    portfolio: [],
    templateId: "modern-clean",
    careerStage: "working-professional",
    claims,
  };
}

/** Build the pipeline for a given resume + evidence, returning trust metrics. */
function runPipeline(resume: Resume, evidence: Evidence[]) {
  const graph = resumeToGraph(resume, "user-input", evidence);
  const graphService = new GraphService(graph);
  const trustService = new TrustService(graphService);
  const trust = trustService.calculateTrustScore();
  const coverage = trustService.getEvidenceCoverage();
  const verification = trustService.getVerificationSummary();
  return { trust, coverage, verification };
}

describe("Constitutional pipeline: graph → trust integration", () => {
  it("trust increases when evidence is added to an accepted claim", () => {
    // 1. Resume with one accepted claim, zero evidence.
    const resume = makeResume([makeClaim("c1", true)]);

    // 2-5. Build graph + trust with no evidence.
    const before = runPipeline(resume, []);
    expect(before.coverage.totalClaims).toBe(1);
    expect(before.coverage.claimsWithEvidence).toBe(0);
    expect(before.coverage.coveragePercent).toBe(0);
    expect(before.verification.total).toBe(1);

    // 6-8. Add one evidence item, rebuild, recalc.
    const evidence = [makeEvidence("e1", "c1")];
    const after = runPipeline(resume, evidence);

    // supported claims increased
    expect(after.coverage.claimsWithEvidence).toBeGreaterThan(before.coverage.claimsWithEvidence);
    // evidence coverage increased
    expect(after.coverage.coveragePercent).toBeGreaterThan(before.coverage.coveragePercent);
    // trust score increased
    if (before.trust.overall !== null && after.trust.overall !== null) {
      expect(after.trust.overall).toBeGreaterThan(before.trust.overall);
    } else {
      // Before has no claim/evidence support; after should at least produce a number.
      expect(after.trust.overall).not.toBeNull();
    }
    // no other values changed unexpectedly
    expect(after.coverage.totalClaims).toBe(before.coverage.totalClaims);
    expect(after.verification.total).toBe(before.verification.total);
  });
});
