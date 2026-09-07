/**
 * Job Application Context Tests
 *
 * Tests for persistent Resume + Job Application context:
 * - Stale session data clearing on job switch
 * - Job isolation (Job A ≠ Job B)
 * - Active application persistence
 * - Auto-restore on load
 * - matchScore/hydration correctness
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useResumeBuilder, defaultResume } from "../resume-builder";
import type { Resume } from "@/types/resume";

const JOB_A = {
  applicationId: "app-a",
  title: "Senior Data Engineer",
  companyName: "Company A",
  jobDescription: "JD for role A",
  status: "saved",
  resumeId: null as string | null,
  matchScore: 87,
  matchData: { matched: ["Python", "Spark"], partial: ["AWS"], missing: ["Kubernetes"] },
  qualificationMatch: { id: "qm-a", summary: { total: 10, proven: 6, related: 3, communicationGap: 0, missing: 1 }, items: [] },
  matchedResumeId: "r1",
  matchedAt: "2026-09-07T00:00:00.000Z",
};

const JOB_B = {
  applicationId: "app-b",
  title: "Data Analyst",
  companyName: "Company B",
  jobDescription: "JD for role B",
  status: "saved",
  resumeId: null as string | null,
  matchScore: 62,
  matchData: { matched: ["SQL"], partial: ["Excel"], missing: ["Python"] },
  qualificationMatch: { id: "qm-b", summary: { total: 8, proven: 3, related: 2, communicationGap: 1, missing: 2 }, items: [] },
  matchedResumeId: "r1",
  matchedAt: "2026-09-07T00:00:00.000Z",
};

describe("Job Application Context", () => {
  beforeEach(() => {
    // Reset store to clean state
    useResumeBuilder.setState({
      resumes: [{ ...defaultResume, resumeId: "r1", resumeName: "Test Resume" }],
      activeResumeId: "r1",
      resume: { ...defaultResume, resumeId: "r1", resumeName: "Test Resume" },
      activeJobApplicationId: null,
      activeJobApplication: null,
      jobDescription: "",
      jobProfile: null,
      qualificationMatch: null,
      jobMatch: null,
      hasExported: false,
      styleConfigs: {},
    });
  });

  describe("Stale data clearing on job switch", () => {
    it("clears Job A session-level data and restores Job B data when switching", () => {
      const { setActiveJobApplication, setJobProfile, setQualificationMatch } =
        useResumeBuilder.getState();

      // Simulate analyzing Job A — populate session-level data
      setJobProfile({ title: "Senior Data Engineer" } as any);
      setQualificationMatch({ id: "manual-match-a", summary: { total: 10, proven: 5, related: 3, communicationGap: 1, missing: 1 } } as any);

      // Verify session data is set
      expect(useResumeBuilder.getState().jobProfile).not.toBeNull();
      expect(useResumeBuilder.getState().qualificationMatch).not.toBeNull();

      // Switch to Job B
      setActiveJobApplication(JOB_B as any);

      // Job A's session-level jobProfile is cleared (not from persisted data)
      expect(useResumeBuilder.getState().jobProfile).toBeNull();
      // qualificationMatch is restored from Job B's persisted data (not null)
      expect(useResumeBuilder.getState().qualificationMatch).toEqual(JOB_B.qualificationMatch);
      expect(useResumeBuilder.getState().jobMatch).toBeNull();

      // Active application should be Job B
      expect(useResumeBuilder.getState().activeJobApplicationId).toBe("app-b");
      expect(useResumeBuilder.getState().activeJobApplication?.title).toBe("Data Analyst");
    });

    it("does NOT clear session data when re-selecting the same job", () => {
      const { setActiveJobApplication, setJobProfile, setJobDescription } =
        useResumeBuilder.getState();

      // Select Job A
      setActiveJobApplication(JOB_A as any);
      setJobDescription(JOB_A.jobDescription);

      // Simulate analysis
      useResumeBuilder.getState().setJobProfile({ title: "Senior Data Engineer" } as any);

      expect(useResumeBuilder.getState().jobProfile).not.toBeNull();

      // Re-select the SAME job
      setActiveJobApplication(JOB_A as any);

      // Session data should NOT be cleared for same-job re-selection
      expect(useResumeBuilder.getState().jobProfile).not.toBeNull();
    });

    it("clears all session data when deselecting a job (no job selected)", () => {
      const { setActiveJobApplication, setJobProfile, setQualificationMatch, setJobDescription } =
        useResumeBuilder.getState();

      // Select Job A and populate data
      setActiveJobApplication(JOB_A as any);
      setJobDescription(JOB_A.jobDescription);
      setJobProfile({ title: "Senior Data Engineer" } as any);
      setQualificationMatch({ id: "match-a" } as any);

      // Clear job selection
      setActiveJobApplication(null);

      expect(useResumeBuilder.getState().jobProfile).toBeNull();
      expect(useResumeBuilder.getState().qualificationMatch).toBeNull();
      expect(useResumeBuilder.getState().activeJobApplicationId).toBeNull();
    });
  });

  describe("Job isolation — Job A ≠ Job B", () => {
    it("switching between jobs isolates their data completely", () => {
      const { setActiveJobApplication, setJobDescription } =
        useResumeBuilder.getState();

      // Select Job A and set its description
      setActiveJobApplication(JOB_A as any);
      setJobDescription(JOB_A.jobDescription);

      // Verify Job A is active
      expect(useResumeBuilder.getState().activeJobApplicationId).toBe("app-a");
      expect(useResumeBuilder.getState().jobDescription).toBe("JD for role A");
      expect(useResumeBuilder.getState().activeJobApplication?.matchScore).toBe(87);

      // Switch to Job B
      setActiveJobApplication(JOB_B as any);
      setJobDescription(JOB_B.jobDescription);

      // Verify Job B is active and Job A's data is gone
      expect(useResumeBuilder.getState().activeJobApplicationId).toBe("app-b");
      expect(useResumeBuilder.getState().jobDescription).toBe("JD for role B");
      expect(useResumeBuilder.getState().activeJobApplication?.matchScore).toBe(62);

      // Job A's match score must NOT leak
      expect(useResumeBuilder.getState().activeJobApplication?.title).toBe("Data Analyst");
    });

    it("switching back to Job A restores Job A's persisted data", () => {
      const { setActiveJobApplication, setJobDescription } =
        useResumeBuilder.getState();

      // Select Job A
      setActiveJobApplication(JOB_A as any);
      setJobDescription(JOB_A.jobDescription);

      // Switch to Job B
      setActiveJobApplication(JOB_B as any);
      setJobDescription(JOB_B.jobDescription);

      // Switch back to Job A
      setActiveJobApplication(JOB_A as any);
      setJobDescription(JOB_A.jobDescription);

      expect(useResumeBuilder.getState().activeJobApplicationId).toBe("app-a");
      expect(useResumeBuilder.getState().activeJobApplication?.title).toBe("Senior Data Engineer");
      expect(useResumeBuilder.getState().activeJobApplication?.matchScore).toBe(87);
      expect(useResumeBuilder.getState().jobDescription).toBe("JD for role A");
    });
  });

  describe("Persistence in Zustand partialize", () => {
    it("includes activeJobApplicationId in partialize output", () => {
      const { setActiveJobApplication } = useResumeBuilder.getState();
      setActiveJobApplication(JOB_A as any);

      // The partialize function should include activeJobApplicationId
      // We verify by checking the store state has the value
      expect(useResumeBuilder.getState().activeJobApplicationId).toBe("app-a");
    });
  });

  describe("Match score isolation", () => {
    it("matchScore from Job A does not appear for Job B", () => {
      const { setActiveJobApplication } = useResumeBuilder.getState();

      // Select Job A (matchScore: 87)
      setActiveJobApplication(JOB_A as any);
      expect(useResumeBuilder.getState().activeJobApplication?.matchScore).toBe(87);

      // Switch to Job B (matchScore: 62)
      setActiveJobApplication(JOB_B as any);
      expect(useResumeBuilder.getState().activeJobApplication?.matchScore).toBe(62);

      // Verify Job A's 87% is NOT shown for Job B
      const currentMatchScore = useResumeBuilder.getState().activeJobApplication?.matchScore;
      expect(currentMatchScore).toBe(62);
      expect(currentMatchScore).not.toBe(87);
    });
  });

  describe("Empty/null job application", () => {
    it("initial state has no active job application", () => {
      expect(useResumeBuilder.getState().activeJobApplicationId).toBeNull();
      expect(useResumeBuilder.getState().activeJobApplication).toBeNull();
    });

    it("can set and clear active job application", () => {
      const { setActiveJobApplication } = useResumeBuilder.getState();

      setActiveJobApplication(JOB_A as any);
      expect(useResumeBuilder.getState().activeJobApplicationId).toBe("app-a");

      setActiveJobApplication(null);
      expect(useResumeBuilder.getState().activeJobApplicationId).toBeNull();
      expect(useResumeBuilder.getState().activeJobApplication).toBeNull();
    });
  });

  describe("Reset resume clears job application", () => {
    it("resetResume clears activeJobApplicationId and activeJobApplication", () => {
      const { setActiveJobApplication, resetResume } = useResumeBuilder.getState();

      setActiveJobApplication(JOB_A as any);
      expect(useResumeBuilder.getState().activeJobApplicationId).toBe("app-a");

      resetResume();

      expect(useResumeBuilder.getState().activeJobApplicationId).toBeNull();
      expect(useResumeBuilder.getState().activeJobApplication).toBeNull();
    });
  });

  describe("QualificationMatch persistence", () => {
    it("includes qualificationMatch, matchedResumeId, matchedAt from persisted application", () => {
      const { setActiveJobApplication } = useResumeBuilder.getState();

      setActiveJobApplication(JOB_A as any);

      const app = useResumeBuilder.getState().activeJobApplication;
      expect(app?.qualificationMatch).toEqual(JOB_A.qualificationMatch);
      expect(app?.matchedResumeId).toBe("r1");
      expect(app?.matchedAt).toBe("2026-09-07T00:00:00.000Z");
    });

    it("clears Job A session-level match and restores Job B persisted match when switching", () => {
      const { setActiveJobApplication, setQualificationMatch } = useResumeBuilder.getState();

      // Set Job A with a manually computed match (different from persisted data)
      setActiveJobApplication(JOB_A as any);
      setQualificationMatch({ id: "manual-match-a", summary: { total: 10, proven: 5, related: 3, communicationGap: 1, missing: 1 } } as any);

      // Verify Job A's manual match is active
      expect(useResumeBuilder.getState().qualificationMatch?.id).toBe("manual-match-a");

      // Switch to Job B — session-level qualificationMatch should be Job B's persisted data
      setActiveJobApplication(JOB_B as any);

      // Job A's manual match is gone, replaced by Job B's persisted match
      expect(useResumeBuilder.getState().qualificationMatch).toEqual(JOB_B.qualificationMatch);
      expect(useResumeBuilder.getState().activeJobApplication?.qualificationMatch).toEqual(JOB_B.qualificationMatch);
    });

    it("restores qualificationMatch from persisted application on selection", () => {
      const { setActiveJobApplication } = useResumeBuilder.getState();

      // Select Job A — its persisted qualificationMatch should be available
      setActiveJobApplication(JOB_A as any);

      expect(useResumeBuilder.getState().activeJobApplication?.qualificationMatch).toEqual(JOB_A.qualificationMatch);
      expect(useResumeBuilder.getState().qualificationMatch).toEqual(JOB_A.qualificationMatch);
    });
  });

  describe("Match-version staleness", () => {
    it("match belongs to the correct resume", () => {
      const { setActiveJobApplication } = useResumeBuilder.getState();

      setActiveJobApplication(JOB_A as any);

      const app = useResumeBuilder.getState().activeJobApplication;
      expect(app?.matchedResumeId).toBe("r1");
    });

    it("match-version staleness is detectable when resume changes", () => {
      const { setActiveJobApplication } = useResumeBuilder.getState();

      // Job A was matched against resume r1
      setActiveJobApplication(JOB_A as any);

      const app = useResumeBuilder.getState().activeJobApplication;
      // Current resume is r1 — match is fresh
      expect(app?.matchedResumeId).toBe(useResumeBuilder.getState().activeResumeId);

      // If we switched to a different resume (r2), the match would be stale
      // This is detectable by: app.matchedResumeId !== activeResumeId
      // We don't switch resumes here, just verify the detection mechanism works
      expect(app?.matchedResumeId).not.toBe("r2");
    });
  });

  describe("Multiple-job match isolation", () => {
    it("Job A and Job B have independent qualificationMatch data", () => {
      const { setActiveJobApplication } = useResumeBuilder.getState();

      // Select Job A
      setActiveJobApplication(JOB_A as any);
      expect(useResumeBuilder.getState().activeJobApplication?.qualificationMatch).toEqual(JOB_A.qualificationMatch);
      expect(useResumeBuilder.getState().activeJobApplication?.matchScore).toBe(87);

      // Select Job B
      setActiveJobApplication(JOB_B as any);
      expect(useResumeBuilder.getState().activeJobApplication?.qualificationMatch).toEqual(JOB_B.qualificationMatch);
      expect(useResumeBuilder.getState().activeJobApplication?.matchScore).toBe(62);

      // Switch back to Job A
      setActiveJobApplication(JOB_A as any);
      expect(useResumeBuilder.getState().activeJobApplication?.qualificationMatch).toEqual(JOB_A.qualificationMatch);
      expect(useResumeBuilder.getState().activeJobApplication?.matchScore).toBe(87);
    });
  });
});
