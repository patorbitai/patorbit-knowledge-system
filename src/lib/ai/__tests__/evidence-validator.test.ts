"use strict";

/**
 * M4 Evidence-Based Optimizer — Anti-Fabrication Validator Tests
 *
 * Tests that validateOptimizerChanges correctly:
 *  - accepts evidence-grounded changes
 *  - rejects fabricated skills, employers, metrics, dates
 *  - enforces MISSING qualification rules
 *  - allows COMMUNICATION_GAP wording improvements
 */

import { describe, it, expect } from "vitest";
import { validateOptimizerChanges } from "../evidence-validator";
import type { CareerProfile } from "@/types/career-profile";
import type { OptimizerChange } from "@/types/evidence-optimizer";

/* ── Test fixtures ──────────────────────────────────────────────────────── */

function makeCareerProfile(overrides?: Partial<CareerProfile>): CareerProfile {
  return {
    id: "cp-test",
    version: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    identity: {
      name: "Test User",
      title: "Software Engineer",
      summary: "Experienced software engineer",
      careerStage: "working-professional",
      social: {
        linkedin: "",
        github: "",
        website: "",
        twitter: "",
        portfolio: "",
        stackoverflow: "",
      },
      source: {
        sourceType: "resume-import",
        sourceRef: "resume:personal",
        capturedAt: "2026-01-01T00:00:00Z",
        claimIds: [],
        evidenceIds: [],
      },
      verification: { state: "candidate-stated" },
    },
    experiences: [
      {
        id: "exp-1",
        company: "Acme Corp",
        position: "Senior Engineer",
        current: false,
        achievements: [
          "Led a team of 8 engineers to deliver a new platform",
          "Improved API performance by 40%",
        ],
        summary: "Built scalable systems",
        source: {
          sourceType: "resume-import",
          sourceRef: "resume:experience:exp_1",
          capturedAt: "2026-01-01T00:00:00Z",
          claimIds: [],
          evidenceIds: [],
        },
        verification: { state: "candidate-stated" },
        derived: false,
      },
    ],
    educations: [
      {
        id: "edu-1",
        school: "MIT",
        degree: "B.S. Computer Science",
        source: {
          sourceType: "resume-import",
          sourceRef: "resume:education:edu_1",
          capturedAt: "2026-01-01T00:00:00Z",
          claimIds: [],
          evidenceIds: [],
        },
        verification: { state: "candidate-stated" },
        derived: false,
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: "Open Source Tool",
        description: "A tool for developers",
        source: {
          sourceType: "resume-import",
          sourceRef: "resume:project:proj_1",
          capturedAt: "2026-01-01T00:00:00Z",
          claimIds: [],
          evidenceIds: [],
        },
        verification: { state: "candidate-stated" },
        derived: false,
      },
    ],
    skills: [
      {
        id: "skill-1",
        name: "React",
        category: "Technology",
        source: {
          sourceType: "resume-import",
          sourceRef: "resume:skills",
          capturedAt: "2026-01-01T00:00:00Z",
          claimIds: [],
          evidenceIds: [],
        },
        verification: { state: "candidate-stated" },
        derived: false,
      },
      {
        id: "skill-2",
        name: "TypeScript",
        category: "Technology",
        source: {
          sourceType: "resume-import",
          sourceRef: "resume:skills",
          capturedAt: "2026-01-01T00:00:00Z",
          claimIds: [],
          evidenceIds: [],
        },
        verification: { state: "candidate-stated" },
        derived: false,
      },
      {
        id: "skill-3",
        name: "Node.js",
        category: "Technology",
        source: {
          sourceType: "resume-import",
          sourceRef: "resume:skills",
          capturedAt: "2026-01-01T00:00:00Z",
          claimIds: [],
          evidenceIds: [],
        },
        verification: { state: "candidate-stated" },
        derived: false,
      },
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Solutions Architect",
        issuer: "Amazon",
        source: {
          sourceType: "resume-import",
          sourceRef: "resume:certifications:cert_1",
          capturedAt: "2026-01-01T00:00:00Z",
          claimIds: [],
          evidenceIds: [],
        },
        verification: { state: "candidate-stated" },
        derived: false,
      },
    ],
    languages: [],
    industries: [],
    leadership: [],
    outcomes: [],
    ...overrides,
  };
}

function makeChange(overrides?: Partial<OptimizerChange>): OptimizerChange {
  return {
    id: "change-1",
    section: "summary",
    original: "Experienced software engineer",
    optimized: "Senior software engineer with expertise in React and Node.js",
    reason: "Emphasize relevant skills for the target role",
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

describe("validateOptimizerChanges", () => {
  it("accepts a valid evidence-grounded change", () => {
    const profile = makeCareerProfile();
    const changes = [
      makeChange({
        optimized: "Built scalable systems using React and Node.js",
        qualification: "PROVEN",
      }),
    ];

    const result = validateOptimizerChanges(changes, profile);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.passedChanges).toBe(1);
  });

  it("rejects an invented skill not in the career profile", () => {
    const profile = makeCareerProfile();
    const changes = [
      makeChange({
        optimized: "Expert in Kubernetes and Docker orchestration",
        qualification: "PROVEN",
      }),
    ];

    const result = validateOptimizerChanges(changes, profile);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some((v) => v.type === "unsupported-skill")).toBe(
      true,
    );
  });

  it("rejects an invented employer not in the career profile", () => {
    const profile = makeCareerProfile();
    const changes = [
      makeChange({
        optimized: "Senior Engineer at Google, building scalable systems",
        qualification: "PROVEN",
      }),
    ];

    const result = validateOptimizerChanges(changes, profile);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.type === "unsupported-employer"),
    ).toBe(true);
  });

  it("rejects invented metrics not in the career profile", () => {
    const profile = makeCareerProfile();
    const changes = [
      makeChange({
        optimized: "Increased revenue by 75% and reduced costs by $2M",
        qualification: "PROVEN",
      }),
    ];

    const result = validateOptimizerChanges(changes, profile);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.type === "unsupported-metric"),
    ).toBe(true);
  });

  it("rejects invented dates not in the career profile", () => {
    const profile = makeCareerProfile();
    const changes = [
      makeChange({
        optimized: "Joined the team in 2019 and led projects through 2023",
        qualification: "PROVEN",
      }),
    ];

    const result = validateOptimizerChanges(changes, profile);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.type === "unsupported-date"),
    ).toBe(true);
  });

  it("rejects a MISSING qualification that appears as a change", () => {
    const profile = makeCareerProfile();
    const changes = [
      makeChange({
        optimized: "Experience with Kubernetes deployment",
        qualification: "MISSING",
      }),
    ];

    const result = validateOptimizerChanges(changes, profile);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("allows a COMMUNICATION_GAP wording improvement", () => {
    const profile = makeCareerProfile();
    const changes = [
      makeChange({
        original: "Led a team of 8 engineers to deliver a new platform",
        optimized:
          "Led cross-functional team of 8 engineers to deliver a scalable platform",
        qualification: "COMMUNICATION_GAP",
        supportingEvidence: [
          {
            itemId: "exp-1",
            itemKind: "experience",
            text: "Led a team of 8 engineers to deliver a new platform",
            sourceType: "resume-import",
          },
        ],
      }),
    ];

    const result = validateOptimizerChanges(changes, profile);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("rejects a change with no supporting evidence", () => {
    const profile = makeCareerProfile();
    const changes = [
      makeChange({
        optimized: "Expert in cloud architecture",
        qualification: "PROVEN",
        supportingEvidence: [],
      }),
    ];

    const result = validateOptimizerChanges(changes, profile);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("accepts changes that reference existing profile items", () => {
    const profile = makeCareerProfile();
    const changes = [
      makeChange({
        optimized: "Led a team of 8 engineers at Acme Corp",
        qualification: "PROVEN",
        supportingEvidence: [
          {
            itemId: "exp-1",
            itemKind: "experience",
            text: "Led a team of 8 engineers to deliver a new platform",
            sourceType: "resume-import",
          },
        ],
      }),
    ];

    const result = validateOptimizerChanges(changes, profile);
    expect(result.valid).toBe(true);
  });

  it("handles empty changes array", () => {
    const profile = makeCareerProfile();
    const result = validateOptimizerChanges([], profile);
    expect(result.valid).toBe(true);
    expect(result.totalChanges).toBe(0);
    expect(result.passedChanges).toBe(0);
  });
});
