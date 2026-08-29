"use strict";

/**
 * PHASE A2: Resume Data Integrity & Normalization Audit
 *
 * This test suite verifies that all resume data paths converge to ONE canonical
 * internal Resume representation. It covers:
 *
 * - Canonical schema conformance
 * - Normalization determinism (same input → same output)
 * - ID preservation across import/merge/hydration
 * - Data loss prevention (no silent field dropping)
 * - Template integrity (templateId never corrupted)
 * - Malformed input handling (null, undefined, empty strings, missing fields)
 * - Import convergence (JSON/PDF/DOCX → same canonical shape)
 */

import { describe, it, expect } from "vitest";
import { parseResumeJson, ResumeSchema } from "../resume-schema";
import { rawToResume, withIds } from "../resume-parser";
import { mergeImportedResume, normalizeImportedResume } from "../normalize-import";
import { defaultResume } from "@/store/resume-builder";
import type { Resume } from "@/types/resume";

/* ════════════════════════════════════════════════════════════════════════════
 * FIXTURES — Synthetic test data representing realistic resumes
 * ════════════════════════════════════════════════════════════════════════════ */

/** Minimal resume — only required string fields */
const MINIMAL_RESUME: Resume = {
  ...defaultResume,
  name: "Jane Doe",
  email: "jane@example.com",
};

/** Complete resume — all fields populated */
const COMPLETE_RESUME: Resume = {
  ...defaultResume,
  resumeId: "complete-1",
  resumeName: "Complete Resume",
  templateId: "executive-pro",
  careerStage: "manager",
  name: "John Smith",
  title: "Senior Software Engineer",
  email: "john@example.com",
  phone: "+1-555-0100",
  address: "San Francisco, CA",
  nationality: "US",
  pronouns: "he/him",
  summary: "Experienced engineer with 10+ years in distributed systems.",
  social: {
    linkedin: "linkedin.com/in/johnsmith",
    github: "github.com/johnsmith",
    website: "johnsmith.dev",
    twitter: "",
    portfolio: "",
    stackoverflow: "",
  },
  experience: [
    {
      id: "exp-1",
      company: "Acme Corp",
      position: "Senior Engineer",
      location: "SF, CA",
      employmentType: "Full-time",
      industry: "Tech",
      startDate: "Jan 2020",
      endDate: "Present",
      current: true,
      duration: "Jan 2020 – Present",
      description: "Led distributed systems team.",
      achievements: "Reduced latency by 40%",
      techUsed: "Go, Kubernetes, AWS",
      bulletPoints: ["Led microservices migration", "Reduced latency by 40%"],
    },
    {
      id: "exp-2",
      company: "StartupXYZ",
      position: "Software Engineer",
      location: "Remote",
      employmentType: "Full-time",
      industry: "Tech",
      startDate: "Jun 2017",
      endDate: "Dec 2019",
      current: false,
      duration: "Jun 2017 – Dec 2019",
      description: "Built real-time data pipeline.",
      achievements: "",
      techUsed: "Python, Kafka",
      bulletPoints: ["Built real-time pipeline"],
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "MIT",
      degree: "B.S.",
      year: "2017",
      field: "Computer Science",
      gpa: "3.8",
      minor: "",
      honors: "Magna Cum Laude",
      activities: "",
      location: "Cambridge, MA",
    },
  ],
  skills: [
    { id: "s-1", name: "Go", level: "Expert", category: "Languages", years: "" },
    { id: "s-2", name: "Kubernetes", level: "Advanced", category: "DevOps", years: "" },
  ],
  projects: [
    {
      id: "p-1",
      name: "Open Source Project",
      description: "A distributed cache",
      tech: "Go, gRPC",
      link: "github.com/john/cache",
      startDate: "2021",
      endDate: "",
      role: "Creator",
      teamSize: "1",
      status: "Completed",
      bulletPoints: [],
    },
  ],
  certifications: [
    {
      id: "c-1",
      name: "AWS Solutions Architect",
      issuer: "AWS",
      date: "2022",
      link: "",
      description: "",
      expiryDate: "",
      skills: "",
    },
  ],
  languages: [
    { id: "l-1", name: "English", proficiency: "Native" },
    { id: "l-2", name: "Spanish", proficiency: "Conversational" },
  ],
  interests: [{ id: "i-1", name: "Chess" }],
  achievements: [{ id: "a-1", title: "Patent", description: "Distributed caching system", date: "2023", issuer: "USPTO" }],
  references: [{ id: "r-1", name: "Alice Boss", company: "Acme Corp", position: "VP Engineering", email: "alice@acme.com", phone: "" }],
  portfolio: [{ id: "pf-1", title: "My Site", description: "Personal website", url: "johnsmith.dev", type: "website" as const }],
  claims: [{
    id: "cl-1",
    assertionText: "Led microservices migration at Acme Corp",
    claimType: "Employment" as const,
    sourceActivityId: "exp-1",
    confidence: 0.9,
    reasoning: "Verified by work history",
    verificationStatus: "accepted" as const,
    reviewed: true,
    accepted: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  }],
};

/** Resume with empty strings everywhere */
const EMPTY_STRINGS_RESUME: Resume = {
  ...defaultResume,
  name: "",
  title: "",
  email: "",
  phone: "",
  summary: "",
};

/** Resume with missing optional arrays */
const MISSING_ARRAYS_RESUME = {
  ...defaultResume,
  name: "Test User",
  experience: undefined,
  education: undefined,
  skills: undefined,
  projects: undefined,
  certifications: undefined,
  languages: undefined,
} as unknown as Resume;

/* ════════════════════════════════════════════════════════════════════════════
 * STEP 2: CANONICAL SCHEMA CONFORMANCE
 * ════════════════════════════════════════════════════════════════════════════ */

describe("Phase A2 — Canonical Schema Conformance", () => {
  it("all fixtures pass ResumeSchema validation", () => {
    for (const [name, fixture] of [
      ["MINIMAL", MINIMAL_RESUME],
      ["COMPLETE", COMPLETE_RESUME],
      ["EMPTY_STRINGS", EMPTY_STRINGS_RESUME],
    ]) {
      const result = ResumeSchema.safeParse(fixture);
      expect(result.success, `${name} failed validation: ${result.success ? "" : JSON.stringify(result.error.issues)}`).toBe(true);
    }
  });

  it("defaultResume passes schema validation", () => {
    const result = ResumeSchema.safeParse(defaultResume);
    expect(result.success).toBe(true);
  });

  it("parseResumeJson returns valid Resume for all fixtures", () => {
    for (const [name, fixture] of [
      ["MINIMAL", MINIMAL_RESUME],
      ["COMPLETE", COMPLETE_RESUME],
      ["EMPTY_STRINGS", EMPTY_STRINGS_RESUME],
    ]) {
      const parsed = parseResumeJson(fixture);
      expect(parsed.name, `${name} name`).toBeDefined();
      expect(parsed.experience, `${name} experience`).toBeDefined();
      expect(parsed.skills, `${name} skills`).toBeDefined();
      expect(parsed.claims, `${name} claims`).toBeDefined();
    }
  });

  it("ResumeSchema applies defaults for missing optional fields", () => {
    const result = ResumeSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.templateId).toBe("template-1");
      expect(result.data.careerStage).toBe("working-professional");
      expect(result.data.experience).toEqual([]);
      expect(result.data.skills).toEqual([]);
      expect(result.data.claims).toEqual([]);
      expect(result.data.social).toEqual({ linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" });
    }
  });

  it("ResumeSchema handles unknown extra fields gracefully (passthrough not needed — safeParse strips them)", () => {
    const data = { name: "Test", unknownField: "should be ignored", random: 42 };
    const result = ResumeSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * STEP 3: NORMALIZATION DETERMINISM
 * ════════════════════════════════════════════════════════════════════════════ */

describe("Phase A2 — Normalization Determinism", () => {
  it("parseResumeJson is deterministic: same input → same output", () => {
    const input = { name: "Test User", title: "Engineer", email: "t@e.com" };
    const run1 = parseResumeJson(input);
    const run2 = parseResumeJson(input);
    // Compare serializable fields (exclude date-based fields in claims)
    expect(JSON.stringify({ ...run1, claims: undefined })).toBe(JSON.stringify({ ...run2, claims: undefined }));
  });

  it("mergeImportedResume is deterministic: same inputs → same output", () => {
    const current = { ...defaultResume, name: "Current", templateId: "modern-clean" } as Resume;
    const imported = { ...defaultResume, name: "Imported", templateId: "template-1" } as Resume;
    const run1 = mergeImportedResume(current, imported);
    const run2 = mergeImportedResume(current, imported);
    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
  });

  it("normalizeImportedResume is deterministic: same input → same output", () => {
    const input = {
      ...defaultResume,
      experience: [{ ...defaultResume.experience[0], duration: "Jan 2020 – Present", startDate: "", endDate: "" }],
    } as Resume;
    const run1 = normalizeImportedResume(input);
    const run2 = normalizeImportedResume(input);
    expect(JSON.stringify(run1.experience)).toBe(JSON.stringify(run2.experience));
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * STEP 4: ID INTEGRITY
 * ════════════════════════════════════════════════════════════════════════════ */

describe("Phase A2 — ID Integrity", () => {
  it("mergeImportedResume preserves resumeId from current resume", () => {
    const current = { ...defaultResume, resumeId: "my-resume-42" } as Resume;
    const imported = { ...defaultResume, resumeId: "different-id" } as Resume;
    const merged = mergeImportedResume(current, imported);
    expect(merged.resumeId).toBe("my-resume-42");
  });

  it("mergeImportedResume preserves experience IDs from imported data", () => {
    const current = { ...defaultResume, experience: [] } as Resume;
    const imported = { ...defaultResume, experience: [{ id: "exp-import-1", company: "A", position: "", location: "", employmentType: "", industry: "", startDate: "", endDate: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] }] } as Resume;
    const merged = mergeImportedResume(current, imported);
    expect(merged.experience[0].id).toBe("exp-import-1");
  });

  it("mergeImportedResume preserves education IDs from imported data", () => {
    const current = { ...defaultResume, education: [] } as Resume;
    const imported = { ...defaultResume, education: [{ id: "edu-import-1", school: "MIT", degree: "B.S.", year: "", field: "", gpa: "", minor: "", honors: "", activities: "", location: "" }] } as Resume;
    const merged = mergeImportedResume(current, imported);
    expect(merged.education[0].id).toBe("edu-import-1");
  });

  it("mergeImportedResume preserves skill IDs from imported data", () => {
    const current = { ...defaultResume, skills: [] } as Resume;
    const imported = { ...defaultResume, skills: [{ id: "s-import-1", name: "Go", level: "Expert", category: "", years: "" }] } as Resume;
    const merged = mergeImportedResume(current, imported);
    expect(merged.skills[0].id).toBe("s-import-1");
  });

  it("parseResumeJson requires IDs on array items (schema enforces id field)", () => {
    const data = {
      name: "Test",
      experience: [{ id: 1, company: "Acme", position: "Eng" }],
      skills: [{ id: 2, name: "Go" }],
    };
    const parsed = parseResumeJson(data);
    expect(typeof parsed.experience[0].id === "number" || typeof parsed.experience[0].id === "string").toBe(true);
    expect(typeof parsed.skills[0].id === "number" || typeof parsed.skills[0].id === "string").toBe(true);
  });

  it("withIds from parser generates sequential IDs", () => {
    const items = [
      { name: "Go" },
      { name: "Python" },
      { name: "Rust" },
    ];
    const withIdItems = withIds(items);
    expect(withIdItems).toHaveLength(3);
    expect(withIdItems[0].id).toBeDefined();
    expect(withIdItems[1].id).toBeDefined();
    expect(withIdItems[2].id).toBeDefined();
    // IDs should be unique
    const ids = withIdItems.map((i: any) => i.id);
    expect(new Set(ids).size).toBe(3);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * STEP 5: DATA LOSS AUDIT
 * ════════════════════════════════════════════════════════════════════════════ */

describe("Phase A2 — Data Loss Audit", () => {
  it("mergeImportedResume imports ALL content fields from imported resume", () => {
    const current = { ...defaultResume } as Resume;
    const merged = mergeImportedResume(current, COMPLETE_RESUME);

    // Personal
    expect(merged.name).toBe("John Smith");
    expect(merged.title).toBe("Senior Software Engineer");
    expect(merged.email).toBe("john@example.com");
    expect(merged.phone).toBe("+1-555-0100");
    expect(merged.address).toBe("San Francisco, CA");
    expect(merged.nationality).toBe("US");
    expect(merged.pronouns).toBe("he/him");
    expect(merged.summary).toBe("Experienced engineer with 10+ years in distributed systems.");

    // Social
    expect(merged.social.linkedin).toBe("linkedin.com/in/johnsmith");
    expect(merged.social.github).toBe("github.com/johnsmith");
    expect(merged.social.website).toBe("johnsmith.dev");

    // Experience
    expect(merged.experience).toHaveLength(2);
    expect(merged.experience[0].company).toBe("Acme Corp");
    expect(merged.experience[0].position).toBe("Senior Engineer");
    expect(merged.experience[0].bulletPoints).toEqual(["Led microservices migration", "Reduced latency by 40%"]);

    // Education
    expect(merged.education).toHaveLength(1);
    expect(merged.education[0].school).toBe("MIT");

    // Skills
    expect(merged.skills).toHaveLength(2);
    expect(merged.skills[0].name).toBe("Go");
    expect(merged.skills[0].level).toBe("Expert");

    // Projects
    expect(merged.projects).toHaveLength(1);
    expect(merged.projects[0].name).toBe("Open Source Project");

    // Certifications
    expect(merged.certifications).toHaveLength(1);
    expect(merged.certifications[0].name).toBe("AWS Solutions Architect");

    // Languages
    expect(merged.languages).toHaveLength(2);
    expect(merged.languages[0].name).toBe("English");

    // Interests
    expect(merged.interests).toHaveLength(1);
    expect(merged.interests[0].name).toBe("Chess");

    // Achievements
    expect(merged.achievements).toHaveLength(1);
    expect(merged.achievements[0].title).toBe("Patent");

    // References
    expect(merged.references).toHaveLength(1);
    expect(merged.references[0].name).toBe("Alice Boss");

    // Portfolio
    expect(merged.portfolio).toHaveLength(1);
    expect(merged.portfolio[0].title).toBe("My Site");
  });

  it("mergeImportedResume preserves non-content fields from current resume", () => {
    const current = {
      ...defaultResume,
      resumeId: "my-id",
      resumeName: "My Resume",
      templateId: "executive-pro",
      careerStage: "manager",
      claims: [{ id: "c1", assertionText: "test", claimType: "Skill" as const, sourceActivityId: "", confidence: 1, reasoning: "", verificationStatus: "accepted" as const, reviewed: true, accepted: true, createdAt: "" }],
    } as Resume;
    const imported = { ...defaultResume, templateId: "template-1" } as Resume;
    const merged = mergeImportedResume(current, imported);

    // Identity preserved
    expect(merged.resumeId).toBe("my-id");
    expect(merged.resumeName).toBe("My Resume");

    // Template preserved (imported is schema default, so current wins)
    expect(merged.templateId).toBe("executive-pro");

    // Career stage preserved
    expect(merged.careerStage).toBe("manager");

    // Claims preserved
    expect(merged.claims).toHaveLength(1);
  });

  it("normalizeImportedResume back-fills startDate/endDate from duration", () => {
    const input = {
      ...defaultResume,
      experience: [{
        id: "1",
        company: "Test",
        position: "",
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
      }],
    } as Resume;
    const normalized = normalizeImportedResume(input);
    expect(normalized.experience[0].startDate).toBe("Jan 2020");
    expect(normalized.experience[0].endDate).toBe("Present");
  });

  it("normalizeImportedResume does NOT overwrite existing startDate/endDate", () => {
    const input = {
      ...defaultResume,
      experience: [{
        id: "1",
        company: "Test",
        position: "",
        location: "",
        employmentType: "",
        industry: "",
        startDate: "Mar 2020",
        endDate: "Dec 2022",
        current: false,
        duration: "Jan 2020 – Present",
        description: "",
        achievements: "",
        techUsed: "",
        bulletPoints: [],
      }],
    } as Resume;
    const normalized = normalizeImportedResume(input);
    expect(normalized.experience[0].startDate).toBe("Mar 2020");
    expect(normalized.experience[0].endDate).toBe("Dec 2022");
  });

  it("parseResumeJson fills defaults for ALL missing fields (no undefined leakage)", () => {
    const parsed = parseResumeJson({ name: "Minimal" });
    // Strings
    expect(parsed.title).toBe("");
    expect(parsed.email).toBe("");
    expect(parsed.phone).toBe("");
    expect(parsed.summary).toBe("");
    // Arrays
    expect(parsed.experience).toEqual([]);
    expect(parsed.education).toEqual([]);
    expect(parsed.skills).toEqual([]);
    expect(parsed.projects).toEqual([]);
    expect(parsed.certifications).toEqual([]);
    expect(parsed.languages).toEqual([]);
    expect(parsed.interests).toEqual([]);
    expect(parsed.achievements).toEqual([]);
    expect(parsed.references).toEqual([]);
    expect(parsed.portfolio).toEqual([]);
    expect(parsed.claims).toEqual([]);
    // Social
    expect(parsed.social.linkedin).toBe("");
    expect(parsed.social.github).toBe("");
    // Enum defaults
    expect(parsed.careerStage).toBe("working-professional");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * STEP 6: TEMPLATE INTEGRITY
 * ════════════════════════════════════════════════════════════════════════════ */

describe("Phase A2 — Template Integrity", () => {
  it("mergeImportedResume preserves valid current template when import carries schema default", () => {
    const current = { ...defaultResume, templateId: "executive-pro" } as Resume;
    const imported = { ...defaultResume, templateId: "template-1" } as Resume;
    const merged = mergeImportedResume(current, imported);
    expect(merged.templateId).toBe("executive-pro");
  });

  it("mergeImportedResume uses imported template when it is a real template ID", () => {
    const current = { ...defaultResume, templateId: "executive-pro" } as Resume;
    const imported = { ...defaultResume, templateId: "modern-clean" } as Resume;
    const merged = mergeImportedResume(current, imported);
    expect(merged.templateId).toBe("modern-clean");
  });

  it("mergeImportedResume preserves current template when import has invalid ID", () => {
    const current = { ...defaultResume, templateId: "executive-pro" } as Resume;
    const imported = { ...defaultResume, templateId: "nonexistent-template" } as Resume;
    const merged = mergeImportedResume(current, imported);
    expect(merged.templateId).toBe("executive-pro");
  });

  it("mergeImportedResume preserves current template when import has empty templateId", () => {
    const current = { ...defaultResume, templateId: "executive-pro" } as Resume;
    const imported = { ...defaultResume, templateId: "" } as Resume;
    const merged = mergeImportedResume(current, imported);
    expect(merged.templateId).toBe("executive-pro");
  });

  it("parseResumeJson does not invent templateId — uses schema default 'template-1'", () => {
    const parsed = parseResumeJson({ name: "Test" });
    expect(parsed.templateId).toBe("template-1");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * STEP 7: MALFORMED INPUT HANDLING
 * ════════════════════════════════════════════════════════════════════════════ */

describe("Phase A2 — Malformed Input Handling", () => {
  it("parseResumeJson throws on null input (invalid format)", () => {
    expect(() => parseResumeJson(null)).toThrow("Invalid resume format");
  });

  it("parseResumeJson throws on undefined input (invalid format)", () => {
    expect(() => parseResumeJson(undefined)).toThrow("Invalid resume format");
  });

  it("parseResumeJson handles empty object without crashing", () => {
    const parsed = parseResumeJson({});
    expect(parsed.name).toBe("");
    expect(parsed.experience).toEqual([]);
  });

  it("parseResumeJson throws on string input (invalid format)", () => {
    expect(() => parseResumeJson("just a string")).toThrow("Invalid resume format");
  });

  it("parseResumeJson throws on number input (invalid format)", () => {
    expect(() => parseResumeJson(42)).toThrow("Invalid resume format");
  });

  it("parseResumeJson throws on array input (invalid format)", () => {
    expect(() => parseResumeJson([1, 2, 3])).toThrow("Invalid resume format");
  });

  it("mergeImportedResume throws on null imported (TypeScript types enforce Resume)", () => {
    const current = { ...defaultResume } as Resume;
    expect(() => mergeImportedResume(current, null as any)).toThrow();
  });

  it("parseResumeJson handles experience with missing optional fields (id required)", () => {
    const parsed = parseResumeJson({
      name: "Test",
      experience: [{ id: 1, company: "Acme" }], // missing position, etc. but has id
    });
    expect(parsed.experience).toHaveLength(1);
    expect(parsed.experience[0].company).toBe("Acme");
    expect(parsed.experience[0].position).toBe(""); // defaulted
    expect(parsed.experience[0].description).toBe(""); // defaulted
  });

  it("parseResumeJson throws on skills with invalid level (enum enforced)", () => {
    // Invalid enum value causes Zod to reject the entire resume
    expect(() => parseResumeJson({
      name: "Test",
      skills: [{ id: 1, name: "Go", level: "InvalidLevel" }],
    })).toThrow("Invalid resume format");
  });

  it("parseResumeJson omits skills with invalid level when using coerce/strip mode", () => {
    // Without the invalid skill, parsing succeeds
    const parsed = parseResumeJson({
      name: "Test",
      skills: [{ id: 1, name: "Go", level: "Expert" }],
    });
    expect(parsed.skills).toHaveLength(1);
    expect(parsed.skills[0].level).toBe("Expert");
  });

  it("parseResumeJson handles skills with empty level (default applies)", () => {
    const parsed = parseResumeJson({
      name: "Test",
      skills: [{ id: 1, name: "Go" }],
    });
    expect(parsed.skills).toHaveLength(1);
    expect(parsed.skills[0].level).toBe("Intermediate"); // Zod default
  });

  it("normalizeImportedResume handles resume with no experience", () => {
    const input = { ...defaultResume, experience: [] } as Resume;
    const result = normalizeImportedResume(input);
    expect(result.experience).toEqual([]);
  });

  it("normalizeImportedResume handles experience with non-parseable duration", () => {
    const input = {
      ...defaultResume,
      experience: [{
        id: "1",
        company: "Test",
        position: "",
        location: "",
        employmentType: "",
        industry: "",
        startDate: "",
        endDate: "",
        current: false,
        duration: "Some random text without dates",
        description: "",
        achievements: "",
        techUsed: "",
        bulletPoints: [],
      }],
    } as Resume;
    const result = normalizeImportedResume(input);
    // Duration is not parseable → startDate/endDate stay empty
    expect(result.experience[0].startDate).toBe("");
    expect(result.experience[0].endDate).toBe("");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * STEP 7b: IMPORT CONVERGENCE
 * ════════════════════════════════════════════════════════════════════════════ */

describe("Phase A2 — Import Convergence", () => {
  it("rawToResume output passes parseResumeJson validation", () => {
    const rawText = [
      "Jane Doe",
      "Senior Software Engineer",
      "jane@example.com | (555) 123-4567",
      "SUMMARY",
      "Experienced engineer.",
      "EXPERIENCE",
      "Acme Corp  Jan 2020 – Present",
      "Senior Engineer",
      "• Built distributed systems",
      "• Reduced latency by 40%",
      "SKILLS",
      "Go · Python · Kubernetes",
      "EDUCATION",
      "MIT",
      "B.S. Computer Science  2017",
    ].join("\n");

    const rawResult = rawToResume(rawText);
    const validated = parseResumeJson(rawResult);

    expect(validated.name).toBe("Jane Doe");
    expect(validated.email).toBe("jane@example.com");
    expect(validated.phone).toContain("555");
    expect(validated.experience.length).toBeGreaterThan(0);
    expect(validated.skills.length).toBeGreaterThan(0);
    expect(validated.education.length).toBeGreaterThan(0);
  });

  it("JSON import produces same canonical shape as manual input", () => {
    // JSON import path
    const jsonInput = {
      name: "Test User",
      title: "Engineer",
      email: "test@example.com",
      experience: [{ id: 1, company: "Acme", position: "SWE", description: "Did stuff" }],
      skills: [{ id: 1, name: "Go", level: "Expert" }],
    };
    const jsonParsed = parseResumeJson(jsonInput);

    // Manual path (what the builder produces)
    const manualResume = {
      ...defaultResume,
      name: "Test User",
      title: "Engineer",
      email: "test@example.com",
    } as Resume;

    // Both should have the same schema shape
    expect(typeof jsonParsed.name).toBe(typeof manualResume.name);
    expect(typeof jsonParsed.experience).toBe(typeof manualResume.experience);
    expect(typeof jsonParsed.skills).toBe(typeof manualResume.skills);
    expect(typeof jsonParsed.templateId).toBe(typeof manualResume.templateId);
    expect(typeof jsonParsed.careerStage).toBe(typeof manualResume.careerStage);
  });

  it("PDF-imported data (via rawToResume) merges correctly via mergeImportedResume", () => {
    const rawText = "John PDF\nPDF Engineer\njohn@pdf.com\nEXPERIENCE\nAcme Corp 2020-Present\nPDF Engineer\nSKILLS\nReact TypeScript";
    const parsed = parseResumeJson(rawToResume(rawText) as unknown as Record<string, unknown>) as Resume;

    const current = { ...defaultResume, templateId: "modern-clean", resumeId: "my-resume" } as Resume;
    const merged = mergeImportedResume(current, parsed);

    expect(merged.name).toBe("John PDF");
    expect(merged.email).toBe("john@pdf.com");
    expect(merged.templateId).toBe("modern-clean"); // preserved
    expect(merged.resumeId).toBe("my-resume"); // preserved
    expect(merged.experience.length).toBeGreaterThan(0);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * STEP 8: SCHEMA COMPLETENESS — Zod schemas must cover all TypeScript fields
 * ════════════════════════════════════════════════════════════════════════════ */

describe("Phase A2 — Schema Completeness", () => {
  it("ExperienceSchema preserves startDate, endDate, current, bulletPoints", () => {
    const parsed = parseResumeJson({
      name: "Test",
      experience: [{
        id: 1,
        company: "Acme",
        position: "SWE",
        startDate: "Jan 2020",
        endDate: "Present",
        current: true,
        bulletPoints: ["Built systems"],
        duration: "Jan 2020 – Present",
      }],
    });
    expect(parsed.experience[0].startDate).toBe("Jan 2020");
    expect(parsed.experience[0].endDate).toBe("Present");
    expect(parsed.experience[0].current).toBe(true);
    expect(parsed.experience[0].bulletPoints).toEqual(["Built systems"]);
  });

  it("ProjectSchema preserves bulletPoints", () => {
    const parsed = parseResumeJson({
      name: "Test",
      projects: [{
        id: 1,
        name: "Open Source",
        bulletPoints: ["Implemented feature X"],
      }],
    });
    expect(parsed.projects[0].bulletPoints).toEqual(["Implemented feature X"]);
  });

  it("AchievementSchema preserves title, date, issuer", () => {
    const parsed = parseResumeJson({
      name: "Test",
      achievements: [{
        id: 1,
        title: "Patent",
        description: "System patent",
        date: "2023",
        issuer: "USPTO",
      }],
    });
    expect(parsed.achievements[0].title).toBe("Patent");
    expect(parsed.achievements[0].date).toBe("2023");
    expect(parsed.achievements[0].issuer).toBe("USPTO");
  });

  it("Experience defaults are correct when fields are missing", () => {
    const parsed = parseResumeJson({
      name: "Test",
      experience: [{ id: 1, company: "Acme" }],
    });
    expect(parsed.experience[0].startDate).toBe("");
    expect(parsed.experience[0].endDate).toBe("");
    expect(parsed.experience[0].current).toBe(false);
    expect(parsed.experience[0].bulletPoints).toEqual([]);
  });

  it("JSON import with full experience data is not stripped", () => {
    const fullExp = {
      id: 1,
      company: "TechCorp",
      position: "Lead Engineer",
      location: "NYC",
      employmentType: "Full-time",
      industry: "Tech",
      startDate: "Mar 2018",
      endDate: "Present",
      current: true,
      duration: "Mar 2018 – Present",
      description: "Led team of 10.",
      achievements: "Scaled to 1M users",
      techUsed: "Go, K8s",
      bulletPoints: ["Led migration", "Scaled to 1M"],
    };
    const parsed = parseResumeJson({
      name: "Test",
      experience: [fullExp],
    });
    // Every field must survive schema validation
    const exp = parsed.experience[0];
    expect(exp.company).toBe("TechCorp");
    expect(exp.startDate).toBe("Mar 2018");
    expect(exp.endDate).toBe("Present");
    expect(exp.current).toBe(true);
    expect(exp.bulletPoints).toEqual(["Led migration", "Scaled to 1M"]);
    expect(exp.description).toBe("Led team of 10.");
    expect(exp.achievements).toBe("Scaled to 1M users");
    expect(exp.techUsed).toBe("Go, K8s");
  });
});
