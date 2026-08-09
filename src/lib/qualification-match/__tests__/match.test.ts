"use strict";

import { describe, it, expect } from "vitest";
import type { Resume } from "@/types/resume";
import { createEmptyResume } from "@/services/__tests__/fixtures";
import { buildCareerProfile } from "@/lib/career-profile/build";
import { buildJobProfile } from "@/lib/job-profile/build";
import { buildQualificationMatch } from "../match";

const CAPTURED_AT = "2026-01-01T00:00:00.000Z";

/** A candidate with a rich, realistic frontend/backend skill set. */
function createResume(overrides: Partial<Resume> = {}): Resume {
  const base = createEmptyResume();
  base.name = "Ada Lovelace";
  base.title = "Full Stack Engineer";
  base.email = "ada@example.com";
  base.social.linkedin = "https://linkedin.com/in/ada";
  base.social.github = "https://github.com/ada";
  base.experience = [
    {
      id: "exp-1",
      company: "Analytical Engines",
      position: "Lead Full Stack Engineer",
      location: "London",
      employmentType: "Full-time",
      industry: "Technology",
      startDate: "2021-01-01",
      endDate: "",
      current: true,
      duration: "",
      description: "Built web platforms with React and Node.js.",
      achievements: "Cut onboarding time by 40%. Introduced CI tooling.",
      techUsed: "React, TypeScript, Node.js",
      bulletPoints: ["Shipped the payments API with Stripe."],
    },
  ];
  base.education = [
    {
      id: "edu-1",
      school: "University of London",
      degree: "Bachelor of Science",
      year: "2015",
      field: "Computer Science",
      gpa: "",
      minor: "",
      honors: "",
      activities: "",
      location: "London",
    },
  ];
  base.skills = [
    { id: "skill-1", name: "TypeScript", level: "Advanced", category: "Languages", years: "5" },
    { id: "skill-2", name: "React", level: "Advanced", category: "Frameworks", years: "4" },
    { id: "skill-3", name: "Node.js", level: "Advanced", category: "Runtimes", years: "4" },
  ];
  base.projects = [
    {
      id: "proj-1",
      name: "Engine Kit",
      description: "A toolkit built with React and TypeScript.",
      tech: "React, TypeScript",
      link: "",
      startDate: "",
      endDate: "",
      role: "",
      teamSize: "",
      status: "Completed",
      bulletPoints: [],
    },
  ];
  base.certifications = [
    {
      id: "cert-1",
      name: "AWS Solutions Architect",
      issuer: "Amazon Web Services",
      date: "",
      link: "",
      description: "",
      expiryDate: "",
      skills: "",
    },
  ];
  base.languages = [{ id: "lang-1", name: "English", proficiency: "Native" }];
  return { ...base, ...overrides };
}

const JD = `
Senior Full Stack Engineer

Requirements:
- Strong proficiency with TypeScript and React
- Experience with Node.js
- Experience with Kubernetes

Qualifications:
- Bachelor's degree in Computer Science or equivalent
- Experience with Java

Skills:
- TypeScript, React, GraphQL
`;

describe("buildQualificationMatch", () => {
  it("builds a deterministic match between a career and a job profile", () => {
    const career = buildCareerProfile(createResume(), { capturedAt: CAPTURED_AT });
    const job = buildJobProfile(JD, { capturedAt: CAPTURED_AT });

    const match = buildQualificationMatch(career, job, { capturedAt: CAPTURED_AT });

    expect(match.id).toMatch(/^qm-/);
    expect(match.version).toBe(1);
    expect(match.createdAt).toBe(CAPTURED_AT);
    expect(match.updatedAt).toBe(CAPTURED_AT);
    expect(match.careerProfileId).toBe(career.id);
    expect(match.jobProfileId).toBe(job.id);
    expect(match.summary.total).toBe(match.items.length);
  });

  it("classifies discrete-skill matches as PROVEN", () => {
    const career = buildCareerProfile(createResume(), { capturedAt: CAPTURED_AT });
    const job = buildJobProfile(JD, { capturedAt: CAPTURED_AT });

    const match = buildQualificationMatch(career, job, { capturedAt: CAPTURED_AT });
    const provenNames = match.items
      .filter((i) => i.classification === "PROVEN")
      .map((i) => i.requirement);

    expect(provenNames).toContain("TypeScript");
    expect(provenNames).toContain("React");
  });

  it("classifies related-but-not-exact skills as RELATED", () => {
    const resume = createResume({ skills: [
      { id: "skill-x", name: "React Native", level: "Advanced", category: "Frameworks", years: "3" },
    ] });
    resume.projects = [];

    const career = buildCareerProfile(resume, { capturedAt: CAPTURED_AT });
    const job = buildJobProfile(`
Requirements:
- Experience with React
`, { capturedAt: CAPTURED_AT });

    const match = buildQualificationMatch(career, job, { capturedAt: CAPTURED_AT });
    const item = match.items.find((i) => i.sourceGroup === "requirement");
    expect(item?.classification).toBe("RELATED");
    expect(item?.evidence[0]?.itemKind).toBe("skill");
    expect(item?.evidence[0]?.text).toBe("React Native");
  });

  it("classifies wording present only in free text as COMMUNICATION_GAP", () => {
    const resume = createResume({
      skills: [{ id: "skill-1", name: "TypeScript", level: "Advanced", category: "Languages", years: "5" }],
      experience: [
        {
          id: "exp-1",
          company: "Analytical Engines",
          position: "Platform Engineer",
          location: "London",
          employmentType: "Full-time",
          industry: "Technology",
          startDate: "2020-01-01",
          endDate: "2022-01-01",
          current: false,
          duration: "2 years",
          description: "Daily work with Docker and Kubernetes.",
          achievements: "",
          techUsed: "Docker",
          bulletPoints: [],
        },
      ],
    });

    const career = buildCareerProfile(resume, { capturedAt: CAPTURED_AT });
    const job = buildJobProfile(`
Requirements:
- Experience with Docker
`, { capturedAt: CAPTURED_AT });

    const match = buildQualificationMatch(career, job, { capturedAt: CAPTURED_AT });
    const item = match.items.find((i) => i.sourceGroup === "requirement");
    expect(item?.classification).toBe("COMMUNICATION_GAP");
    expect(item?.evidence[0]?.itemKind).toBe("experience");
  });

  it("classifies unmatched JD items as MISSING with empty evidence", () => {
    const resume = createResume();
    const career = buildCareerProfile(resume, { capturedAt: CAPTURED_AT });
    const job = buildJobProfile(`
Requirements:
- You must have ten years of COBOL expertise
`, { capturedAt: CAPTURED_AT });

    const match = buildQualificationMatch(career, job, { capturedAt: CAPTURED_AT });
    const item = match.items.find((i) => i.sourceGroup === "requirement");
    expect(item?.classification).toBe("MISSING");
    expect(item?.evidence).toEqual([]);
  });

  it("verifies the summary counts lines up with classifications", () => {
    const career = buildCareerProfile(createResume(), { capturedAt: CAPTURED_AT });
    const job = buildJobProfile(JD, { capturedAt: CAPTURED_AT });

    const match = buildQualificationMatch(career, job, { capturedAt: CAPTURED_AT });

    const byClass = (c: string) => match.items.filter((i) => i.classification === c).length;
    expect(match.summary.proven).toBe(byClass("PROVEN"));
    expect(match.summary.related).toBe(byClass("RELATED"));
    expect(match.summary.communicationGap).toBe(byClass("COMMUNICATION_GAP"));
    expect(match.summary.missing).toBe(byClass("MISSING"));
  });

  it("is deterministic: identical inputs produce deep-equal outputs", () => {
    const career = buildCareerProfile(createResume(), { capturedAt: CAPTURED_AT });
    const job = buildJobProfile(JD, { capturedAt: CAPTURED_AT });

    const a = buildQualificationMatch(career, job, { capturedAt: CAPTURED_AT });
    const b = buildQualificationMatch(career, job, { capturedAt: CAPTURED_AT });

    expect(a).toEqual(b);
  });
});