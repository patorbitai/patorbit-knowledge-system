"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useResumeBuilder } from "@/store/resume-builder";
import type { ResumeBuilderState } from "@/store/resume-builder";
import { createMinimalResume } from "@/services/__tests__/fixtures";

// Isolate the store so tests start clean (same pattern as the service tests).
vi.mock("@/store/resume-builder", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/store/resume-builder")>();
  const store = create<ResumeBuilderState>()(
    persist(original.resumeStore, {
      name: `test-patorbit-resume-v3-${Math.random()}`,
      partialize: (s) => ({ resume: s.resume, evidence: s.evidence }),
    }),
  );
  return { ...original, useResumeBuilder: store };
});

const JD = [
  "Senior Full Stack Engineer",
  "",
  "Requirements:",
  "- Strong proficiency with TypeScript and React",
  "- Experience with Node.js",
  "- Experience with Kubernetes",
  "",
  "Qualifications:",
  "- Bachelor's degree in Computer Science or equivalent",
  "- Experience with Java",
  "",
  "Skills:",
  "- TypeScript, React, GraphQL",
].join("\n");

function seedResume(): void {
  const resume = createMinimalResume("Ada Integration");
  useResumeBuilder.getState().setResume(resume);
}

function resetStore(): void {
  useResumeBuilder.getState().resetResume();
}

function runDeterministicPipeline(): void {
  const state = useResumeBuilder.getState();
  state.setJobDescription(JD);
  state.rebuildCareerProfile();
  state.rebuildJobProfile();
  state.rebuildQualificationMatch();
}

describe("M3 qualification match store integration", () => {
  beforeEach(() => {
    resetStore();
  });

  it("starts with a null qualificationMatch", () => {
    expect(useResumeBuilder.getState().qualificationMatch).toBeNull();
  });

  it("rebuildQualificationMatch produces a deterministic match after M1 + M2", () => {
    seedResume();
    runDeterministicPipeline();

    const { qualificationMatch } = useResumeBuilder.getState();
    expect(qualificationMatch).not.toBeNull();
    expect(qualificationMatch?.careerProfileId).toBeTruthy();
    expect(qualificationMatch?.jobProfileId).toBeTruthy();
    expect(qualificationMatch?.summary.total).toBe(qualificationMatch?.items.length);
  });

  it("exposes all four verdicts and supporting evidence/provenance", () => {
    seedResume();
    runDeterministicPipeline();

    const { qualificationMatch } = useResumeBuilder.getState();
    const items = qualificationMatch?.items ?? [];
    const verdicts = new Set(items.map((i) => i.classification));

    // The M1/M2/M3 pipeline must produce spanning verdicts from this fixture.
    expect(verdicts.has("PROVEN")).toBe(true);
    expect(verdicts.has("RELATED")).toBe(true);
    expect(verdicts.has("COMMUNICATION_GAP")).toBe(true);
    expect(verdicts.has("MISSING")).toBe(true);

    // Provenance: every item keeps the verbatim JD source.
    for (const item of items) {
      expect(item.jobSource.sourceRef).toMatch(/^jd:(line|skill):/);
      expect(typeof item.reason).toBe("string");
    }

    // Evidence: PROVEN carries a candidate skill with provenance; MISSING is empty.
    const proven = items.find((i) => i.classification === "PROVEN");
    expect(proven?.evidence.length).toBeGreaterThan(0);
    expect(proven?.evidence[0].source.sourceRef).toMatch(/^resume:skill:/);

    const missing = items.find((i) => i.classification === "MISSING");
    expect(missing?.evidence).toEqual([]);
  });

  it("rebuilds from scratch after resetResume clears jobProfile + qualificationMatch", () => {
    seedResume();
    runDeterministicPipeline();
    expect(useResumeBuilder.getState().qualificationMatch).not.toBeNull();

    resetStore();
    expect(useResumeBuilder.getState().qualificationMatch).toBeNull();
    expect(useResumeBuilder.getState().jobProfile).toBeNull();
  });

  it("is deterministic across repeated pipeline runs (modulo generated timestamps)", () => {
    seedResume();
    runDeterministicPipeline();
    const first = useResumeBuilder.getState().qualificationMatch;

    runDeterministicPipeline();
    const second = useResumeBuilder.getState().qualificationMatch;

    // Rebuilds re-stamp capturedAt/updatedAt with `new Date()`, so compare the
    // match content with generated timestamps stripped.
    const stripTime = (match: typeof first) =>
      match && {
        ...match,
        createdAt: "",
        updatedAt: "",
        items: match.items.map((item) => ({
          ...item,
          evidence: item.evidence.map((ev) => ({
            ...ev,
            source: { ...ev.source, capturedAt: "" },
          })),
        })),
      };

    expect(stripTime(first)).toEqual(stripTime(second));
  });

  it("setQualificationMatch externally overwrites the snapshot", () => {
    seedResume();
    runDeterministicPipeline();
    const before = useResumeBuilder.getState().qualificationMatch;
    expect(before).not.toBeNull();

    useResumeBuilder.getState().setQualificationMatch(null);
    expect(useResumeBuilder.getState().qualificationMatch).toBeNull();
  });
});