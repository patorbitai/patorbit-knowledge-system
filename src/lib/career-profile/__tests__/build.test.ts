"use strict";

import { describe, it, expect } from "vitest";
import type { Resume, Claim, Evidence } from "@/types/resume";
import { buildCareerProfile } from "../build";
import { createEmptyResume } from "@/services/__tests__/fixtures";

const CAPTURED_AT = "2026-01-01T00:00:00.000Z";

function createResume(overrides: Partial<Resume> = {}): Resume {
  const base = createEmptyResume();
  base.name = "Ada Lovelace";
  base.title = "Principal Engineer";
  base.email = "ada@example.com";
  base.summary = "Engineer with deep platform experience.";
  base.careerStage = "manager";
  base.social.linkedin = "https://linkedin.com/in/ada";
  base.social.github = "https://github.com/ada";
  base.experience = [
    {
      id: "exp-1",
      company: "Analytical Engines",
      position: "Lead Engineer",
      location: "London",
      employmentType: "Full-time",
      industry: "Technology",
      startDate: "2020-01-01",
      endDate: "",
      current: true,
      duration: "",
      description: "Led the platform team of 10 engineers.",
      achievements: "Reduced build time by 40%.\nDrove architectural improvements.",
      techUsed: "TypeScript, React",
      bulletPoints: ["Generated $1.2M in revenue.", "Mentored junior engineers."],
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
      honors: "First Class",
      activities: "",
      location: "London",
    },
  ];
  base.skills = [
    { id: "skill-1", name: "TypeScript", level: "Advanced", category: "Languages", years: "5" },
  ];
  base.projects = [
    {
      id: "proj-1",
      name: "Analytical Engine",
      description: "A mechanical general-purpose computer.",
      tech: "TypeScript",
      link: "",
      startDate: "2019-01-01",
      endDate: "2020-01-01",
      role: "Architect",
      teamSize: "",
      status: "Completed",
      bulletPoints: ["Cut simulation time by 30%."],
    },
  ];
  base.certifications = [
    { id: "cert-1", name: "AWS Certified", issuer: "Amazon", date: "2021", link: "", description: "", expiryDate: "", skills: "" },
  ];
  base.languages = [{ id: "lang-1", name: "English", proficiency: "Native" }];
  base.claims = [];
  return { ...base, ...overrides };
}

function createClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: "claim-1",
    assertionText: "Ada was the lead engineer at Analytical Engines.",
    claimType: "Employment",
    sourceActivityId: "experience-0",
    confidence: 0.9,
    reasoning: "Stated in resume experience.",
    verificationStatus: "accepted",
    reviewed: true,
    accepted: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: "ev-1",
    claimId: "claim-1",
    evidenceType: "file",
    evidenceKind: "Offer Letter",
    content: "offer.pdf",
    format: "PDF",
    metadata: {},
    uploadedBy: "self",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "evidence-added",
    confidence: 0.8,
    notes: "",
    visibility: "private",
    consent: true,
    ...overrides,
  };
}

describe("buildCareerProfile", () => {
  it("is deterministic for identical inputs", () => {
    const resume = createResume();
    const a = buildCareerProfile(resume, { capturedAt: CAPTURED_AT });
    const b = buildCareerProfile(resume, { capturedAt: CAPTURED_AT });
    expect(a).toEqual(b);
  });

  it("produces a deterministic id from identity", () => {
    const resume = createResume();
    const p1 = buildCareerProfile(resume, { capturedAt: CAPTURED_AT });
    const p2 = buildCareerProfile(createResume(), { capturedAt: CAPTURED_AT });
    expect(p1.id).toBe(p2.id);
    expect(p1.id).toMatch(/^career-profile-[0-9a-z]+$/);
  });

  it("faithfully maps identity fields", () => {
    const p = buildCareerProfile(createResume(), { capturedAt: CAPTURED_AT });
    expect(p.identity.name).toBe("Ada Lovelace");
    expect(p.identity.title).toBe("Principal Engineer");
    expect(p.identity.careerStage).toBe("manager");
    expect(p.identity.social.linkedin).toBe("https://linkedin.com/in/ada");
    expect(p.identity.verification.state).toBe("candidate-stated");
  });

  it("maps experiences with faithful fields and provenance", () => {
    const p = buildCareerProfile(createResume(), { capturedAt: CAPTURED_AT });
    const exp = p.experiences[0];
    expect(exp.company).toBe("Analytical Engines");
    expect(exp.position).toBe("Lead Engineer");
    expect(exp.current).toBe(true);
    expect(exp.derived).toBe(false);
    expect(exp.source.sourceRef).toBe("resume:experience:exp-1");
    expect(exp.source.capturedAt).toBe(CAPTURED_AT);
    expect(exp.verification.state).toBe("candidate-stated");
  });

  it("maps education, skills, certifications, languages and projects", () => {
    const p = buildCareerProfile(createResume(), { capturedAt: CAPTURED_AT });
    expect(p.educations).toHaveLength(1);
    expect(p.educations[0].school).toBe("University of London");
    expect(p.skills).toHaveLength(1);
    expect(p.skills[0].name).toBe("TypeScript");
    expect(p.skills[0].category).toBe("Languages");
    expect(p.skills[0].proficiency).toBe("Advanced");
    expect(p.certifications).toHaveLength(1);
    expect(p.certifications[0].issuer).toBe("Amazon");
    expect(p.languages).toHaveLength(1);
    expect(p.projects).toHaveLength(1);
    expect(p.projects[0].role).toBe("Architect");
  });

  it("marks derived items (industries, leadership, outcomes) with exact source text", () => {
    const p = buildCareerProfile(createResume(), { capturedAt: CAPTURED_AT });

    expect(p.industries).toHaveLength(1);
    expect(p.industries[0].name).toBe("Technology");
    expect(p.industries[0].derived).toBe(true);
    expect(p.industries[0].derivation?.kind).toBe("industry");
    expect(p.industries[0].contexts).toContain("resume:experience:exp-1");

    expect(p.leadership.length).toBeGreaterThan(0);
    const lead = p.leadership[0];
    expect(lead.derived).toBe(true);
    expect(lead.derivation?.kind).toBe("leadership");
    expect(lead.derivation?.sourceText).toBeTruthy();
    expect(p.leadership.some((l) => l.role === "the platform team of 10 engineers")).toBe(true);

    expect(p.outcomes.length).toBeGreaterThan(0);
    const outcome = p.outcomes[0];
    expect(outcome.derived).toBe(true);
    expect(outcome.derivation?.kind).toBe("outcome");
    expect(p.outcomes.some((o) => o.metric === "40" && o.unit === "%")).toBe(true);
    expect(p.outcomes.some((o) => o.metric === "1.2" && o.unit === "$M")).toBe(true);
    expect(p.outcomes.some((o) => o.metric === "30" && o.unit === "%")).toBe(true);
  });

  it("never invents data: derived arrays reflect only source content", () => {
    const p = buildCareerProfile(createResume(), { capturedAt: CAPTURED_AT });
    const outcomeTexts = p.outcomes.map((o) => o.description);
    for (const o of outcomeTexts) {
      expect(o).toMatch(/reduced build time by 40%|generated \$1\.2m in revenue|cut simulation time by 30%/i);
    }
  });

  it("links claims and evidence to the correct items by sourceActivityId", () => {
    const claim = createClaim();
    const evidence = createEvidence();
    const resume = createResume({ claims: [claim] });
    const p = buildCareerProfile(resume, { capturedAt: CAPTURED_AT, claims: [claim], evidence: [evidence] });

    const exp = p.experiences[0];
    expect(exp.source.claimIds).toContain("claim-1");
    expect(exp.source.evidenceIds).toContain("ev-1");
  });

  it("does not attach unrelated claims to items", () => {
    const claim = createClaim({ sourceActivityId: "project-0" });
    const p = buildCareerProfile(createResume(), {
      capturedAt: CAPTURED_AT,
      claims: [claim],
      evidence: [createEvidence()],
    });
    expect(p.experiences[0].source.claimIds).toEqual([]);
  });

  it("handles a fully empty resume without errors and produces an empty profile", () => {
    const p = buildCareerProfile(createEmptyResume(), { capturedAt: CAPTURED_AT });
    expect(p.experiences).toEqual([]);
    expect(p.educations).toEqual([]);
    expect(p.skills).toEqual([]);
    expect(p.projects).toEqual([]);
    expect(p.certifications).toEqual([]);
    expect(p.languages).toEqual([]);
    expect(p.industries).toEqual([]);
    expect(p.leadership).toEqual([]);
    expect(p.outcomes).toEqual([]);
  });

  it("normalizes both store-style and numeric source ids into stable prefixed ids", () => {
    const storeResume = createResume();
    storeResume.experience[0].id = "id_1720000000000_abcde";
    const p1 = buildCareerProfile(storeResume, { capturedAt: CAPTURED_AT });

    const numericResume = createResume();
    numericResume.experience[0].id = "1";
    const p2 = buildCareerProfile(numericResume, { capturedAt: CAPTURED_AT });

    expect(p1.experiences[0].id).toMatch(/^cp_exp_id_1720000000000_abcde$/);
    expect(p2.experiences[0].id).toMatch(/^cp_exp_1$/);
    expect(p1.experiences[0].id).not.toBe(p2.experiences[0].id);
  });

  it("does not mutate the input resume", () => {
    const resume = createResume();
    const snapshot = JSON.stringify(resume);
    buildCareerProfile(resume, { capturedAt: CAPTURED_AT });
    expect(JSON.stringify(resume)).toBe(snapshot);
  });

  it("uses a user-provided capturedAt and id when supplied", () => {
    const p = buildCareerProfile(createResume(), {
      capturedAt: CAPTURED_AT,
      id: "custom-id",
      version: 3,
    });
    expect(p.id).toBe("custom-id");
    expect(p.version).toBe(3);
    expect(p.createdAt).toBe(CAPTURED_AT);
    expect(p.updatedAt).toBe(CAPTURED_AT);
  });
});
