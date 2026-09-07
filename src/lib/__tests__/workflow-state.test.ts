import { describe, it, expect } from "vitest";
import { deriveWorkflowState, getCurrentStep, getNextStepRecommendation } from "@/lib/workflow-state";
import type { Resume } from "@/types/resume";
import type { JobProfile } from "@/types/job-profile";
import type { QualificationMatch } from "@/types/qualification-match";

const EMPTY_RESUME: Resume = {
  resumeId: "test",
  resumeName: "Test Resume",
  name: "",
  title: "",
  email: "",
  phone: "",
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
  careerStage: "mid" as any,
  claims: [],
};

const FILLED_RESUME: Resume = {
  ...EMPTY_RESUME,
  name: "John Doe",
  summary: "Experienced engineer",
  experience: [{ id: "1", company: "Acme", position: "Engineer", startDate: "2020", endDate: "2024", bulletPoints: ["Built things"], location: "", employmentType: "", industry: "", current: false, duration: "", description: "", achievements: "", techUsed: "" }],
  skills: [{ id: "1", name: "TypeScript", level: "Advanced" as const, category: "Technical", years: "3" }],
};

const TAILORED_RESUME: Resume = {
  ...FILLED_RESUME,
  resumeName: "John Doe — Tailored",
};

const MOCK_JOB_PROFILE: JobProfile = {
  id: "jp-1",
  title: "Senior Engineer",
  seniority: [],
  domain: [],
  requirements: [],
  responsibilities: [],
  qualifications: [],
  skills: [],
  implicitCompetencies: [],
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sourceLength: 100,
} as any;

const MOCK_MATCH: QualificationMatch = {
  id: "match-1",
  version: 1,
  careerProfileId: "cp-1",
  jobProfileId: "jp-1",
  items: [],
  summary: { total: 0, proven: 0, related: 0, communicationGap: 0, missing: 0 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("deriveWorkflowState", () => {
  it("all false for empty resume and no job", () => {
    const state = deriveWorkflowState(EMPTY_RESUME, null, null, false);
    expect(state.resume).toBe(false);
    expect(state.job).toBe(false);
    expect(state.match).toBe(false);
    expect(state.tailor).toBe(false);
    expect(state.export).toBe(false);
  });

  it("resume is true when resume has content", () => {
    const state = deriveWorkflowState(FILLED_RESUME, null, null, false);
    expect(state.resume).toBe(true);
    expect(state.job).toBe(false);
  });

  it("job is true when jobProfile exists", () => {
    const state = deriveWorkflowState(FILLED_RESUME, MOCK_JOB_PROFILE, null, false);
    expect(state.resume).toBe(true);
    expect(state.job).toBe(true);
    expect(state.match).toBe(false);
  });

  it("match is true when qualificationMatch exists", () => {
    const state = deriveWorkflowState(FILLED_RESUME, MOCK_JOB_PROFILE, MOCK_MATCH, false);
    expect(state.resume).toBe(true);
    expect(state.job).toBe(true);
    expect(state.match).toBe(true);
    expect(state.tailor).toBe(false);
  });

  it("tailor is true when resume name contains '— Tailored'", () => {
    const state = deriveWorkflowState(TAILORED_RESUME, MOCK_JOB_PROFILE, MOCK_MATCH, false);
    expect(state.tailor).toBe(true);
  });

  it("export is true when hasExported is true", () => {
    const state = deriveWorkflowState(TAILORED_RESUME, MOCK_JOB_PROFILE, MOCK_MATCH, true);
    expect(state.export).toBe(true);
  });

  it("all true for complete workflow", () => {
    const state = deriveWorkflowState(TAILORED_RESUME, MOCK_JOB_PROFILE, MOCK_MATCH, true);
    expect(state.resume).toBe(true);
    expect(state.job).toBe(true);
    expect(state.match).toBe(true);
    expect(state.tailor).toBe(true);
    expect(state.export).toBe(true);
  });

  it("null resume produces all false", () => {
    const state = deriveWorkflowState(null, null, null, false);
    expect(state.resume).toBe(false);
    expect(state.job).toBe(false);
  });
});

describe("getCurrentStep", () => {
  it("returns 'resume' when no resume", () => {
    const state = deriveWorkflowState(null, null, null, false);
    expect(getCurrentStep(state)).toBe("resume");
  });

  it("returns 'job' when resume exists but no job", () => {
    const state = deriveWorkflowState(FILLED_RESUME, null, null, false);
    expect(getCurrentStep(state)).toBe("job");
  });

  it("returns 'match' when job exists but no match", () => {
    const state = deriveWorkflowState(FILLED_RESUME, MOCK_JOB_PROFILE, null, false);
    expect(getCurrentStep(state)).toBe("match");
  });

  it("returns 'tailor' when match exists but not tailored", () => {
    const state = deriveWorkflowState(FILLED_RESUME, MOCK_JOB_PROFILE, MOCK_MATCH, false);
    expect(getCurrentStep(state)).toBe("tailor");
  });

  it("returns 'export' when tailored but not exported", () => {
    const state = deriveWorkflowState(TAILORED_RESUME, MOCK_JOB_PROFILE, MOCK_MATCH, false);
    expect(getCurrentStep(state)).toBe("export");
  });

  it("returns 'complete' when all steps done", () => {
    const state = deriveWorkflowState(TAILORED_RESUME, MOCK_JOB_PROFILE, MOCK_MATCH, true);
    expect(getCurrentStep(state)).toBe("complete");
  });
});

describe("getNextStepRecommendation", () => {
  it("recommends creating resume when none exists", () => {
    const state = deriveWorkflowState(null, null, null, false);
    const rec = getNextStepRecommendation(state, undefined);
    expect(rec).not.toBeNull();
    expect(rec!.actionLabel).toContain("Resume");
  });

  it("recommends analyzing job when resume exists", () => {
    const state = deriveWorkflowState(FILLED_RESUME, null, null, false);
    const rec = getNextStepRecommendation(state, "My Resume");
    expect(rec).not.toBeNull();
    expect(rec!.title).toContain("job");
  });

  it("recommends tailoring when match exists", () => {
    const state = deriveWorkflowState(FILLED_RESUME, MOCK_JOB_PROFILE, MOCK_MATCH, false);
    const rec = getNextStepRecommendation(state, "My Resume");
    expect(rec).not.toBeNull();
    expect(rec!.title).toContain("Tailor");
  });

  it("recommends exporting when tailored", () => {
    const state = deriveWorkflowState(TAILORED_RESUME, MOCK_JOB_PROFILE, MOCK_MATCH, false);
    const rec = getNextStepRecommendation(state, "My Resume");
    expect(rec).not.toBeNull();
    expect(rec!.title).toContain("Export");
  });

  it("says ready when all complete", () => {
    const state = deriveWorkflowState(TAILORED_RESUME, MOCK_JOB_PROFILE, MOCK_MATCH, true);
    const rec = getNextStepRecommendation(state, "My Resume");
    expect(rec).not.toBeNull();
    expect(rec!.title).toContain("Ready");
  });
});
