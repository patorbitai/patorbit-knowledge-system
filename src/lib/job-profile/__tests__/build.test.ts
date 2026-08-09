"use strict";

import { describe, it, expect } from "vitest";
import { buildJobProfile } from "../build";

const CAPTURED_AT = "2026-01-01T00:00:00.000Z";

const JD = `
Senior Software Engineer (FinTech)

About us:
We are a fast growing fintech company building payments infrastructure.
We value cross-functional collaboration and shipping on tight deadlines.

Requirements:
- You must have 5+ years of software engineering experience
- Strong proficiency with TypeScript and Node.js required
- Experience with AWS and Docker

Responsibilities:
- Design and build scalable payment services
- Mentor junior engineers on the team
- Collaborate with product and stakeholders

Qualifications:
- Bachelor's degree in Computer Science or equivalent
- Experience with PostgreSQL

Skills:
- React, Kafka, Kubernetes
`;

describe("buildJobProfile", () => {
  it("builds a structured Job Profile from a realistic JD", () => {
    const profile = buildJobProfile(JD, { capturedAt: CAPTURED_AT });

    expect(profile.id).toMatch(/^job-profile-/);
    expect(profile.version).toBe(1);
    expect(profile.createdAt).toBe(CAPTURED_AT);
    expect(profile.updatedAt).toBe(CAPTURED_AT);
    expect(profile.sourceLength).toBe(JD.length);
  });

  it("extracts the title", () => {
    const profile = buildJobProfile(JD, { capturedAt: CAPTURED_AT });
    expect(profile.title).toBe("Senior Software Engineer (FinTech)");
  });

  it("classifies requirements with provenance", () => {
    const profile = buildJobProfile(JD, { capturedAt: CAPTURED_AT });
    expect(profile.requirements.length).toBeGreaterThan(0);
    for (const req of profile.requirements) {
      expect(JD).toContain(req.source.sourceText);
      expect(req.source.sourceRef).toMatch(/^jd:line:\d+$/);
      expect(req.source.method).toContain("requirement");
    }
  });

  it("classifies responsibilities with provenance", () => {
    const profile = buildJobProfile(JD, { capturedAt: CAPTURED_AT });
    expect(profile.responsibilities.length).toBeGreaterThan(0);
    for (const r of profile.responsibilities) {
      expect(JD).toContain(r.source.sourceText);
    }
  });

  it("classifies qualifications with provenance", () => {
    const profile = buildJobProfile(JD, { capturedAt: CAPTURED_AT });
    const texts = profile.qualifications.map((q) => q.text);
    expect(texts.some((t) => /degree/i.test(t))).toBe(true);
    for (const q of profile.qualifications) {
      expect(JD).toContain(q.source.sourceText);
    }
  });

  it("extracts skills from the explicit skills section", () => {
    const profile = buildJobProfile(JD, { capturedAt: CAPTURED_AT });
    const names = profile.skills.map((s) => s.name);
    expect(names).toContain("TypeScript");
    expect(names).toContain("React");
    expect(names).toContain("Kafka");
    expect(names).toContain("Kubernetes");
  });

  it("detects seniority level and years", () => {
    const profile = buildJobProfile(JD, { capturedAt: CAPTURED_AT });
    expect(profile.seniority.length).toBeGreaterThan(0);
    expect(profile.seniority.some((s) => s.level === "Senior")).toBe(true);
    expect(profile.seniority.some((s) => s.years === "5+")).toBe(true);
  });

  it("detects domain terms", () => {
    const profile = buildJobProfile(JD, { capturedAt: CAPTURED_AT });
    expect(profile.domain.map((d) => d.name)).toContain("FinTech");
  });

  it("derives implicit competencies with derivation provenance", () => {
    const profile = buildJobProfile(JD, { capturedAt: CAPTURED_AT });
    const names = profile.implicitCompetencies.map((c) => c.name);
    expect(names).toContain("Collaboration");
    expect(names).toContain("Time Management");
    expect(names).toContain("Leadership");
    for (const c of profile.implicitCompetencies) {
      expect(c.derived).toBe(true);
      expect(c.derivation.kind).toBe("implicit-competency");
      expect(c.derivation.sourceText).toBe(c.context);
      expect(JD).toContain(c.context);
    }
  });

  it("does not fabricate anything for empty input", () => {
    const profile = buildJobProfile("", { capturedAt: CAPTURED_AT });
    expect(profile.requirements).toEqual([]);
    expect(profile.responsibilities).toEqual([]);
    expect(profile.skills).toEqual([]);
    expect(profile.seniority).toEqual([]);
    expect(profile.domain).toEqual([]);
    expect(profile.qualifications).toEqual([]);
    expect(profile.implicitCompetencies).toEqual([]);
    expect(profile.title).toBeUndefined();
  });

  it("is deterministic: same input produces a deep-equal profile", () => {
    const a = buildJobProfile(JD, { capturedAt: CAPTURED_AT });
    const b = buildJobProfile(JD, { capturedAt: CAPTURED_AT });
    expect(a).toEqual(b);
  });

  it("supports explicit id and version options", () => {
    const profile = buildJobProfile(JD, {
      capturedAt: CAPTURED_AT,
      id: "my-job",
      version: 3,
    });
    expect(profile.id).toBe("my-job");
    expect(profile.version).toBe(3);
  });
});
