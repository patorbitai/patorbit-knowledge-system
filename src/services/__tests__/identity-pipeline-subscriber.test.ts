"use strict";

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IdentityPipelineCoordinator } from "../identity-pipeline-coordinator";
import { startIdentityPipeline } from "../identity-pipeline-subscriber";
import { useResumeBuilder, resumeStore } from "@/store/resume-builder";
import type { ResumeBuilderState } from "@/store/resume-builder";
import type { Claim, Evidence, SuggestedClaim } from "@/types/resume";

// Isolate the store for each test suite run
vi.mock("@/store/resume-builder", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/store/resume-builder")>();
  const store = create<ResumeBuilderState>()(
    persist(original.resumeStore, {
      name: `test-patorbit-resume-v2-${Math.random()}`, // unique name per test
      partialize: (s) => ({ resume: s.resume, evidence: s.evidence }),
    }),
  );
  return { ...original, useResumeBuilder: store };
});

// -----------------------------------------------------------------
//  Test data builders
// -----------------------------------------------------------------
function makeSuggestion(): SuggestedClaim {
  return {
    assertionText: "Test claim.",
    claimType: "Project",
    sourceActivityId: "test",
    confidence: 0.9,
    reasoning: "Reason.",
  };
}

function makeEvidence(id: string, claimId: string): Evidence {
  return {
    id,
    claimId,
    evidenceType: "file",
    evidenceKind: "Screenshots",
    content: "blob",
    format: "image/png",
    metadata: {},
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

/** Reset the store so each test starts from a clean identity. */
function resetStore() {
  useResumeBuilder.getState().resetResume();
}

/** Accept a suggestion so `addEvidence` has an accepted claim to attach to. */
function acceptASuggestion(): string {
  const store = useResumeBuilder.getState();
  store.setSuggestedClaims([makeSuggestion()]);
  store.acceptClaim(useResumeBuilder.getState().suggestedClaims[0]);
  return useResumeBuilder.getState().resume.claims[0].id;
}

describe("IdentityPipelineSubscriber", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    resetStore();
  });

  it("triggers exactly one refresh for many rapid addEvidence calls inside one debounce window", () => {
    // Spy on the coordinator the subscriber will instantiate internally.
    const refreshSpy = vi.spyOn(
      IdentityPipelineCoordinator.prototype,
      "refreshIdentityPipeline",
    );

    // Start the real subscriber (runs its initial refresh → count 1).
    const stop = startIdentityPipeline();
    expect(refreshSpy).toHaveBeenCalledTimes(1); // initial refresh

    const claimId = acceptASuggestion();

    // Rapid adds — all within the 200ms debounce window.
    const store = useResumeBuilder.getState();
    store.addEvidence(makeEvidence("e1", claimId));
    store.addEvidence(makeEvidence("e2", claimId));
    store.addEvidence(makeEvidence("e3", claimId));
    store.addEvidence(makeEvidence("e4", claimId));

    // No refresh fired yet (debounce pending).
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    // Let the debounce window elapse — exactly one coalesced refresh.
    vi.advanceTimersByTime(200);
    expect(refreshSpy).toHaveBeenCalledTimes(2);

    stop();
  });

  it("keeps trustScore in sync after the debounced refresh", () => {
    vi.useRealTimers();

    // Initially empty identity → null trust.
    expect(useResumeBuilder.getState().trustScore).toBeNull();
    const stop = startIdentityPipeline();

    // The initial refresh sets the score from the empty store.
    expect(useResumeBuilder.getState().trustScore).not.toBeNull();
    expect(useResumeBuilder.getState().trustScore?.overall).toBeNull(); // Empty store is null score

    // Accept a claim; subscription fires, debounce resolves, refresh runs.
    const claimId = acceptASuggestion();

    // Wait for the debounce (real timer, 200ms) — poll for the write.
    return new Promise<void>((resolve, reject) => {
      const started = Date.now();
      const poll = () => {
        const snapshot = useResumeBuilder.getState().trustScore;
        if (snapshot?.overall !== null) {
          stop();
          resolve();
          return;
        }
        if (Date.now() - started > 2000) {
          stop();
          reject(new Error("trustScore never updated after acceptClaim"));
        } else {
          setTimeout(poll, 25);
        }
      };
      poll();
    });
  });

  it("unsubscribe stops further refreshes (cancels pending debounce)", () => {
    const refreshSpy = vi.spyOn(
      IdentityPipelineCoordinator.prototype,
      "refreshIdentityPipeline",
    );

    const stop = startIdentityPipeline();
    const initialCalls = refreshSpy.mock.calls.length;
    const claimId = acceptASuggestion();

    // Fire an add BEFORE unsubscribing — a debounce becomes pending.
    useResumeBuilder.getState().addEvidence(makeEvidence("e1", claimId));

    // Unsubscribe cancels the pending debounced refresh.
    stop();

    // Advance well past the debounce window — nothing should fire.
    vi.advanceTimersByTime(1000);
    expect(refreshSpy.mock.calls.length).toBe(initialCalls);
  });
});
