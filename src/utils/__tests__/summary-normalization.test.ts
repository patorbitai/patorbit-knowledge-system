"use strict";

/**
 * Focused tests for deterministic SUMMARY normalization (PATORBIT CORE RULE —
 * NO AI) plus the mapper wiring.
 *
 * Rules under test:
 *   A. summary prose remains unchanged when nothing is classified.
 *   B. LinkedIn URL removed from summary after link classification.
 *   C. GitHub URL removed from summary.
 *   D. email removed from summary.
 *   E. phone removed from summary.
 *   F. multiple URLs removed without damaging surrounding prose.
 *   G. ordinary words (skills/roles/tech) are never removed.
 *   H. summary emptied by removal becomes "" per the Resume schema.
 *   I. contact/link/skill/experience/education/project/certification/language
 *      behavior is unchanged.
 *   J. identical input produces identical output.
 */

import { describe, it, expect } from "vitest";
import type { EvidenceFact } from "@/lib/document-model/evidence";
import { extractEvidenceFacts } from "@/lib/document-model/evidence";
import { buildDocumentRecord } from "@/lib/document-model";
import { normalizeSummaryTokens } from "@/utils/summary-normalization";
import { mapEvidenceToResume } from "@/utils/evidence-resume-mapper";
import { rawToResume } from "@/utils/resume-parser";
import { parseResumeJson } from "@/utils/resume-schema";

/* ── Unit: normalizeSummaryTokens ─────────────────────────────────────────── */

describe("normalizeSummaryTokens", () => {
  it("A: prose without classified tokens is returned verbatim", () => {
    const text = "AI/ML Engineer and Data Engineer with 5 years of experience.";
    expect(normalizeSummaryTokens(text)).toEqual({ summary: text, tokens: [] });
  });

  it("G: skill/role/technology words are never treated as tokens", () => {
    const text = "Python Engineer who builds React apps in TypeScript.";
    const { summary, tokens } = normalizeSummaryTokens(text);
    expect(summary).toBe(text);
    expect(tokens).toEqual([]);
  });

  it("B/C: linkedin + github URLs are classified and removed together", () => {
    const text = "AI/ML Engineer and Data Engineer linkedin.com/in/example github.com/example";
    const { summary, tokens } = normalizeSummaryTokens(text);
    expect(summary).toBe("AI/ML Engineer and Data Engineer");
    expect(tokens).toEqual([
      { type: "link", value: "linkedin.com/in/example", social: "linkedin" },
      { type: "link", value: "github.com/example", social: "github" },
    ]);
  });

  it("D: email is classified and removed", () => {
    const text = "Reach me at jane@example.com anytime.";
    const { summary, tokens } = normalizeSummaryTokens(text);
    expect(summary).toBe("Reach me at anytime.");
    expect(tokens).toEqual([{ type: "email", value: "jane@example.com" }]);
  });

  it("E: phone is classified and removed", () => {
    const text = "Call (415) 555-0100 for details.";
    const { summary, tokens } = normalizeSummaryTokens(text);
    expect(summary).toBe("Call for details.");
    expect(tokens).toEqual([{ type: "phone", value: "(415) 555-0100" }]);
  });

  it("F: multiple URLs removed without damaging surrounding prose", () => {
    const text = "Built tools at github.com/a and hosted docs at www.example.com.";
    const { summary, tokens } = normalizeSummaryTokens(text);
    expect(summary).toBe("Built tools at and hosted docs at.");
    expect(tokens.map((t) => t.value)).toEqual(["github.com/a", "www.example.com"]);
  });

  it("F: a URL with a trailing sentence period is stripped of the period only", () => {
    const text = "See github.com/a for the code.";
    const { summary, tokens } = normalizeSummaryTokens(text);
    expect(tokens[0]).toEqual({ type: "link", value: "github.com/a", social: "github" });
    expect(summary).toBe("See for the code.");
  });

  it("does not invent a phantom phone from digits inside a URL", () => {
    const text = "More at https://example.com/4155550100 here.";
    const { summary, tokens } = normalizeSummaryTokens(text);
    expect(tokens).toEqual([
      { type: "link", value: "https://example.com/4155550100", social: "website" },
    ]);
    expect(summary).toBe("More at here.");
  });

  it("a lone pipe separator left after token removal is stripped, not kept", () => {
    const text = "linkedin.com/in/janedoe | github.com/janedoe | (415) 555-0100";
    const { summary, tokens } = normalizeSummaryTokens(text);
    expect(tokens.map((t) => t.value)).toEqual([
      "linkedin.com/in/janedoe",
      "github.com/janedoe",
      "(415) 555-0100",
    ]);
    expect(summary).toBe("");
  });

  it("J: identical input produces identical output", () => {
    const text = "AI/ML Engineer linkedin.com/in/x github.com/x jane@example.com (415) 555-0100";
    expect(normalizeSummaryTokens(text)).toEqual(normalizeSummaryTokens(text));
  });
});

/* ── Integration: mapEvidenceToResume ─────────────────────────────────────── */

describe("mapEvidenceToResume summary normalization", () => {
  it("B/C: rule-6 example — URLs leave the summary and land in social fields", () => {
    const base = rawToResume(
      "Jane Doe\nAI/ML Engineer and Data Engineer linkedin.com/in/example github.com/example\nWORK EXPERIENCE",
    );
    const { resume, changed } = mapEvidenceToResume(base, []);
    expect(resume.summary).toBe("AI/ML Engineer and Data Engineer");
    expect(resume.social).toMatchObject({
      linkedin: "linkedin.com/in/example",
      github: "github.com/example",
    });
    expect(changed).toEqual(expect.arrayContaining(["social.linkedin", "social.github"]));
  });

  it("D: email inside summary fills empty email and leaves the summary", () => {
    // rawToResume filters email lines out of summary, so exercise the mapper
    // directly on a resume whose summary still carries an inline email.
    const base: Record<string, unknown> = {
      name: "Jane Doe",
      summary: "Data Engineer. Contact jane@example.com for work.",
      social: { linkedin: "", github: "", website: "" },
    };
    const { resume, changed } = mapEvidenceToResume(base, []);
    expect(resume.summary).toBe("Data Engineer. Contact for work.");
    expect(resume.email).toBe("jane@example.com");
    expect(changed).toContain("email");
  });

  it("E: phone inside summary fills empty phone and leaves the summary", () => {
    const base: Record<string, unknown> = {
      name: "Jane Doe",
      summary: "Data Engineer. Call (415) 555-0100 anytime.",
      social: { linkedin: "", github: "", website: "" },
    };
    const { resume, changed } = mapEvidenceToResume(base, []);
    expect(resume.summary).toBe("Data Engineer. Call anytime.");
    expect(resume.phone).toBe("(415) 555-0100");
    expect(changed).toContain("phone");
  });

  it("H: summary emptied by removal becomes '' per the Resume schema", () => {
    const base = rawToResume("Jane Doe\nlinkedin.com/in/example\nWORK EXPERIENCE");
    const { resume } = mapEvidenceToResume(base, []);
    const parsed = parseResumeJson(resume);
    expect(parsed.summary).toBe("");
    expect(parsed.social.linkedin).toBe("linkedin.com/in/example");
  });

  it("G: skills/roles in the summary are untouched even when they are skills", () => {
    const facts: EvidenceFact[] = [
      { id: "s1", type: "skill", value: "Python", source: "Python", confidence: 1, provenance: { page: 1, blockId: "blk", section: "skills", line: 3 } },
      { id: "s2", type: "skill", value: "React", source: "React", confidence: 1, provenance: { page: 1, blockId: "blk", section: "skills", line: 3 } },
    ];
    const base = rawToResume("Jane Doe\nPython Engineer who loves React apps.\nSKILLS\nPython, React");
    const { resume } = mapEvidenceToResume(base, facts);
    expect(resume.summary).toBe("Python Engineer who loves React apps.");
    expect((resume.skills as { name: string }[]).map((s) => s.name)).toEqual(["Python", "React"]);
  });

  it("I: existing contact/link/skill/experience/education/project/certification/language behavior is unchanged", () => {
    // Full deterministic chain: text → blocks → facts → overlay → schema.
    const map = (text: string) => {
      const record = buildDocumentRecord([text], { sourceType: "text" });
      const facts = extractEvidenceFacts(record.blocks);
      const result = mapEvidenceToResume(rawToResume(text), facts);
      return { ...result, resume: parseResumeJson(result.resume) };
    };

    const { resume, changed } = map(
      [
        "Jane Doe",
        "AI/ML Engineer and Data Engineer",
        "jane.doe@example.com | linkedin.com/in/janedoe",
        "SKILLS",
        "React, TypeScript",
        "WORK EXPERIENCE",
        "Acme Corp",
        "Senior Engineer",
        "Mar 2021 – Present",
        "EDUCATION",
        "University of California, Berkeley",
        "B.S. Computer Science",
        "2015 – 2019",
        "PROJECTS",
        "E-Commerce Platform",
        "Tech: React, Node.js",
        "CERTIFICATIONS",
        "AWS Certified Solutions Architect",
        "Issued by Amazon 2022",
        "LANGUAGES",
        "English (Native), Spanish",
      ].join("\n"),
    );

    expect(resume.name).toBe("Jane Doe");
    expect(resume.summary).toBe("AI/ML Engineer and Data Engineer");
    expect(resume.email).toBe("jane.doe@example.com");
    expect(resume.social.linkedin).toBe("linkedin.com/in/janedoe");
    expect(resume.skills.map((s) => s.name)).toEqual(["React", "TypeScript"]);
    expect(resume.experience[0]).toMatchObject({ company: "Acme Corp", position: "Senior Engineer" });
    expect(resume.education[0]).toMatchObject({
      school: "University of California, Berkeley",
      degree: "B.S. Computer Science",
    });
    expect(resume.projects[0]).toMatchObject({ name: "E-Commerce Platform" });
    expect(resume.certifications[0]).toMatchObject({ name: "AWS Certified Solutions Architect" });
    expect(resume.languages.map((l) => l.name)).toEqual(["English", "Spanish"]);
    expect(changed).toEqual(
      expect.arrayContaining([
        "social.linkedin",
        "skills",
        "experience",
        "education",
        "projects",
        "certifications",
        "languages",
      ]),
    );
  });

  it("I: fact-mapped values win over summary tokens; parser email is not overwritten", () => {
    const facts: EvidenceFact[] = [
      { id: "c1", type: "contact", value: "jane@example.com", source: "jane@example.com", confidence: 1, provenance: { page: 1, blockId: "blk", section: "contact", line: 2 } },
    ];
    const base: Record<string, unknown> = {
      name: "Jane Doe",
      email: "jane@example.com",
      summary: "Contact jane@example.com for work.",
      social: { linkedin: "", github: "", website: "" },
    };
    const { resume } = mapEvidenceToResume(base, facts);
    expect(resume.email).toBe("jane@example.com");
    expect(resume.summary).toBe("Contact for work.");
  });

  it("J: running the same input twice produces identical output", () => {
    const base = rawToResume(
      "Jane Doe\nAI/ML Engineer linkedin.com/in/x github.com/x jane@example.com (415) 555-0100\nWORK EXPERIENCE",
    );
    const run = () => {
      const { resume } = mapEvidenceToResume({ ...base }, []);
      return parseResumeJson(resume);
    };
    expect(run()).toEqual(run());
  });
});