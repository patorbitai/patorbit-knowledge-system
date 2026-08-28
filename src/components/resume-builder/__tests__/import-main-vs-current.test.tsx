"use strict";

/**
 * REGRESSION A/B TEST — main vs current branch import apply behavior.
 *
 * The ONLY functional difference between `main` and the current branch in the
 * import CLIENT chain is `ImportButton.handleConfirm`:
 *
 *   main:     setResume(normalizeImportedResume(draft))
 *   current:  setResume(mergeImportedResume(currentResume, draft))
 *
 * Everything upstream (fetch → response.json → setPending → ImportReviewScreen)
 * and downstream (store.setResume → partialize → builder read) is byte-identical
 * to main. This test runs BOTH implementations against the same seeded store and
 * proves:
 *
 *   1. Both write the imported content to the SAME resumeId (no data loss).
 *   2. Both preserve the existing resumeId and resumeName.
 *   3. Both write imported name/title/email/summary/experience/education/skills.
 *   4. Current additionally preserves the user's templateId when the import
 *      carries the schema default ("template-1"); main would overwrite it.
 *
 * If a regression existed, the current implementation would produce different
 * (empty/old) values than main for fields 1–3. It does not.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { normalizeImportedResume, mergeImportedResume } from "@/utils/normalize-import";
import type { Resume } from "@/types/resume";

const EXISTING: Resume = {
  ...defaultResume,
  resumeId: "real-resume-42",
  resumeName: "My Resume",
  templateId: "executive-pro",
  name: "Alex Johnson",
  title: "Senior Software Engineer",
  email: "alex@example.com",
  summary: "Existing summary that must survive if untouched.",
  social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
  experience: [{ id: "e-old", company: "OLD COMPANY", position: "", location: "", employmentType: "", industry: "", startDate: "", endDate: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] }],
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

/** The exact shape the import API returns for a PDF/DOCX (templateId = schema default "template-1"). */
const IMPORTED: Resume = {
  ...defaultResume,
  templateId: "template-1", // schema default — not a real template
  name: "IMPORT_TEST_USER",
  title: "IMPORT_TEST_ENGINEER",
  email: "import-test@example.com",
  summary: "IMPORT_TEST_SUMMARY",
  social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
  experience: [
    { id: "e1", company: "IMPORT_TEST_COMPANY", position: "Engineer", location: "", employmentType: "", industry: "", startDate: "", endDate: "", current: false, duration: "Jan 2020 – Present", description: "", achievements: "", techUsed: "", bulletPoints: [] },
  ],
  education: [{ id: "edu1", school: "IMPORT_TEST_UNIVERSITY", degree: "B.S.", year: "", field: "", gpa: "", minor: "", honors: "", activities: "", location: "" }],
  skills: [{ id: "s1", name: "IMPORT_TEST_SKILL", level: "Intermediate", category: "", years: "" }],
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
    resumes: [EXISTING],
    activeResumeId: "real-resume-42",
    resume: EXISTING,
    styleConfigs: {},
    saveStatus: "saved",
  });
}

function applyMainWay(draft: Resume): void {
  useResumeBuilder.getState().setResume(normalizeImportedResume(draft));
}

function applyCurrentWay(draft: Resume): void {
  const current = useResumeBuilder.getState().resume;
  useResumeBuilder.getState().setResume(mergeImportedResume(current, draft));
}

function applied(): Resume {
  const s = useResumeBuilder.getState();
  return s.resumes.find((r) => r.resumeId === s.activeResumeId)!;
}

function expectImportedData(r: Resume): void {
  // The imported content must land in the resume the builder reads.
  expect(r.name).toBe("IMPORT_TEST_USER");
  expect(r.title).toBe("IMPORT_TEST_ENGINEER");
  expect(r.email).toBe("import-test@example.com");
  expect(r.summary).toBe("IMPORT_TEST_SUMMARY");
  expect(r.experience[0]?.company).toBe("IMPORT_TEST_COMPANY");
  expect(r.education[0]?.school).toBe("IMPORT_TEST_UNIVERSITY");
  expect(r.skills.map((s) => s.name)).toContain("IMPORT_TEST_SKILL");
}

describe("import apply A/B: main implementation vs current branch", () => {
  beforeEach(() => {
    seedStore();
  });

  it("MAIN implementation (normalizeImportedResume) transfers all imported data to the same resumeId", () => {
    applyMainWay(IMPORTED);
    const r = applied();
    expect(r.resumeId).toBe("real-resume-42");
    expect(r.resumeName).toBe("My Resume");
    expectImportedData(r);
    // NOTE: main OVERWRITES the template with the schema default.
    expect(r.templateId).toBe("template-1");
  });

  it("CURRENT implementation (mergeImportedResume) transfers the SAME imported data to the SAME resumeId", () => {
    applyCurrentWay(IMPORTED);
    const r = applied();
    expect(r.resumeId).toBe("real-resume-42");
    expect(r.resumeName).toBe("My Resume");
    expectImportedData(r);
    // Current additionally preserves the user's template.
    expect(r.templateId).toBe("executive-pro");
  });

  it("content transfer is IDENTICAL between the two implementations (only template/identity differ)", () => {
    // Seed a resume with a career stage and claims that an import cannot know
    // about, so the preservation contract is observable.
    const withIdentity = {
      ...EXISTING,
      careerStage: "manager" as const,
      claims: [{ id: "c1", assertionText: "x", claimType: "Skill" as const, sourceActivityId: "s1", confidence: 1, reasoning: "r", verificationStatus: "accepted" as const, reviewed: true, accepted: true, createdAt: "2026-01-01" }],
    };
    useResumeBuilder.setState({ resumes: [withIdentity], activeResumeId: "real-resume-42", resume: withIdentity });
    applyMainWay(IMPORTED);
    const mainResume = applied();

    useResumeBuilder.setState({ resumes: [withIdentity], activeResumeId: "real-resume-42", resume: withIdentity });
    applyCurrentWay(IMPORTED);
    const currentResume = applied();

    // Every IMPORTABLE content field is equal — nothing is lost or changed by the merge.
    const fields: (keyof Resume)[] = ["name", "title", "email", "summary", "experience", "education", "skills", "projects", "certifications", "languages", "interests", "achievements", "references", "portfolio"];
    for (const f of fields) {
      expect(JSON.stringify(currentResume[f])).toBe(JSON.stringify(mainResume[f]));
    }
    // resumeId/resumeName identical.
    expect(currentResume.resumeId).toBe(mainResume.resumeId);
    expect(currentResume.resumeName).toBe(mainResume.resumeName);
    // templateId differs: current preserves, main clobbers.
    expect(currentResume.templateId).toBe("executive-pro");
    expect(mainResume.templateId).toBe("template-1");
    // Identity/trust fields differ too: current preserves the user's career
    // stage and claims, main resets them to the schema default.
    expect(currentResume.careerStage).toBe("manager");
    expect(mainResume.careerStage).toBe("working-professional");
    expect(currentResume.claims).toHaveLength(1);
    expect(mainResume.claims).toHaveLength(0);
  });

  it("unrelated existing fields are not destroyed by the current implementation", () => {
    // claims and careerStage are not part of the import; verify they survive the merge path.
    const withClaims = { ...EXISTING, claims: [{ id: "c1", assertionText: "x", claimType: "Skill" as const, sourceActivityId: "s1", confidence: 1, reasoning: "r", verificationStatus: "accepted" as const, reviewed: true, accepted: true, createdAt: "2026-01-01" }] };
    useResumeBuilder.setState({ resumes: [withClaims], activeResumeId: "real-resume-42", resume: withClaims });
    applyCurrentWay(IMPORTED);
    const r = applied();
    expect(r.claims).toHaveLength(1);
    expect(r.careerStage).toBe("working-professional");
    expectImportedData(r);
    expect(r.templateId).toBe("executive-pro");
  });
});
