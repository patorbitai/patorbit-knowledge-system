"use strict";

/**
 * M4 Phase 3 — resolver unit tests.
 *
 * The resolver is the heart of click-to-edit: it maps clicked TEXT back to a
 * resume field. It must be exact for field values, tolerant of compound
 * contact rows, and blind to structural (whole-section) clicks.
 */

import { describe, it, expect } from "vitest";
import {
  normalizeForMatch,
  resolveInlineTarget,
} from "../resolveInlineTarget";
import type { Resume } from "@/types/resume";

const RESUME: Resume = {
  resumeId: "r1",
  resumeName: "Version A",
  name: "Jordan Rivera",
  title: "Senior Platform Engineer",
  email: "jordan.rivera@example.com",
  phone: "+1 (415) 555-0184",
  address: "San Francisco, CA",
  nationality: "",
  pronouns: "",
  summary:
    "Platform engineer with a decade of experience building reliable systems.",
  social: {
    linkedin: "linkedin.com/in/jordanrivera",
    github: "github.com/jordanrivera",
    website: "jordanrivera.dev",
    twitter: "",
    portfolio: "jordanrivera.dev/work",
    stackoverflow: "",
  },
  experience: [
    {
      id: "exp1",
      company: "Northwind Labs",
      position: "Staff Platform Engineer",
      location: "San Francisco, CA",
      employmentType: "Full-time",
      industry: "",
      startDate: "2021-06",
      endDate: "",
      current: true,
      duration: "2021 – Present",
      description: "Led the platform team.\nOwned the deployment pipeline.",
      achievements: "",
      techUsed: "",
      bulletPoints: [
        "Built payment platform processing millions of transactions",
        "Reduced processing time by 40%",
      ],
    },
  ],
  education: [
    {
      id: "edu1",
      school: "State University",
      degree: "B.S.",
      year: "2015 – 2019",
      field: "Computer Science",
      gpa: "3.8",
      minor: "",
      honors: "magna cum laude",
      activities: "",
      location: "",
    },
  ],
  skills: [
    { id: "sk1", name: "Kubernetes", level: "Expert", category: "", years: "" },
    { id: "sk2", name: "TypeScript", level: "Intermediate", category: "", years: "" },
  ],
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

describe("normalizeForMatch", () => {
  it("lowercases, collapses whitespace and strips bullet glyphs/punctuation", () => {
    expect(normalizeForMatch("  Built   things. ")).toBe("built things");
    expect(normalizeForMatch("• Built things")).toBe("built things");
    expect(normalizeForMatch("- Reduced time by 40%")).toBe("reduced time by 40%");
  });
});

describe("resolveInlineTarget", () => {
  it("resolves header identity and contact values", () => {
    expect(resolveInlineTarget(RESUME, "Jordan Rivera")).toEqual({
      kind: "header",
      field: "name",
    });
    expect(resolveInlineTarget(RESUME, "Senior Platform Engineer")).toEqual({
      kind: "header",
      field: "title",
    });
    expect(resolveInlineTarget(RESUME, "jordan.rivera@example.com")).toEqual({
      kind: "header",
      field: "email",
    });
    expect(resolveInlineTarget(RESUME, "San Francisco, CA")).toEqual({
      kind: "header",
      field: "address",
    });
  });

  it("resolves social links by value and by clean label", () => {
    expect(resolveInlineTarget(RESUME, "linkedin.com/in/jordanrivera")).toEqual({
      kind: "social",
      key: "linkedin",
    });
    // Anchors render the clean label (protocol stripped) as their text.
    expect(resolveInlineTarget(RESUME, "jordanrivera.dev/work")).toEqual({
      kind: "social",
      key: "portfolio",
    });
    expect(resolveInlineTarget(RESUME, "LinkedIn")).toEqual({
      kind: "social",
      key: "linkedin",
    });
  });

  it("resolves the summary (exact line or a contained fragment)", () => {
    expect(resolveInlineTarget(RESUME, RESUME.summary)).toEqual({
      kind: "summary",
    });
    expect(
      resolveInlineTarget(RESUME, "Platform engineer with a decade"),
    ).toEqual({ kind: "summary" });
  });

  it("a summary that opens with the job title still resolves to summary", () => {
    // Regression (live QA): the loose "position prefix" entry-line
    // heuristic used to hijack this common summary shape.
    const titled: Resume = {
      ...RESUME,
      summary:
        "Senior Platform Engineer with 8 years of experience across fintech and developer tools.",
    };
    expect(
      resolveInlineTarget(titled, titled.summary),
    ).toEqual({ kind: "summary" });
    // The real entry line still resolves to the experience editor.
    expect(
      resolveInlineTarget(
        titled,
        "Staff Platform Engineer · Full-time · San Francisco, CA",
      ),
    ).toEqual({ kind: "experience", expId: "exp1", part: "entry" });
    // The bare headline text still resolves to the header title.
    expect(
      resolveInlineTarget(titled, "Senior Platform Engineer"),
    ).toEqual({ kind: "header", field: "title" });
  });

  it("resolves experience fields, dates and bullets", () => {
    expect(resolveInlineTarget(RESUME, "Northwind Labs")).toEqual({
      kind: "experience",
      expId: "exp1",
      part: "entry",
    });
    expect(resolveInlineTarget(RESUME, "Staff Platform Engineer")).toEqual({
      kind: "experience",
      expId: "exp1",
      part: "entry",
    });
    expect(resolveInlineTarget(RESUME, "2021 – Present")).toEqual({
      kind: "experience",
      expId: "exp1",
      part: "entry",
    });
    expect(
      resolveInlineTarget(
        RESUME,
        "Built payment platform processing millions of transactions",
      ),
    ).toEqual({ kind: "bullet", expId: "exp1", index: 0 });
    expect(
      resolveInlineTarget(RESUME, "Reduced processing time by 40%"),
    ).toEqual({ kind: "bullet", expId: "exp1", index: 1 });
  });

  it("resolves description lines to the experience description editor", () => {
    expect(resolveInlineTarget(RESUME, "Owned the deployment pipeline.")).toEqual(
      { kind: "experience", expId: "exp1", part: "description" },
    );
  });

  it("resolves education, skills (incl. level suffix) and section headings", () => {
    expect(resolveInlineTarget(RESUME, "State University")).toEqual({
      kind: "education",
      eduId: "edu1",
    });
    expect(resolveInlineTarget(RESUME, "Kubernetes")).toEqual({
      kind: "skill",
      skillId: "sk1",
    });
    expect(resolveInlineTarget(RESUME, "Kubernetes (expert)")).toEqual({
      kind: "skill",
      skillId: "sk1",
    });
    expect(resolveInlineTarget(RESUME, "Professional Experience")).toEqual({
      kind: "section",
      section: "experience",
    });
    expect(resolveInlineTarget(RESUME, "TECHNICAL SKILLS")).toEqual({
      kind: "section",
      section: "skills",
    });
    expect(resolveInlineTarget(RESUME, "Education")).toEqual({
      kind: "section",
      section: "education",
    });
  });

  it("resolves compound contact rows to the header editor", () => {
    expect(
      resolveInlineTarget(
        RESUME,
        "jordan.rivera@example.com | +1 (415) 555-0184 | San Francisco, CA",
      ),
    ).toEqual({ kind: "header", field: "email" });
  });

  it("resolves compound entry lines (position · type · location)", () => {
    expect(
      resolveInlineTarget(
        RESUME,
        "Staff Platform Engineer · Full-time · San Francisco, CA",
      ),
    ).toEqual({ kind: "experience", expId: "exp1", part: "entry" });
  });

  it("returns null for structural text and unrelated content", () => {
    expect(resolveInlineTarget(RESUME, "Some unrelated heading")).toBeNull();
    expect(resolveInlineTarget(RESUME, "   ")).toBeNull();
    // Huge ancestor texts (whole sections/pages) are never resolvable.
    expect(resolveInlineTarget(RESUME, RESUME.summary.repeat(20))).toBeNull();
  });
});
