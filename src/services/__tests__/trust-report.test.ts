"use strict";

import { describe, it, expect } from "vitest";
import { resumeToGraph } from "../graph-mapper";
import { GraphService } from "../graph-service";
import { TrustService } from "../trust-service";
import { defaultResume } from "@/store/resume-builder";
import type { Resume, Claim, Evidence } from "@/types/resume";

/**
 * TrustService explainability tests (Task 1.1).
 *
 * Verifies the canonical TrustReport aggregation and the backward-compat
 * invariant that `calculateTrustScore()` always matches
 * `calculateTrustReport().snapshot`.
 */

function makeClaim(id: string, accepted: boolean, overrides: Partial<Claim> = {}): Claim {
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
    ...overrides,
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

function buildService(resume: Resume, evidence: Evidence[]): TrustService {
  const graph = resumeToGraph(resume, "user-input", evidence);
  const graphService = new GraphService(graph);
  return new TrustService(graphService);
}

describe("TrustService — calculateTrustReport (Task 1.1)", () => {
  it("returns a snapshot equivalent to calculateTrustScore() (invariant)", () => {
    const resume = makeResume([
      makeClaim("c1", true, { verificationStatus: "verified" }),
    ]);
    const evidence = [makeEvidence("e1", "c1")];
    const service = buildService(resume, evidence);

    const report = service.calculateTrustReport();
    const score = service.calculateTrustScore();

    // Both public methods surface the same scoring computation. The
    // calculatedAt timestamps may differ by a millisecond (each call stamps
    // its own Date), so compare the meaningful structure exactly.
    expect(score.overall).toBe(report.snapshot.overall);
    expect(score.components).toEqual(report.snapshot.components);
    expect(score.calculatedAt).toEqual(expect.any(String));
    // The report's snapshot IS the score the public method returns.
    expect(score.components).toEqual(report.snapshot.components);
  });

  it("aggregates verificationSummary, evidenceCoverage, and weakClaims", () => {
    const resume = makeResume([
      makeClaim("c1", true, { verificationStatus: "verified" }),
      makeClaim("c2", true, { verificationStatus: "accepted" }),
    ]);
    const evidence = [makeEvidence("e1", "c1")];
    const service = buildService(resume, evidence);

    const report = service.calculateTrustReport();

    // Verification summary reflects the two claims' statuses.
    expect(report.verificationSummary.total).toBe(2);
    expect(report.verificationSummary.verified).toBe(1);

    // Evidence coverage: only c1 has evidence.
    expect(report.evidenceCoverage.totalClaims).toBe(2);
    expect(report.evidenceCoverage.claimsWithEvidence).toBe(1);
    expect(report.evidenceCoverage.coveragePercent).toBe(50);

    // Weak claims: c2 has no evidence (+ no verified status) → surfaced.
    expect(report.weakClaims.length).toBeGreaterThan(0);
    expect(report.weakClaims.some((w) => w.claim.id === "c2")).toBe(true);
  });

  it("reuses the snapshot timestamp as generatedAt", () => {
    const resume = makeResume([]);
    const service = buildService(resume, []);

    const report = service.calculateTrustReport();
    expect(report.generatedAt).toBe(report.snapshot.calculatedAt);
  });

  it("produces an empty-but-valid report for an empty identity", () => {
    // defaultResume has empty profile fields (name/email/phone ""), so every
    // scoring component is "missing" and the overall score is null.
    const service = buildService(defaultResume, []);

    const report = service.calculateTrustReport();

    expect(report.snapshot.overall).toBeNull();
    expect(report.verificationSummary.total).toBe(0);
    expect(report.evidenceCoverage.totalClaims).toBe(0);
    expect(report.weakClaims).toHaveLength(0);
  });
});