"use strict";

import { describe, it, expect } from "vitest";
import { synthesizeCareerJourney, buildJourneyProvenance } from "../journey-service";
import { validateJourney, validateProvenance } from "@/lib/careerjourney/validation";
import { createMinimalResume, createEmptyResume } from "@/services/__tests__/fixtures";
import type { Claim, Evidence } from "@/types/resume";
import type { CareerJourney, JourneyStatement } from "@/types/careerjourney";

function makeClaim(id: string, overrides: Partial<Claim> = {}): Claim {
  return {
    id,
    assertionText: `Claim assertion ${id}.`,
    claimType: "Employment",
    sourceActivityId: `activity-${id}`,
    confidence: 0.8,
    reasoning: `Reasoning for ${id}.`,
    verificationStatus: "accepted",
    reviewed: true,
    accepted: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeEvidence(id: string, claimId: string, overrides: Partial<Evidence> = {}): Evidence {
  return {
    id,
    claimId,
    evidenceType: "link",
    evidenceKind: "GitHub Repository",
    content: `https://example.com/${id}`,
    format: "link",
    metadata: { linkTitle: `example.com/${id}` },
    uploadedBy: "self",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "evidence-added",
    confidence: 0.7,
    notes: "",
    visibility: "private",
    consent: true,
    ...overrides,
  };
}

function allStatements(journey: CareerJourney): JourneyStatement[] {
  return journey.chapters.flatMap((c) => c.statements);
}

describe("synthesizeCareerJourney — ADR-006 synthesis engine", () => {
  it("produces a valid CareerJourney from valid resume/claim/evidence data", () => {
    const resume = createMinimalResume("Journey User");
    const claims = [
      makeClaim("c1", { confidence: 0.9 }),
      makeClaim("c2", { confidence: 0.6 }),
    ];
    const evidence = [makeEvidence("e1", "c1"), makeEvidence("e2", "c2")];

    const journey = synthesizeCareerJourney(resume, claims, evidence);

    expect(journey.status).toBe("draft");
    expect(journey.version).toBe(1);
    expect(journey.chapters.length).toBeGreaterThan(0);
    expect(allStatements(journey).length).toBeGreaterThan(0);

    const result = validateJourney(journey);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("every produced JourneyStatement has >=1 claim and >=1 evidence", () => {
    const resume = createMinimalResume("Journey User");
    const claims = [makeClaim("c1"), makeClaim("c2")];
    const evidence = [makeEvidence("e1", "c1"), makeEvidence("e2", "c2")];

    const journey = synthesizeCareerJourney(resume, claims, evidence);
    const statements = allStatements(journey);
    expect(statements.length).toBeGreaterThan(0);
    for (const s of statements) {
      expect(s.claims.length).toBeGreaterThanOrEqual(1);
      expect(s.evidence.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("statement claim references correspond to the real supplied claims", () => {
    const resume = createMinimalResume("Journey User");
    const claims = [makeClaim("c1"), makeClaim("c2")];
    const evidence = [makeEvidence("e1", "c1"), makeEvidence("e2", "c2")];

    const journey = synthesizeCareerJourney(resume, claims, evidence);
    for (const s of allStatements(journey)) {
      for (const c of s.claims) {
        const supplied = claims.find((x) => x.id === c.id);
        expect(supplied).toBeDefined();
        expect(c).toEqual(supplied);
      }
    }
  });

  it("statement evidence references correspond to the real supplied evidence", () => {
    const resume = createMinimalResume("Journey User");
    const claims = [makeClaim("c1")];
    const evidence = [makeEvidence("e1", "c1"), makeEvidence("e2", "c1")];

    const journey = synthesizeCareerJourney(resume, claims, evidence);
    for (const s of allStatements(journey)) {
      for (const e of s.evidence) {
        const supplied = evidence.find((x) => x.id === e.id);
        expect(supplied).toBeDefined();
        expect(e).toEqual(supplied);
      }
    }
  });

  it("evidence-less claims do NOT become narrative statements", () => {
    const resume = createMinimalResume("Journey User");
    const claimWithoutEvidence = makeClaim("c-no-ev");
    const journey = synthesizeCareerJourney(resume, [claimWithoutEvidence], []);

    expect(allStatements(journey)).toHaveLength(0);
    expect(journey.strongestProof).toBeNull();
    // The claim is never referenced anywhere in the journey.
    expect(JSON.stringify(journey)).not.toContain("c-no-ev");
  });

  it("no-claims/no-evidence input produces honest chronology without fabricated narrative", () => {
    const journey = synthesizeCareerJourney(createMinimalResume("No Claims"), [], []);

    expect(journey.chapters.length).toBeGreaterThan(0);
    for (const c of journey.chapters) {
      expect(c.statements).toHaveLength(0);
    }
    expect(journey.strongestProof).toBeNull();
    // Chapter titles come from real resume roles — no invented narrative.
    expect(journey.chapters.some((c) => c.title === "Senior Developer")).toBe(true);
    expect(validateJourney(journey).valid).toBe(true);
  });

  it("strongestProof is deterministic and comes only from supported real evidence", () => {
    const resume = createMinimalResume("Journey User");
    const cHigh = makeClaim("c-high", { confidence: 0.95 });
    const cLow = makeClaim("c-low", { confidence: 0.5 });
    const evidence = [makeEvidence("e1", "c-high"), makeEvidence("e2", "c-low")];

    const journey = synthesizeCareerJourney(resume, [cHigh, cLow], evidence);
    expect(journey.strongestProof?.claims[0]?.id).toBe("c-high");
    expect(journey.strongestProof?.evidence.length).toBeGreaterThanOrEqual(1);

    const again = synthesizeCareerJourney(resume, [cHigh, cLow], evidence);
    expect(journey.strongestProof?.id).toBe(again.strongestProof?.id);
    expect(journey.strongestProof?.statement).toBe(again.strongestProof?.statement);
  });

  it("provenance contains only real source information", () => {
    const resume = createMinimalResume("Provenance User");
    const provenance = buildJourneyProvenance(resume);

    const result = validateProvenance(provenance);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(provenance.journeyId).toBe(`journey-${resume.resumeId ?? "unknown-identity"}`);

    const types = provenance.sources.map((s) => s.type);
    expect(types).toContain("resume");
    expect(types).toContain("experience");
    expect(types).toContain("education");
    expect(types).toContain("projects");
    expect(types).toContain("skills");
    expect(types).toContain("certifications");
    expect(types).toContain("portfolio");
    expect(types).toContain("github");

    // Descriptions carry real counts from the resume.
    expect(provenance.sources.find((s) => s.type === "experience")?.description).toBe(
      "1 work experience entry",
    );
    expect(provenance.sources.find((s) => s.type === "skills")?.description).toBe("3 skills");
  });

  it("output passes validateJourney() for claim-rich and claim-less inputs", () => {
    const claimRich = synthesizeCareerJourney(
      createMinimalResume("Rich"),
      [makeClaim("c1")],
      [makeEvidence("e1", "c1")],
    );
    expect(validateJourney(claimRich).valid).toBe(true);

    const claimLess = synthesizeCareerJourney(createEmptyResume(), [], []);
    expect(validateJourney(claimLess).valid).toBe(true);
  });

  it("repeated calls with identical inputs produce equivalent output", () => {
    const resume = createMinimalResume("Deterministic User");
    const claims = [makeClaim("c1", { confidence: 0.9 }), makeClaim("c2", { confidence: 0.7 })];
    const evidence = [makeEvidence("e1", "c1"), makeEvidence("e2", "c2")];

    const a = synthesizeCareerJourney(resume, claims, evidence);
    const b = synthesizeCareerJourney(resume, claims, evidence);

    expect(a.chapters).toEqual(b.chapters);
    expect(a.strongestProof).toEqual(b.strongestProof);
    expect(a.identityId).toBe(b.identityId);
    // The regeneration timestamp is the only permitted difference.
    expect(a.id).toBe(b.id);
    expect(a.version).toBe(b.version);
    expect(a.status).toBe(b.status);
  });

  it("never invents employer/job/date/skill/achievement data", () => {
    const resume = createMinimalResume("Honest User");
    const c1 = makeClaim("c1", {
      assertionText: "Led a 6-person team at Tech Corp",
      confidence: 0.9,
    });
    const evidence = [makeEvidence("e1", "c1")];

    const journey = synthesizeCareerJourney(resume, [c1], evidence);
    const text = JSON.stringify(journey);

    // Every statement text is exactly a supplied assertionText.
    for (const s of allStatements(journey)) {
      expect(s.statement).toBe(c1.assertionText);
    }
    // Nothing beyond the supplied data appears.
    expect(text).not.toContain("Enterprise GenAI");
    expect(text).not.toContain("Fake Corp");
    expect(text).not.toContain("May 2020");
  });

  it("fails safely on invalid/incomplete inputs", () => {
    // Empty identity → a valid, honest, empty journey.
    const empty = synthesizeCareerJourney(createEmptyResume(), [], []);
    expect(validateJourney(empty).valid).toBe(true);
    expect(empty.strongestProof).toBeNull();
    expect(empty.chapters[0].statements).toHaveLength(0);
    expect(empty.chapters[0].title).toBe("Career Overview");

    // Malformed confidence is skipped, never fabricated.
    const badClaim = makeClaim("bad", { confidence: 5 });
    const badJourney = synthesizeCareerJourney(
      createMinimalResume(),
      [badClaim],
      [makeEvidence("e-bad", "bad")],
    );
    expect(allStatements(badJourney)).toHaveLength(0);
    expect(badJourney.strongestProof).toBeNull();

    // Revoked evidence excludes the claim from narrative.
    const revokedClaim = makeClaim("c-revoked");
    const revokedJourney = synthesizeCareerJourney(
      createMinimalResume(),
      [revokedClaim],
      [makeEvidence("e-revoked", "c-revoked", { status: "revoked" })],
    );
    expect(allStatements(revokedJourney)).toHaveLength(0);

    // Disputed claims are excluded from narrative.
    const disputedClaim = makeClaim("c-disputed", { verificationStatus: "disputed" });
    const disputedJourney = synthesizeCareerJourney(
      createMinimalResume(),
      [disputedClaim],
      [makeEvidence("e-disputed", "c-disputed")],
    );
    expect(allStatements(disputedJourney)).toHaveLength(0);
  });
});
