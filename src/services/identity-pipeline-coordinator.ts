"use strict";

import { resumeToGraph } from "./graph-mapper";
import type { GraphService } from "./graph-service";
import type { TrustService } from "./trust-service";
import type { Resume, Evidence } from "@/types/resume";
import type { KnowledgeGraph, TrustReport } from "@/types/knowledge-graph";

/**
 * Identity Pipeline Coordinator — orchestration only.
 *
 * Converts canonical store state → graph → trust, and caches the trust
 * snapshot back into the store. This component owns no business logic:
 * it does not map source→graph (GraphMapper does), does not hold the graph
 * (GraphService does), does not score (TrustService does). It only hands
 * state from one layer to the next.
 *
 * Layer: Orchestration
 *
 *   Store (resume, claims, evidence)
 *     ↓  resumeToGraph(...)
 *   GraphService.setGraph(graph)
 *     ↓  calculateTrustReport()
 *   TrustService
 *     ↓  setTrustReport(report) + setTrustScore(report.snapshot)
 *   Store cache
 */

/** The slice of the store the coordinator depends on. */
export interface IdentityPipelineStorePort {
  resume: Resume;
  evidence: Evidence[];
  setTrustScore: (score: TrustReport["snapshot"] | null) => void;
  setTrustReport: (report: TrustReport | null) => void;
}

export class IdentityPipelineCoordinator {
  private graphService: GraphService;
  private trustService: TrustService;
  private store: IdentityPipelineStorePort;

  constructor(
    graphService: GraphService,
    trustService: TrustService,
    store: IdentityPipelineStorePort,
  ) {
    this.graphService = graphService;
    this.trustService = trustService;
    this.store = store;
  }

  /**
   * Rebuild the derived graph from canonical store state, recompute the
   * trust report, and cache both the report and its snapshot back into the store.
   *
   * Failures (graph build or trust calc) propagate to the caller; because
   * the store writes only run after both succeed, a failed recomputation
   * leaves the prior cached values untouched.
   */
  refreshIdentityPipeline(): TrustReport {
    const resume: Resume = this.store.resume;
    const evidence: Evidence[] = this.store.evidence;

    const graph: KnowledgeGraph = resumeToGraph(resume, "user-input", evidence);
    this.graphService.setGraph(graph);

    const report: TrustReport = this.trustService.calculateTrustReport();
    this.store.setTrustReport(report);
    this.store.setTrustScore(report.snapshot);

    return report;
  }
}