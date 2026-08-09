"use strict";

import { describe, it, expect } from "vitest";
import { buildDocumentRecord, buildDocumentBlocks, detectSectionKind } from "../index";
import type { DocumentBlock, DocumentLine } from "../types";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function lines(text: string): DocumentLine[] {
  return text
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw, i) => ({ lno: i + 1, page: 1, raw }));
}

const kinds = (blocks: DocumentBlock[]) => blocks.map((b) => b.kind);
const blocks = kinds;

describe("detectSectionKind", () => {
  it("recognises common section names case-insensitively", () => {
    expect(detectSectionKind("WORK EXPERIENCE")).toBe("experience");
    expect(detectSectionKind("work experience")).toBe("experience");
    expect(detectSectionKind("Professional Summary")).toBe("summary");
    expect(detectSectionKind("Technical Skills")).toBe("skills");
    expect(detectSectionKind("CERTIFICATIONS")).toBe("certifications");
    expect(detectSectionKind("languages")).toBe("languages");
    expect(detectSectionKind("Education")).toBe("education");
    expect(detectSectionKind("Projects")).toBe("projects");
  });

  it("tolerates bullets, numbers and trailing colons", () => {
    expect(detectSectionKind("- EXPERIENCE")).toBe("experience");
    expect(detectSectionKind("1) SKILLS")).toBe("skills");
    expect(detectSectionKind("• Summary:")).toBe("summary");
  });

  it("does not treat body sentences or date lines as headings", () => {
    expect(detectSectionKind("Reduced checkout load time by 40%.")).toBeNull();
    expect(detectSectionKind("2021 – Present")).toBeNull();
    expect(detectSectionKind("Built a high scale checkout with 40% uplift.")).toBeNull();
  });
});

describe("buildDocumentRecord", () => {
  it("preserves page, line number, raw text and source info", () => {
    const rec = buildDocumentRecord(
      ["Jane Doe\nEngineer", "Jane does more"],
      { fileName: "a.pdf", sourceType: "pdf" },
    );
    expect(rec.source.fileName).toBe("a.pdf");
    expect(rec.source.type).toBe("pdf");
    expect(rec.pages).toHaveLength(2);
    expect(rec.lines).toHaveLength(3);
    expect(rec.lines[0]).toMatchObject({ lno: 1, page: 1, raw: "Jane Doe" });
    expect(rec.lines[1]).toMatchObject({ lno: 2, page: 1, raw: "Engineer" });
    expect(rec.lines[2]).toMatchObject({ lno: 3, page: 2, raw: "Jane does more" });
    expect(rec.id).toMatch(/^doc_[a-z0-9]+$/);
  });

  it("preserves columns when supplied", () => {
    const rec = buildDocumentRecord(["A\nB"], { columns: [[0, 1]] });
    expect(rec.lines[0].column).toBe(0);
    expect(rec.lines[1].column).toBe(1);
  });

  it("returns an empty record for an empty document", () => {
    const rec = buildDocumentRecord([""]);
    expect(rec.lines).toEqual([]);
    expect(rec.pages[0].lines).toEqual([]);
  });
});

describe("classic single-column resume", () => {
  const text = [
    "Jane Doe",
    "Senior Software Engineer",
    "jane.doe@example.com | (415) 555-0100",
    "PROFESSIONAL SUMMARY",
    "Engineer with 8+ years building web apps and teams.",
    "WORK EXPERIENCE",
    "Acme Corp  Mar 2020 – Present",
    "Senior Engineer",
    "Reduced checkout load time by 40%.",
    "EDUCATION",
    "University of California",
    "B.S. Computer Science, 2014",
    "TECHNICAL SKILLS",
    "React, TypeScript, Node.js",
  ].join("\n");

  it("maps headings to canonical kinds in source order", () => {
    const blocks = buildDocumentBlocks(lines(text));
    expect(blocks.map((b) => b.kind)).toEqual([
      "name", "contact", "summary", "experience", "education", "skills",
    ]);
  });

  it("preserves the original heading verbatim as title", () => {
    const got = buildDocumentBlocks(lines(text));
    expect(got[2].title).toBe("PROFESSIONAL SUMMARY");
    expect(got[3].title).toBe("WORK EXPERIENCE");
    expect(got[4].title).toBe("EDUCATION");
    expect(got[5].title).toBe("TECHNICAL SKILLS");
  });

  it("keeps heading provenance (page, startLine, endLine)", () => {
    const got = buildDocumentBlocks(lines(text));
    const exp = got[3];
    expect(exp.page).toBe(1);
    expect(exp.startLine).toBe(6);
    expect(exp.endLine).toBe(9);
    expect(exp.lines[0].lno).toBe(6);
    expect(exp.uncertain).toBe(false);
  });

  it("does not drop any content lines", () => {
    const got = buildDocumentBlocks(lines(text));
    const total = got.reduce((acc, b) => acc + b.lines.length, 0);
    expect(total).toBe(14);
  });
});

describe("two-column resume (sidebar first)", () => {
  const text = [
    "Sarah Chen",
    "Senior Frontend Engineer",
    "CONTACT",
    "sarah.chen@example.com",
    "SKILLS",
    "React, TypeScript",
    "LANGUAGES",
    "English (Native)",
    "PROFESSIONAL SUMMARY",
    "Senior Frontend Engineer with 8+ years of experience.",
    "WORK EXPERIENCE",
    "Stripe  Mar 2021 – Present",
    "Airbnb  May 2018 – Feb 2021",
  ].join("\n");

  it("keeps sections in page-wide order (sidebar, then main)", () => {
    const got = buildDocumentBlocks(lines(text));
    const kindsOfBlock = kinds(got);
    const contact = kindsOfBlock.indexOf("contact");
    const skills = kindsOfBlock.indexOf("skills");
    const languages = kindsOfBlock.indexOf("languages");
    const summary = kindsOfBlock.indexOf("summary");
    const experience = kindsOfBlock.indexOf("experience");
    expect(contact).toBeGreaterThanOrEqual(0);
    expect(skills).toBeGreaterThan(contact);
    expect(languages).toBeGreaterThan(skills);
    expect(summary).toBeGreaterThan(languages);
    expect(experience).toBeGreaterThan(summary);
  });

  it("threads column provenance through when provided", () => {
    const rec = buildDocumentRecord([text], {
      columns: [[0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
    });
    expect(rec.lines.find((l) => l.raw === "CONTACT")?.column).toBe(1);
    expect(rec.lines.find((l) => l.raw === "WORK EXPERIENCE")?.column).toBe(1);
  });
});

describe("right-aligned date rail", () => {
  const text = [
    "JANE DOE",
    "WORK EXPERIENCE",
    "Acme Corp  Mar 2021 – Present",
    "Senior Engineer",
    "Built the checkout across 40 stores.",
    "Globex  Jan 2019 – Feb 2021",
    "Platform Engineer",
    "EDUCATION",
    "State University  2014 – 2018",
  ].join("\n");

  it("detects sections despite right-aligned dates embedded on lines", () => {
    const got = buildDocumentBlocks(lines(text));
    expect(blocks(got)).toEqual(["name", "experience", "education"]);
    const exp = got[1];
    expect(exp.startLine).toBe(2);
    expect(exp.lines.map((l) => l.raw)).toContain("Acme Corp  Mar 2021 – Present");
  });
});

describe("custom sections (VOLUNTEER WORK, PUBLICATIONS)", () => {
  const text = [
    "John Lee",
    "Data Engineer",
    "VOLUNTEER WORK",
    "Community garden lead, 2019–2021",
    "PUBLICATIONS",
    "Attention Patterns — ML Journal, 2022",
    "AWARDS",
    "Hackathon winner, 2022",
  ].join("\n");

  it("preserves unknown sections as custom, in source order", () => {
    const got = buildDocumentBlocks(lines(text));
    expect(blocks(got)).toEqual([
      "name", "custom", "custom", "achievements",
    ]);
    expect(got.find((b) => b.title === "VOLUNTEER WORK")?.kind).toBe("custom");
    expect(got.find((b) => b.title === "PUBLICATIONS")?.kind).toBe("custom");
  });

  it("marks custom sections uncertain but keeps their lines verbatim", () => {
    const got = buildDocumentBlocks(lines(text));
    const volunteer = got.find((b) => b.title === "VOLUNTEER WORK");
    expect(volunteer?.uncertain).toBe(true);
    expect(volunteer?.lines.map((l) => l.raw)).toContain("Community garden lead, 2019–2021");
    const pubs = got.find((b) => b.title === "PUBLICATIONS");
    expect(pubs?.lines.map((l) => l.raw)).toContain("Attention Patterns — ML Journal, 2022");
  });

  it("does not drop unknown content", () => {
    const got = buildDocumentBlocks(lines(text));
    const flat = got.flatMap((b) => b.lines.map((l) => l.raw));
    expect(flat).toContain("VOLUNTEER WORK");
    expect(flat).toContain("PUBLICATIONS");
    expect(flat).toContain("Hackathon winner, 2022");
  });
});

describe("mixed punctuation / bullets", () => {
  const text = [
    "Alex Rivera",
    "• SUMMARY:",
    "Built high-throughput checkout.",
    "1) WORK EXPERIENCE",
    "  - Acme Corp, 2024 – Present",
    "    • Reduced load time by 23%.",
    "  2) 2021 – 2022, Globex",
    "CERTIFICATIONS",
    "AWS Solutions Architect — 2022",
    "HOBBIES",
    "Chess, hiking, coffee brewing",
  ].join("\n");

  it("handles bullets, numbers and colons on headers", () => {
    const got = buildDocumentBlocks(lines(text));
    expect(blocks(got)).toEqual(["name", "summary", "experience", "certifications", "interests"]);
    expect(got[1].title).toBe("SUMMARY");
  });

  it("keeps bullet content inside its section block", () => {
    const got = buildDocumentBlocks(lines(text));
    const exp = got[2];
    expect(exp.lines.map((l) => l.raw)).toContain("• Reduced load time by 23%.");
    expect(exp.lines.some((l) => l.raw.includes("Globex"))).toBe(true);
  });
});

describe("empty document", () => {
  it("returns zero blocks for empty input", () => {
    expect(buildDocumentBlocks([])).toEqual([]);
  });
});

describe("one-line document", () => {
  it("keeps a single line as one preamble block", () => {
    const got = buildDocumentBlocks(lines("Jane Doe"));
    expect(blocks(got)).toEqual(["name"]);
    expect(got[0].lines).toHaveLength(1);
    expect(got[0].uncertain).toBe(true);
  });
});