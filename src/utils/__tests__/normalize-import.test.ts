import { describe, expect, it } from "vitest";
import { normalizeImportedResume, mergeImportedResume } from "../normalize-import";
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

describe("mergeImportedResume (the import → apply step)", () => {
  function importedResume(overrides: Partial<Resume> = {}): Resume {
    return {
      ...baseResume(),
      name: "IMPORT TEST USER",
      title: "IMPORT TEST ENGINEER",
      email: "import-test@example.com",
      summary: "A summary written for the import test.",
      ...overrides,
    };
  }

  it("replaces content with imported data but preserves the user's template when the import has no real templateId", () => {
    const current = { ...baseResume(), name: "Original User", templateId: "executive-pro" };
    const imported = importedResume(); // templateId defaults to "modern-clean" in baseResume...
    // Force the schema-default "unspecified" marker, as parseResumeJson produces
    // for imports without a templateId.
    imported.templateId = "template-1";

    const merged = mergeImportedResume(current, imported);

    // Imported content wins.
    expect(merged.name).toBe("IMPORT TEST USER");
    expect(merged.title).toBe("IMPORT TEST ENGINEER");
    expect(merged.email).toBe("import-test@example.com");
    expect(merged.summary).toBe("A summary written for the import test.");
    // User's template is preserved — the import must not reset it.
    expect(merged.templateId).toBe("executive-pro");
  });

  it("uses the imported templateId when the import explicitly carries a real template", () => {
    const current = { ...baseResume(), name: "Original User", templateId: "executive-pro" };
    const imported = importedResume({ templateId: "engineering-clean" });

    const merged = mergeImportedResume(current, imported);

    expect(merged.name).toBe("IMPORT TEST USER");
    expect(merged.templateId).toBe("engineering-clean");
  });

  it("preserves the user's template when the import's templateId is unknown", () => {
    const current = { ...baseResume(), name: "Original User", templateId: "executive-pro" };
    const imported = importedResume({ templateId: "not-a-real-template" });

    const merged = mergeImportedResume(current, imported);

    expect(merged.templateId).toBe("executive-pro");
  });

  it("never writes the parser/schema 'unspecified' marker into the real resume", () => {
    const current = { ...baseResume(), name: "Original User", templateId: "modern-clean" };
    const imported = importedResume({ templateId: "template-1" });

    const merged = mergeImportedResume(current, imported);

    expect(merged.templateId).toBe("modern-clean");
    expect(merged.templateId).not.toBe("template-1");
  });

  it("keeps the imported content with the user's template and preserves identity", () => {
    const current = {
      ...baseResume(),
      resumeId: "current-id-123",
      resumeName: "My Resume",
      name: "Original User",
      templateId: "executive-pro",
      careerStage: "manager" as const,
      claims: [{ id: "c1", assertionText: "x", claimType: "Skill" as const, sourceActivityId: "s1", confidence: 1, reasoning: "r", verificationStatus: "accepted" as const, reviewed: true, accepted: true, createdAt: "2026-01-01" }],
    };
    const imported = importedResume();
    imported.templateId = "template-1";

    const merged = mergeImportedResume(current, imported);

    // Content from the import, template from the user.
    expect(merged.name).toBe("IMPORT TEST USER");
    expect(merged.templateId).toBe("executive-pro");
    // Identity/trust fields the import cannot know about survive the merge.
    expect(merged.resumeId).toBe("current-id-123");
    expect(merged.resumeName).toBe("My Resume");
    expect(merged.careerStage).toBe("manager");
    expect(merged.claims).toHaveLength(1);
  });

  it("applies date normalization after the merge (imported durations split into startDate/endDate)", () => {
    const current = baseResume();
    const imported = importedResume({
      experience: [entry("Apr 2024 – Present")],
    });
    imported.templateId = "template-1";

    const merged = mergeImportedResume(current, imported);

    expect(merged.experience[0]?.startDate).toBe("Apr 2024");
    expect(merged.experience[0]?.endDate).toBe("Present");
    expect(merged.templateId).toBe(current.templateId);
  });
});

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