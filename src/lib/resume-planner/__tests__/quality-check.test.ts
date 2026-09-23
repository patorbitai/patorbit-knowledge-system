"use strict";

/**
 * Quality + ATS check tests (§19, §20). Verifies actionable plain-language
 * issues, positives, and that no overall score is ever produced.
 */

import { describe, expect, it } from "vitest";
import {
  buildContentPlan,
  runAtsCheck,
  runQualityCheck,
} from "@/lib/resume-planner";
import type { QualityIssue } from "@/lib/resume-planner";
import { EARLY_CAREER, SENIOR, TECHNICAL } from "./fixtures";

function severities(issues: QualityIssue[]) {
  return issues.map((i) => i.severity);
}

describe("runQualityCheck (§20)", () => {
  it("flags missing contact", () => {
    const resume = { ...EARLY_CAREER, email: "", phone: "" };
    const plan = buildContentPlan(resume, { jobAware: false });
    const issues = runQualityCheck({ resume, plan });
    expect(issues.some((i) => i.id === "missing-contact" && i.severity === "warn")).toBe(true);
  });

  it("flags an empty summary, stronger when job-aware", () => {
    const resume = { ...EARLY_CAREER, summary: "" };
    const plan = buildContentPlan(resume, { jobAware: false });
    const issues = runQualityCheck({ resume, plan });
    expect(issues.some((i) => i.id === "missing-summary")).toBe(true);
  });

  it("reports the §20 skills-vs-experience imbalance example", () => {
    const resume = { ...EARLY_CAREER, skills: TECHNICAL.skills }; // 32 skills on a tiny profile
    const plan = buildContentPlan(resume, { jobAware: false });
    const issues = runQualityCheck({ resume, plan });
    expect(
      issues.some((i) =>
        i.message.includes("skills section is taking more space"),
      ),
    ).toBe(true);
  });

  it("gives the positive experience-balance message when balanced", () => {
    const balanced = {
      ...EARLY_CAREER,
      experience: [
        { ...EARLY_CAREER.experience[0], id: "b1" },
        { ...EARLY_CAREER.experience[0], id: "b2", bulletPoints: ["x1", "x2", "x3", "x4"] },
        { ...EARLY_CAREER.experience[0], id: "b3", bulletPoints: ["y1", "y2", "y3"] },
      ],
    };
    const plan = buildContentPlan(balanced, { jobAware: false });
    const issues = runQualityCheck({ resume: balanced, plan });
    expect(
      issues.some(
        (i) =>
          i.severity === "positive" &&
          i.message.includes("experience section is well balanced"),
      ),
    ).toBe(true);
  });

  it("flags sparse last page and honors measured page counts", () => {
    const plan = buildContentPlan(SENIOR, { jobAware: false });
    const issues = runQualityCheck({
      resume: SENIOR,
      plan,
      pageCount: 3,
      lastPageFill: 0.12,
    });
    expect(issues.some((i) => i.id === "sparse-last-page")).toBe(true);
    expect(issues.some((i) => i.id === "over-page-target")).toBe(true);
  });

  it("positive when everything fits one page", () => {
    const plan = buildContentPlan(EARLY_CAREER, { jobAware: false });
    const issues = runQualityCheck({
      resume: EARLY_CAREER,
      plan,
      pageCount: 1,
    });
    expect(issues.some((i) => i.id === "fits-one-page")).toBe(true);
  });

  it("warns when body font drops below the readable floor (§10)", () => {
    const plan = buildContentPlan(SENIOR, { jobAware: false });
    const issues = runQualityCheck({
      resume: SENIOR,
      plan,
      bodyFontSize: 8,
    });
    expect(issues.some((i) => i.id === "font-too-small" && i.severity === "warn")).toBe(true);
  });

  it("detects duplicate skills (§13)", () => {
    const resume = {
      ...EARLY_CAREER,
      skills: [...EARLY_CAREER.skills, { ...EARLY_CAREER.skills[0], id: "dup" }],
    };
    const plan = buildContentPlan(resume, { jobAware: false });
    const issues = runQualityCheck({ resume, plan });
    expect(issues.some((i) => i.id === "duplicate-skills")).toBe(true);
  });

  it("never invents an overall score — only standalone issues", () => {
    const plan = buildContentPlan(EARLY_CAREER, { jobAware: false });
    const issues = runQualityCheck({ resume: EARLY_CAREER, plan, pageCount: 1 });
    for (const issue of issues) {
      expect(issue.id).toBeTruthy();
      expect(issue.message.length).toBeGreaterThan(10);
      expect(Object.keys(issue)).not.toContain("score");
    }
    expect(severities(issues).every((s) => ["positive", "info", "warn"].includes(s))).toBe(true);
  });
});

describe("runAtsCheck (§19)", () => {
  it("positives the classic ATS family", () => {
    const issues = runAtsCheck({ templateId: "minimal-ats", familyId: "classic-ats", layout: "standard" });
    expect(issues.some((i) => i.severity === "positive")).toBe(true);
  });

  it("warns on column layouts", () => {
    const issues = runAtsCheck({ templateId: "patorbit-modern", familyId: "technical", layout: "two-column" });
    expect(issues.some((i) => i.id === "ats-columns")).toBe(true);
  });

  it("stays quiet for plain single-column non-ATS-family templates", () => {
    const issues = runAtsCheck({ templateId: "modern-clean", familyId: "modern-professional", layout: "standard" });
    expect(issues).toEqual([]);
  });
});
