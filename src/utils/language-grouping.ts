"use strict";

/**
 * Deterministic LANGUAGE grouping (PATORBIT CORE RULE — NO AI).
 *
 * Reuses the existing EvidenceFacts exactly as extractEvidenceFacts produced
 * them — evidence already emits one `language` fact per explicitly listed
 * language, and only within a detected `languages` section. This module turns
 * those facts into Resume language entries:
 *
 *   name        → verbatim language token
 *   proficiency → preserved ONLY when explicitly written alongside the
 *                 language ("English (Native)", "Spanish: Professional",
 *                 "German - B2"); otherwise never invented (left "")
 *
 * A language is never inferred from prose because only `language` facts inside
 * the `languages` section are consumed. Order and provenance are preserved and
 * identical input yields an identical result.
 */

import type { EvidenceFact } from "@/lib/document-model/evidence";

/** Shape exactly matching the ResumeSchema language entry (ids via withIds). */
export interface GroupedLanguage {
  name: string;
  proficiency: string;
}

export interface LanguageGroupingResult {
  /** Confident entries in document order. */
  entries: GroupedLanguage[];
  /** Facts that could not be assigned — preserved, never dropped. */
  unassigned: EvidenceFact[];
}

/**
 * Extract an explicitly-written proficiency, verbatim, from a language token:
 *   "English (Native)"  → Native    | name English
 *   "Spanish: Fluent"   → Fluent    | name Spanish
 *   "German - B2"       → B2        | name German
 *   "French"            → ""        | name French (no invented proficiency)
 */
function parseLanguageEntry(value: string): { name: string; proficiency: string } {
  const t = value.replace(/\s+/g, " ").trim();
  if (!t) return { name: "", proficiency: "" };

  const paren = t.match(/^(.+?)\s*[\(\（]([^\)\）]+)[\)\）]\s*$/);
  if (paren) return { name: paren[1].trim(), proficiency: paren[2].trim() };

  const colon = t.match(/^(.+?)\s*:\s*(.+)$/);
  if (colon) return { name: colon[1].trim(), proficiency: colon[2].trim() };

  const dash = t.match(/^(.+?)\s+[–—-]\s+(.+)$/);
  if (dash) return { name: dash[1].trim(), proficiency: dash[2].trim() };

  return { name: t, proficiency: "" };
}

/**
 * Group the languages-section EvidenceFacts into Resume language entries.
 * Deterministic and order-preserving; an empty or non-languages fact list
 * returns empty entries.
 */
export function groupLanguageEntries(facts: EvidenceFact[]): LanguageGroupingResult {
  const langFacts = facts.filter((f) => f.provenance.section === "languages");
  const entries: GroupedLanguage[] = [];
  const unassigned: EvidenceFact[] = [];

  for (const fact of langFacts) {
    if (fact.type !== "language") {
      unassigned.push(fact);
      continue;
    }
    const { name, proficiency } = parseLanguageEntry(fact.value);
    if (!name) {
      unassigned.push(fact);
      continue;
    }
    entries.push({ name, proficiency });
  }

  return { entries, unassigned };
}