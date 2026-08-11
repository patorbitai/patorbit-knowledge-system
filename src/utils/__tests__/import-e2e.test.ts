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
import { mapEvidenceToResume } from "../evidence-resume-mapper";
import { groupExperienceEntries } from "../experience-grouping";
import { groupEducationEntries } from "../education-grouping";
import { buildDocumentRecord } from "@/lib/document-model";
import { extractEvidenceFacts } from "@/lib/document-model/evidence";
import type { EvidenceFact } from "@/lib/document-model/evidence";

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

describe("document-model evidence runs alongside the existing import result", () => {
  it("produces facts from buildDocumentRecord blocks and preserves provenance", () => {
    const text = extractPageText([
      item("Jane Doe", 40, 700),
      item("linkedin.com/in/janedoe | github.com/janedoe", 40, 680),
      item("jane.doe@example.com | (415) 555-0100", 40, 660),
      item("SKILLS", 40, 640),
      item("React, TypeScript", 40, 620),
      item("WORK EXPERIENCE", 40, 600),
      item("Acme Corp", 40, 580),
      item("Mar 2021 \u2013 Present", 100, 580),
    ]);

    const record = buildDocumentRecord([text], { sourceType: "pdf", fileName: "a.pdf" });
    const facts = extractEvidenceFacts(record.blocks);

    const links = facts.filter((f) => f.type === "link").map((f) => f.value);
    const contacts = facts.filter((f) => f.type === "contact").map((f) => f.value);
    const skills = facts.filter((f) => f.type === "skill").map((f) => f.value);
    const dates = facts.filter((f) => f.type === "date").map((f) => f.value);
    const companies = facts.filter((f) => f.type === "company").map((f) => f.value);

    expect(links).toContain("linkedin.com/in/janedoe");
    expect(links).toContain("github.com/janedoe");
    expect(contacts).toContain("jane.doe@example.com");
    expect(contacts).toContain("(415) 555-0100");
    expect(skills).toEqual(expect.arrayContaining(["React", "TypeScript"]));
    expect(dates).toContain("Mar 2021 \u2013 Present");
    expect(companies).toContain("Acme Corp");

    for (const f of facts) {
      expect(f.provenance.blockId).toMatch(/^blk_/);
      expect(f.provenance.line).toBeGreaterThan(0);
      expect(f.provenance.section).toBeTruthy();
      expect(f.source).toBeTruthy();
      expect(f.id).toMatch(/^fact_/);
    }
    expect(record.blocks.length).toBeGreaterThan(0);
  });

  it("existing rawToResume Resume output still exists unchanged", () => {
    const text = [
      "Jane Doe",
      "Senior Software Engineer",
      "jane.doe@example.com | linkedin.com/in/janedoe",
      "WORK EXPERIENCE",
      "Acme Corp  Mar 2020 – Present",
    ].join("\n");
    const resume = parseResumeJson(rawToResume(text));

    expect(resume.name).toBe("Jane Doe");
    expect(resume.experience[0]?.company).toBe("Acme Corp");
    expect(resume.templateId).toBe("modern-clean");
  });
});

describe("evidence overlay: deterministic evidence wins for provable fields", () => {
  it("populates resume fields from evidence via the full chain", () => {
    const text = extractPageText([
      item("Jane Doe", 40, 700),
      item("linkedin.com/in/janedoe | github.com/janedoe", 40, 680),
      item("jane.doe@example.com | (415) 555-0100", 40, 660),
      item("SKILLS", 40, 640),
      item("React, TypeScript", 40, 620),
      item("WORK EXPERIENCE", 40, 600),
      item("Acme Corp", 40, 580),
    ]);

    const record = buildDocumentRecord([text], { sourceType: "pdf", fileName: "a.pdf" });
    const facts = extractEvidenceFacts(record.blocks);
    const base = rawToResume(text);
    const { resume, changed } = mapEvidenceToResume({ ...base }, facts);

    const resumeWithIds = parseResumeJson(resume);
    expect(resumeWithIds.name).toBe("Jane Doe");
    expect(resumeWithIds.email).toBe("jane.doe@example.com");
    expect(resumeWithIds.phone).toBe("(415) 555-0100");
    expect(resumeWithIds.social.linkedin).toBe("linkedin.com/in/janedoe");
    expect(resumeWithIds.social.github).toBe("github.com/janedoe");
    expect(changed).toEqual(
      expect.arrayContaining(["social.linkedin", "social.github"]),
    );
  });

  it("evidence wins for fields the parser got wrong, and reports the change", () => {
    // rawToResume misreads "WORK EXPERIENCE" as the name and finds no contact.
    const base = rawToResume("WORK EXPERIENCE\nAcme Corp  Mar 2020 – Present");
    expect(base.name).toBe("WORK EXPERIENCE");

    const facts: EvidenceFact[] = [
      { id: "f1", type: "person", value: "Jane Doe", source: "Jane Doe", confidence: 0.8, provenance: { page: 1, blockId: "blk_1", section: "name", line: 1 } },
      { id: "f2", type: "contact", value: "jane.doe@example.com", source: "jane.doe@example.com", confidence: 1, provenance: { page: 1, blockId: "blk_1", section: "contact", line: 2 } },
      { id: "f3", type: "contact", value: "(415) 555-0100", source: "(415) 555-0100", confidence: 1, provenance: { page: 1, blockId: "blk_1", section: "contact", line: 2 } },
    ];

    const { resume, changed } = mapEvidenceToResume({ ...base }, facts);
    expect(resume.name).toBe("Jane Doe");
    expect(resume.email).toBe("jane.doe@example.com");
    expect(resume.phone).toBe("(415) 555-0100");
    expect(changed).toEqual(expect.arrayContaining(["name", "email", "phone"]));
    expect(changed).not.toContain("skills");
  });

  it("moves skills from evidence and never invents proficiency", () => {
    const text = extractPageText([
      item("Jane Doe", 40, 700),
      item("SKILLS", 40, 640),
      item("React, TypeScript", 40, 620),
    ]);
    const record = buildDocumentRecord([text], { sourceType: "pdf", fileName: "a.pdf" });
    const facts = extractEvidenceFacts(record.blocks);
    const resume = parseResumeJson(mapEvidenceToResume(rawToResume(text), facts).resume);

    expect(resume.skills.map((s) => s.name)).toEqual(["React", "TypeScript"]);
    expect(resume.skills.every((s) => s.level === "Intermediate")).toBe(true);
    expect(resume.skills).toHaveLength(2);
  });

  it("does not leave LinkedIn/GitHub URLs in summary; they live in social fields", () => {
    const text = [
      "Jane Doe",
      "Senior Software Engineer",
      "jane.doe@example.com",
      "linkedin.com/in/janedoe",
      "github.com/janedoe",
      "WORK EXPERIENCE",
      "Acme Corp  Mar 2020 – Present",
    ].join("\n");

    const base = rawToResume(text);
    expect(base.summary).toContain("linkedin.com/in/janedoe");

    const facts: EvidenceFact[] = [
      { id: "f1", type: "link", value: "linkedin.com/in/janedoe", source: "linkedin.com/in/janedoe", confidence: 1, provenance: { page: 1, blockId: "blk_1", section: "contact", line: 1 } },
      { id: "f2", type: "link", value: "github.com/janedoe", source: "github.com/janedoe", confidence: 1, provenance: { page: 1, blockId: "blk_1", section: "contact", line: 1 } },
    ];

    const resume = parseResumeJson(mapEvidenceToResume(base, facts).resume);
    expect(resume.social.linkedin).toBe("linkedin.com/in/janedoe");
    expect(resume.social.github).toBe("github.com/janedoe");
    expect(resume.summary).not.toContain("linkedin.com/in/janedoe");
    expect(resume.summary).not.toContain("github.com/janedoe");
    // The mapped values themselves must surface verbatim in their field.
    expect(resume.social.github).toBe("github.com/janedoe");
  });

  it("leaves fields evidence cannot prove untouched (experience survives)", () => {
    const facts: EvidenceFact[] = [
      { id: "f1", type: "skill", value: "React", source: "React", confidence: 0.95, provenance: { page: 1, blockId: "blk_1", section: "skills", line: 1 } },
    ];
    const base = rawToResume("Jane Doe\nWORK EXPERIENCE\nAcme Corp  Mar 2020 – Present");
    const resume = parseResumeJson(mapEvidenceToResume({ ...base }, facts).resume);

    expect(resume.experience[0]?.company).toBe("Acme Corp");
    expect(resume.skills.map((s) => s.name)).toEqual(["React"]);
  });
});

describe("deterministic experience grouping", () => {
  /** Full deterministic chain: text → blocks → facts → overlay → schema. */
  const map = (text: string) => {
    const record = buildDocumentRecord([text], { sourceType: "text" });
    const facts = extractEvidenceFacts(record.blocks);
    const result = mapEvidenceToResume(rawToResume(text), facts);
    return { ...result, resume: parseResumeJson(result.resume), facts };
  };

  it("A: company + role + date + bullets become ONE experience entry", () => {
    const { resume, changed } = map(
      [
        "Jane Doe",
        "WORK EXPERIENCE",
        "Acme Corp",
        "Senior Engineer",
        "Mar 2021 – Present",
        "• Built platform",
        "• Improved performance",
      ].join("\n"),
    );

    expect(resume.experience).toHaveLength(1);
    expect(resume.experience[0]).toMatchObject({
      company: "Acme Corp",
      position: "Senior Engineer",
      duration: "Mar 2021 – Present",
      description: "• Built platform\n• Improved performance",
    });
    expect(changed).toContain("experience");
  });

  it("B: two companies become exactly two experience entries, in order", () => {
    const { resume } = map(
      [
        "Jane Doe",
        "WORK EXPERIENCE",
        "Acme Corp",
        "Senior Engineer",
        "Mar 2021 – Present",
        "• Built platform",
        "• Improved performance",
        "Globex",
        "Lead Engineer",
        "May 2019 – Present",
        "• Built integrations",
      ].join("\n"),
    );

    expect(resume.experience).toHaveLength(2);
    expect(resume.experience.map((e) => e.company)).toEqual(["Acme Corp", "Globex"]);
    expect(resume.experience[1]?.position).toBe("Lead Engineer");
  });

  it("C: multiple roles under the same company do not duplicate the company", () => {
    const { resume } = map(
      [
        "Jane Doe",
        "WORK EXPERIENCE",
        "Acme Corp",
        "Senior Engineer",
        "Lead Engineer",
        "Mar 2021 – Present",
        "• Built platform",
      ].join("\n"),
    );

    expect(resume.experience).toHaveLength(1);
    expect(resume.experience[0]?.company).toBe("Acme Corp");
    expect(resume.experience[0]?.position).toBe("Senior Engineer, Lead Engineer");
  });

  it("D: a prose line that cannot be confidently assigned is preserved, not invented", () => {
    const result = map(
      [
        "Abigail Chen",
        "WORK EXPERIENCE",
        "Drove product strategy across three teams with measurable impact on retention.",
      ].join("\n"),
    );

    expect(result.resume.experience).toHaveLength(0);
    // The ambiguous line stays as evidence, available for review.
    expect(result.uncertain.length).toBeGreaterThan(0);
    expect(
      result.uncertain.some((f) =>
        f.value.includes("Drove product strategy across three teams"),
      ),
    ).toBe(true);
  });

  it("E: dates stay attached to the correct entry", () => {
    const { resume } = map(
      [
        "Jane Doe",
        "WORK EXPERIENCE",
        "Acme Corp",
        "Mar 2020 – Feb 2021",
        "• Built platform",
        "Globex",
        "Mar 2021 – Present",
        "• Built integrations",
      ].join("\n"),
    );

    expect(resume.experience).toHaveLength(2);
    expect(resume.experience.map((e) => e.duration)).toEqual([
      "Mar 2020 – Feb 2021",
      "Mar 2021 – Present",
    ]);
  });

  it("F: two-column/date-rail input preserves the existing document ordering", () => {
    const sb = (s: string, y: number) => item(s, 13.5, y);
    const mn = (s: string, y: number) => item(s, 227.6, y);
    const text = extractPageText([
      sb("Sarah Chen", 749.3), sb("CONTACT", 705.8), sb("sarah.chen@example.com", 687.8),
      sb("SKILLS", 617.3), sb("React, TypeScript", 588),
      mn("WORK EXPERIENCE", 595.5), mn("Stripe", 573), item("Mar 2021 – Present", 528.6, 573.8),
      mn("Senior Frontend Engineer", 561),
      mn("Airbnb", 468), item("May 2018 – Feb 2021", 522, 468.8),
    ]);
    const record = buildDocumentRecord([text], { sourceType: "pdf" });
    const facts = extractEvidenceFacts(record.blocks);
    const r = mapEvidenceToResume(rawToResume(text), facts);
    const parsed = parseResumeJson(r.resume);

    expect(r.changed).toContain("experience");
    expect(parsed.experience.map((e) => e.company)).toEqual(["Stripe", "Airbnb"]);
    expect(parsed.experience.map((e) => e.duration)).toEqual([
      "Mar 2021 – Present",
      "May 2018 – Feb 2021",
    ]);
  });

  it("G: running the same input twice produces identical output", () => {
    const text = [
      "Jane Doe",
      "WORK EXPERIENCE",
      "Acme Corp",
      "Senior Engineer",
      "Mar 2021 – Present",
      "• Built platform",
      "Globex",
      "Lead Engineer",
      "May 2019 – Present",
    ].join("\n");

    const run = () => {
      const record = buildDocumentRecord([text], { sourceType: "text" });
      const facts = extractEvidenceFacts(record.blocks);
      return groupExperienceEntries(facts);
    };

    expect(run()).toEqual(run());
  });

  it("H: a trailing role after the last dated company becomes its position", () => {
    const { resume, uncertain } = map(
      [
        "JANE DOE",
        "WORK EXPERIENCE",
        "Acme Corp",
        "Mar 2021 – Present",
        "Senior Engineer",
        "Globex",
        "Jan 2019 – Feb 2021",
        "Platform Engineer",
      ].join("\n"),
    );

    expect(resume.experience).toHaveLength(2);
    expect(resume.experience[1]?.company).toBe("Globex");
    expect(resume.experience[1]?.position).toBe("Platform Engineer");
    expect(uncertain.map((u) => u.value)).not.toContain("Platform Engineer");
  });

  it("I: a role before a bare company is not mistaken for the new company", () => {
    const { resume, uncertain } = map(
      [
        "Sarah Chen",
        "WORK EXPERIENCE",
        "Stripe",
        "Mar 2021 – Present",
        "Senior Frontend Engineer",
        "Airbnb",
        "May 2018 – Feb 2021",
      ].join("\n"),
    );

    expect(resume.experience).toHaveLength(2);
    expect(resume.experience[0]?.company).toBe("Stripe");
    expect(resume.experience[0]?.position).toBe("Senior Frontend Engineer");
    expect(resume.experience[1]?.company).toBe("Airbnb");
    expect(uncertain.map((u) => u.value)).not.toContain("Airbnb");
  });
});

describe("deterministic education grouping", () => {
  /** Full deterministic chain: text → blocks → facts → overlay → schema. */
  const map = (text: string) => {
    const record = buildDocumentRecord([text], { sourceType: "text" });
    const facts = extractEvidenceFacts(record.blocks);
    const result = mapEvidenceToResume(rawToResume(text), facts);
    return { ...result, resume: parseResumeJson(result.resume), facts };
  };

  it("A: institution + degree + date become ONE education entry", () => {
    const { resume, changed } = map(
      [
        "Jane Doe",
        "EDUCATION",
        "University of California, Berkeley",
        "B.S. Computer Science",
        "2015 – 2019",
      ].join("\n"),
    );

    expect(resume.education).toHaveLength(1);
    expect(resume.education[0]).toMatchObject({
      school: "University of California, Berkeley",
      degree: "B.S. Computer Science",
      year: "2015 – 2019",
      field: "",
    });
    expect(changed).toContain("education");
  });

  it("B: two institutions become exactly two education entries, in order", () => {
    const { resume } = map(
      [
        "Jane Doe",
        "EDUCATION",
        "University of California, Berkeley",
        "B.A. Economics",
        "2016 – 2020",
        "Stanford University",
        "M.S. Accounting",
        "2013 – 2015",
      ].join("\n"),
    );

    expect(resume.education).toHaveLength(2);
    expect(resume.education.map((e) => e.school)).toEqual([
      "University of California, Berkeley",
      "Stanford University",
    ]);
    expect(resume.education[1]?.degree).toBe("M.S. Accounting");
  });

  it("C: degree and an explicitly-written field are both preserved", () => {
    const { resume } = map(
      [
        "Jane Doe",
        "EDUCATION",
        "University of Michigan",
        "Master of Science",
        "Field: Data Science",
        "2018 – 2022",
      ].join("\n"),
    );

    expect(resume.education).toHaveLength(1);
    expect(resume.education[0]).toMatchObject({
      school: "University of Michigan",
      degree: "Master of Science",
      field: "Data Science",
    });
  });

  it("D: dates stay attached to the correct institution", () => {
    const { resume } = map(
      [
        "Jane Doe",
        "EDUCATION",
        "Cornell University",
        "2014 – 2018",
        "University of Pennsylvania",
        "2019 – 2023",
      ].join("\n"),
    );

    expect(resume.education).toHaveLength(2);
    expect(resume.education.map((e) => e.year)).toEqual([
      "2014 – 2018",
      "2019 – 2023",
    ]);
  });

  it("E: ambiguous prose is preserved as evidence, never an education entry", () => {
    const result = map(
      [
        "Abigail Chen",
        "EDUCATION",
        "Pursued rigorous coursework in applied machine learning and statistics.",
      ].join("\n"),
    );

    expect(result.resume.education).toHaveLength(0);
    expect(result.uncertain.length).toBeGreaterThan(0);
    expect(
      result.uncertain.some((f) =>
        f.value.includes("Pursued rigorous coursework in applied machine learning"),
      ),
    ).toBe(true);
  });

  it("F: provenance survives on preserved education evidence", () => {
    const result = map(
      [
        "Abigail Chen",
        "EDUCATION",
        "Lifelong learning and self-study across distributed systems.",
      ].join("\n"),
    );

    const fact = result.uncertain.find(
      (f) => f.type === "education" && f.provenance.section === "education",
    );
    expect(fact).toBeTruthy();
    if (fact) {
      expect(fact.provenance.blockId).toMatch(/^blk_/);
      expect(fact.provenance.line).toBeGreaterThan(0);
      expect(fact.source).toContain("distributed systems");
      expect(fact.id).toMatch(/^fact_/);
    }
  });

  it("G: running the same input twice produces identical education output", () => {
    const text = [
      "Jane Doe",
      "EDUCATION",
      "University of Michigan",
      "Master of Science",
      "Field: Data Science",
      "2018 – 2022",
    ].join("\n");

    const run = () => {
      const record = buildDocumentRecord([text], { sourceType: "text" });
      const facts = extractEvidenceFacts(record.blocks);
      return groupEducationEntries(facts);
    };

    expect(run()).toEqual(run());
  });

  it("H: experience/contact/link/skill behavior is unchanged alongside education", () => {
    const { resume, changed } = map(
      [
        "Jane Doe",
        "jane.doe@example.com | linkedin.com/in/janedoe",
        "SKILLS",
        "React, TypeScript",
        "WORK EXPERIENCE",
        "Acme Corp",
        "Senior Engineer",
        "Mar 2021 – Present",
        "• Built platform",
        "EDUCATION",
        "University of California, Berkeley",
        "B.S. Computer Science",
        "2015 – 2019",
      ].join("\n"),
    );

    expect(resume.name).toBe("Jane Doe");
    expect(resume.email).toBe("jane.doe@example.com");
    expect(resume.social.linkedin).toBe("linkedin.com/in/janedoe");
    expect(resume.skills.map((s) => s.name)).toEqual(["React", "TypeScript"]);
    expect(resume.experience[0]?.company).toBe("Acme Corp");
    expect(resume.experience[0]?.position).toBe("Senior Engineer");
    expect(resume.education[0]).toMatchObject({
      school: "University of California, Berkeley",
      degree: "B.S. Computer Science",
      year: "2015 – 2019",
    });
    expect(changed).toEqual(
      expect.arrayContaining(["skills", "experience", "education"]),
    );
  });
});

describe("real resume: header location and company/position on the same line", () => {
  const text = [
    "Arvind Chauhan",
    "Senior Data Engineer",
    "Mumbai, India carvind35@gmail.com 9226232697",
    "linkedin.com/in/arvind-chauhan-bb3a75148 github.com/arvind-data-engineer",
    "SKILLS",
    "Python, SQL, Apache Spark, Databricks, Azure, Kafka",
    "WORK EXPERIENCE",
    "Usher Technologies – AI/ML Engineer Apr 2024 – Present",
    "- Develop and deploy AI/ML models for predicting demand, churn and fraud.",
  ].join("\n");

  it("extracts the Mumbai location as a contact fact alongside email/phone", () => {
    const record = buildDocumentRecord([text], { sourceType: "text" });
    const facts = extractEvidenceFacts(record.blocks);
    const contacts = facts.filter((f) => f.type === "contact").map((f) => f.value);
    expect(contacts).toContain("Mumbai, India");
    expect(contacts).toContain("carvind35@gmail.com");
    expect(contacts).toContain("9226232697");
  });

  it("maps the header location into resume.address", () => {
    const record = buildDocumentRecord([text], { sourceType: "text" });
    const facts = extractEvidenceFacts(record.blocks);
    const { resume, changed } = mapEvidenceToResume({}, facts);
    expect(resume.address).toBe("Mumbai, India");
    expect(changed).toContain("address");
  });

  it("splits 'Usher Technologies – AI/ML Engineer' into company + position", () => {
    const record = buildDocumentRecord([text], { sourceType: "text" });
    const facts = extractEvidenceFacts(record.blocks);
    const { resume } = mapEvidenceToResume({}, facts);
    const entries = Array.isArray(resume.experience) ? resume.experience : [];
    const entry = entries.find((e) => (e as Record<string, unknown>).company === "Usher Technologies") as Record<string, unknown> | undefined;
    expect(entry).toBeTruthy();
    expect(entry?.position).toBe("AI/ML Engineer");
  });
});