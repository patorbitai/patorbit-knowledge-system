/**
 * DOCX builder — maps the SAME resolved ResumeStyleConfig the user sees in
 * Professional Preview onto the generated Word document, as closely as the
 * .docx format supports. This is not a second styling system: it consumes the
 * shared config values (font family, colors, heading style/weight, bullet
 * style, spacing, page margins) and translates them into docx primitives.
 *
 * The module is intentionally server-safe (no React, no "use client") so the
 * API route can import it directly.
 */

import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  ExternalHyperlink,
  type ISectionOptions,
  type ILevelsOptions,
  type ParagraphChild,
} from "docx";
import type { ResumeStyleConfig } from "@/lib/resume-design-system/style-config";

/* ── Input types ── */

export interface DocxSocial {
  linkedin?: string;
  github?: string;
  website?: string;
  twitter?: string;
  portfolio?: string;
  stackoverflow?: string;
}

export interface DocxResumeData {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  address?: string;
  nationality?: string;
  pronouns?: string;
  summary?: string;
  social?: DocxSocial;
  experience?: {
    id: number | string;
    company?: string;
    position?: string;
    location?: string;
    duration?: string;
    description?: string;
  }[];
  education?: {
    id: number | string;
    school?: string;
    degree?: string;
    year?: string;
    field?: string;
  }[];
  skills?: { id: number | string; name?: string; level?: string; category?: string; years?: string }[];
  projects?: { id: number | string; name?: string; description?: string; tech?: string; link?: string }[];
  certifications?: { id: number | string; name?: string; issuer?: string; date?: string }[];
}

/* ── Config translation (defensive; values were already resolved/clamped
      client-side via resolveStyleConfig, but the route can be hit directly) ── */

/** Word font name for a curated font id. Falls back to Inter. */
export function wordFontName(fontFamily: string): string {
  const map: Record<string, string> = {
    jakarta: "Plus Jakarta Sans",
    inter: "Inter",
    playfair: "Playfair Display",
    garamond: "EB Garamond",
    mono: "JetBrains Mono",
  };
  return map[fontFamily] ?? "Inter";
}

function hexColor(color: string, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.slice(1) : fallback;
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

/** px → twentieths of a point (twips). 96px = 1in = 1440 twips → 1px = 15 twips. */
export const pxToTwips = (px: number) => Math.round(px * 15);

/** Applies the configured heading case to a heading string for DOCX. */
export function applyHeadingCase(text: string, style: ResumeStyleConfig["headingStyle"]): string {
  if (style === "uppercase") return text;
  if (style === "title-case") return text.replace(/\b\w/g, (c) => c.toUpperCase());
  return text;
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const BULLET_GLYPHS: Record<string, string> = {
  bullet: "•",
  circle: "◦",
  dash: "–",
  square: "▪",
};

/* ── Builder ── */

export function buildDocx(data: DocxResumeData, style: ResumeStyleConfig): Document {
  const font = wordFontName(style.fontFamily);
  const scale = clamp(style.fontScale, 0.9, 1.1, 1);
  const accent = hexColor(style.accentColor, "0ea5e9");
  const headingHex = hexColor(style.headingColor, "0f172a");
  const body = hexColor(style.bodyColor, "374151");
  const muted = body;
  const sectionSpacing = pxToTwips(clamp(style.sectionSpacing, 16, 32, 24));
  const entrySpacing = pxToTwips(clamp(style.entrySpacing, 8, 20, 16));
  const pageMargin = pxToTwips(clamp(style.pageMargin, 24, 48, 40));
  const line = Math.round(clamp(style.lineHeight, 1.4, 1.8, 1.6) * 240);
  const headingCaps = style.headingStyle === "uppercase";
  const headingBold = style.headingWeight === "semibold" || style.headingWeight === "bold";
  const bulletGlyph = BULLET_GLYPHS[style.bulletStyle] ?? BULLET_GLYPHS.bullet;

  const sz = (halfPoints: number) => Math.max(8, Math.round(halfPoints * scale));

  const headingRun = (text: string, size: number, color: string): TextRun =>
    new TextRun({
      text: applyHeadingCase(text, style.headingStyle),
      bold: headingBold,
      allCaps: headingCaps,
      size: sz(size),
      font,
      color,
    });

  const bodyRun = (text: string, size = 20, color = body): TextRun =>
    new TextRun({ text, size: sz(size), font, color });

  const children: Paragraph[] = [];

  // ── Header ──
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60, line },
      children: [headingRun(data.name || "Your Name", 32, headingHex)],
    }),
  );

  if (data.title) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80, line },
        children: [bodyRun(data.title, 22, muted)],
      }),
    );
  }

  // Contact line — LinkedIn/GitHub become real hyperlinks where present.
  const contactChildren: ParagraphChild[] = [];
  const pushContact = (text: string, link?: string) => {
    const run = bodyRun(text, 18, muted);
    contactChildren.push(
      link
        ? new ExternalHyperlink({ link, children: [run] })
        : run,
    );
  };
  let firstContact = true;
  const addContact = (text: string, link?: string) => {
    if (!text) return;
    if (!firstContact) pushContact("  |  ");
    firstContact = false;
    pushContact(text, link);
  };
  addContact(data.email || "");
  addContact(data.phone || "");
  addContact(data.address || "");
  addContact(data.nationality || "");
  const linkedin = data.social?.linkedin ? normalizeUrl(data.social.linkedin) : "";
  const github = data.social?.github ? normalizeUrl(data.social.github) : "";
  if (linkedin) addContact("LinkedIn", linkedin);
  if (github) addContact("GitHub", github);
  if (contactChildren.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120, line },
        children: contactChildren,
      }),
    );
  }

  // ── Helper: Section Headers ──
  function addSection(title: string) {
    children.push(
      new Paragraph({
        spacing: { before: sectionSpacing, after: 40, line },
        border: { bottom: { color: accent, size: 6, style: BorderStyle.SINGLE, space: 4 } },
        children: [headingRun(title, 20, headingHex)],
      }),
    );
  }

  /** Bulleted list paragraphs — glyph driven by the selected bulletStyle. */
  function addBullets(text: string, after = entrySpacing) {
    if (!text) return;
    for (const rawLine of text.split("\n")) {
      const lineText = rawLine.replace(/^[•◦▪–\-*]\s*/, "").trim();
      if (!lineText) continue;
      children.push(
        new Paragraph({
          numbering: { reference: "styled-bullets", level: 0 },
          spacing: { after, line },
          children: [bodyRun(lineText)],
        }),
      );
    }
  }

  // ── Summary ──
  if (data.summary) {
    addSection("SUMMARY");
    children.push(
      new Paragraph({
        spacing: { after: sectionSpacing, line },
        children: [bodyRun(data.summary)],
      }),
    );
  }

  // ── Experience ──
  if (data.experience?.length) {
    addSection("EXPERIENCE");
    for (const exp of data.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 20, line },
          children: [
            headingRun(exp.position || "", 21, headingHex),
            ...(exp.company ? [bodyRun(`  at ${exp.company}`, 20, muted)] : []),
            ...(exp.duration ? [bodyRun(`  (${exp.duration})`, 18, muted)] : []),
          ],
        }),
      );
      if (exp.location) {
        children.push(
          new Paragraph({
            spacing: { after: 20, line },
            children: [bodyRun(exp.location, 18, muted)],
          }),
        );
      }
      if (exp.description) addBullets(exp.description, entrySpacing);
      children.push(new Paragraph({ spacing: { after: entrySpacing } }));
    }
  }

  // ── Education ──
  if (data.education?.length) {
    addSection("EDUCATION");
    for (const edu of data.education) {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 20, line },
          children: [
            headingRun(edu.school || "", 21, headingHex),
            ...(edu.degree ? [bodyRun(`  — ${edu.degree}${edu.field ? `, ${edu.field}` : ""}`, 20, muted)] : []),
          ],
        }),
      );
      if (edu.year) {
        children.push(
          new Paragraph({
            spacing: { after: entrySpacing, line },
            children: [bodyRun(edu.year, 18, muted)],
          }),
        );
      }
    }
  }

  // ── Skills ──
  if (data.skills?.length) {
    addSection("SKILLS");
    const skillText = data.skills
      .slice(0, 8)
      .map((s) => `${s.name || ""}${s.level && s.level !== "Intermediate" ? ` (${s.level})` : ""}`)
      .filter(Boolean)
      .join("  |  ");
    children.push(
      new Paragraph({
        spacing: { after: entrySpacing, line },
        children: [bodyRun(skillText)],
      }),
    );
  }

  // ── Projects ──
  if (data.projects?.length) {
    addSection("PROJECTS");
    for (const proj of data.projects) {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 20, line },
          children: [
            headingRun(proj.name || "", 21, headingHex),
            ...(proj.tech ? [bodyRun(`  | ${proj.tech}`, 20, muted)] : []),
          ],
        }),
      );
      if (proj.description) addBullets(proj.description, entrySpacing);
      children.push(new Paragraph({ spacing: { after: entrySpacing } }));
    }
  }

  // ── Certifications ──
  if (data.certifications?.length) {
    addSection("CERTIFICATIONS");
    for (const cert of data.certifications) {
      children.push(
        new Paragraph({
          spacing: { after: entrySpacing, line },
          children: [
            headingRun(cert.name || "", 20, headingHex),
            ...(cert.issuer ? [bodyRun(`  — ${cert.issuer}`, 20, muted)] : []),
          ],
        }),
      );
    }
  }

  const section: ISectionOptions = {
    properties: {
      page: {
        // The SAME page margin the user configured in Customize (px → twips).
        margin: { top: pageMargin, bottom: pageMargin, left: pageMargin, right: pageMargin },
      },
    },
    children,
  };

  const bulletLevels: ILevelsOptions[] = [
    {
      level: 0,
      format: "bullet",
      text: bulletGlyph,
      alignment: AlignmentType.START,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } },
    },
  ];

  return new Document({
    styles: {
      paragraphStyles: [
        {
          id: "default",
          name: "Default",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font, size: sz(22), color: body },
        },
      ],
    },
    numbering: {
      config: [{ reference: "styled-bullets", levels: bulletLevels }],
    },
    sections: [section],
  });
}
