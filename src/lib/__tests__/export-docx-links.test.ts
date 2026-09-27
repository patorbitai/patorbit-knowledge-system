"use strict";

/**
 * M4 Phase 5 — DOCX hyperlink RELATIONSHIPS (not visible text).
 *
 * The exported .docx must contain real external hyperlink relationships for
 * LinkedIn, GitHub, Website, Portfolio and a mailto: for email / tel: for
 * phone — verified by unzipping the generated document and inspecting
 * word/_rels/document.xml.rels and word/document.xml. This is the
 * regression guard against a DOCX that "shows" a URL as plain text.
 */

import { describe, it, expect } from "vitest";
import { Packer } from "docx";
import JSZip from "jszip";
import { buildDocx, type DocxResumeData } from "@/lib/export-docx";
import { DEFAULT_STYLE_CONFIG } from "@/lib/resume-design-system/style-config";

const LINKEDIN = "linkedin.com/in/jordanrivera";
const GITHUB = "github.com/jordanrivera";
const WEBSITE = "jordanrivera.dev";
const PORTFOLIO = "jordanrivera.dev/work";
const EMAIL = "jordan.rivera@example.com";
const PHONE = "+1 (415) 555-0184";

const RESUME: DocxResumeData = {
  name: "Jordan Rivera",
  title: "Senior Platform Engineer",
  email: EMAIL,
  phone: PHONE,
  address: "San Francisco, CA",
  summary: "Platform engineer with a decade of experience.",
  social: {
    linkedin: LINKEDIN,
    github: GITHUB,
    website: WEBSITE,
    portfolio: PORTFOLIO,
    twitter: "",
    stackoverflow: "",
  },
  experience: [
    {
      id: "e1",
      company: "Northwind Labs",
      position: "Staff Platform Engineer",
      location: "San Francisco, CA",
      duration: "2021 – Present",
      bulletPoints: ["Built payment platform"],
    },
  ],
};

async function unzipDocx(data: DocxResumeData): Promise<{ rels: string; docXml: string }> {
  const doc = buildDocx(data, DEFAULT_STYLE_CONFIG);
  const buffer = await Packer.toBuffer(doc);
  const zip = await JSZip.loadAsync(buffer);
  const relsFile = zip.file("word/_rels/document.xml.rels");
  const docFile = zip.file("word/document.xml");
  expect(relsFile, "word/_rels/document.xml.rels must exist").toBeTruthy();
  expect(docFile, "word/document.xml must exist").toBeTruthy();
  return {
    rels: await relsFile!.async("string"),
    docXml: await docFile!.async("string"),
  };
}

describe("DOCX hyperlink relationships (M4 Phase 5)", () => {
  it("emits an external hyperlink relationship for every social link", async () => {
    const { rels } = await unzipDocx(RESUME);

    expect(rels).toContain('TargetMode="External"');
    // Bare values are normalized to absolute https URLs before export.
    expect(rels).toContain('Target="https://linkedin.com/in/jordanrivera"');
    expect(rels).toContain('Target="https://github.com/jordanrivera"');
    expect(rels).toContain('Target="https://jordanrivera.dev"');
    expect(rels).toContain('Target="https://jordanrivera.dev/work"');

    const hyperlinkRels = rels.match(/relationships\/hyperlink/g) ?? [];
    expect(hyperlinkRels.length).toBeGreaterThanOrEqual(4);
  });

  it("emits mailto: for email and tel: for phone", async () => {
    const { rels } = await unzipDocx(RESUME);
    expect(rels).toContain(`Target="mailto:${EMAIL}"`);
    expect(rels).toContain('Target="tel:+14155550184"');
  });

  it("emits w:hyperlink elements with clean URL display text (ATS-safe)", async () => {
    const { docXml } = await unzipDocx(RESUME);
    expect(docXml).toContain("<w:hyperlink");
    // Display text mirrors the preview: clean URL labels, raw email/phone.
    expect(docXml).toContain("linkedin.com/in/jordanrivera");
    expect(docXml).toContain("github.com/jordanrivera");
    expect(docXml).toContain(EMAIL);
  });

  it("blocks unsafe schemes — javascript:/data: never become relationships", async () => {
    const { rels, docXml } = await unzipDocx({
      ...RESUME,
      email: "jordan@example.com",
      social: {
        linkedin: "javascript:alert(1)",
        github: "data:text/html,x",
        website: "",
        portfolio: "",
        twitter: "",
        stackoverflow: "",
      },
    });
    expect(rels).not.toContain("javascript:");
    expect(rels).not.toContain("Target=\"data:");
    // The unsafe values are demoted to plain text runs — visible, not clickable.
    expect(docXml).toContain("javascript:alert(1)");
    expect(docXml).toContain("data:text/html,x");
  });
});
