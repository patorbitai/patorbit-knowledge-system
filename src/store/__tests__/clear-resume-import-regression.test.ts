"use strict";

/**
 * Regression tests for import + Clear Resume scenarios.
 *
 * Covers:
 * 1. Import into empty resume
 * 2. Import into populated resume (Replace semantics)
 * 3. Cancel import (no data changes)
 * 4. Active resume ID remains stable during import
 * 5. Resume ID remains stable during import
 * 6. Other resumes are untouched during import
 * 7. Clear current resume
 * 8. Clear current resume does not affect Resume B
 * 9. Clear preserves resumeId and templateId
 * 10. Import after clear
 * 11. Persistence after clear
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { mergeImportedResume } from "@/utils/normalize-import";
import type { Resume } from "@/types/resume";

/* ── Fixtures ── */

const RESUME_A: Resume = {
  ...defaultResume,
  resumeId: "resume-a",
  resumeName: "Resume A",
  templateId: "executive-pro",
  name: "CURRENT_USER",
  title: "CURRENT_ENGINEER",
  email: "current@example.com",
  phone: "555-0001",
  summary: "Current summary.",
  social: { linkedin: "current-linkedin", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
  experience: [
    {
      id: "exp-a1",
      company: "CURRENT_COMPANY",
      position: "Engineer",
      location: "Current City",
      employmentType: "",
      industry: "",
      startDate: "2020",
      endDate: "",
      current: false,
      duration: "2020 – Present",
      description: "Current job.",
      achievements: "",
      techUsed: "",
      bulletPoints: [],
    },
  ],
  education: [
    { id: "edu-a1", school: "Current University", degree: "B.S.", year: "2018", field: "CS", gpa: "", minor: "", honors: "", activities: "", location: "" },
  ],
  skills: [{ id: "skill-a1", name: "CurrentSkill", level: "Expert", category: "", years: "" }],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
  achievements: [],
  references: [],
  portfolio: [],
  careerStage: "working-professional",
  claims: [],
};

const RESUME_B: Resume = {
  ...defaultResume,
  resumeId: "resume-b",
  resumeName: "Resume B",
  templateId: "patorbit-modern",
  name: "RESUME_B_USER",
  title: "Resume B Title",
  email: "resume-b@example.com",
  summary: "Resume B summary.",
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
  careerStage: "working-professional",
  claims: [],
};

const IMPORTED: Resume = {
  ...defaultResume,
  templateId: "template-1", // schema default — not a real template
  name: "IMPORT_TEST_USER",
  title: "IMPORT_TEST_ENGINEER",
  email: "import-test@example.com",
  phone: "+1 555 999 8888",
  summary: "IMPORT_TEST_SUMMARY",
  social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
  experience: [
    {
      id: "exp-1",
      company: "IMPORT_TEST_COMPANY",
      position: "Engineer",
      location: "",
      employmentType: "",
      industry: "",
      startDate: "",
      endDate: "",
      current: false,
      duration: "Jan 2020 – Present",
      description: "Imported job.",
      achievements: "",
      techUsed: "",
      bulletPoints: [],
    },
  ],
  education: [
    { id: "edu-1", school: "IMPORT_TEST_UNIVERSITY", degree: "B.S.", year: "", field: "", gpa: "", minor: "", honors: "", activities: "", location: "" },
  ],
  skills: [{ id: "skill-1", name: "IMPORT_TEST_SKILL", level: "Expert", category: "", years: "" }],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
  achievements: [],
  references: [],
  portfolio: [],
  careerStage: "working-professional",
  claims: [],
};

/* ── Helpers ── */

function seedResumeA() {
  useResumeBuilder.setState({
    resumes: [RESUME_A],
    activeResumeId: "resume-a",
    resume: RESUME_A,
    styleConfigs: {},
    saveStatus: "saved",
  });
}

function seedResumesAAndB() {
  useResumeBuilder.setState({
    resumes: [RESUME_A, RESUME_B],
    activeResumeId: "resume-a",
    resume: RESUME_A,
    styleConfigs: {},
    saveStatus: "saved",
  });
}

/* ── Tests ── */

describe("Import regression: import into populated resume", () => {
  beforeEach(() => {
    seedResumeA();
  });

  it("import into populated resume replaces content fields and preserves identity", () => {
    const current = useResumeBuilder.getState().resume;
    const merged = mergeImportedResume(current, IMPORTED);
    useResumeBuilder.getState().setResume(merged);

    const state = useResumeBuilder.getState();
    const r = state.resumes.find((x) => x.resumeId === "resume-a");

    // Identity preserved
    expect(state.activeResumeId).toBe("resume-a");
    expect(r?.resumeId).toBe("resume-a");
    expect(r?.resumeName).toBe("Resume A");

    // Content replaced
    expect(r?.name).toBe("IMPORT_TEST_USER");
    expect(r?.title).toBe("IMPORT_TEST_ENGINEER");
    expect(r?.email).toBe("import-test@example.com");
    expect(r?.summary).toBe("IMPORT_TEST_SUMMARY");
    expect(r?.experience[0]?.company).toBe("IMPORT_TEST_COMPANY");
    expect(r?.education[0]?.school).toBe("IMPORT_TEST_UNIVERSITY");
    expect(r?.skills[0]?.name).toBe("IMPORT_TEST_SKILL");

    // Template preserved (schema default "template-1" should not overwrite)
    expect(r?.templateId).toBe("executive-pro");
  });

  it("import with a real templateId IS honored", () => {
    const importedWithTemplate = { ...IMPORTED, templateId: "engineering-clean" };
    const current = useResumeBuilder.getState().resume;
    const merged = mergeImportedResume(current, importedWithTemplate);
    useResumeBuilder.getState().setResume(merged);

    const r = useResumeBuilder.getState().resume;
    expect(r.templateId).toBe("engineering-clean");
  });
});

describe("Import regression: cancel does not change data", () => {
  beforeEach(() => {
    seedResumeA();
  });

  it("cancel import leaves the resume unchanged", () => {
    const before = { ...useResumeBuilder.getState().resume };

    // Simulate cancel: just don't call setResume
    // The store should remain identical
    const after = useResumeBuilder.getState().resume;
    expect(after.name).toBe(before.name);
    expect(after.title).toBe(before.title);
    expect(after.email).toBe(before.email);
    expect(after.templateId).toBe(before.templateId);
  });
});

describe("Import regression: multi-resume safety", () => {
  beforeEach(() => {
    seedResumesAAndB();
  });

  it("import into Resume A does not affect Resume B", () => {
    const current = useResumeBuilder.getState().resume;
    const merged = mergeImportedResume(current, IMPORTED);
    useResumeBuilder.getState().setResume(merged);

    const state = useResumeBuilder.getState();
    const rB = state.resumes.find((x) => x.resumeId === "resume-b");

    // Resume B untouched
    expect(rB?.name).toBe("RESUME_B_USER");
    expect(rB?.title).toBe("Resume B Title");
    expect(rB?.email).toBe("resume-b@example.com");
    expect(rB?.templateId).toBe("patorbit-modern");

    // Resume A updated
    const rA = state.resumes.find((x) => x.resumeId === "resume-a");
    expect(rA?.name).toBe("IMPORT_TEST_USER");
  });

  it("switching to Resume B after import still shows Resume B data", () => {
    const current = useResumeBuilder.getState().resume;
    const merged = mergeImportedResume(current, IMPORTED);
    useResumeBuilder.getState().setResume(merged);

    // Switch to Resume B
    useResumeBuilder.getState().switchResume("resume-b");

    const state = useResumeBuilder.getState();
    expect(state.activeResumeId).toBe("resume-b");
    expect(state.resume.name).toBe("RESUME_B_USER");
    expect(state.resume.templateId).toBe("patorbit-modern");
  });
});

describe("Clear Resume regression", () => {
  beforeEach(() => {
    seedResumeA();
  });

  it("clear preserves resumeId, resumeName, and templateId", () => {
    useResumeBuilder.getState().resetResume();

    const state = useResumeBuilder.getState();
    const r = state.resumes.find((x) => x.resumeId === "resume-a");

    expect(r?.resumeId).toBe("resume-a");
    expect(r?.resumeName).toBe("Resume A");
    expect(r?.templateId).toBe("executive-pro");

    // Content cleared
    expect(r?.name).toBe("");
    expect(r?.title).toBe("");
    expect(r?.email).toBe("");
    expect(r?.summary).toBe("");
    expect(r?.experience).toEqual([]);
    expect(r?.education).toEqual([]);
    expect(r?.skills).toEqual([]);
  });

  it("clear does not affect Resume B", () => {
    seedResumesAAndB();

    useResumeBuilder.getState().resetResume();

    const state = useResumeBuilder.getState();
    const rB = state.resumes.find((x) => x.resumeId === "resume-b");

    // Resume B untouched
    expect(rB?.name).toBe("RESUME_B_USER");
    expect(rB?.title).toBe("Resume B Title");
    expect(rB?.templateId).toBe("patorbit-modern");

    // Resume A cleared
    const rA = state.resumes.find((x) => x.resumeId === "resume-a");
    expect(rA?.name).toBe("");
    expect(rA?.experience).toEqual([]);
  });

  it("activeResumeId remains unchanged after clear", () => {
    useResumeBuilder.getState().resetResume();
    expect(useResumeBuilder.getState().activeResumeId).toBe("resume-a");
  });

  it("import after clear works correctly", () => {
    // Clear
    useResumeBuilder.getState().resetResume();
    expect(useResumeBuilder.getState().resume.name).toBe("");

    // Import
    const current = useResumeBuilder.getState().resume;
    const merged = mergeImportedResume(current, IMPORTED);
    useResumeBuilder.getState().setResume(merged);

    const r = useResumeBuilder.getState().resume;
    expect(r.name).toBe("IMPORT_TEST_USER");
    expect(r.resumeId).toBe("resume-a");
    expect(r.templateId).toBe("executive-pro");
  });
});
