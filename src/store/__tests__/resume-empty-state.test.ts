import { describe, it, expect } from "vitest";
import { isResumeEffectivelyEmpty, defaultResume } from "../resume-builder";
import type { Resume } from "@/types/resume";

describe("isResumeEffectivelyEmpty", () => {
  it("returns true for the default blank resume", () => {
    expect(isResumeEffectivelyEmpty(defaultResume)).toBe(true);
  });

  it("returns true for a resume with no user content", () => {
    const empty: Resume = {
      ...defaultResume,
      resumeId: "test-1",
      resumeName: "My Resume",
    };
    expect(isResumeEffectivelyEmpty(empty)).toBe(true);
  });

  it("returns false when name is set", () => {
    const r: Resume = { ...defaultResume, resumeId: "test-1", name: "John Doe" };
    expect(isResumeEffectivelyEmpty(r)).toBe(false);
  });

  it("returns false when title is set", () => {
    const r: Resume = { ...defaultResume, resumeId: "test-1", title: "Software Engineer" };
    expect(isResumeEffectivelyEmpty(r)).toBe(false);
  });

  it("returns false when email is set", () => {
    const r: Resume = { ...defaultResume, resumeId: "test-1", email: "john@example.com" };
    expect(isResumeEffectivelyEmpty(r)).toBe(false);
  });

  it("returns false when summary is set", () => {
    const r: Resume = { ...defaultResume, resumeId: "test-1", summary: "Experienced engineer" };
    expect(isResumeEffectivelyEmpty(r)).toBe(false);
  });

  it("returns false when experience exists", () => {
    const r: Resume = {
      ...defaultResume,
      resumeId: "test-1",
      experience: [{ id: "exp-1", company: "ACME", position: "Engineer", location: "", employmentType: "", industry: "", startDate: "2020", endDate: "2024", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] }],
    };
    expect(isResumeEffectivelyEmpty(r)).toBe(false);
  });

  it("returns false when education exists", () => {
    const r: Resume = {
      ...defaultResume,
      resumeId: "test-1",
      education: [{ id: "edu-1", school: "MIT", degree: "BS", year: "2020", field: "CS", gpa: "", minor: "", honors: "", activities: "", location: "" }],
    };
    expect(isResumeEffectivelyEmpty(r)).toBe(false);
  });

  it("returns false when skills exist", () => {
    const r: Resume = {
      ...defaultResume,
      resumeId: "test-1",
      skills: [{ id: "skill-1", name: "TypeScript", level: "Expert" as const, category: "", years: "" }],
    };
    expect(isResumeEffectivelyEmpty(r)).toBe(false);
  });

  it("returns false when projects exist", () => {
    const r: Resume = {
      ...defaultResume,
      resumeId: "test-1",
      projects: [{ id: "proj-1", name: "My Project", description: "", tech: "", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed" as const, bulletPoints: [] }],
    };
    expect(isResumeEffectivelyEmpty(r)).toBe(false);
  });

  it("treats resumeName-only resume as empty (name field, not resumeName)", () => {
    const r: Resume = { ...defaultResume, resumeId: "test-1", resumeName: "Data Engineer Resume" };
    expect(isResumeEffectivelyEmpty(r)).toBe(true);
  });
});

describe("Default resume placeholder", () => {
  it("defaultResume has empty content fields", () => {
    expect(defaultResume.name).toBe("");
    expect(defaultResume.email).toBe("");
    expect(defaultResume.title).toBe("");
    expect(defaultResume.summary).toBe("");
    expect(defaultResume.experience).toHaveLength(0);
    expect(defaultResume.education).toHaveLength(0);
    expect(defaultResume.skills).toHaveLength(0);
    expect(defaultResume.projects).toHaveLength(0);
  });

  it("defaultResume template is modern-clean", () => {
    expect(defaultResume.templateId).toBe("modern-clean");
  });
});

describe("Resume list filtering", () => {
  it("filtering out empty resumes leaves only real ones", () => {
    const resumes: Resume[] = [
      { ...defaultResume, resumeId: "blank-1" },
      { ...defaultResume, resumeId: "blank-2" },
      { ...defaultResume, resumeId: "real-1", name: "John Doe", email: "john@test.com" },
    ];
    const realResumes = resumes.filter((r) => !isResumeEffectivelyEmpty(r));
    expect(realResumes).toHaveLength(1);
    expect(realResumes[0].resumeId).toBe("real-1");
  });

  it("all-empty list produces empty filtered list", () => {
    const resumes: Resume[] = [
      { ...defaultResume, resumeId: "blank-1" },
      { resumeId: "blank-2", resumeName: "My Resume", name: "", title: "", email: "", phone: "", address: "", nationality: "", pronouns: "", summary: "", social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" }, experience: [], education: [], skills: [], projects: [], certifications: [], languages: [], interests: [], achievements: [], references: [], portfolio: [], templateId: "modern-clean", careerStage: "working-professional" as const, fontPreference: "inter", palettePreference: "slate", exportFormat: "pdf", pageSize: "letter", claims: [] },
    ];
    const realResumes = resumes.filter((r) => !isResumeEffectivelyEmpty(r));
    expect(realResumes).toHaveLength(0);
  });
});
