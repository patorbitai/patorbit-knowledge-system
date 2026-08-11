"use strict";

/**
 * Deterministic PROJECT grouping (PATORBIT CORE RULE — NO AI).
 *
 * Reuses the existing EvidenceFacts exactly as extractEvidenceFacts produced
 * them — no new extraction engine, no changes to evidence.ts. The structural
 * boundary is the `projects` section (provenance.section) and source line
 * order is preserved throughout.
 *
 * A clear project heading/name line starts a project entry. Details attach to
 * the open entry only when explicitly present:
 *
 *   name/heading   → starts a project (title-case short line)
 *   URL            → link (whole-line URLs only)
 *   explicit tech  → tech ("Tech:", "Technologies:", "Stack:", "Built with ...",
 *                    or a pure comma-separated technology list)
 *   date           → startDate/endDate, split mechanically from the existing
 *                    date fact (both halves verbatim, never re-parsed)
 *   description    → prose / bullets of the open entry
 *
 * Work/achievement prose, bullets without an open project, and lines that only
 * vaguely look like a project are never turned into a project: they are kept in
 * `unassigned` (with verbatim text + provenance) for review. Nothing is invented.
 */

import type { EvidenceFact } from "@/lib/document-model/evidence";

/** Shape exactly matching the ResumeSchema project entry (ids added via withIds). */
export interface GroupedProject {
  name: string;
  description: string;
  tech: string;
  link: string;
  startDate: string;
  endDate: string;
  role: string;
  teamSize: string;
}

export interface ProjectGroupingResult {
  /** Confident entries in document order. */
  entries: GroupedProject[];
  /** Facts that could not be assigned to any entry — preserved, never dropped. */
  unassigned: EvidenceFact[];
}

interface Builder {
  name: string;
  description: string[];
  tech: string[];
  link: string;
  startDate: string;
  endDate: string;
}

/* ── Deterministic line classifiers (regexes only, no inference) ───────────── */

/** Whole-line URLs → project link. */
const URL_RE = /^(?:https?:\/\/|www\.)\S+$/i;

/** Explicit technology markers — a tech is only taken from an explicit phrase. */
const TECH_MARKER_RE =
  /^\s*(?:tech(?:nolog(?:y|ies))?|stack|tools?|librar(?:y|ies)|frameworks?|languages?|built\s+(?:with|using)|using)\s*[:–—-]?\s*(.+)\s*$/i;

/**
 * Lowercase words that may legitimately appear inside a title-cased heading,
 * e.g. "Graph RAG and Agentic AI Workflow". Everything else in a heading must
 * be title-case.
 */
const HEADING_CONNECTOR_RE = /^(?:and|or|of|the|for|with|in|on|at|to|by|from|a|an|as|via|into|within|per|vs)$/i;

/**
 * Action-verb prefixes are prose ("Built a ...", "Developed ..."), never the
 * start of a real project heading.
 */
const HEADING_ACTION_VERB_RE =
  /^(?:built|build|created|developed|implemented|designed|automated|worked|maintained|managed|deployed|used|wrote|led|improved|reduced|performed|supported|assisted|prepared|delivered|monitored|added|handled|processed|run|ran)$/i;

/**
 * Common English function words that disqualify a comma-separated line from
 * being a pure technology list. A tech list is bare proper nouns/acronyms
 * ("React, Node.js, PostgreSQL"); anything containing connectors, articles or
 * prose words ("... prompt templates, and response") is description prose.
 */
const TECH_PROSE_WORD_RE =
  /\b(?:and|or|the|a|an|of|for|with|using|via|into|across|through|from|to|in|on|by|that|this|which|these|those|their|our|your|such|like|during|about|over|under|before|after|between|among)\b/i;

/**
 * A pure comma/pipe/semicolon-separated list of short proper-noun/acronym
 * tokens is an explicitly stated technology line (e.g. "React, Node.js,
 * TypeScript"). Prose lines (sentence punctuation, long phrases, English
 * function words, lowercase-headed tokens) never match.
 */
function isTechList(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 140) return false;
  if (/[.!?]/.test(t.replace(/\./g, ""))) return false;
  if (TECH_PROSE_WORD_RE.test(t)) return false;
  const parts = t.split(/,|;|\||•/).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return false;
  return parts.every(
    (p) =>
      p.length <= 40 &&
      p.split(/\s+/).length <= 2 &&
      /^[A-Z0-9][A-Za-z0-9.#+_\-"'’ ]*$/.test(p),
  );
}

/**
 * A project heading/name: short, title-case, no sentence punctuation, no
 * inline commas. Lowercase connectors (and/of/for/...) are allowed; prose
 * (action-verb prefixes, lowercase or lowercase-headed words) is not.
 */
function isProjectName(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 80) return false;
  if (/^[•·▪◦∙*\-\–—\d]/.test(t)) return false;
  if (/[.!?,;]/.test(t)) return false;
  if (isTechList(t) || TECH_MARKER_RE.test(t)) return false;
  const words = t.split(/\s+/);
  if (words.length === 0 || words.length > 8) return false;
  if (HEADING_ACTION_VERB_RE.test(words[0])) return false;
  return words.every(
    (w) => HEADING_CONNECTOR_RE.test(w) || /^[A-Z0-9][A-Za-z0-9&''’\-.]*$/.test(w),
  );
}

/** Mechanically split an existing date fact value into verbatim start/end. */
function splitDateRange(value: string): { start: string; end: string } {
  const parts = value.split(/\s*(?:to|through|[-–—])\s*/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { start: parts[0], end: parts.slice(1).join(" ") };
  if (parts.length === 1) return { start: parts[0], end: "" };
  return { start: value.trim(), end: "" };
}

function finalize(b: Builder): GroupedProject {
  return {
    name: b.name,
    description: b.description.join("\n"),
    tech: b.tech.join(", "),
    link: b.link,
    startDate: b.startDate,
    endDate: b.endDate,
    role: "",
    teamSize: "",
  };
}

/**
 * Group the projects-section EvidenceFacts into Resume project entries.
 * Deterministic and order-preserving; an empty or non-projects fact list
 * returns empty entries.
 */
export function groupProjectEntries(facts: EvidenceFact[]): ProjectGroupingResult {
  const projectFacts = facts.filter((f) => f.provenance.section === "projects");
  const entries: GroupedProject[] = [];
  const unassigned: EvidenceFact[] = [];

  // Verbatim date values per source line, taken ONLY from existing date facts.
  const datesByLine = new Map<number, string[]>();
  for (const f of projectFacts) {
    if (f.type === "date") {
      const list = datesByLine.get(f.provenance.line) ?? [];
      list.push(f.value);
      datesByLine.set(f.provenance.line, list);
    }
  }

  let current: Builder | null = null;

  const flush = () => {
    if (current) entries.push(finalize(current));
    current = null;
  };

  const stripDates = (line: string, dates: string[]): string => {
    let out = line;
    for (const d of dates) {
      if (!d) continue;
      out = out.replace(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), " ");
    }
    return out.replace(/\s+/g, " ").trim();
  };

  for (const fact of projectFacts) {
    if (fact.type === "date") {
      if (current && current.startDate === "") {
        const { start, end } = splitDateRange(fact.value);
        current.startDate = start;
        current.endDate = end;
      } else {
        unassigned.push(fact); // orphan or extra date → ambiguous
      }
      continue;
    }

    if (fact.type !== "project") {
      unassigned.push(fact);
      continue;
    }

    const lineDates = datesByLine.get(fact.provenance.line) ?? [];
    const t = stripDates(fact.value, lineDates);
    if (!t) continue; // purely a date signal

    if (URL_RE.test(t)) {
      if (current) current.link = t;
      else unassigned.push(fact);
      continue;
    }

    const techMarker = t.match(TECH_MARKER_RE);
    if (techMarker) {
      if (current) current.tech.push(techMarker[1].trim());
      else unassigned.push(fact);
      continue;
    }

    if (isTechList(t)) {
      if (current) current.tech.push(t);
      else unassigned.push(fact);
      continue;
    }

    if (/^\s*[•·▪◦∙*\-\–—]\s+/.test(t)) {
      if (current) current.description.push(t);
      else unassigned.push(fact);
      continue;
    }

    if (isProjectName(t)) {
      flush();
      current = { name: t, description: [], tech: [], link: "", startDate: "", endDate: "" };
      continue;
    }

    // Unrecognised line: prose of the open entry if there is one, else review.
    if (current) current.description.push(t);
    else unassigned.push(fact);
  }

  flush();
  return { entries, unassigned };
}