"use strict";

/**
 * Focused regression tests for the regex import fallback (rawToResume) — the
 * exact data ImportReviewScreen renders when /api/import cannot use AI.
 *
 * Regression: lines of the shape "Company  Mar 2020 – Present" were being
 * split on the en-dash inside the date range, so the company became
 * "Acme Corp  Mar 2020", position became "Present" and duration was empty.
 */

import { describe, it, expect } from "vitest";
import { rawToResume } from "../resume-parser";
import { parseResumeJson } from "../resume-schema";

describe("rawToResume experience grouping (company / date)", () => {
  it("keeps the company clean and the date in duration for 'Company  Range – Present'", () => {
    const resume = parseResumeJson(
      rawToResume([
        "Jane Doe",
        "Senior Software Engineer",
        "jane.doe@example.com | (415) 555-0100",
        "WORK EXPERIENCE",
        "Acme Corp  Mar 2020 – Present",
        "Senior Engineer",
        "Reduced checkout load time by 40%.",
      ].join("\n")),
    );
    const exp = resume.experience[0];
    expect(exp.company).toBe("Acme Corp");
    expect(exp.company).not.toContain("Mar 2020");
    expect(exp.duration).toContain("Mar 2020");
    expect(exp.position).not.toBe("Present");
  });

  it("keeps both companies with their own date ranges", () => {
    const resume = parseResumeJson(
      rawToResume([
        "Sarah Chen",
        "WORK EXPERIENCE",
        "Stripe  Mar 2021 – Present",
        "Airbnb  May 2018 – Feb 2021",
      ].join("\n")),
    );
    expect(resume.experience.map((e) => e.company)).toEqual(["Stripe", "Airbnb"]);
    expect(resume.experience[0].duration).toContain("Mar 2021");
    expect(resume.experience[1].duration).toContain("May 2018");
  });

  it("still splits 'Company | Position' style lines correctly", () => {
    const resume = parseResumeJson(
      rawToResume([
        "John Lee",
        "WORK EXPERIENCE",
        "Acme Corp | Senior Engineer",
      ].join("\n")),
    );
    expect(resume.experience[0].company).toBe("Acme Corp");
    expect(resume.experience[0].position).toBe("Senior Engineer");
  });

  it("extracts contact and skills alongside experience", () => {
    const resume = parseResumeJson(
      rawToResume([
        "Jane Doe",
        "jane.doe@example.com | (415) 555-0100",
        "TECHNICAL SKILLS",
        "React, TypeScript, Node.js",
      ].join("\n")),
    );
    expect(resume.email).toBe("jane.doe@example.com");
    expect(resume.phone).toContain("415");
    expect(resume.skills.map((s) => s.name)).toEqual(
      expect.arrayContaining(["React", "TypeScript", "Node.js"]),
    );
  });
});