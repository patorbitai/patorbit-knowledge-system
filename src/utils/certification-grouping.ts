"use strict";

/**
 * Deterministic CERTIFICATION grouping (PATORBIT CORE RULE — NO AI).
 *
 * Reuses the existing EvidenceFacts exactly as extractEvidenceFacts produced
 * them — no new extraction engine, no changes to evidence.ts. The structural
 * boundary is the `certifications` section (provenance.section), source line
 * order preserved. Certifications are only ever taken from that section, so a
 * skill or course-like phrase elsewhere can never become one.
 *
 * A clear certification name line starts an entry. Details attach only when
 * explicitly present:
 *
 *   name          → starts a certification (title-case line)
 *   issuer        → only an explicitly-worded issuer line
 *                   ("Issued by X", "provided by X", "by X", "from X")
 *   date          → verbatim from existing date facts
 *   URL           → link (whole-line URLs only)
 *
 * A bare line while the current certification is still undated/un-issued is
 * ambiguous (could be an issuer on its own line) and stays in `unassigned`
 * rather than being guessed or duplicating the name. Prose lines are also
 * preserved for review. Nothing is invented.
 */

import type { EvidenceFact } from "@/lib/document-model/evidence";

/** Shape exactly matching the ResumeSchema certification entry (ids via withIds). */
export interface GroupedCertification {
  name: string;
  issuer: string;
  date: string;
  link: string;
}

export interface CertificationGroupingResult {
  /** Confident entries in document order. */
  entries: GroupedCertification[];
  /** Facts that could not be assigned to any entry — preserved, never dropped. */
  unassigned: EvidenceFact[];
}

interface Builder {
  name: string;
  issuer: string;
  date: string;
  link: string;
}

/** Whole-line URLs → certification link. */
const URL_RE = /^(?:https?:\/\/|www\.)\S+$/i;

/** An explicitly-worded issuer line. */
const ISSUER_RE =
  /^\s*(?:issued\s*(?:by|from)|provided\s*(?:by|from)|by|from|via|through)\s+(.+)\s*$/i;

/** A certification name: short, title-case, no sentence punctuation/commas. */
function isName(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 90) return false;
  if (/^[•·▪◦∙*\-\–—\d]/.test(t)) return false;
  if (/[.!?,;]/.test(t)) return false;
  const words = t.split(/\s+/);
  if (words.length === 0 || words.length > 10) return false;
  return words.every(
    (w) =>
      /^(?:and|of|or|the|for|with|in|on|at|to|by|from|a|an|as)$/i.test(w) ||
      /^[A-Z0-9][A-Za-z0-9&''’\-.+#:]*$/.test(w),
  );
}

/**
 * Split a spaced en/em/hyphen separator into "Name – Issuer" (e.g.
 * "Microsoft Azure ... – Microsoft"). Requires whitespace around the dash and
 * a plausible title-cased name on the left, so names that merely contain a
 * hyphen ("Azure-Resilient Architect") are never split.
 */
function splitNameIssuer(value: string): { name: string; issuer: string } | null {
  const m = value.match(/^(.+?)\s+(?:–|—|-)\s+([A-Za-z][A-Za-z0-9&''’ .#+:]*)$/);
  if (!m) return null;
  const name = m[1].trim();
  const issuer = m[2].trim();
  if (!name || !issuer) return null;
  if (!isName(name)) return null;
  return { name, issuer };
}

function finalize(b: Builder): GroupedCertification {
  return { name: b.name, issuer: b.issuer, date: b.date, link: b.link };
}

/**
 * Group the certifications-section EvidenceFacts into Resume certification
 * entries. Deterministic and order-preserving; an empty or non-certifications
 * fact list returns empty entries.
 */
export function groupCertificationEntries(facts: EvidenceFact[]): CertificationGroupingResult {
  const certFacts = facts.filter((f) => f.provenance.section === "certifications");
  const entries: GroupedCertification[] = [];
  const unassigned: EvidenceFact[] = [];

  const datesByLine = new Map<number, string[]>();
  for (const f of certFacts) {
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

  for (const fact of certFacts) {
    if (fact.type === "date") {
      if (current && current.date === "") current.date = fact.value;
      else unassigned.push(fact); // orphan or extra date → ambiguous
      continue;
    }

    if (fact.type !== "certification") {
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

    const issuer = t.match(ISSUER_RE);
    if (issuer) {
      if (current && current.issuer === "") current.issuer = issuer[1].trim();
      else unassigned.push(fact);
      continue;
    }

    const split = splitNameIssuer(t);
    if (split) {
      // An explicit "Name – Issuer" line is self-contained: start a fresh entry
      // even if a previous undated/un-issued entry exists.
      flush();
      current = { name: split.name, issuer: split.issuer, date: "", link: "" };
      continue;
    }

    if (isName(t)) {
      // While the current certification is still undated and un-issued, a bare
      // line is ambiguous (organiser on its own line, or a continuation) — keep
      // it as evidence rather than duplicating/spawning an entry.
      if (current && current.name !== "" && current.date === "" && current.issuer === "") {
        unassigned.push(fact);
        continue;
      }
      flush();
      current = { name: t, issuer: "", date: "", link: "" };
      continue;
    }

    // Prose / credential text without a dedicated schema slot → review.
    unassigned.push(fact);
  }

  flush();
  return { entries, unassigned };
}