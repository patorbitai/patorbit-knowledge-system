"use strict";

/**
 * Focused tests for the deterministic PROJECT / CERTIFICATION / LANGUAGE
 * grouping (PATORBIT CORE RULE — NO AI) and their wiring into
 * mapEvidenceToResume.
 */

import { describe, it, expect } from "vitest";
import type { EvidenceFact, EvidenceFactType } from "@/lib/document-model/evidence";
import { extractEvidenceFacts } from "@/lib/document-model/evidence";
import type { DocumentBlock, DocumentLine, SectionKind } from "@/lib/document-model/types";
import { groupProjectEntries } from "@/utils/project-grouping";
import { groupCertificationEntries } from "@/utils/certification-grouping";
import { groupLanguageEntries } from "@/utils/language-grouping";
import { mapEvidenceToResume } from "@/utils/evidence-resume-mapper";

/* ── Fact builders ────────────────────────────────────────────────────────── */

let seq = 0;
function fact(
  type: EvidenceFactType,
  value: string,
  section: SectionKind = "projects",
  line: number = ++seq,
): EvidenceFact {
  return {
    id: `fact_1_${line}_${type}`,
    type,
    value,
    source: value,
    confidence: 1,
    provenance: { page: 1, blockId: "blk", section, line },
  };
}

const dateOf = (
  value: string,
  section: SectionKind = "projects",
  line: number = ++seq,
): EvidenceFact => fact("date", value, section, line);

/* ── PROJECTS ─────────────────────────────────────────────────────────────── */

describe("groupProjectEntries", () => {
  it("groups heading, URL, explicit tech, bullets and date into one entry", () => {
    const facts = [
      fact("project", "E-Commerce Platform 2021 - 2023", "projects", 10),
      dateOf("2021 - 2023", "projects", 10),
      fact("project", "https://github.com/acme/ecommerce", "projects", 11),
      fact("project", "Tech: React, Node.js, PostgreSQL", "projects", 12),
      fact("project", "Built an order pipeline", "projects", 13),
      fact("project", "• Cut checkout time by 30%", "projects", 14),
    ];
    const { entries, unassigned } = groupProjectEntries(facts);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      name: "E-Commerce Platform",
      description: "Built an order pipeline\n• Cut checkout time by 30%",
      tech: "React, Node.js, PostgreSQL",
      link: "https://github.com/acme/ecommerce",
      startDate: "2021",
      endDate: "2023",
      role: "",
      teamSize: "",
    });
    expect(unassigned).toEqual([]);
  });

  it("starts a new entry on the next clear heading — no invented boundaries", () => {
    const facts = [
      fact("project", "Inventory App", "projects", 20),
      fact("project", "Stock dashboard", "projects", 21),
      dateOf("2020", "projects", 22),
      fact("project", "Reporting Tool", "projects", 23),
      fact("project", "Pdf extracts", "projects", 24),
    ];
    const { entries } = groupProjectEntries(facts);
    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe("Inventory App");
    expect(entries[0].startDate).toBe("2020");
    expect(entries[1].name).toBe("Reporting Tool");
    expect(entries[1].description).toBe("Pdf extracts");
  });

  it("never invents projects from prose, bullets or unrelated sections", () => {
    const facts = [
      fact("project", "Some freelance work I did for clients.", "projects", 30),
      fact("project", "• Various odd jobs", "projects", 31),
      fact("project", "React is great", "projects", 32),
      fact("project", "https://github.com/me", "projects", 33),
    ];
    const { entries, unassigned } = groupProjectEntries(facts);

    // No entry is invented — every line is preserved for review instead.
    expect(entries).toHaveLength(0);
    expect(unassigned).toHaveLength(facts.length);
  });

  it("returns nothing for empty / non-projects input", () => {
    expect(groupProjectEntries([])).toEqual({ entries: [], unassigned: [] });
    const skills = [fact("skill", "React", "skills", 40)];
    expect(groupProjectEntries(skills)).toEqual({ entries: [], unassigned: [] });
  });

  it("accepts lowercase connectors as part of a title-cased heading", () => {
    // "and" between title-cased words is a heading, not prose.
    const facts = [
      fact("project", "Graph RAG and Agentic AI Workflow 2024 - 2025", "projects", 42),
      dateOf("2024 - 2025", "projects", 42),
      fact("project", "Cloud Data Automation and Power BI Reporting", "projects", 43),
    ];
    const { entries, unassigned } = groupProjectEntries(facts);
    expect(entries.map((e) => e.name)).toEqual([
      "Graph RAG and Agentic AI Workflow",
      "Cloud Data Automation and Power BI Reporting",
    ]);
    expect(entries[0].startDate).toBe("2024");
    expect(entries[0].endDate).toBe("2025");
    expect(entries[1].description).toBe("");
    expect(unassigned).toEqual([]);
  });

  it("keeps prose description lines as description, never as tech", () => {
    const facts = [
      fact("project", "Enterprise GenAI RAG Knowledge Assistant", "projects", 44),
      fact(
        "project",
        "Implemented chunking, metadata filtering, similarity search, prompt templates, and response",
        "projects",
        45,
      ),
    ];
    const { entries, unassigned } = groupProjectEntries(facts);
    expect(entries).toHaveLength(1);
    expect(entries[0].tech).toBe("");
    expect(entries[0].description).toContain("Implemented chunking");
    expect(unassigned).toEqual([]);
  });
});

/* ── CERTIFICATIONS ───────────────────────────────────────────────────────── */

describe("groupCertificationEntries", () => {
  it("groups name, explicit issuer, date and URL", () => {
    const facts = [
      fact("certification", "AWS Certified Solutions Architect", "certifications", 50),
      fact("certification", "Issued by Amazon Web Services", "certifications", 51),
      dateOf("2022", "certifications", 52),
      fact("certification", "https://www.credly.com/badges/123", "certifications", 53),
    ];
    const { entries, unassigned } = groupCertificationEntries(facts);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2022",
      link: "https://www.credly.com/badges/123",
    });
    expect(unassigned).toEqual([]);
  });

  it("keeps an ambiguous bare line as evidence, not as a phantom entry", () => {
    // "Coursera" could be the issuer of the previous cert; no date/issuer yet,
    // so it must NOT become a second certification and must NOT be dropped.
    const facts = [
      fact("certification", "Google Cloud Professional", "certifications", 60),
      fact("certification", "Coursera", "certifications", 61),
    ];
    const { entries, unassigned } = groupCertificationEntries(facts);
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("Google Cloud Professional");
    expect(unassigned.map((u) => u.value)).toEqual(["Coursera"]);
  });

  it("splits an explicit spaced Name - Issuer line into name and issuer", () => {
    const facts = [
      fact(
        "certification",
        "Microsoft Azure Data Engineer Associate – Microsoft",
        "certifications",
        1,
      ),
      fact(
        "certification",
        "Data Science and Business Analytics Internship – GRIP",
        "certifications",
        2,
      ),
    ];
    const { entries, unassigned } = groupCertificationEntries(facts);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      name: "Microsoft Azure Data Engineer Associate",
      issuer: "Microsoft",
      date: "",
      link: "",
    });
    expect(entries[1]).toEqual({
      name: "Data Science and Business Analytics Internship",
      issuer: "GRIP",
      date: "",
      link: "",
    });
    expect(unassigned).toEqual([]);
  });

  it("does not split names that merely contain an unspaced hyphen", () => {
    const facts = [
      fact("certification", "Azure-Resilient Architect Microsoft", "certifications", 3),
    ];
    const { entries, unassigned } = groupCertificationEntries(facts);
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("Azure-Resilient Architect Microsoft");
    expect(entries[0].issuer).toBe("");
    expect(unassigned).toEqual([]);
  });

  it("starts a new entry once the previous is dated", () => {
    const facts = [
      fact("certification", "Google Cloud Professional", "certifications", 70),
      dateOf("2021", "certifications", 71),
      fact("certification", "Scrum Master PSM I", "certifications", 72),
    ];
    const { entries } = groupCertificationEntries(facts);
    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe("Google Cloud Professional");
    expect(entries[1].name).toBe("Scrum Master PSM I");
  });

  it("never invents certifications from prose or other sections", () => {
    const facts = [
      fact("certification", "I once earned a few badges online.", "certifications", 80),
      fact("certification", "Completed many courses over the years.", "certifications", 81),
      fact("skill", "AWS", "skills", 82),
    ];
    const { entries, unassigned } = groupCertificationEntries(facts);
    expect(entries).toHaveLength(0);
    expect(unassigned).toHaveLength(2);
  });

  it("returns nothing for empty / non-certifications input", () => {
    expect(groupCertificationEntries([])).toEqual({ entries: [], unassigned: [] });
  });
});

/* ── LANGUAGES ────────────────────────────────────────────────────────────── */

describe("groupLanguageEntries", () => {
  it("keeps explicit proficiencies verbatim and never invents unstated ones", () => {
    const facts = [
      fact("language", "English (Native)", "languages", 90),
      fact("language", "Spanish: Fluent", "languages", 91),
      fact("language", "German - B2", "languages", 92),
      fact("language", "French", "languages", 93),
    ];
    const { entries } = groupLanguageEntries(facts);
    expect(entries).toEqual([
      { name: "English", proficiency: "Native" },
      { name: "Spanish", proficiency: "Fluent" },
      { name: "German", proficiency: "B2" },
      { name: "French", proficiency: "" },
    ]);
  });

  it("only consumes language facts inside the languages section", () => {
    const facts = [
      fact("language", "English", "skills", 100),
      fact("other", "Fluent in 3 languages", "languages", 101),
    ];
    const { entries, unassigned } = groupLanguageEntries(facts);
    expect(entries).toHaveLength(0);
    // Non-language lines inside the section are preserved; a language fact in
    // another section is outside the boundary and ignored entirely.
    expect(unassigned).toHaveLength(1);
    expect(unassigned[0].value).toBe("Fluent in 3 languages");
  });

  it("returns nothing for empty input", () => {
    expect(groupLanguageEntries([])).toEqual({ entries: [], unassigned: [] });
  });
});

/* ── MAPPER WIRING ────────────────────────────────────────────────────────── */

describe("mapEvidenceToResume (projects / certifications / languages)", () => {
  const lineOf = (raw: string, lno: number): DocumentLine => ({
    page: 1,
    lno,
    raw,
    column: undefined,
  });
  const block = (kind: SectionKind, lines: DocumentLine[]): DocumentBlock => ({
    id: `blk_${kind}`,
    kind,
    title: "",
    page: 1,
    startLine: lines[0]?.lno ?? 0,
    endLine: lines.at(-1)?.lno ?? 0,
    uncertain: false,
    confidence: 1,
    lines,
  });

  it("populates resume.projects / certifications / languages and reports changes", () => {
    const facts = extractEvidenceFacts([
      block("projects", [
        lineOf("E-Commerce Platform 2021 - 2023", 1),
        lineOf("Tech: React, Node.js", 2),
      ]),
      block("certifications", [
        lineOf("AWS Certified Solutions Architect", 4),
        lineOf("Issued by Amazon 2022", 5),
      ]),
      block("languages", [lineOf("English (Native), Spanish", 7)]),
    ]);

    const resume: Record<string, unknown> = {};
    const { changed, uncertain } = mapEvidenceToResume(resume, facts);

    expect(changed).toEqual(expect.arrayContaining(["projects", "certifications", "languages"]));
    expect(resume.projects).toHaveLength(1);
    expect(resume.certifications).toHaveLength(1);
    expect(resume.languages).toHaveLength(2);
    expect(resume.projects).toMatchObject([{ name: "E-Commerce Platform" }]);
    expect(resume.certifications).toMatchObject([{ name: "AWS Certified Solutions Architect" }]);
    expect(resume.languages).toMatchObject([
      { name: "English", proficiency: "Native" },
      { name: "Spanish", proficiency: "" },
    ]);
    for (const item of resume.projects as { id: number }[]) expect(item.id).toBeGreaterThan(0);
    void uncertain;
  });

  it("maps actual Summary-section prose into resume.summary verbatim", () => {
    const facts = extractEvidenceFacts([
      block("summary", [
        lineOf("AI/ML Engineer and Data Engineer with 4+ years of experience.", 1),
        lineOf("Skilled in Python, machine learning and NLP pipelines.", 2),
      ]),
    ]);

    const resume: Record<string, unknown> = { summary: "AI/ML Engineer and Data Engineer" };
    const { changed } = mapEvidenceToResume(resume, facts);

    expect(changed).toContain("summary");
    expect(resume.summary).toBe(
      "AI/ML Engineer and Data Engineer with 4+ years of experience. Skilled in Python, machine learning and NLP pipelines.",
    );
  });

  it("leaves resume.summary untouched when no Summary section exists", () => {
    const facts = extractEvidenceFacts([
      block("skills", [lineOf("Python, SQL, Azure", 1)]),
    ]);

    const resume: Record<string, unknown> = { summary: "AI/ML Engineer" };
    const { changed } = mapEvidenceToResume(resume, facts);
    expect(changed).not.toContain("summary");
    expect(resume.summary).toBe("AI/ML Engineer");
  });

  it("does not touch projects/certifications/languages when evidence has none", () => {
    const resume = { name: "Jane" };
    const { changed } = mapEvidenceToResume(resume, []);
    expect(changed).not.toEqual(expect.arrayContaining(["projects", "certifications", "languages"]));
    expect((resume as Record<string, unknown>).projects).toBeUndefined();
  });
});