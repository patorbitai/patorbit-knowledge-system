"use strict";

import { GraphService } from "./graph-service";
import { TrustService } from "./trust-service";
import { IdentityPipelineCoordinator } from "./identity-pipeline-coordinator";
import { useResumeBuilder } from "@/store/resume-builder";
import { debounce } from "@/lib/debounce";

/**
 * Identity Pipeline Subscriber — state watching.
 *
 * Owns the single subscription that drives the automatic pipeline. It does
 * no orchestration (that is the coordinator's job) and no lifecycle wiring
 * (that is the bootstrap's job). It only maps store changes onto the
 * coordinator's `refreshIdentityPipeline()`.
 *
 * Layer: Subscription
 *
 *   Zustand store mutation (claims / evidence reference change)
 *     ↓  debounced
 *   IdentityPipelineCoordinator.refreshIdentityPipeline()
 *     ↓
 *   Store trustScore snapshot updated
 */

/** Coalescing window for rapid edits (design doc §10: 150–250ms). */
const DEBOUNCE_MS = 200;

/**
 * Start watching the store and keep the pipeline self-maintaining.
 *
 * Returns an unsubscribe that stops the subscription and cancels any
 * pending (debounced) refresh. Call exactly once from the bootstrap
 * component's `useEffect`.
 */
export function startIdentityPipeline(): () => void {
  const graphService = new GraphService();
  const trustService = new TrustService(graphService);
  const coordinator = new IdentityPipelineCoordinator(
    graphService,
    trustService,
    {
      get resume() {
        return useResumeBuilder.getState().resume;
      },
      get evidence() {
        return useResumeBuilder.getState().evidence;
      },
      setTrustScore: (score) => useResumeBuilder.getState().setTrustScore(score),
      setTrustReport: (report) => useResumeBuilder.getState().setTrustReport(report),
    },
  );

  const refresh = debounce(() => {
    coordinator.refreshIdentityPipeline();
  }, DEBOUNCE_MS);

  const unsubscribe = useResumeBuilder.subscribe((state, prevState) => {
    // The store updates claims/evidence immutably, so a new array reference
    // signals a canonical-input change: acceptClaim, acceptEditedClaim,
    // addEvidence, removeEvidence, setEvidenceStatus, markClaimReadyForReview.
    // rejectClaim changes neither reference, so it triggers no refresh (no
    // graph effect per design doc §3).
    if (
      state.resume.claims !== prevState.resume.claims ||
      state.evidence !== prevState.evidence
    ) {
      refresh();
    }
  });

  // Initial refresh: cover store rehydrate from persisted resume + evidence
  // (design doc §9) and a freshly mounted app shell with existing data.
  coordinator.refreshIdentityPipeline();

  return () => {
    unsubscribe();
    refresh.cancel();
  };
}