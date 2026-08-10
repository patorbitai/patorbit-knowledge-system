"use strict";

/**
 * Focused end-to-end tests for the /api/import → ImportReviewScreen → builder
 * confirmation chain at the data level. This exercises the exact pipeline the
 * route runs when AI extraction is unavailable:
 *
 *   pdfjs text → extractPageText → rawToResume → parseResumeJson
 *
 * Regression 1: "Company  Mar 2020 – Present" was split on the en-dash inside
 * the date range (company became "Acme Corp  Mar 2020", position "Present",
 * duration empty).
 *
 * Regression 2: the validated resume was missing required Resume fields
 * (careerStage, portfolio, claims) so confirmed imports crashed builder
 * sections that read resume.portfolio / resume.claims directly.
 */

import { describe, it, expect } from "vitest";
import { extractPageText, type PdfTextItem } from "../pdf-extract";
import { rawToResume } from "../resume-parser";
import { parseResumeJson } from "../resume-schema";

function item(str: string, x: number, y: number, width?: number): PdfTextItem {
  return { str, transform: [1, 0, 0, 1, x, y], width: width ?? str.length * 6, height: 10 };
}

describe("import → confirm flow: fields the builder needs after setResume", () => {
  it("preserves careerStage, portfolio and claims so the builder does not lose data", () => {
    const text = [
      "Jane Doe",
      "Senior Software Engineer",
      "jane.doe@example.com | (415) 555-0100",
      "WORK EXPERIENCE",
      "Acme Corp  Mar 2020 – Present",
      "Senior Engineer",
      "Reduced checkout load time by 40%.",
    ].join("\n");
    const parsed = parseResumeJson(rawToResume(text));

    expect(parsed.careerStage).toBe("working-professional");
    expect(Array.isArray(parsed.portfolio)).toBe(true);
    expect(Array.isArray(parsed.claims)).toBe(true);
  });

  it("keeps templateId so the template gallery shows the right template", () => {
    const parsed = parseResumeJson(rawToResume("Jane Doe\nWORK EXPERIENCE\nAcme Corp  Mar 2020 – Present"));
    expect(parsed.templateId).toBe("modern-clean");
  });
});

describe("end-to-end: pdf-extract → rawToResume (the actual /api/import regex chain)", () => {
  it("date-rail resume: company stays clean after the full chain", () => {
    const text = extractPageText([
      item("JANE DOE", 40, 700),
      item("SENIOR BUILDER", 40, 680),
      item("WORK EXPERIENCE", 40, 640),
      item("Acme Corp", 40, 610),
      item("Mar 2021 – Present", 540, 610),
      item("Senior Engineer", 60, 590),
      item("Built the checkout across 40 stores.", 60, 570),
      item("Globex", 40, 520),
      item("Jan 2019 – Feb 2021", 540, 520),
      item("Platform Engineer", 60, 500),
    ]);
    const r = parseResumeJson(rawToResume(text));
    const companies = r.experience.map((e) => ({ company: e.company, duration: e.duration }));
    expect(companies).toEqual([
      { company: "Acme Corp", duration: "Mar 2021 – Present" },
      { company: "Globex", duration: "Jan 2019 – Feb 2021" },
    ]);
  });

  it("two-column page: both roles grouped with correct company/date", () => {
    const mn = (s: string, y: number) => item(s, 227.6, y);
    const sb = (s: string, y: number) => item(s, 13.5, y);
    const text = extractPageText([
      sb("Sarah Chen", 749.3), sb("CONTACT", 705.8), sb("sarah.chen@example.com", 687.8),
      sb("SKILLS", 617.3), sb("React, TypeScript", 588),
      mn("WORK EXPERIENCE", 595.5), mn("Stripe", 573), item("Mar 2021 – Present", 528.6, 573.8),
      mn("Senior Frontend Engineer", 561),
      mn("Airbnb", 468), item("May 2018 – Feb 2021", 522, 468.8),
    ]);
    const r = parseResumeJson(rawToResume(text));
    expect(r.experience[0]?.company).toBe("Stripe");
    expect(r.experience[0]?.duration).toContain("Mar 2021");
    expect(r.experience[1]?.company).toBe("Airbnb");
    expect(r.experience[1]?.duration).toContain("May 2018");
  });
});