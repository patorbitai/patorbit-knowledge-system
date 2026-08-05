"use strict";

import { describe, it, expect, vi, afterEach } from "vitest";
import * as graphMapper from "../graph-mapper";
import { IdentityPipelineCoordinator } from "../identity-pipeline-coordinator";
import type { IdentityPipelineStorePort } from "../identity-pipeline-coordinator";
import { GraphService } from "../graph-service";
import { TrustService } from "../trust-service";
import { defaultResume } from "@/store/resume-builder";
import type { Resume, Claim, Evidence } from "@/types/resume";
import type { KnowledgeGraph } from "@/types/knowledge-graph";

/**
 * Isolated unit tests for the IdentityPipelineCoordinator.
 *
 * The coordinator is pure orchestration. Each test wires real
 * GraphService/TrustService instances with a store double and spies on the
 * seams (`resumeToGraph`, `setGraph`, `calculateTrustScore`, `setTrustScore`)
 * to prove the handoffs happen exactly once and in the right order.
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

/** A controllable store double exposing the coordinator's data port. */
function makeStore(overrides: {
  resume?: Resume;
  evidence?: Evidence[];
} = {}): {
  store: IdentityPipelineStorePort;
  setTrustScore: ReturnType<typeof vi.fn>;
  setTrustReport: ReturnType<typeof vi.fn>;
} {
  const resume = overrides.resume ?? makeResume([]);
  const evidence = overrides.evidence ?? [];
  const setTrustScore = vi.fn();
  const setTrustReport = vi.fn();
  const store: IdentityPipelineStorePort = {
    resume,
    evidence,
    setTrustScore,
    setTrustReport,
  };
  return { store, setTrustScore, setTrustReport };
}

/** Build a coordinated pipeline over a store double, returning the seams. */
function buildPipeline(storeData: Parameters<typeof makeStore>[0] = {}) {
  const { store, setTrustScore, setTrustReport } = makeStore(storeData);
  const graphService = new GraphService();
  const trustService = new TrustService(graphService);
  const coordinator = new IdentityPipelineCoordinator(graphService, trustService, store);
  return {
    coordinator,
    store,
    setTrustScore,
    setTrustReport,
    graphService,
    trustService,
  };
}

describe("IdentityPipelineCoordinator", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls resumeToGraph exactly once", () => {
    const resume = makeResume([makeClaim("c1", true)]);
    const evidence = [makeEvidence("e1", "c1")];
    const { coordinator } = buildPipeline({ resume, evidence });

    const spy = vi.spyOn(graphMapper, "resumeToGraph");
    coordinator.refreshIdentityPipeline();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(resume, "user-input", evidence);
  });

  it("passes the generated graph to GraphService.setGraph", () => {
    const resume = makeResume([makeClaim("c1", true)]);
    const evidence = [makeEvidence("e1", "c1")];
    const { coordinator, graphService } = buildPipeline({ resume, evidence });

    // Spy AFTER graph build so the spy sees only the coordinator's call.
    const setGraphSpy = vi.spyOn(graphService, "setGraph");

    const graph: KnowledgeGraph = graphMapper.resumeToGraph(resume, "user-input", evidence);

    // refresh rebuilds its own identical graph and hands it to setGraph.
    coordinator.refreshIdentityPipeline();

    expect(setGraphSpy).toHaveBeenCalledTimes(1);
    expect(setGraphSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: expect.objectContaining({ type: "profile" }),
      }),
    );
    // The coordinator's setGraph arg must be a fully-built graph (nodes + edges),
    // not the raw resume.
    expect(graph).toEqual(
      expect.objectContaining({ profile: expect.objectContaining({ type: "profile" }) }),
    );
  });

  it("executes TrustService.calculateTrustReport", () => {
    const resume = makeResume([makeClaim("c1", true)]);
    const { coordinator, trustService } = buildPipeline({ resume });

    const calcSpy = vi.spyOn(trustService, "calculateTrustReport");
    coordinator.refreshIdentityPipeline();

    expect(calcSpy).toHaveBeenCalledTimes(1);
  });

  it("caches the trust report and its snapshot into the store", () => {
    const resume = makeResume([makeClaim("c1", true)]);
    const evidence = [makeEvidence("e1", "c1")];
    const { coordinator, setTrustScore, setTrustReport } = buildPipeline({ resume, evidence });

    // The standalone reference pipeline builds the proper graph and scores it.
    const before = runStandalone(resume, evidence);

    const report = coordinator.refreshIdentityPipeline();

    // The report carries the full snapshot plus the diagnostic insights.
    expect(report.snapshot.overall).toBe(before.overall);
    expect(report.snapshot.components).toEqual(before.components);
    expect(report.verificationSummary.total).toBe(1);
    expect(report.evidenceCoverage.totalClaims).toBe(1);
    expect(Array.isArray(report.weakClaims)).toBe(true);
    expect(typeof report.generatedAt).toBe("string");

    // The coordinator writes BOTH the report and its snapshot to the store.
    expect(setTrustReport).toHaveBeenCalledTimes(1);
    expect(setTrustReport).toHaveBeenCalledWith(report);
    expect(setTrustScore).toHaveBeenCalledTimes(1);
    expect(setTrustScore).toHaveBeenCalledWith(report.snapshot);
  });

  it("propagates graph generation failure", () => {
    const resume = makeResume([makeClaim("c1", true)]);
    const { coordinator, graphService, setTrustScore, setTrustReport } = buildPipeline({ resume });

    const boom = new Error("graph exploded");
    vi.spyOn(graphMapper, "resumeToGraph").mockImplementation(() => {
      throw boom;
    });

    const setGraphSpy = vi.spyOn(graphService, "setGraph");

    expect(() => coordinator.refreshIdentityPipeline()).toThrow(boom);
    // Graph never reaches GraphService, and prior caches are untouched.
    expect(setGraphSpy).not.toHaveBeenCalled();
    expect(setTrustScore).not.toHaveBeenCalled();
    expect(setTrustReport).not.toHaveBeenCalled();
  });

  it("propagates trust calculation failure and keeps prior values", () => {
    const resume = makeResume([makeClaim("c1", true)]);
    const evidence = [makeEvidence("e1", "c1")];
    const { coordinator, trustService, graphService, setTrustScore, setTrustReport } = buildPipeline({ resume, evidence });

    // First successful run establishes the graph + a prior report/snapshot.
    const first = coordinator.refreshIdentityPipeline();
    expect(setTrustScore).toHaveBeenCalledTimes(1);
    expect(setTrustReport).toHaveBeenCalledTimes(1);

    // Second run: trust calc throws. It must propagate and NOT write anything.
    const boom = new Error("trust exploded");
    const setGraphSpy = vi.spyOn(graphService, "setGraph");
    vi.spyOn(trustService, "calculateTrustReport").mockImplementation(() => {
      throw boom;
    });

    expect(() => coordinator.refreshIdentityPipeline()).toThrow(boom);
    // The graph was still rebuilt (setGraph ran), but trust failed.
    expect(setGraphSpy).toHaveBeenCalledTimes(1);
    // Prior cached report + snapshot retained — no new writes.
    expect(setTrustScore).toHaveBeenCalledTimes(1);
    expect(setTrustReport).toHaveBeenCalledTimes(1);
    expect(setTrustScore).toHaveBeenLastCalledWith(first.snapshot);
    expect(setTrustReport).toHaveBeenLastCalledWith(first);
  });

  it("executes a valid pipeline with empty claims and evidence", () => {
    const { coordinator, graphService, setTrustScore, setTrustReport } = buildPipeline({ resume: defaultResume });

    const report = coordinator.refreshIdentityPipeline();

    expect(report).toBeDefined();
    expect(report.snapshot).toBeDefined();
    expect(Array.isArray(report.snapshot.components)).toBe(true);
    // Empty identity produces an overall of null but a completed run.
    expect(report.snapshot.overall).toBeNull();
    // Empty report: zero claims, zero coverage, no weak claims.
    expect(report.verificationSummary.total).toBe(0);
    expect(report.evidenceCoverage.totalClaims).toBe(0);
    expect(report.weakClaims).toHaveLength(0);
    expect(setTrustScore).toHaveBeenCalledTimes(1);
    expect(setTrustScore).toHaveBeenCalledWith(report.snapshot);
    expect(setTrustReport).toHaveBeenCalledTimes(1);
    expect(setTrustReport).toHaveBeenCalledWith(report);
    // The graph has a shell profile node, but nothing else.
    expect(graphService.getGraph().nodes.length).toBe(1);
    expect(graphService.getGraph().nodes[0].type).toBe("profile");
  });
});

/** Standalone reference pipeline (pure services only). */
function runStandalone(resume: Resume, evidence: Evidence[]) {
  const graph = graphMapper.resumeToGraph(resume, "user-input", evidence);
  const graphService = new GraphService(graph);
  const trustService = new TrustService(graphService);
  return trustService.calculateTrustScore();
}