import { describe, it, expect } from "vitest";
import { Packer } from "docx";
import {
  buildDocx,
  wordFontName,
  applyHeadingCase,
  pxToTwips,
  BULLET_GLYPHS,
  type DocxResumeData,
} from "@/lib/export-docx";
import { resolveStyleConfig, resolveHeadingHex, DEFAULT_STYLE_CONFIG } from "@/lib/resume-design-system/style-config";

const SAMPLE: DocxResumeData = {
  name: "Jordan Rivera",
  title: "Senior Product Engineer",
  email: "jordan@example.com",
  phone: "+1 555 0100",
  summary: "Product engineer with 8+ years shipping web platforms.",
  social: { linkedin: "linkedin.com/in/jordanrivera", github: "github.com/jordanrivera" },
  experience: [
    {
      id: 1,
      position: "Staff Engineer",
      company: "Acme Corp",
      location: "Remote",
      duration: "2021 – Present",
      description: "• Led platform migrations\n- Cut deploy times by 40%",
    },
  ],
  education: [{ id: 1, school: "State University", degree: "B.Sc.", field: "Computer Science", year: "2016" }],
  skills: [{ id: 1, name: "TypeScript", level: "Expert" }],
  projects: [{ id: 1, name: "Patorbit", tech: "Next.js", description: "• Resume builder" }],
  certifications: [{ id: 1, name: "AWS Solutions Architect", issuer: "Amazon" }],
};

describe("wordFontName — curated font id → Word font name", () => {
  it("maps every curated font id", () => {
    expect(wordFontName("jakarta")).toBe("Plus Jakarta Sans");
    expect(wordFontName("inter")).toBe("Inter");
    expect(wordFontName("playfair")).toBe("Playfair Display");
    expect(wordFontName("garamond")).toBe("EB Garamond");
    expect(wordFontName("mono")).toBe("JetBrains Mono");
  });

  it("falls back to Inter for unknown ids — never a silent wrong font", () => {
    expect(wordFontName("comic-sans" as string)).toBe("Inter");
  });
});

describe("applyHeadingCase", () => {
  it("uppercases only via the allCaps run flag (text untouched)", () => {
    expect(applyHeadingCase("Senior Engineer", "uppercase")).toBe("Senior Engineer");
  });

  it("title-cases the heading text", () => {
    expect(applyHeadingCase("senior engineer", "title-case")).toBe("Senior Engineer");
  });

  it("leaves normal headings untouched", () => {
    expect(applyHeadingCase("Senior Engineer", "normal")).toBe("Senior Engineer");
  });
});

describe("pxToTwips", () => {
  it("converts 96dpi px to twentieths of a point", () => {
    expect(pxToTwips(40)).toBe(600);
    expect(pxToTwips(24)).toBe(360);
    expect(pxToTwips(48)).toBe(720);
  });
});

describe("BULLET_GLYPHS", () => {
  it("offers the four curated bullet glyphs", () => {
    expect(BULLET_GLYPHS.bullet).toBe("•");
    expect(BULLET_GLYPHS.circle).toBe("◦");
    expect(BULLET_GLYPHS.dash).toBe("–");
    expect(BULLET_GLYPHS.square).toBe("▪");
  });
});

describe("buildDocx — style config drives the generated document", () => {
  it("produces a valid document buffer with the default config", async () => {
    const doc = buildDocx(SAMPLE, resolveStyleConfig());
    const buffer = await Packer.toBuffer(doc);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("resolves the heading sentinel to a concrete hex before DOCX", () => {
    const resolved = resolveStyleConfig({ headingColor: "accent", accentColor: "#059669" });
    expect(resolveHeadingHex(resolved)).toBe("#059669");
    const ink = resolveStyleConfig({ headingColor: "ink" });
    expect(resolveHeadingHex(ink)).toBe("#0f172a");
  });

  it("clamps out-of-range values to ATS-safe bounds (no arbitrary input)", () => {
    const resolved = resolveStyleConfig({
      fontScale: 3,
      lineHeight: 0.2,
      pageMargin: 500,
      sectionSpacing: 0,
      entrySpacing: -10,
      fontFamily: "nope",
    });
    expect(resolved.fontScale).toBe(1.1);
    expect(resolved.lineHeight).toBe(1.4);
    expect(resolved.pageMargin).toBe(48);
    expect(resolved.sectionSpacing).toBe(16);
    expect(resolved.entrySpacing).toBe(8);
    expect(resolved.fontFamily).toBe(DEFAULT_STYLE_CONFIG.fontFamily);
  });

  it("applies custom font, colors, heading style, bullet style, spacing, and margins without crashing", async () => {
    const resolved = resolveStyleConfig({
      fontFamily: "garamond",
      accentColor: "#7f1d1d",
      headingColor: "accent",
      bodyColor: "#4b5563",
      headingStyle: "uppercase",
      headingWeight: "semibold",
      bulletStyle: "dash",
      sectionSpacing: 32,
      entrySpacing: 20,
      pageMargin: 48,
    });
    const doc = buildDocx(SAMPLE, resolved);
    const buffer = await Packer.toBuffer(doc);
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
