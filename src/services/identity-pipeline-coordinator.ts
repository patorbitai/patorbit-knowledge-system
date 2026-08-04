"use strict";

import { resumeToGraph } from "./graph-mapper";
import type { GraphService } from "./graph-service";
import type { TrustService } from "./trust-service";
import type { Resume, Evidence } from "@/types/resume";
import type { KnowledgeGraph, TrustSnapshot } from "@/types/knowledge-graph";

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
 *     ↓  calculateTrustScore()
 *   TrustService
 *     ↓  setTrustScore(snapshot)
 *   Store cache
 */

/** The slice of the store the coordinator depends on. */
export interface IdentityPipelineStorePort {
  resume: Resume;
  evidence: Evidence[];
  setTrustScore: (score: TrustSnapshot | null) => void;
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
   * trust score, and cache the snapshot back into the store.
   *
   * Failures (graph build or trust calc) propagate to the caller; because
   * `setTrustScore` only runs after both succeed, a failed recomputation
   * leaves the prior cached snapshot untouched.
   */
  refreshIdentityPipeline(): TrustSnapshot {
    const resume: Resume = this.store.resume;
    const evidence: Evidence[] = this.store.evidence;

    const graph: KnowledgeGraph = resumeToGraph(resume, "user-input", evidence);
    this.graphService.setGraph(graph);

    const snapshot: TrustSnapshot = this.trustService.calculateTrustScore();
    this.store.setTrustScore(snapshot);

    return snapshot;
  }
}