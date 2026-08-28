"use strict";

/**
 * Deterministic section-heading detection.
 *
 * Rules are lexicon + structural heuristics only. An exact-ish match against a
 * known section-name variant (case-insensitive, tolerant of leading bullets /
 * numbers and a trailing colon) wins; otherwise a "looks like a heading" guard
 * classifies the line as `custom` and its text is preserved verbatim. Section
 * order is never assumed; unknown and custom sections are never discarded.
 */

import type { SectionKind } from "./types";

/** Recognised section-name variants, against a normalised lowercase title. */
const SECTION_ALIASES: { kind: SectionKind; aliases: readonly string[] }[] = [
  {
    kind: "contact",
    aliases: ["contact", "contact information", "contact details", "get in touch", "reach me"],
  },
  {
    kind: "summary",
    aliases: [
      "summary", "professional summary", "career summary", "summary of qualifications",
      "qualifications summary", "profile", "professional profile", "objective",
      "career objective", "about", "about me", "personal statement", "executive summary",
    ],
  },
  {
    kind: "experience",
    aliases: [
      "experience", "work experience", "professional experience", "employment experience",
      "employment history", "work history", "professional history", "career history",
      "relevant experience", "professional background", "employment", "work",
    ],
  },
  {
    kind: "education",
    aliases: [
      "education", "academic background", "academic history", "academics",
      "education and training", "educational background", "university education",
      "college education",
    ],
  },
  {
    kind: "skills",
    aliases: [
      "skills", "technical skills", "core skills", "core competencies", "competencies",
      "technical competencies", "tech stack", "technology stack", "technologies",
      "technical expertise", "key skills", "areas of expertise", "tools",
      "skills and abilities", "skills & abilities",
    ],
  },
  {
    kind: "projects",
    aliases: [
      "projects", "project experience", "selected projects", "technical projects",
      "personal projects", "professional projects", "featured projects", "key projects",
    ],
  },
  {
    kind: "certifications",
    aliases: [
      "certifications", "certification", "certificates", "licenses",
      "licenses & certifications", "licenses and certifications",
      "professional certifications", "certifications and licenses",
      "certifications & awards", "certifications and awards",
      "certificates & awards", "certificates and awards",
      "certifications, awards", "certifications and awards and honors",
    ],
  },
  {
    kind: "languages",
    aliases: ["languages", "language skills", "language proficiency", "language"],
  },
  {
    kind: "achievements",
    aliases: [
      "achievements", "awards", "awards and honors", "awards and recognition",
      "honors and awards", "honors", "accomplishments", "recognition",
    ],
  },
  {
    kind: "interests",
    aliases: ["interests", "hobbies", "hobbies and interests", "interests and hobbies", "personal"],
  },
  {
    kind: "references",
    aliases: ["references", "professional references", "personal references"],
  },
  {
    kind: "portfolio",
    aliases: ["portfolio", "work samples", "featured work", "online presence", "links", "websites"],
  },
];

/** Strip leading bullets/numbers and trailing colons; collapse whitespace. */
function normalize(line: string): string {
  return line
    .trim()
    .replace(/^[\s•·▪◦∙\-\–—\d.)]+[:,\s]*/, "")
    .replace(/[:;]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cheap guard: a heading is short and is not ending-sentence punctuation. */
function headingShape(title: string): boolean {
  if (title.length > 60) return false;
  if (/[.!?]$/.test(title)) return false;
  if (/^\d/.test(title)) return false;
  return true;
}

/** True for an all-caps multi-word line that reads as a header. */
function looksCustom(title: string): boolean {
  if (!headingShape(title)) return false;
  if (/\d/.test(title)) return false; // avoid dates / numeric lists / "100%"
  if (/[,;]/.test(title)) return false; // avoid inline comma lists (skills, tags)
  return /^[A-Z][A-Z'’-]*(?:\s+[A-Z][A-Z'’-]*){0,4}$/.test(title);
}

/**
 * Collapse PDF letter-spacing: "SK I L L S" → "skills".
 * Only processes short, all-uppercase lines with 3+ space-separated tokens
 * that collapse into a known section alias.
 */
function collapseSpacedHeader(title: string): string {
  if (title.length > 40 || !/^[A-Z][A-Z'\u2019\- ]+$/.test(title)) return title;
  const tokens = title.split(/\s+/);
  if (tokens.length < 3) return title;
  const collapsed = tokens.join("");
  const norm = collapsed.toLowerCase();
  for (const { aliases } of SECTION_ALIASES) {
    for (const a of aliases) {
      if (norm === a || norm.startsWith(`${a}:`)) return collapsed;
    }
  }
  return title;
}

/**
 * Classify a raw line as a section heading. Returns the recognised kind, or
 * `"custom"` when the line looks like a heading but matches no known alias, or
 * `null` when the line is ordinary content. Never throws away the source line.
 */
export function detectSectionKind(line: string): SectionKind | null {
  const raw = normalize(line);
  if (!raw) return null;
  if (!headingShape(raw)) return null;
  // Collapse PDF letter-spacing before matching aliases
  const title = collapseSpacedHeader(raw);

  const norm = title.toLowerCase();
  for (const { kind, aliases } of SECTION_ALIASES) {
    for (const a of aliases) {
      if (norm === a || norm.startsWith(`${a}:`)) return kind;
      // Compound phrases like "professional work experience" — the alias is a
      // tail phrase whose leading words come from a small heading-word set,
      // so body sentences ("10+ years of experience") never match.
      const phrase = ` ${a}`;
      if (norm.endsWith(phrase)) {
        const head = norm.slice(0, -phrase.length).trim();
        const words = head.split(/\s+/).filter(Boolean);
        if (words.length <= 2 && words.every((w) => HEADING_WORDS.has(w))) return kind;
      }
    }
  }

  if (looksCustom(title)) return "custom";
  return null;
}

/** Words that can preface a compound section heading ("Professional ..."). */
const HEADING_WORDS = new Set([
  "professional", "work", "employment", "career", "academic", "technical",
  "core", "key", "selected", "featured", "relevant", "personal", "project",
  "related", "training", "additional", "extracurricular", "online", "referee",
]);

/**
 * Normalise a section heading for display while preserving the verbatim text
 * (strips leading bullets/numbers and a trailing colon only).
 */
export function normalizeSectionTitle(line: string): string {
  return normalize(line);
}