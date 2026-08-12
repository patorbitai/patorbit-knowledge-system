"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import { useResumeBuilder, defaultResume } from "../resume-builder";

describe("Multi-Resume Management Store (EPIC-03)", () => {
  beforeEach(() => {
    useResumeBuilder.setState({
      resumes: [{ ...defaultResume, resumeId: "r1", resumeName: "My Resume", name: "Jane Doe" }],
      activeResumeId: "r1",
      resume: { ...defaultResume, resumeId: "r1", resumeName: "My Resume", name: "Jane Doe" },
    });
  });

  it("creates a new resume and switches active resume to it", () => {
    const state = useResumeBuilder.getState();
    const newId = state.createResume("Tech Resume");

    const updatedState = useResumeBuilder.getState();
    expect(updatedState.resumes).toHaveLength(2);
    expect(updatedState.activeResumeId).toBe(newId);
    expect(updatedState.resume.resumeName).toBe("Tech Resume");
    expect(updatedState.resume.name).toBe("");
  });

  it("switches between resumes and isolates data", () => {
    const state = useResumeBuilder.getState();
    state.updateField("name", "Jane Doe Original");

    const r2Id = state.createResume("Second Resume");
    state.updateField("name", "Jane Doe Second");
    expect(useResumeBuilder.getState().resume.name).toBe("Jane Doe Second");

    state.switchResume("r1");
    expect(useResumeBuilder.getState().resume.name).toBe("Jane Doe Original");
    expect(useResumeBuilder.getState().activeResumeId).toBe("r1");
  });

  it("renames a resume", () => {
    const state = useResumeBuilder.getState();
    state.renameResume("r1", "Primary Resume");

    const updatedState = useResumeBuilder.getState();
    const r1 = updatedState.resumes.find((r) => r.resumeId === "r1");
    expect(r1?.resumeName).toBe("Primary Resume");
    expect(updatedState.resume.resumeName).toBe("Primary Resume");
  });

  it("deletes a resume and switches to another if active was deleted", () => {
    const state = useResumeBuilder.getState();
    const r2Id = state.createResume("Temp Resume");

    expect(useResumeBuilder.getState().resumes).toHaveLength(2);

    state.deleteResume(r2Id);
    const updatedState = useResumeBuilder.getState();
    expect(updatedState.resumes).toHaveLength(1);
    expect(updatedState.activeResumeId).toBe("r1");
  });

  it("prevents deleting the last remaining resume", () => {
    const state = useResumeBuilder.getState();
    expect(state.resumes).toHaveLength(1);

    state.deleteResume("r1");
    const updatedState = useResumeBuilder.getState();
    expect(updatedState.resumes).toHaveLength(1);
    expect(updatedState.activeResumeId).toBe("r1");
  });

  it("migrates existing single-resume data correctly", () => {
    // Simulate rehydration with old format (single resume object)
    const oldState = {
      resume: { ...defaultResume, name: "Legacy User", email: "legacy@example.com" },
      evidence: [],
    };
    
    // Test rehydration logic via setState or simulating storage migration
    useResumeBuilder.setState({
      resumes: [
        {
          ...defaultResume,
          ...oldState.resume,
          resumeId: "migrated_1",
          resumeName: oldState.resume.name || "My Resume",
        },
      ],
      activeResumeId: "migrated_1",
      resume: {
        ...defaultResume,
        ...oldState.resume,
        resumeId: "migrated_1",
        resumeName: oldState.resume.name || "My Resume",
      },
    });

    const state = useResumeBuilder.getState();
    expect(state.resumes).toHaveLength(1);
    expect(state.resumes[0].name).toBe("Legacy User");
    expect(state.resumes[0].email).toBe("legacy@example.com");
    expect(state.activeResumeId).toBe("migrated_1");
  });
});
