"use strict";

/**
 * M4 Evidence-Based Optimizer — Apply Changes Tests
 *
 * Tests that applyAcceptedChanges correctly:
 *  - produces a new Resume without mutating the original
 *  - applies summary changes
 *  - applies experience bullet changes
 *  - applies skills reordering
 *  - handles empty changes array
 *  - handles missing sections gracefully
 */

import { describe, it, expect } from "vitest";
import { applyAcceptedChanges } from "../apply-changes";
import type { Resume } from "@/types/resume";
import type { OptimizerChange } from "@/types/evidence-optimizer";

/* ── Test fixtures ──────────────────────────────────────────────────────── */

function makeResume(overrides?: Partial<Resume>): Resume {
  return {
    resumeId: "test-resume",
    resumeName: "Test Resume",
    name: "Test User",
    title: "Software Engineer",
    email: "test@example.com",
    phone: "+1-555-0100",
    address: "San Francisco, CA",
    nationality: "",
    pronouns: "",
    summary: "Experienced software engineer with 5 years of experience.",
    social: {
      linkedin: "",
      github: "",
      website: "",
      twitter: "",
      portfolio: "",
      stackoverflow: "",
    },
    experience: [
      {
        id: "exp-1",
        company: "Acme Corp",
        position: "Senior Engineer",
        location: "San Francisco, CA",
        employmentType: "Full-time",
        industry: "Technology",
        startDate: "2020-01",
        endDate: "2024-12",
        current: false,
        duration: "4 years",
        description: "Built scalable systems.",
        achievements: "Led team of 8 engineers.",
        techUsed: "React, Node.js",
        bulletPoints: [
          "Built scalable microservices architecture",
          "Led team of 8 engineers to deliver new platform",
        ],
      },
    ],
    education: [
      {
        id: "edu-1",
        school: "MIT",
        degree: "B.S. Computer Science",
        year: "2019",
        field: "Computer Science",
        gpa: "3.8",
        minor: "",
        honors: "",
        activities: "",
        location: "Cambridge, MA",
      },
    ],
    skills: [
      { id: "skill-1", name: "React", level: "Expert", category: "Technology", years: "5" },
      { id: "skill-2", name: "TypeScript", level: "Advanced", category: "Technology", years: "4" },
      { id: "skill-3", name: "Node.js", level: "Advanced", category: "Technology", years: "4" },
    ],
    projects: [
      {
        id: "proj-1",
        name: "Open Source Tool",
        description: "A tool for developers",
        tech: "React, TypeScript",
        link: "",
        startDate: "",
        endDate: "",
        role: "Creator",
        teamSize: "",
        status: "Completed",
        bulletPoints: [],
      },
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Solutions Architect",
        issuer: "Amazon",
        date: "2023",
        link: "",
        description: "Cloud architecture certification",
        expiryDate: "",
        skills: "AWS, Cloud",
      },
    ],
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

function makeChange(overrides?: Partial<OptimizerChange>): OptimizerChange {
  return {
    id: "change-1",
    section: "summary",
    original: "Experienced software engineer",
    optimized: "Senior software engineer with React and TypeScript expertise",
    reason: "Emphasize relevant skills",
    qualification: "PROVEN",
    supportingEvidence: [
      {
        itemId: "skill-1",
        itemKind: "skill",
        text: "React",
        sourceType: "resume-import",
      },
    ],
    confidence: 0.9,
    ...overrides,
  };
}

/* ── Tests ──────────────────────────────────────────────────────────────── */

describe("applyAcceptedChanges", () => {
  it("returns a deep clone of the original when no changes are applied", () => {
    const original = makeResume();
    const result = applyAcceptedChanges(original, []);

    expect(result).toEqual(original);
    expect(result).not.toBe(original); // different object reference
    expect(result.experience).not.toBe(original.experience); // deep clone
  });

  it("does not mutate the original resume", () => {
    const original = makeResume();
    const originalSummary = original.summary;

    applyAcceptedChanges(original, [
      makeChange({ section: "summary", optimized: "New summary" }),
    ]);

    expect(original.summary).toBe(originalSummary);
  });

  it("applies a summary change", () => {
    const original = makeResume();
    const result = applyAcceptedChanges(original, [
      makeChange({
        section: "summary",
        original: "Experienced software engineer",
        optimized: "Senior software engineer with React expertise",
      }),
    ]);

    expect(result.summary).toBe("Senior software engineer with React expertise");
    // Original unchanged
    expect(original.summary).toBe("Experienced software engineer with 5 years of experience.");
  });

  it("applies an experience bullet change", () => {
    const original = makeResume();
    const result = applyAcceptedChanges(original, [
      makeChange({
        section: "experience",
        original: "Built scalable microservices architecture",
        optimized:
          "Built scalable microservices architecture handling 10k requests/day",
      }),
    ]);

    expect(result.experience[0].bulletPoints![0]).toBe(
      "Built scalable microservices architecture handling 10k requests/day",
    );
    // Other bullets unchanged
    expect(result.experience[0].bulletPoints![1]).toBe(
      "Led team of 8 engineers to deliver new platform",
    );
  });

  it("applies a skills reordering change", () => {
    const original = makeResume();
    const result = applyAcceptedChanges(original, [
      makeChange({
        section: "skills",
        original: "",
        optimized: "TypeScript, Node.js, React",
      }),
    ]);

    // Skills should be reordered to match the optimized list
    expect(result.skills[0].name).toBe("TypeScript");
    expect(result.skills[1].name).toBe("Node.js");
    expect(result.skills[2].name).toBe("React");
  });

  it("applies multiple changes across sections", () => {
    const original = makeResume();
    const result = applyAcceptedChanges(original, [
      makeChange({
        id: "c1",
        section: "summary",
        original: "Experienced software engineer",
        optimized: "Senior software engineer",
      }),
      makeChange({
        id: "c2",
        section: "experience",
        original: "Built scalable microservices architecture",
        optimized: "Designed and built scalable microservices",
      }),
      makeChange({
        id: "c3",
        section: "skills",
        original: "",
        optimized: "React, TypeScript, Node.js",
      }),
    ]);

    expect(result.summary).toBe("Senior software engineer");
    expect(result.experience[0].bulletPoints![0]).toBe(
      "Designed and built scalable microservices",
    );
    expect(result.skills[0].name).toBe("React");
  });

  it("handles resume with no experience entries", () => {
    const original = makeResume({ experience: [] });
    const result = applyAcceptedChanges(original, [
      makeChange({
        section: "experience",
        original: "test",
        optimized: "improved test",
      }),
    ]);

    // Should not crash, experience remains empty
    expect(result.experience).toHaveLength(0);
  });

  it("handles resume with no skills entries", () => {
    const original = makeResume({ skills: [] });
    const result = applyAcceptedChanges(original, [
      makeChange({
        section: "skills",
        original: "",
        optimized: "React, TypeScript",
      }),
    ]);

    // Should not crash, skills remains empty (no skills to reorder)
    expect(result.skills).toHaveLength(0);
  });

  it("preserves template and other metadata", () => {
    const original = makeResume({ templateId: "executive" });
    const result = applyAcceptedChanges(original, [
      makeChange({ section: "summary", optimized: "New summary" }),
    ]);

    expect(result.templateId).toBe("executive");
    expect(result.resumeId).toBe("test-resume");
    expect(result.name).toBe("Test User");
  });
});
