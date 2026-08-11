"use strict";

/**
 * Deterministic EDUCATION grouping (PATORBIT CORE RULE — NO AI).
 *
 * Reuses the existing EvidenceFacts exactly as extractEvidenceFacts produced
 * them — no new extraction engine, no changes to evidence.ts or to experience
 * grouping. The primary structural boundary is the `education` section
 * (provenance.section), and source line order is preserved throughout.
 *
 * For every education-section line, evidence has already produced one
 * `education` fact (the verbatim line) plus `date` facts for any dates on it.
 * This module classifies those lines deterministically:
 *
 *   institution-like → starts an entry (school)
 *   degree-like      → degree (whole line; a field is never split off it)
 *   explicit field   → field, only when written as its own line
 *   date             → year, always taken from an existing date fact
 *   gpa/minor/honors/activities → their labeled fields
 *
 * Nothing is invented: no institution is inferred from arbitrary prose, no
 * field is inferred from a degree name, no date is re-extracted (dates come
 * only from existing date facts). Every line keeps its verbatim text + proven-
 * ance, and anything that cannot be confidently classified stays in
 * `unassigned` for review instead of being guessed into a field.
 */

import type { EvidenceFact } from "@/lib/document-model/evidence";

/** Shape exactly matching the ResumeSchema education entry (id added later via withIds). */
export interface GroupedEducation {
  school: string;
  degree: string;
  year: string;
  field: string;
  gpa: string;
  minor: string;
  honors: string;
  activities: string;
  location: string;
}

export interface EducationGroupingResult {
  /** Confident entries in document order. */
  entries: GroupedEducation[];
  /** Facts that could not be assigned to any entry — preserved, never dropped. */
  unassigned: EvidenceFact[];
}

interface EduBuilder {
  school: string;
  degree: string;
  year: string;
  field: string;
  gpa: string;
  minor: string;
  honors: string;
  activities: string;
  location: string;
}

/* ── Deterministic line classifiers (regexes only, no inference) ───────────── */

/** Degree-shaped lines: the whole line becomes the degree, never split into a field. */
const DEGREE_RE =
  /\b(?:bachelor['’]?s?|b\.?a\.?|b\.?s\.?|b\.?sc\.?|b\.?eng\.?|b\.?tech\.?|master['’]?s?|m\.?a\.?|m\.?s\.?|m\.?sc\.?|m\.?eng\.?|m\.?ba\.?|mba|ph\.?d\.?|doctorate|doctor\s+of|associate|ll\.?b\.?|juris\s+doctor|engineer['’]?s\s+degree|bachelor\s+of|master\s+of)(?![A-Za-z0-9])/i;

/** Institution-shaped lines: explicit place-of-study words. */
const INSTITUTION_RE =
  /\b(?:universit\w*|universidad|colleges?|institute\w*|academy|polytechnic\w*|schools?|conservatory|faculty|academia)\b/i;

/** Explicit field-of-study markers — a field is only taken from its own line. */
const FIELD_RE =
  /^\s*(?:field(?:\s+of\s+study)?|major|concentration|specialization|specialisation|emphasis|focus|discipline|study|studies)\s*[:–—-]?\s*(.+)\s*$/i;

const GPA_RE = /^\s*(?:gpa|grade\s+point\s+average|cgpa)\s*[:–—-]?\s*(.+)\s*$/i;
const MINOR_RE = /^\s*(?:minor|minors)\s*[:–—-]?\s*(.+)\s*$/i;
const HONORS_RE =
  /^\s*(?:honors?|honours?|awards?|distinction|recognition|deans?\s+list|cum\s+laude|magna\s+cum\s+laude|summa\s+cum\s+laude)\s*[:–—-]?\s*(.*)\s*$/i;
const ACTIVITIES_RE =
  /^\s*(?:activities?|extracurriculars?|clubs?|organizations?|leadership)\s*[:–—-]?\s*(.+)\s*$/i;

function normalize(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

/** Strip verbatim date substrings (taken from existing date facts) off a line. */
function stripDates(line: string, dates: string[]): string {
  let out = line;
  for (const d of dates) {
    if (!d) continue;
    out = out.replace(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

type LineKind =
  | { kind: "institution" }
  | { kind: "degree" }
  | { kind: "field"; value: string }
  | { kind: "gpa"; value: string }
  | { kind: "minor"; value: string }
  | { kind: "honors"; value: string }
  | { kind: "activities"; value: string }
  | { kind: "other" };

/** Capture the text after an explicit label (or the whole line when unlabeled). */
function labeledValue(line: string, re: RegExp): string {
  const m = normalize(line).match(re);
  const rest = (m?.[1] ?? "").trim();
  return rest || normalize(line);
}

function classifyLine(line: string): LineKind {
  const t = normalize(line);
  if (!t) return { kind: "other" };

  if (DEGREE_RE.test(t)) return { kind: "degree" };
  if (INSTITUTION_RE.test(t) && t.length <= 70) return { kind: "institution" };

  if (FIELD_RE.test(t)) return { kind: "field", value: labeledValue(t, FIELD_RE) };
  if (GPA_RE.test(t)) return { kind: "gpa", value: labeledValue(t, GPA_RE) };
  if (MINOR_RE.test(t)) return { kind: "minor", value: labeledValue(t, MINOR_RE) };
  if (HONORS_RE.test(t)) return { kind: "honors", value: labeledValue(t, HONORS_RE) };
  if (ACTIVITIES_RE.test(t)) return { kind: "activities", value: labeledValue(t, ACTIVITIES_RE) };

  return { kind: "other" };
}

function emptyBuilder(): EduBuilder {
  return {
    school: "",
    degree: "",
    year: "",
    field: "",
    gpa: "",
    minor: "",
    honors: "",
    activities: "",
    location: "",
  };
}

function finalize(b: EduBuilder): GroupedEducation {
  return {
    school: b.school,
    degree: b.degree,
    year: b.year,
    field: b.field,
    gpa: b.gpa,
    minor: b.minor,
    honors: b.honors,
    activities: b.activities,
    location: b.location,
  };
}

/**
 * Group the education-section EvidenceFacts into Resume education entries.
 * Deterministic and order-preserving; an empty or non-education fact list
 * returns empty entries.
 */
export function groupEducationEntries(facts: EvidenceFact[]): EducationGroupingResult {
  const eduFacts = facts.filter((f) => f.provenance.section === "education");
  const entries: GroupedEducation[] = [];
  const unassigned: EvidenceFact[] = [];

  // Verbatim date values per source line, taken ONLY from existing date facts.
  const datesByLine = new Map<number, string>();
  for (const f of eduFacts) {
    if (f.type === "date") datesByLine.set(f.provenance.line, f.value);
  }

  /** Current entry under construction, in document order. */
  let current: EduBuilder | null = null;

  const flush = () => {
    if (current) entries.push(finalize(current));
    current = null;
  };

  for (const fact of eduFacts) {
    // Dates attach to the open entry; orphan dates are preserved for review.
    if (fact.type === "date") {
      if (current) current.year = fact.value;
      else unassigned.push(fact);
      continue;
    }

    if (fact.type !== "education") {
      unassigned.push(fact);
      continue;
    }

    const lineDates = datesByLine.has(fact.provenance.line)
      ? [datesByLine.get(fact.provenance.line)!]
      : [];
    const lineExtra = stripDates(fact.value, lineDates);
    // A line consisting purely of a date is only a year signal (the date fact
    // itself attaches it); it carries no institution/degree content.
    if (!lineExtra) continue;

    const kind = classifyLine(lineExtra);

    switch (kind.kind) {
      case "institution": {
        if (current && current.school !== "") flush();
        if (!current) current = emptyBuilder();
        current.school = lineExtra;
        break;
      }

      case "degree": {
        if (current && current.degree !== "") {
          flush(); // a second degree is its own entry, never a guessed duplicate
          current = null;
        }
        if (!current) current = emptyBuilder();
        current.degree = lineExtra;
        break;
      }

      case "field": {
        if (current && current.field === "") current.field = kind.value;
        else if (current) unassigned.push(fact); // already has a field → preserve
        else unassigned.push(fact); // orphan field with no entry → preserve
        break;
      }

      case "gpa":
      case "minor":
      case "honors":
      case "activities": {
        if (current) {
          if (current[kind.kind] === "") current[kind.kind] = kind.value;
          else unassigned.push(fact);
        } else {
          unassigned.push(fact);
        }
        break;
      }

      case "other":
      default:
        // Ambiguous prose — never converted into an entry or a guessed field.
        unassigned.push(fact);
    }
  }

  flush();
  return { entries, unassigned };
}