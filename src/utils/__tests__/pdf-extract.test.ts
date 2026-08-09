"use strict";

import { describe, it, expect } from "vitest";
import { extractPageText, type PdfTextItem } from "../pdf-extract";

function item(str: string, x: number, y: number, width?: number): PdfTextItem {
  return { str, transform: [1, 0, 0, 1, x, y], width: width ?? str.length * 6, height: 10 };
}

describe("extractPageText column detection", () => {
  it("detects a two-column page from page-wide X coverage (not intra-row gaps)", () => {
    const sb = (s: string, y: number) => item(s, 13.5, y);
    const mn = (s: string, y: number) => item(s, 227.6, y);
    const bt = (s: string, y: number) => item(s, 239.6, y);

    const items: PdfTextItem[] = [
      sb("Sarah Chen", 749.3),
      mn("Sarah Chen", 749.3),
      sb("Senior Frontend Engineer", 729),
      mn("Senior Frontend Engineer", 729),
      sb("CONTACT", 705.8),
      sb("sarah.chen@example.com", 687.8),
      sb("SKILLS", 617.3),
      sb("React, TypeScript", 588),
      sb("EDUCATION", 468),
      sb("University of California", 449.3),
      sb("L ANGUAGES", 337.5),
      mn("PROFESSIONAL SUMMARY", 666.8),
      mn("Senior Frontend Engineer with 8+", 645),
      mn("WORK EXPERIENCE", 595.5),
      mn("Stripe", 573),
      item("Mar 2021 – Present", 528.6, 573.8),
      mn("Senior Frontend Engineer", 561),
      bt("•Led a team of 5 engineers rebuild.", 534),
      bt("•Reduced checkout load time by 23%.", 519),
      mn("Airbnb", 468),
      item("May 2018 – Feb 2021", 522, 468.8),
      item("OpenSource: react-hooks-", 449.1, 276.8, 131.2),
      item("form. Used by 12k developers.", 227.6, 264.8),
    ];

    const text = extractPageText(items);
    const lines = text.trim().split("\n").map((l) => l.trim());

    // Sidebar comes first, then main content — never interleaved.
    const sidebarIdx = lines.indexOf("CONTACT");
    const summaryIdx = lines.indexOf("PROFESSIONAL SUMMARY");
    expect(sidebarIdx).toBeGreaterThanOrEqual(0);
    expect(summaryIdx).toBeGreaterThan(sidebarIdx);

    // 1. sidebar does not interleave with main content
    const findLine = (needle: string) => lines.findIndex((l) => l.includes(needle));
    const sidebarOrder = [
      "Sarah",
      "Senior Frontend Engineer",
      "CONTACT",
      "sarah.chen@example.com",
      "SKILLS",
      "React, TypeScript",
      "EDUCATION",
      "University of California",
      "LANGUAGES",
    ];
    let last = -1;
    for (const s of sidebarOrder) {
      const idx = findLine(s);
      expect(idx, `expected "${s}" in output`).toBeGreaterThan(last);
      last = idx;
    }

    // 2. main column stays together after the sidebar
    const mainOrder = [
      "PROFESSIONAL SUMMARY",
      "Senior Frontend Engineer with 8+",
      "WORK EXPERIENCE",
      "Stripe Mar 2021 – Present",
    ];
    last = -1;
    for (const s of mainOrder) {
      const idx = findLine(s);
      expect(idx).toBeGreaterThan(last);
      last = idx;
    }

    // 3. bullets belong to experience, in main column
    const bullet1 = findLine("•Led a team of 5 engineers rebuild.");
    const bullet2 = findLine("•Reduced checkout load time by 23%.");
    expect(bullet1).toBeGreaterThan(findLine("Stripe Mar 2021 – Present"));
    expect(bullet2).toBeGreaterThan(bullet1);

    // 4. dates remain near their associated content
    expect(lines).toContain("Stripe Mar 2021 – Present");
    expect(lines).toContain("Airbnb May 2018 – Feb 2021");

    // 5. header is not duplicated (same baseline in both columns).
    // Only occurrences are the header (736 and 726, both y=729) + Stripe role (y=561).
    expect(lines.filter((l) => l.includes("Sarah Chen"))).toHaveLength(1);
    expect(lines.filter((l) => l.trim() === "Senior Frontend Engineer")).toHaveLength(2);

    // 6. wrapped URL rejoined without losing the hyphen
    const urlLine = lines.find((l) => l.includes("react-hooks"));
    expect(urlLine).toContain("react-hooks-form.");
  });

  it("keeps a repeated role line used by two employers (different baselines)", () => {
    const mn = (s: string, y: number) => item(s, 200, y);
    const text = extractPageText([
      mn("Stripe", 500),
      mn("Senior Frontend Engineer", 490),
      mn("Airbnb", 460),
      mn("Senior Frontend Engineer", 450),
    ]);
    expect(text.trim().split("\n").filter((l) => l.includes("Senior Frontend Engineer"))).toHaveLength(2);
  });

  it("keeps single-column pages in top-to-bottom order", () => {
    const text = extractPageText([
      item("MASTER", 100, 400),
      item("NAME", 120, 350),
      item("DETAILS", 140, 300),
      item("FOOTER", 100, 200),
    ]);
    const lines = text.trim().split("\n");
    expect(lines).toEqual(["MASTER", "NAME", "DETAILS", "FOOTER"]);
  });

  it("collapses the letter-spacing artifact in all-caps headers", () => {
    const text = extractPageText([item("L ANGUAGES", 13.5, 337.5)]);
    expect(text.trim()).toBe("LANGUAGES");
  });

  it("does not mangle ordinary mixed-case header text", () => {
    const text = extractPageText([item("John A. Smith", 13.5, 300)]);
    expect(text.trim()).toBe("John A. Smith");
  });

  it("joins a wrapped hyphenated sequence into one line", () => {
    const text = extractPageText([
      item("react-hooks-", 449.1, 276.8, 131.2),
      item("form.", 227.6, 264.8),
    ]);
    expect(text.trim()).toBe("react-hooks-form.");
  });

  it("folds a right-aligned date rail into the single column instead of a second column", () => {
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
      item("EDUCATION", 40, 440),
      item("State University", 40, 410),
      item("2014 – 2018", 540, 410),
    ]);
    const lines = text.trim().split("\n").map((l) => l.trim());
    // dates stay on the same visual line as their company, not own column
    expect(lines).toContain("Acme Corp Mar 2021 – Present");
    expect(lines).toContain("Globex Jan 2019 – Feb 2021");
    expect(lines).toContain("State University 2014 – 2018");
    // no blank-line column break separates the dates out
    expect(lines.indexOf("Acme Corp Mar 2021 – Present")).toBeGreaterThan(-1);
  });

  it("keeps a genuine two-column page when the right column is normal prose", () => {
    const sb = (s: string, y: number) => item(s, 20, y);
    const mn = (s: string, y: number) => item(s, 320, y);
    const text = extractPageText([
      sb("JANE DOE", 700),
      sb("PROFILE", 640),
      sb("Lead three teams", 620),
      mn("WORK EXPERIENCE", 660),
      mn("Acme", 630),
      item("June 2021 – present", 520, 630),
      mn("Director, built a shipping org at scale while keeping", 590),
      mn("the four-pillar roadmap on track for 2023", 570),
      mn("Boston", 500),
    ]);
    const lines = text.trim().split("\n").map((l) => l.trim());
    const profileIdx = lines.findIndex((l) => l.includes("PROFILE"));
    const workIdx = lines.findIndex((l) => l.includes("WORK EXPERIENCE"));
    // sidebar first, then main column (still two regions)
    expect(profileIdx).toBeGreaterThanOrEqual(0);
    expect(workIdx).toBeGreaterThan(profileIdx);
    // the main column retains its date on the same line
    expect(lines).toContain("Acme June 2021 – present");
  });
});