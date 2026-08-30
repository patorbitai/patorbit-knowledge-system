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
  // Handle already-collapsed lowercase single-word headers from pdf-extract.ts:
  // e.g. "executivesummary" (produced by collapseLetterSpacing in pdf-extract.ts)
  if (/^[a-z][a-z]+$/.test(title) && title.length < 40) {
    for (const { aliases } of SECTION_ALIASES) {
      for (const a of aliases) {
        const aliasNoSpace = a.replace(/\s+/g, "");
        if (title === a || title === aliasNoSpace || title.startsWith(`${a}:`) || title.startsWith(`${aliasNoSpace}:`)) return title.toUpperCase();
      }
    }
  }
  if (title.length > 40 || !/^[A-Z][A-Z'\u2019\- ]+$/.test(title)) return title;
  const tokens = title.split(/\s+/);
  if (tokens.length < 3) return title;
  const collapsed = tokens.join("");
  const norm = collapsed.toLowerCase();
  for (const { aliases } of SECTION_ALIASES) {
    for (const a of aliases) {
      if (norm === a || norm.startsWith(`${a}:`) || norm.includes(a)) return collapsed;
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
  if (!headingShape(raw)) {
    // Even long lines might START with a section header followed by content.
    // Check if the first ~30 chars of the normalized line match a known alias.
    const prefix = raw.slice(0, 30).toLowerCase();
    for (const { kind, aliases } of SECTION_ALIASES) {
      for (const a of aliases) {
        if (prefix === a || prefix.startsWith(`${a} `) || prefix.startsWith(`${a}:`)) {
          return kind;
        }
      }
    }
    // Also check collapsed spaced-out prefix: "SK I L L S" in a longer line
    const words = raw.split(/\s+/);
    if (words.length >= 3 && words.slice(0, Math.min(words.length, 8)).every(w => /^[A-Z][A-Z'\-]*$/.test(w))) {
      const prefixCollapsed = words.join("").toLowerCase().slice(0, 20);
      for (const { kind, aliases } of SECTION_ALIASES) {
        for (const a of aliases) {
          if (prefixCollapsed === a || prefixCollapsed.startsWith(a)) return kind;
        }
      }
    }
    return null;
  }
  // Collapse PDF letter-spacing before matching aliases
  const title = collapseSpacedHeader(raw);

  const norm = title.toLowerCase();
  // No-space version for matching compound collapsed headers
  // like "executivesummary" (produced by pdf-extract.ts collapseLetterSpacing)
  const normNoSpace = norm.replace(/\s+/g, "");

  for (const { kind, aliases } of SECTION_ALIASES) {
    for (const a of aliases) {
      if (norm === a || norm.startsWith(`${a}:`)) return kind;
      // Match no-space compound headers: "executivesummary" vs "executive summary"
      const aliasNoSpace = a.replace(/\s+/g, "");
      if (normNoSpace === aliasNoSpace || normNoSpace.startsWith(aliasNoSpace)) return kind;
      // Compound phrases like "professional work experience"
      const phrase = ` ${a}`;
      if (norm.endsWith(phrase)) {
        const head = norm.slice(0, -phrase.length).trim();
        const words2 = head.split(/\s+/).filter(Boolean);
        if (words2.length <= 2 && words2.every((w) => HEADING_WORDS.has(w))) return kind;
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
 * Try to split a line where a section header and content are joined together.
 * E.g. "skills Python SQL Azure" → ["skills", "Python SQL Azure"]
 * Or spaced-out: "SK I L L S Python SQL" → ["SK I L L S", "Python SQL"]
 * Returns the original line as a single-element array when no split is possible.
 * Used by buildDocumentBlocks so a merged header+content line still opens a
 * new section block with its content as the first body line.
 */
export function splitHeaderFromContent(line: string): string[] {
  const raw = line.trim();
  if (!raw) return [line];

  // If the whole line is a SHORT header (headingShape passes), no split needed.
  const wholeKind = detectSectionKind(raw);
  if (wholeKind !== null && wholeKind !== "custom" && headingShape(normalize(raw))) return [raw];

  const norm = raw.toLowerCase();

  // Case 1: line starts with a normal section alias followed by content
  // "skills Python SQL Azure" or "technical skills: Python, SQL"
  for (const { aliases } of SECTION_ALIASES) {
    for (const a of aliases) {
      // Try alias + space, alias + colon + space, alias at end of line
      const patterns = [`${a} `, `${a}: `, `${a}:`, ` ${a} `, ` ${a}:`];
      for (const pat of patterns) {
        const idx = norm.indexOf(pat);
        if (idx >= 0) {
          // Check that the text BEFORE the alias looks like heading words
          const prefixWords = norm.slice(0, idx).trim().split(/\s+/).filter(Boolean);
          const isHeadingPrefix = idx === 0 || (idx <= 30 && prefixWords.every(w => {
            const clean = w.replace(/[:;,]+$/, "");
            return HEADING_WORDS.has(clean) || /^[A-Z][A-Z'\-]*$/.test(clean.toUpperCase());
          }));
          if (isHeadingPrefix) {
            const aliasEnd = idx + a.length;
            const rest = raw.slice(aliasEnd).replace(/^[\s:,;]+/, "").trim();
            if (rest && rest.length > 2) {
              return [raw.slice(0, aliasEnd).trim(), rest];
            }
          }
        }
      }
    }
  }

  // Case 2: spaced-out header followed by content: "SK I L L S Python SQL"
  const tokens = raw.split(/\s+/);
  if (tokens.length >= 4) {
    // Check if leading tokens are all short (1-3 chars) uppercase
    let headerEnd = 0;
    for (let i = 0; i < tokens.length; i++) {
      if (/^[A-Z][A-Z'\-]*$/.test(tokens[i]) && tokens[i].length <= 5) {
        headerEnd = i + 1;
      } else {
        break;
      }
    }
    if (headerEnd >= 3) {
      const prefix = tokens.slice(0, headerEnd).join("").toLowerCase();
      for (const { aliases } of SECTION_ALIASES) {
        for (const a of aliases) {
          if (prefix === a || prefix.startsWith(a)) {
            return [tokens.slice(0, headerEnd).join(" "), tokens.slice(headerEnd).join(" ")];
          }
        }
      }
    }
  }

  return [line];
}

/**
 * Normalise a section heading for display while preserving the verbatim text
 * (strips leading bullets/numbers and a trailing colon only).
 */
export function normalizeSectionTitle(line: string): string {
  return normalize(line);
}