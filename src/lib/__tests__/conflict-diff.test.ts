/**
 * C7 — Section-level diff tests for conflict resolution.
 */

import { describe, it, expect } from "vitest";
import { computeSectionDiffs } from "@/lib/conflict-diff";
import type { Resume, Experience, Skill, Education, Project, Certification, Language } from "@/types/resume";

const EMPTY_EXP: Experience = { id: "", company: "", position: "", location: "", employmentType: "", industry: "", startDate: "", endDate: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] };
const EMPTY_SKILL: Skill = { id: "", name: "", level: "Intermediate", category: "", years: "" };
const EMPTY_EDU: Education = { id: "", school: "", degree: "", year: "", field: "", gpa: "", minor: "", honors: "", activities: "", location: "" };
const EMPTY_PROJ: Project = { id: "", name: "", description: "", tech: "", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed", bulletPoints: [] };
const EMPTY_CERT: Certification = { id: "", name: "", issuer: "", date: "", link: "", description: "", expiryDate: "", skills: "" };
const EMPTY_LANG: Language = { id: "", name: "", proficiency: "Fluent" };

function makeResume(overrides: Partial<Resume> = {}): Resume {
  return {
    resumeId: "test-resume",
    resumeName: "Test",
    name: "Test User",
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
    careerStage: "working-professional",
    fontPreference: "inter",
    palettePreference: "slate",
    exportFormat: "pdf",
    pageSize: "letter",
    claims: [],
    ...overrides,
  };
}

describe("C7 — Section-level Diff", () => {
  it("detects identical resumes as all unchanged", () => {
    const resume = makeResume({
      name: "Alice",
      summary: "Engineer",
      experience: [{ ...EMPTY_EXP, id: "e1", company: "ACME" }],
      skills: [{ ...EMPTY_SKILL, id: "s1", name: "Python" }],
    });

    const diffs = computeSectionDiffs(resume, { ...resume, experience: [...resume.experience], skills: [...resume.skills] });

    expect(diffs.every((d) => d.status === "unchanged")).toBe(true);
  });

  it("detects scalar field changes", () => {
    const local = makeResume({ name: "Alice Local", summary: "Local summary" });
    const server = makeResume({ name: "Alice Server", summary: "Server summary" });

    const diffs = computeSectionDiffs(local, server);

    expect(diffs.find((d) => d.section === "Personal Info")?.status).toBe("both-changed");
    expect(diffs.find((d) => d.section === "Summary")?.status).toBe("both-changed");
  });

  it("detects changed experience entries", () => {
    const local = makeResume({
      experience: [
        { ...EMPTY_EXP, id: "e1", company: "ACME", position: "Dev" },
        { ...EMPTY_EXP, id: "e2", company: "Beta", position: "PM" },
      ],
    });
    const server = makeResume({
      experience: [
        { ...EMPTY_EXP, id: "e1", company: "ACME", position: "Dev" },
      ],
    });

    const diffs = computeSectionDiffs(local, server);
    const exp = diffs.find((d) => d.section === "Experience");

    expect(exp?.status).toBe("both-changed");
    expect(exp?.localCount).toBe(2);
    expect(exp?.serverCount).toBe(1);
  });

  it("detects changed skills", () => {
    const local = makeResume({
      skills: [
        { ...EMPTY_SKILL, id: "s1", name: "Python" },
        { ...EMPTY_SKILL, id: "s2", name: "TypeScript" },
        { ...EMPTY_SKILL, id: "s3", name: "Rust" },
      ],
    });
    const server = makeResume({
      skills: [
        { ...EMPTY_SKILL, id: "s1", name: "Python" },
        { ...EMPTY_SKILL, id: "s2", name: "TypeScript" },
      ],
    });

    const diffs = computeSectionDiffs(local, server);
    const skills = diffs.find((d) => d.section === "Skills");

    expect(skills?.status).toBe("both-changed");
    expect(skills?.localCount).toBe(3);
    expect(skills?.serverCount).toBe(2);
  });

  it("detects template change", () => {
    const local = makeResume({ templateId: "executive-pro" });
    const server = makeResume({ templateId: "modern-clean" });

    const diffs = computeSectionDiffs(local, server);
    expect(diffs.find((d) => d.section === "Template")?.status).toBe("both-changed");
  });

  it("returns unchanged for matching sections", () => {
    const local = makeResume({
      name: "Same Name",
      experience: [{ ...EMPTY_EXP, id: "e1", company: "ACME" }],
      skills: [{ ...EMPTY_SKILL, id: "s1", name: "Python" }],
    });
    const server = makeResume({
      name: "Same Name",
      experience: [{ ...EMPTY_EXP, id: "e1", company: "ACME" }],
      skills: [{ ...EMPTY_SKILL, id: "s1", name: "Python" }],
      templateId: "executive-pro",
    });

    const diffs = computeSectionDiffs(local, server);

    expect(diffs.find((d) => d.section === "Personal Info")?.status).toBe("unchanged");
    expect(diffs.find((d) => d.section === "Experience")?.status).toBe("unchanged");
    expect(diffs.find((d) => d.section === "Skills")?.status).toBe("unchanged");
    expect(diffs.find((d) => d.section === "Template")?.status).toBe("both-changed");
  });

  it("handles empty arrays on both sides", () => {
    const local = makeResume();
    const server = makeResume();

    const diffs = computeSectionDiffs(local, server);
    expect(diffs.every((d) => d.status === "unchanged")).toBe(true);
  });

  it("detects education changes", () => {
    const local = makeResume({
      education: [{ ...EMPTY_EDU, id: "ed1", school: "MIT", degree: "BS" }],
    });
    const server = makeResume({
      education: [
        { ...EMPTY_EDU, id: "ed1", school: "MIT", degree: "BS" },
        { ...EMPTY_EDU, id: "ed2", school: "Stanford", degree: "MS" },
      ],
    });

    const diffs = computeSectionDiffs(local, server);
    const edu = diffs.find((d) => d.section === "Education");

    expect(edu?.status).toBe("both-changed");
    expect(edu?.localCount).toBe(1);
    expect(edu?.serverCount).toBe(2);
  });
});
