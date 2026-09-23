"use strict";

/**
 * DOCX ↔ preview parity (§2/§7): buildDocx with a plan must emit sections
 * in the plan's order, honour exclusions, and keep the legacy fixed order
 * when no plan is passed.
 */

import { describe, expect, it } from "vitest";
import { inflateRawSync } from "zlib";
import { Packer } from "docx";
import { buildDocx, type DocxResumeData } from "@/lib/export-docx";
import { buildContentPlan, materializePlan } from "@/lib/resume-planner";
import {
  EARLY_CAREER,
  SENIOR,
  makeMatchFixture,
} from "@/lib/resume-planner/__tests__/fixtures";
import { resolveStyleConfig, DEFAULT_STYLE_CONFIG } from "@/lib/resume-design-system/style-config";

const style = resolveStyleConfig(DEFAULT_STYLE_CONFIG);

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

async function docText(data: DocxResumeData, plan?: Parameters<typeof buildDocx>[2]) {
  const doc = buildDocx(data, style, plan);
  const buf = await Packer.toBuffer(doc);
  const xml = unzipEntry(buf, "word/document.xml");
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

describe("buildDocx plan order", () => {
  it("emits sections in the plan's order (engineering: skills before experience)", async () => {
    const plan = buildContentPlan(TECHNICAL_AS_RESUME(), {
      jobAware: false,
      roleHint: "engineering",
    });
    const data = materializePlan(TECHNICAL_AS_RESUME(), plan);
    const text = await docText(data as unknown as DocxResumeData, plan);
    const skillsIdx = text.indexOf("SKILLS");
    const expIdx = text.indexOf("EXPERIENCE");
    expect(skillsIdx).toBeGreaterThan(-1);
    expect(expIdx).toBeGreaterThan(-1);
    // Engineering strategy: summary → skills → experience
    expect(skillsIdx).toBeLessThan(expIdx);
  });

  it("keeps the legacy order when no plan is passed", async () => {
    const data = EARLY_CAREER as unknown as DocxResumeData;
    const text = await docText(data);
    const expIdx = text.indexOf("EXPERIENCE");
    const eduIdx = text.indexOf("EDUCATION");
    const skillsIdx = text.indexOf("SKILLS");
    expect(expIdx).toBeGreaterThan(-1);
    expect(expIdx).toBeLessThan(eduIdx);
    expect(eduIdx).toBeLessThan(skillsIdx);
  });

  it("drops excluded sections (interests on a job-aware plan)", async () => {
    const plan = buildContentPlan(EARLY_CAREER, {
      qualificationMatch: makeMatchFixture([
        { classification: "PROVEN", requirement: "SQL", evidence: [] },
      ]),
      jobTitle: "Data Analyst",
    });
    expect(plan.excludedSections).toContain("interests");
    const data = materializePlan(EARLY_CAREER, plan);
    const text = await docText(data as unknown as DocxResumeData, plan);
    expect(text.includes("INTERESTS")).toBe(false);
    // Chess/Trail running were the interests
    expect(text).not.toContain("Chess");
  });

  it("renders achievements that the legacy DOCX path dropped entirely", async () => {
    const plan = buildContentPlan(SENIOR, { jobAware: false });
    const data = materializePlan(SENIOR, plan);
    const text = await docText(data as unknown as DocxResumeData, plan);
    expect(text).toContain("ACHIEVEMENTS");
    expect(text).toContain("VP Engineering Award");

    // …and the legacy (no-plan) path still behaves exactly as before.
    const legacy = await docText(SENIOR as unknown as DocxResumeData);
    expect(legacy).not.toContain("ACHIEVEMENTS");
  });
});

/** A resume with summary/skills/experience for order testing. */
function TECHNICAL_AS_RESUME() {
  // Local import-free fixture to keep this file focused on DOCX ordering.
  return {
    ...EARLY_CAREER,
    title: "Software Engineer",
    summary: "Engineer with a decade of platform experience.",
    skills: [
      { id: "s1", name: "Go", level: "Expert" as const, category: "Languages", years: "8" },
      { id: "s2", name: "Kafka", level: "Advanced" as const, category: "Databases", years: "4" },
    ],
    projects: [
      { id: "p1", name: "Flowrate", description: "Stream replay tool", tech: "Rust", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed" as const, bulletPoints: [] },
      { id: "p2", name: "Ledgerd", description: "Ledger service", tech: "Go", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed" as const, bulletPoints: [] },
      { id: "p3", name: "Tracewalk", description: "Trace diffing CLI", tech: "Python", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed" as const, bulletPoints: [] },
      { id: "p4", name: "Kube Lens", description: "Cluster dashboard", tech: "TS", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed" as const, bulletPoints: [] },
      { id: "p5", name: "Edge Lab", description: "CDN experiments", tech: "Go", link: "", startDate: "", endDate: "", role: "", teamSize: "", status: "Completed" as const, bulletPoints: [] },
    ],
  };
}
