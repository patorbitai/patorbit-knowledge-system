import { describe, expect, it } from "vitest";
import { normalizeImportedResume } from "../normalize-import";
import type { Resume, Experience } from "@/types/resume";

function entry(duration: string, startDate = "", endDate = ""): Experience {
  return {
    id: "1",
    company: "Acme",
    position: "Engineer",
    location: "",
    employmentType: "",
    industry: "",
    startDate,
    endDate,
    current: false,
    duration,
    description: "",
    achievements: "",
    techUsed: "",
    bulletPoints: [],
  };
}

function baseResume(experience: Experience[] = []): Resume {
  return {
    name: "Arvind Chauhan",
    title: "",
    email: "",
    phone: "",
    address: "",
    nationality: "",
    pronouns: "",
    summary: "Experienced engineer.",
    social: {
      linkedin: "",
      github: "",
      website: "",
      twitter: "",
      portfolio: "",
      stackoverflow: "",
    },
    experience,
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
    claims: [],
  };
}

describe("normalizeImportedResume", () => {
  it("splits a 'Start – Present' range into explicit startDate/endDate", () => {
    const resume = baseResume([entry("Apr 2024 – Present")]);
    const [exp] = normalizeImportedResume(resume).experience;
    expect(exp.startDate).toBe("Apr 2024");
    expect(exp.endDate).toBe("Present");
    expect(exp.duration).toBe("Apr 2024 – Present");
  });

  it("splits a hyphenated closed range", () => {
    const resume = baseResume([entry("Jan 2020 - Mar 2023")]);
    const [exp] = normalizeImportedResume(resume).experience;
    expect(exp.startDate).toBe("Jan 2020");
    expect(exp.endDate).toBe("Mar 2023");
  });

  it("splits a year-only range", () => {
    const resume = baseResume([entry("2017 - 2021")]);
    const [exp] = normalizeImportedResume(resume).experience;
    expect(exp.startDate).toBe("2017");
    expect(exp.endDate).toBe("2021");
  });

  it("normalizes a 'to' range with a present marker", () => {
    const resume = baseResume([entry("2020 to Current")]);
    const [exp] = normalizeImportedResume(resume).experience;
    expect(exp.startDate).toBe("2020");
    expect(exp.endDate).toBe("Present");
  });

  it("leaves explicit dates untouched", () => {
    const resume = baseResume([entry("Apr 2024 – Present", "Apr 2024", "2026")]);
    const [exp] = normalizeImportedResume(resume).experience;
    expect(exp.startDate).toBe("Apr 2024");
    expect(exp.endDate).toBe("2026");
    expect(exp.duration).toBe("Apr 2024 – Present");
  });

  it("does not invent dates for a single non-range duration", () => {
    const resume = baseResume([entry("2024")]);
    const [exp] = normalizeImportedResume(resume).experience;
    expect(exp.startDate).toBe("");
    expect(exp.endDate).toBe("");
    expect(exp.duration).toBe("2024");
  });

  it("returns the same resume when there is no experience", () => {
    const resume = baseResume();
    expect(normalizeImportedResume(resume)).toBe(resume);
  });
});