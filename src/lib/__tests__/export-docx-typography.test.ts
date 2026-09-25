"use strict";

/**
 * Regression E — the typography configuration reaches the exported DOCX:
 *   - Text size tier (fontScale) multiplies every run size,
 *   - Heading size tier (headingScale) multiplies name + section headings,
 *   - readable base sizes (body 21 half-points = 10.5pt, sections 22 = 11pt,
 *     name 44 = 22pt) mirror the preview's 14px / 15px / ~33px on the 96dpi A4.
 *
 * The XML is unzipped so assertions run against what Word actually receives.
 */

import { describe, it, expect } from "vitest";
import { inflateRawSync } from "zlib";
import { Packer } from "docx";
import { buildDocx, type DocxResumeData } from "@/lib/export-docx";
import { resolveStyleConfig, DEFAULT_STYLE_CONFIG } from "@/lib/resume-design-system/style-config";

/** Minimal ZIP reader (docx = zip): locate entry, inflate, return text. */
function unzipEntry(buf: Buffer, entryName: string): string {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("ZIP: EOCD not found");
  const cdCount = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < cdCount; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error("ZIP: bad CD");
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString("utf8", off + 46, off + 46 + nameLen);
    if (name === entryName) {
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const dataStart = localOff + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(dataStart, dataStart + compSize);
      return (method === 8 ? inflateRawSync(data) : Buffer.from(data)).toString("utf8");
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`ZIP: entry ${entryName} not found`);
}

const DATA: DocxResumeData = {
  name: "Jordan Lee",
  title: "Senior Software Engineer",
  email: "jordan@example.com",
  summary: "Engineer with a decade of experience building reliable systems.",
  experience: [
    {
      id: "x1",
      company: "Acme Corp",
      position: "Senior Engineer",
      duration: "2020–Present",
      description: "Led migration of billing platform\nCut p99 latency 45%",
    },
  ],
  education: [{ id: "e1", school: "State University", degree: "BSc", field: "CS", year: "2015" }],
  skills: [{ id: "s1", name: "TypeScript" }],
};

async function documentXml(overrides: Partial<Parameters<typeof resolveStyleConfig>[0]>): Promise<string> {
  const style = resolveStyleConfig({ ...DEFAULT_STYLE_CONFIG, ...overrides });
  const doc = buildDocx(DATA, style);
  const buf = await Packer.toBuffer(doc);
  return unzipEntry(buf, "word/document.xml");
}

function hasSize(xml: string, halfPoints: number): boolean {
  return xml.includes(`<w:sz w:val="${halfPoints}"/>`) || xml.includes(`<w:sz w:val="${halfPoints}"`);
}

describe("DOCX typography parity (regression E)", () => {
  it("uses readable base sizes at the default config (10.5pt body, 11pt sections, 22pt name)", async () => {
    const xml = await documentXml({});
    expect(hasSize(xml, 21)).toBe(true); // body / bullets — 10.5pt
    expect(hasSize(xml, 22)).toBe(true); // section headings — 11pt
    expect(hasSize(xml, 44)).toBe(true); // name — 22pt
  });

  it("multiplies every run by the Text size tier (Large 1.1)", async () => {
    const xml = await documentXml({ fontScale: 1.1 });
    // sz() = round(base * 1.1)
    expect(hasSize(xml, 23)).toBe(true); // body 21 * 1.1 = 23.1 → 23
    expect(hasSize(xml, 24)).toBe(true); // sections 22 * 1.1 = 24.2 → 24
    expect(hasSize(xml, 48)).toBe(true); // name 44 * 1.1 = 48.4 → 48
    // Unscaled section headings are gone — one configuration for both.
    expect(hasSize(xml, 22)).toBe(false);
  });

  it("scales name + section headings with the Heading size tier", async () => {
    const prominent = await documentXml({ headingScale: "prominent" });
    expect(hasSize(prominent, 51)).toBe(true); // name 44 * 1.15 = 50.6 → 51
    expect(hasSize(prominent, 25)).toBe(true); // sections 22 * 1.15 = 25.3 → 25
    expect(hasSize(prominent, 21)).toBe(true); // body untouched by heading tier

    const compact = await documentXml({ headingScale: "compact" });
    expect(hasSize(compact, 40)).toBe(true); // name 44 * 0.9 = 39.6 → 40
    expect(hasSize(compact, 20)).toBe(true); // sections 22 * 0.9 = 19.8 → 20
    expect(hasSize(compact, 21)).toBe(true); // body untouched
  });

  it("combines both tiers multiplicatively", async () => {
    const xml = await documentXml({ fontScale: 1.1, headingScale: "prominent" });
    expect(hasSize(xml, 23)).toBe(true); // body 21 * 1.1
    expect(hasSize(xml, 56)).toBe(true); // name 44 * 1.15 * 1.1 = 55.66 → 56
  });
});

describe("DOCX content parity — nothing silently dropped vs the preview", () => {
  const FIXTURE: DocxResumeData = {
    name: "Bullet Parity",
    experience: [
      {
        id: "x1",
        company: "Acme Corp",
        position: "Engineer",
        description: "One-line role summary",
        bulletPoints: ["Shipped feature A", "Cut latency 40%", "Mentored 3 engineers"],
      },
    ],
    education: [
      { id: "e1", school: "State University", degree: "BSc", field: "CS", year: "2015", gpa: "3.8", honors: "Cum Laude", location: "San Jose, CA" },
    ],
    projects: [
      { id: "p1", name: "OpenMetrics", role: "Maintainer", tech: "Go, PromQL", startDate: "2022", endDate: "2024", description: "TSDB sidecar", bulletPoints: ["Adopted by 40 teams"] },
    ],
  };

  async function xmlFor(data: DocxResumeData): Promise<string> {
    const style = resolveStyleConfig(DEFAULT_STYLE_CONFIG);
    const buf = await Packer.toBuffer(buildDocx(data, style));
    return unzipEntry(buf, "word/document.xml");
  }

  it("renders EVERY experience bulletPoint (the preview's <ul> list)", async () => {
    const xml = await xmlFor(FIXTURE);
    expect(xml).toContain("Shipped feature A");
    expect(xml).toContain("Cut latency 40%");
    expect(xml).toContain("Mentored 3 engineers");
    expect(xml).toContain("One-line role summary"); // description still renders too
  });

  it("renders education gpa, honors and location", async () => {
    const xml = await xmlFor(FIXTURE);
    expect(xml).toContain("GPA 3.8");
    expect(xml).toContain("Cum Laude");
    expect(xml).toContain("San Jose, CA");
  });

  it("renders project role, dates and bulletPoints", async () => {
    const xml = await xmlFor(FIXTURE);
    expect(xml).toContain("Maintainer");
    expect(xml).toContain("2022 – 2024");
    expect(xml).toContain("Adopted by 40 teams");
  });
});
