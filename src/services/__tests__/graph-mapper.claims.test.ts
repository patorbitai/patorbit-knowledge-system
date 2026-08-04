"use strict";

import { describe, it, expect } from "vitest";
import { resumeToGraph } from "../graph-mapper";
import type { Resume, Claim, Evidence } from "@/types/resume";
import type { ClaimNode, EvidenceNode } from "@/types/knowledge-graph";

function makeClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: "c1",
    assertionText: "Led migration of the payment platform.",
    claimType: "Project",
    sourceActivityId: "project-0",
    confidence: 0.9,
    reasoning: "Backed by project evidence.",
    verificationStatus: "accepted",
    reviewed: true,
    accepted: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: "e1",
    claimId: "c1",
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
    ...overrides,
  };
}

/** Build a minimal Resume with an optional claims array. */
function makeResume(overrides: Partial<Resume> = {}): Resume {
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
    claims: [],
    ...overrides,
  };
}

describe("graph-mapper: claims and evidence", () => {
  it("creates a ClaimNode for each accepted claim", () => {
    const resume = makeResume({
      claims: [makeClaim({ id: "c1", accepted: true })],
    });
    const { nodes } = resumeToGraph(resume, "test", []);
    const claimNode = nodes.find((n): n is ClaimNode => n.type === "claim");
    expect(claimNode).toBeDefined();
    expect(claimNode?.id).toBe("c1");
    expect(claimNode?.assertion).toBe("Led migration of the payment platform.");
  });

  it("does NOT create a ClaimNode for a rejected claim", () => {
    const resume = makeResume({
      claims: [makeClaim({ id: "c1", accepted: false })],
    });
    const { nodes } = resumeToGraph(resume, "test", []);
    const claimNode = nodes.find((n) => n.type === "claim");
    expect(claimNode).toBeUndefined();
  });

  it("creates an EvidenceNode for evidence attached to an accepted claim", () => {
    const resume = makeResume({
      claims: [makeClaim({ id: "c1", accepted: true })],
    });
    const evidence = [makeEvidence({ id: "e1", claimId: "c1" })];
    const { nodes } = resumeToGraph(resume, "test", evidence);
    const evidenceNode = nodes.find((n): n is EvidenceNode => n.type === "evidence");
    expect(evidenceNode).toBeDefined();
    expect(evidenceNode?.id).toBe("e1");
  });

  it("creates HAS_CLAIM and SUPPORTED_BY edges correctly", () => {
    const resume = makeResume({
      claims: [makeClaim({ id: "c1", accepted: true })],
    });
    const evidence = [makeEvidence({ id: "e1", claimId: "c1" })];
    const { profile, edges } = resumeToGraph(resume, "test", evidence);

    const hasClaimEdge = edges.find((e) => e.type === "HAS_CLAIM");
    expect(hasClaimEdge).toBeDefined();
    expect(hasClaimEdge?.sourceNodeId).toBe(profile.id);
    expect(hasClaimEdge?.targetNodeId).toBe("c1");

    const supportedByEdge = edges.find((e) => e.type === "SUPPORTED_BY");
    expect(supportedByEdge).toBeDefined();
    expect(supportedByEdge?.sourceNodeId).toBe("c1");
    expect(supportedByEdge?.targetNodeId).toBe("e1");
  });

  it("creates a DERIVED_FROM edge from evidence to a new source node", () => {
    const resume = makeResume({
      claims: [makeClaim({ id: "c1", accepted: true })],
    });
    const evidence = [makeEvidence({ id: "e1", claimId: "c1" })];
    const { nodes, edges } = resumeToGraph(resume, "test", evidence);
    const evidenceNode = nodes.find((n) => n.id === "e1");
    const derivedFromEdge = edges.find((e) => e.sourceNodeId === evidenceNode?.id && e.type === "DERIVED_FROM");
    expect(derivedFromEdge).toBeDefined();
    const sourceNode = nodes.find((n) => n.id === derivedFromEdge?.targetNodeId);
    expect(sourceNode).toBeDefined();
    expect(sourceNode?.type).toBe("source");
  });

  it("handles an accepted claim without evidence gracefully", () => {
    const resume = makeResume({
      claims: [makeClaim({ id: "c1", accepted: true })],
    });
    const { nodes, edges } = resumeToGraph(resume, "test", []);
    const claimNode = nodes.find((n) => n.type === "claim");
    expect(claimNode).toBeDefined();
    const supportedByEdge = edges.find((e) => e.type === "SUPPORTED_BY");
    expect(supportedByEdge).toBeUndefined();
  });

  it("handles evidence referencing a missing or rejected claim safely", () => {
    const resume = makeResume({
      claims: [makeClaim({ id: "c1", accepted: false })],
    });
    const evidence = [makeEvidence({ id: "e1", claimId: "c1" })]; // references rejected claim
    const evidence2 = [makeEvidence({ id: "e2", claimId: "c_missing" })]; // references non-existent claim
    const { nodes, edges } = resumeToGraph(resume, "test", [...evidence, ...evidence2]);

    const evidenceNode = nodes.find((n) => n.type === "evidence");
    expect(evidenceNode).toBeUndefined();
    const supportedByEdge = edges.find((e) => e.type === "SUPPORTED_BY");
    expect(supportedByEdge).toBeUndefined();
  });
});
