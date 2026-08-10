"use strict";

/**
 * Phase 2 — deterministic EvidenceFact extraction.
 *
 * EvidenceFacts are produced purely from DocumentBlocks (Phase 1 output); the
 * raw PDF is never re-parsed and no AI/LLM is involved. Every fact:
 *   • preserves the exact source text (verbatim `value` + full line `source`)
 *   • retains page/block/line/section/column provenance
 *   • is deterministic (stable ids, no randomness, no ordering guesses)
 *
 * Unknown content is kept as `other` rather than dropped, ambiguous lines are
 * never force-fitted into experience/education, and skill/language proficiency
 * is never invented. Duplicate evidence is intentionally NOT deduplicated yet.
 */

import type { DocumentBlock, DocumentLine } from "./types";
import { detectSectionKind } from "./sections";

export type EvidenceFactType =
  | "person"
  | "contact"
  | "skill"
  | "role"
  | "company"
  | "date"
  | "project"
  | "education"
  | "certification"
  | "language"
  | "achievement"
  | "link"
  | "other";

export interface EvidenceProvenance {
  page: number;
  blockId: string;
  /** The section kind of the block the fact came from. */
  section: DocumentBlock["kind"];
  /** 1-based line number in the document. */
  line: number;
  /** 0-based column when the extractor reported one. */
  column?: number;
}

export interface EvidenceFact {
  /** Deterministic: `fact_<page>_<lno>_<seq>_<type>`. */
  id: string;
  type: EvidenceFactType;
  /** Verbatim extracted text (exact substring of the source line). */
  value: string;
  /** The full verbatim source line. */
  source: string;
  /** Deterministic 0–1 confidence of this extraction. */
  confidence: number;
  provenance: EvidenceProvenance;
}

/* ── Regexes ──────────────────────────────────────────────────────────────── */

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const URL_RE = /\b(?:https?:\/\/|www\.|linkedin\.com\/|github\.com\/)[^\s,;]+/gi;
const HANDLE_RE = /(?:^|[\s,|])@[A-Za-z0-9._-]+/g;

const MONTH = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";
const MONTH_TOKEN = `${MONTH}[a-z]*\\.?\\s+\\d{1,4}`;
const YEAR_TOKEN = "\\d{4}";
const DATE_TOKEN = `(?:${MONTH_TOKEN}|${YEAR_TOKEN})`;
const DATE_RANGE =
  `${DATE_TOKEN}\\s*(?:[-\\u2013\\u2014]|to|through)\\s*(?:${DATE_TOKEN}|present|current|now|ongoing)`;

/** All date substrings in a line, verbatim (ranges coalesced to one match). */
function matchDates(text: string): string[] {
  const re = new RegExp(`(${DATE_RANGE}|${DATE_TOKEN})`, "gi");
  const out: string[] = [];
  for (const m of text.matchAll(re)) {
    if (m[0]) out.push(m[0]);
  }
  return out;
}

/** Trim leading marker/bullet/number prefixes and trailing separators. */
function cleanCompany(text: string): string | undefined {
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/^[\s\d.,;:)\](\-–—•·▪◦∙*]+/, "")
    .replace(/[\s,;:|]+$/, "")
    .trim();
  return cleaned || undefined;
}

function looksLikeRole(line: string): boolean {
  const t = line.trim();
  if (t.length > 60) return false;
  if (/(corp|inc|ltd|llc|gmbh|co\.)/i.test(t)) return false;
  if (/[$%×\d]/.test(t)) return false;
  if (/^\s*[•·▪◦∙*\-\–—\d.)]/.test(t)) return false;
  return /^[A-Z][a-zA-Z'’]*(\s+[A-Z][a-zA-Z'’]*){1,4}$/.test(t);
}

function looksLikeAchievement(line: string): boolean {
  const t = line.trim();
  if (/^\s*[•·▪◦∙*\-–—]\s+/.test(t)) return true;
  if (/^\s*\d+[.)]\s+/.test(t)) return true;
  if (/(%|\$|×)/.test(t) && t.length > 8) return true;
  if (/\d/.test(t) && t.split(/\s+/).length >= 5) return true;
  return /[.!?]$/.test(t) && t.split(/\s+/).length >= 4;
}

interface CompanyDate {
  company?: string;
  date: string;
}

/** Split a "Company  Date" style line into verbatim company + date parts. */
function parseCompanyDate(line: string): CompanyDate | null {
  const m = new RegExp(`(${DATE_RANGE}|${DATE_TOKEN})`, "i").exec(line);
  if (!m) return null;
  const date = m[0];
  const rest = `${line.slice(0, m.index)} ${line.slice(m.index + date.length)}`;
  const company = cleanCompany(rest);
  return { ...(company ? { company } : {}), date };
}

/* ── Line extractors ──────────────────────────────────────────────────────── */

type AddFact = (type: EvidenceFactType, value: string, confidence: number) => void;

function addContactFacts(line: string, add: AddFact): void {
  for (const m of line.matchAll(new RegExp(EMAIL_RE.source, "gi"))) add("contact", m[0], 1);
  for (const m of line.matchAll(new RegExp(PHONE_RE.source, "g"))) add("contact", m[0], 1);
  const stripped = line.replace(new RegExp(EMAIL_RE.source, "gi"), " ");
  for (const m of stripped.matchAll(new RegExp(HANDLE_RE.source, "g"))) {
    add("contact", m[0].replace(/^[\s,|]+/, ""), 0.7);
  }
}

function addLinkFacts(line: string, add: AddFact): void {
  for (const m of line.matchAll(new RegExp(URL_RE.source, "gi"))) {
    add("link", m[0].replace(/[,;]+$/, ""), 1);
  }
}

function extractExperienceLine(line: DocumentLine, add: AddFact): void {
  const cd = parseCompanyDate(line.raw);
  if (cd) {
    if (cd.company) add("company", cd.company, 0.9);
    add("date", cd.date, 0.9);
    return;
  }
  if (looksLikeRole(line.raw)) {
    add("role", line.raw, 0.9);
    return;
  }
  if (looksLikeAchievement(line.raw)) {
    add("achievement", line.raw, 0.8);
    return;
  }
  add("other", line.raw, 0.3);
}

function splitList(line: string): string[] {
  return line
    .split(/[,•·▪◦∙|;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractLine(block: DocumentBlock, line: DocumentLine, index: number, add: AddFact): void {
  switch (block.kind) {
    case "name":
      // First name-block line → person; trailing title lines → role/other.
      if (index === 0) {
        add("person", line.raw, 0.8);
      } else if (looksLikeRole(line.raw)) {
        add("role", line.raw, 0.7);
      } else {
        add("other", line.raw, 0.3);
      }
      return;

    case "contact":
      addContactFacts(line.raw, add);
      addLinkFacts(line.raw, add);
      return;

    case "summary":
      add("other", line.raw, 0.3);
      return;

    case "skills":
      for (const skill of splitList(line.raw)) add("skill", skill, 0.95);
      return;

    case "experience":
      extractExperienceLine(line, add);
      return;

    case "education":
      add("education", line.raw, 0.9);
      for (const d of matchDates(line.raw)) add("date", d, 0.9);
      return;

    case "projects":
      add("project", line.raw, 0.9);
      for (const d of matchDates(line.raw)) add("date", d, 0.9);
      return;

    case "certifications":
      add("certification", line.raw, 0.9);
      for (const d of matchDates(line.raw)) add("date", d, 0.9);
      return;

    case "languages":
      for (const lang of splitList(line.raw)) add("language", lang, 0.95);
      return;

    case "achievements":
      add("achievement", line.raw, 0.9);
      for (const d of matchDates(line.raw)) add("date", d, 0.9);
      return;

    case "interests":
    case "references":
      add("other", line.raw, 0.3);
      return;

    case "portfolio":
      addLinkFacts(line.raw, add);
      return;

    case "custom":
    default:
      // Unknown sections: never force into experience/education, never drop.
      addLinkFacts(line.raw, add);
      addContactFacts(line.raw, add);
      for (const d of matchDates(line.raw)) add("date", d, 0.7);
      add("other", line.raw, 0.3);
      return;
  }
}

/* ── Public entry point ───────────────────────────────────────────────────── */

/**
 * Extract deterministic, provenance-preserving EvidenceFacts from blocks.
 * Source order is preserved; ids are deterministic; nothing is invented.
 * A content line that yields no match is kept as an `other` fact.
 */
export function extractEvidenceFacts(blocks: DocumentBlock[]): EvidenceFact[] {
  const facts: EvidenceFact[] = [];

  for (const block of blocks) {
    for (const [index, line] of block.lines.entries()) {
      // The block's own heading line is structural, not evidence.
      if (detectSectionKind(line.raw) === block.kind) continue;

      let seq = 0;
      let emitted = 0;

      const add: AddFact = (type, value, confidence) => {
        facts.push({
          id: `fact_${line.page}_${line.lno}_${seq}_${type}`,
          type,
          value,
          source: line.raw,
          confidence,
          provenance: {
            page: line.page,
            blockId: block.id,
            section: block.kind,
            line: line.lno,
            ...(line.column != null ? { column: line.column } : {}),
          },
        });
        seq++;
        emitted++;
      };

      const before = emitted;
      extractLine(block, line, index, add);
      // Guarantee "never drop": if nothing matched, keep the line as `other`.
      if (emitted === before) add("other", line.raw, 0.3);
    }
  }

  return facts;
}