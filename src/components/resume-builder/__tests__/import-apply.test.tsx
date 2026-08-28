"use strict";

/**
 * Regression test for the critical final step of resume import:
 *
 *   Review Imported Resume → click "Continue to Builder" → canonical store
 *
 * The exact wiring under test is what ImportButton.tsx does:
 *   onConfirm={(draft) => setResume(mergeImportedResume(currentResume, draft))}
 *
 * This test proves the Apply action writes the IMPORTED data (not the gallery
 * sample, not the old resume) into the SAME resume the builder reads, while
 * preserving the user's resumeId, resumeName and templateId when the import
 * carries none.
 */

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { ImportReviewScreen } from "../ImportReviewScreen";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { mergeImportedResume } from "@/utils/normalize-import";
import { renderToContainer, click, findButton } from "./gallery-test-utils";
import type { Resume } from "@/types/resume";

const REAL_RESUME: Resume = {
  ...defaultResume,
  resumeId: "real-user-resume-1",
  resumeName: "My Resume",
  templateId: "executive-pro",
  name: "Original User",
  title: "Original Title",
  email: "original@example.com",
  phone: "555-0001",
  summary: "Original summary.",
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
  resumeId: undefined,
  resumeName: undefined,
  templateId: "template-1", // schema default — NOT a real template
  name: "IMPORT_TEST_USER",
  title: "IMPORT_TEST_ENGINEER",
  email: "import-test@example.com",
  phone: "",
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
      description: "",
      achievements: "",
      techUsed: "",
      bulletPoints: [],
    },
  ],
  education: [
    { id: "edu-1", school: "IMPORT_TEST_UNIVERSITY", degree: "B.S.", year: "", field: "", gpa: "", minor: "", honors: "", activities: "", location: "" },
  ],
  skills: [{ id: "skill-1", name: "IMPORT_TEST_SKILL", level: "Intermediate", category: "", years: "" }],
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

function seedStore(): void {
  useResumeBuilder.setState({
    resumes: [REAL_RESUME],
    activeResumeId: "real-user-resume-1",
    resume: REAL_RESUME,
    styleConfigs: {},
    saveStatus: "saved",
  });
}

function meta() {
  return { path: "regex" as const, truncated: false, charCount: 10, rawText: "raw" };
}

describe("Import Review → Apply writes imported data into the real resume", () => {
  beforeEach(() => {
    seedStore();
    document.body.innerHTML = "";
  });

  it("Continue to Builder updates the canonical store with ALL imported values", () => {
    // Same wiring as ImportButton.handleConfirm.
    const onConfirm = (draft: Resume) => {
      const current = useResumeBuilder.getState().resume;
      useResumeBuilder.getState().setResume(mergeImportedResume(current, draft));
    };

    renderToContainer(
      <ImportReviewScreen resume={IMPORTED} meta={meta()} onConfirm={onConfirm} onCancel={() => {}} />,
    );

    // The review screen displays the imported values (in input values).
    const inputs = Array.from(document.body.querySelectorAll("input")).map((i) => (i as HTMLInputElement).value);
    expect(inputs).toContain("IMPORT_TEST_USER");
    expect(inputs).toContain("IMPORT_TEST_ENGINEER");

    click(findButton("Continue to Builder"));

    const state = useResumeBuilder.getState();
    const r = state.resumes.find((x) => x.resumeId === state.activeResumeId);

    // 1. Same resume the builder reads — resumeId/resumeName unchanged.
    expect(state.activeResumeId).toBe("real-user-resume-1");
    expect(r?.resumeId).toBe("real-user-resume-1");
    expect(r?.resumeName).toBe("My Resume");

    // 2. Imported data landed in that resume.
    expect(r?.name).toBe("IMPORT_TEST_USER");
    expect(r?.title).toBe("IMPORT_TEST_ENGINEER");
    expect(r?.email).toBe("import-test@example.com");
    expect(r?.summary).toBe("IMPORT_TEST_SUMMARY");
    expect(r?.experience[0]?.company).toBe("IMPORT_TEST_COMPANY");
    expect(r?.education[0]?.school).toBe("IMPORT_TEST_UNIVERSITY");
    expect(r?.skills.map((s) => s.name)).toContain("IMPORT_TEST_SKILL");

    // 3. Template preserved — the schema default must never reach the resume.
    expect(r?.templateId).toBe("executive-pro");
    expect(r?.templateId).not.toBe("template-1");

    // 4. The builder's live `resume` binding is the same updated object.
    expect(state.resume.name).toBe("IMPORT_TEST_USER");
  });

  it("an import that explicitly carries a real templateId is honored", () => {
    const onConfirm = (draft: Resume) => {
      const current = useResumeBuilder.getState().resume;
      useResumeBuilder.getState().setResume(mergeImportedResume(current, draft));
    };
    const withTemplate = { ...IMPORTED, templateId: "engineering-clean" };

    renderToContainer(
      <ImportReviewScreen resume={withTemplate} meta={meta()} onConfirm={onConfirm} onCancel={() => {}} />,
    );
    click(findButton("Continue to Builder"));

    const r = useResumeBuilder.getState().resume;
    expect(r.templateId).toBe("engineering-clean");
    expect(r.name).toBe("IMPORT_TEST_USER");
  });

  it("never writes gallery sample data into the real resume", () => {
    // The gallery sample (Jordan Rivera) is confined to gallery previews.
    // Confirm the imported resume — not the sample — is what lands in the store.
    const onConfirm = (draft: Resume) => {
      const current = useResumeBuilder.getState().resume;
      useResumeBuilder.getState().setResume(mergeImportedResume(current, draft));
    };

    renderToContainer(
      <ImportReviewScreen resume={IMPORTED} meta={meta()} onConfirm={onConfirm} onCancel={() => {}} />,
    );
    click(findButton("Continue to Builder"));

    const r = useResumeBuilder.getState().resume;
    expect(r.name).toBe("IMPORT_TEST_USER");
    expect(r.name).not.toBe("Jordan Rivera");
    expect(r.name).not.toBe("Original User");
  });
});
