"use strict";

/**
 * Deterministic EXPERIENCE grouping (PATORBIT CORE RULE — NO AI).
 *
 * Reuses the existing EvidenceFacts exactly as extractEvidenceFacts produced
 * them — no new extraction engine, no changes to evidence.ts. The grouping is
 * a pure function over the facts of the `experience` section, using their
 * already-preserved source order as the primary structure:
 *
 *   company → start entry      (explicit `company` facts AND corporate-form
 *             bare company lines that evidence labelled `other`)
 *   role    → attach to the nearest open company entry
 *   date    → attach as duration to the appropriate entry
 *   bullets/prose → stay with the entry until the next company/role/date boundary
 *
 * Evidence labels a bare company line `other` when it carries a corporate
 * suffix ("Corp", "Inc", ...) that `looksLikeRole` deliberately rejects — no
 * date is present, so no `company` fact is produced either. Such lines are the
 * strongest company signal we have, so a conservative corporate-form check
 * re-confirms them: short, every word capitalised, and ending in a known
 * company suffix. Prose/sentence lines (lowercase words, punctuation, years,
 * bullets) never match and are preserved as evidence instead.
 *
 * A run of role-like lines after an already-dated entry is held in `pending`:
 * the next *date* confirms the first pending line as the new company (a bare
 * company whose date sits on its own line below, e.g. a date-rail layout). An
 * explicit *company* boundary instead proves those pending lines were merely
 * more roles of the entry being closed — so they attach there, never as a new
 * company. When a company arrives before any entry exists, pending lines are
 * ambiguous and are preserved as evidence, not guessed.
 *
 * Suffix-less companies ("Globex", "Stripe") arrive as a different `other`
 * shape — a single capitalised word. That is treated as a company *candidate*:
 * it joins the pending pool and only becomes a company once a date confirms it;
 * prose before/after it keeps it as evidence instead.
 *
 * Nothing is invented (no phantom companies, dates, roles or bullets) and no
 * line is dropped: facts that cannot be confidently assigned are returned in
 * `unassigned` verbatim with their provenance for review.
 */

import type { EvidenceFact } from "@/lib/document-model/evidence";

/** Shape exactly matching the ResumeSchema experience entry (id added later via withIds). */
export interface GroupedExperience {
  company: string;
  position: string;
  location: string;
  employmentType: string;
  industry: string;
  duration: string;
  description: string;
  achievements: string;
  techUsed: string;
}

export interface ExperienceGroupingResult {
  /** Confident entries in document order. */
  entries: GroupedExperience[];
  /** Facts that could not be assigned to any entry — preserved, never dropped. */
  unassigned: EvidenceFact[];
}

interface Builder {
  company: string;
  roles: string[];
  duration: string;
  detail: string[];
}

/** Corporate suffixes that make a bare line read as a company name, not a role. */
const COMPANY_SUFFIX_RE =
  /\b(?:corporation|incorporated|corp\.?|inc\.?|ltd\.?|llc|llp|gmbh|plc|co\.|company|companies|group|technologies?|systems|solutions|consulting|partners?|associates?|labs?|studios?|services|holdings?|ventures|industries?)\b/i;

/**
 * Conservative re-confirmation that an `other` line is a company name: short,
 * no bullet/number/year/sentence punctuation, every word capitalised, and a
 * company suffix present. Anything prose-like fails the capitalisation or the
 * suffix checks and stays `unassigned` (rules 6–7).
 */
function isCompanyShaped(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 60) return false;
  if (/^\s*[•·▪◦∙*\-\–—\d.)]/.test(t)) return false;
  if (/\b\d{4}\b/.test(t)) return false;
  if (/[?!]/.test(t)) return false;
  if (!COMPANY_SUFFIX_RE.test(t)) return false;
  const words = t.split(/\s+/);
  if (words.length === 0 || words.length > 6) return false;
  return words.every((w) => /^[A-Z0-9&'’.]/.test(w));
}

/**
 * A single capitalised word line that evidence kept as `other` (bare company
 * names with no corporate suffix: "Globex", "Stripe"). Never a one-word role
 * by evidence's own role pattern, so it is a company *candidate*: it only
 * becomes a company when the next boundary is a date, otherwise it is
 * preserved as evidence (rules 6–7).
 */
function isSingleWordCompany(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 40) return false;
  if (/[.,;:?!@%$×]/.test(t)) return false;
  if (/\b\d\b/.test(t)) return false;
  return /^[A-Z][a-zA-Z'’]+$/.test(t);
}

function finalize(b: Builder): GroupedExperience {
  return {
    company: b.company,
    position: b.roles.join(", "),
    location: "",
    employmentType: "",
    industry: "",
    duration: b.duration,
    description: b.detail.join("\n"),
    achievements: "",
    techUsed: "",
  };
}

/**
 * Group the experience-section EvidenceFacts into Resume experience entries.
 * Deterministic and order-preserving; an empty or non-experience fact list
 * returns empty entries.
 */
export function groupExperienceEntries(facts: EvidenceFact[]): ExperienceGroupingResult {
  const experienceFacts = facts.filter((f) => f.provenance.section === "experience");
  const entries: GroupedExperience[] = [];
  const unassigned: EvidenceFact[] = [];

  // `pending` holds role-like lines awaiting a confirming boundary. A date
  // makes the first pending line the company; an explicit company boundary
  // instead proves they were roles of the entry being closed.
  let pending: EvidenceFact[] = [];

  /** Current entry under construction, in document order. */
  let current: Builder | null = null;

  const flush = () => {
    if (current) entries.push(finalize(current));
    current = null;
  };

  // Prove pending candidate lines were NOT companies: role facts become
  // positions of the entry being closed, other candidates stay ambiguous and
  // are preserved as evidence (no entry at all → everything is preserved).
  const demotePending = () => {
    if (current) {
      for (const fact of pending) {
        if (fact.type === "role") current.roles.push(fact.value);
        else unassigned.push(fact);
      }
    } else {
      unassigned.push(...pending);
    }
    pending = [];
  };

  /** Open a new entry at an explicit company boundary (rules 2, 3). */
  const beginCompany = (company: string) => {
    if (pending.length > 0) demotePending();
    flush();
    current = { company, roles: [], duration: "", detail: [] };
  };

  /**
   * Split an explicit "Company – Position" line into company + position. The
   * source line carries both ("Usher Technologies – AI/ML Engineer"); a date
   * was already separated by evidence, so the only remaining ` – ` is the
   * company/position separator. Requires spaces around the separator so
   * hyphenated brand names ("T-Mobile", "well-known") are never split, and
   * the trailing part is a role-like title, not a date or sentence.
   */
  function splitCompanyPosition(value: string): { company: string; position: string } | null {
    const m = value.match(/^(.+?)\s+[–—-]\s+(.+)$/);
    if (!m) return null;
    const company = m[1].trim();
    const position = m[2].trim();
    if (!company || !position) return null;
    if (/\b\d{4}\b/.test(position) || /[.!?]$/.test(position)) return null;
    return { company, position };
  }

  for (const fact of experienceFacts) {
    // A bare company line (no date on it) that evidence kept as `other` is the
    // strongest company signal outside an explicit `company` fact.
    if (fact.type === "other" && isCompanyShaped(fact.value)) {
      beginCompany(fact.value);
      continue;
    }
    // A single capitalised word kept as `other`: a suffix-less company name
    // candidate. It waits for a confirming date boundary — never an entry alone.
    if (fact.type === "other" && isSingleWordCompany(fact.value)) {
      pending.push(fact);
      continue;
    }

    switch (fact.type) {
      case "company": {
        // Strongest boundary: a company+date (or company-prefixed) line. The
        // value may also carry the position ("Usher Technologies – AI/ML
        // Engineer") — split that deterministically into company + role.
        const split = splitCompanyPosition(fact.value);
        if (split) {
          if (pending.length > 0) demotePending();
          flush();
          current = { company: split.company, roles: [split.position], duration: "", detail: [] };
        } else {
          beginCompany(fact.value);
        }
        break;
      }

      case "role": {
        if (!current) {
          // Leading role-like lines: first is the candidate company.
          pending.push(fact);
        } else if (current.duration === "") {
          // Header phase — still collecting titles for the current company.
          current.roles.push(fact.value);
        } else {
          // Entry already dated → this is a candidate for a NEW company.
          pending.push(fact);
        }
        break;
      }

      case "date": {
        if (pending.length > 0) {
          // A run of pending lines followed by a date. The real company is the
          // LAST single-word `other` candidate ("Stripe", "Globex"); any role
          // lines BEFORE it belong to the entry being closed, never a new
          // company. Fall back to the first pending line when no bare-company
          // candidate exists (role-like company names).
          let companyIdx = -1;
          for (let i = pending.length - 1; i >= 0; i--) {
            if (pending[i].type === "other") {
              companyIdx = i;
              break;
            }
          }
          if (companyIdx === -1) companyIdx = 0;
          const company = pending[companyIdx].value;
          if (companyIdx > 0) {
            for (const f of pending.slice(0, companyIdx)) {
              if (current) {
                if (f.type === "role") current.roles.push(f.value);
                else unassigned.push(f);
              } else {
                unassigned.push(f);
              }
            }
          }
          const roles = pending
            .slice(companyIdx + 1)
            .filter((f) => f.type === "role")
            .map((f) => f.value);
          const ambiguous = pending
            .slice(companyIdx + 1)
            .filter((f) => f.type !== "role");
          flush();
          current = { company, roles, duration: fact.value, detail: [] };
          pending = [];
          unassigned.push(...ambiguous);
        } else if (!current) {
          unassigned.push(fact); // orphan date with nothing to attach to
        } else if (current.duration === "") {
          current.duration = fact.value;
        } else {
          unassigned.push(fact); // already dated — extra date is ambiguous
        }
        break;
      }

      case "achievement":
      case "other": {
        if (pending.length > 0) demotePending(); // not a new company — just roles
        if (current) {
          current.detail.push(fact.value);
        } else {
          unassigned.push(fact); // prose/bullet with no company context (rule D)
        }
        break;
      }

      default:
        // Any other fact type cannot belong to an experience entry.
        unassigned.push(fact);
    }
  }

  // Unconfirmed pending lines with no following boundary. When an entry is
  // already open and dated, a trailing role is almost certainly its position
  // ("Platform Engineer" under Globex) — demote it instead of losing it.
  if (pending.length > 0) {
    if (current) {
      for (const fact of pending) {
        if (fact.type === "role") current.roles.push(fact.value);
        else unassigned.push(fact);
      }
    } else {
      unassigned.push(...pending);
    }
    pending = [];
  }

  flush();
  return { entries, unassigned };
}