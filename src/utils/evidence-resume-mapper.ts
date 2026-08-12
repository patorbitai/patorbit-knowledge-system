"use strict";

/**
 * Deterministic evidence → Resume overlay (PATORBIT CORE RULE — NO AI).
 *
 * EvidenceFacts are source-of-truth while the Resume produced by rawToResume
 * is a regex guess. For the fields deterministic evidence can PROVE, the exact
 * evidence value wins over whatever the parser recovered:
 *
 *   person                → resume.name
 *   contact (email)       → resume.email
 *   contact (phone)       → resume.phone
 *   link parked on linkedin.com → resume.social.linkedin
 *   link parked on github.com   → resume.social.github
 *   other URL link              → resume.social.website
 *   skill                 → resume.skills (exact name, level never invented)
 *
 * Everything else is left exactly as the parser produced it — evidence never
 * invents or destroys structure it cannot prove. Provenance is preserved by
 * the API response's `evidence` array; the Resume shape has no provenance
 * slots, so this mapper only copies the verbatim value.
 *
 * Summary normalization (deterministic, no AI): contact/link tokens that are
 * independently classified with the same regexes evidence.ts uses (email,
 * phone, LinkedIn/GitHub/website URL) are removed from summary prose and
 * surfaced in their proper field when that field is empty. Prose, skills,
 * roles, dates and technologies are never removed — the summary is never
 * rewritten or reworded.
 */

import type { EvidenceFact } from "@/lib/document-model/evidence";
import { EMAIL_RE, PHONE_RE } from "@/lib/document-model/evidence";
import { splitSkillLevel, withIds } from "@/utils/resume-parser";
import { groupExperienceEntries } from "@/utils/experience-grouping";
import { groupEducationEntries } from "@/utils/education-grouping";
import { groupProjectEntries } from "@/utils/project-grouping";
import { groupCertificationEntries } from "@/utils/certification-grouping";
import { groupLanguageEntries } from "@/utils/language-grouping";
import { normalizeSummaryTokens } from "@/utils/summary-normalization";

type SocialKey = "linkedin" | "github" | "website";

/** Field names this overlay can change, for reporting/verification. */
export type EvidenceOverlayFields =
  | "name"
  | "title"
  | "email"
  | "phone"
  | "address"
  | "social.linkedin"
  | "social.github"
  | "social.website"
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "certifications"
  | "languages"
  | "summary";

export interface EvidenceOverlayResult {
  resume: Record<string, unknown>;
  changed: EvidenceOverlayFields[];
  /** EvidenceFacts that could not be confidently assigned (e.g. ambiguous
   *  experience lines) — preserved for review, never invented into the resume. */
  uncertain: EvidenceFact[];
}

function isEmail(value: string): boolean {
  return new RegExp(`^(?:${EMAIL_RE.source})$`, "i").test(value);
}

function isPhone(value: string): boolean {
  return new RegExp(`^(?:${PHONE_RE.source})$`).test(value);
}

/** Which social field a bare/parked URL belongs to. */
function classifyLink(value: string): SocialKey | null {
  const v = value.toLowerCase();
  if (v.includes("linkedin.com")) return "linkedin";
  if (v.includes("github.com")) return "github";
  return "website";
}

function firstFact(
  facts: EvidenceFact[],
  predicate: (f: EvidenceFact) => boolean,
): EvidenceFact | undefined {
  for (const fact of facts) if (predicate(fact)) return fact;
  return undefined;
}

/** Case-insensitive equality ignoring whitespace — "parser and evidence agree". */
function sameValue(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function markChanged(changed: EvidenceOverlayFields[], field: EvidenceOverlayFields): void {  if (!changed.includes(field)) changed.push(field);
}

/**
 * Overlay deterministic EvidenceFacts onto a parsed Resume.
 *
 * Evidence wins over the parser for the fields it can prove, and ONLY for
 * those fields. A fact whose value already matches the parser keeps the
 * parser's value. Returns the changed field list so callers can report it.
 * Never throws — an empty fact list returns `resume` untouched.
 */
export function mapEvidenceToResume(
  resume: Record<string, unknown>,
  facts: EvidenceFact[],
): EvidenceOverlayResult {
  const changed: EvidenceOverlayFields[] = [];
  const uncertain: EvidenceFact[] = [];

  const social = ensureSocial(resume);

  // name ← person fact (verbatim source text). Evidence wins when the parser
  // got it wrong or left it empty.
  const person = firstFact(facts, (f) => f.type === "person");
  if (person && person.value.trim()) {
    const current = String(resume.name ?? "").trim();
    if (!current || !sameValue(current, person.value)) {
      resume.name = person.value;
      markChanged(changed, "name");
    }
  }

  // title ← role fact from header / name / contact area
  const headerRole = firstFact(facts, (f) => f.type === "role" && (f.provenance.section === "name" || f.provenance.section === "contact" || f.provenance.line < 5));
  if (headerRole && headerRole.value.trim()) {
    const current = String(resume.title ?? "").trim();
    if (!current || !sameValue(current, headerRole.value)) {
      resume.title = headerRole.value;
      markChanged(changed, "title");
    }
  }

  // email ← first contact fact that IS an email address.
  const emailFact = firstFact(facts, (f) => f.type === "contact" && isEmail(f.value));
  if (emailFact) {
    if (typeof resume.email !== "string" || !sameValue(resume.email, emailFact.value)) {
      resume.email = emailFact.value;
      markChanged(changed, "email");
    }
  }

  // phone ← first contact fact that IS a phone number.
  const phoneFact = firstFact(facts, (f) => f.type === "contact" && isPhone(f.value));
  if (phoneFact) {
    if (typeof resume.phone !== "string" || !sameValue(resume.phone, phoneFact.value)) {
      resume.phone = phoneFact.value;
      markChanged(changed, "phone");
    }
  }

  // address ← contact fact an explicit header location ("Mumbai, India"): a
  // contact fact that is neither email nor phone and has a City, Region shape.
  const addrFact = firstFact(facts, (f) => f.type === "contact" && !isEmail(f.value) && !isPhone(f.value) && /^[A-Z][a-zA-Z'’.\-]*(?:\s+[A-Z][a-zA-Z'’.\-]*)*,\s*[A-Z][a-zA-Z'’.\-]{2,}$/.test(f.value));
  if (addrFact) {
    if (typeof resume.address !== "string" || !sameValue(resume.address, addrFact.value)) {
      resume.address = addrFact.value;
      markChanged(changed, "address");
    }
  }

  // social links ← collected link facts; the first URL parked on a given
  // platform wins for that slot (source order preserved).
  for (const fact of facts) {
    const key = fact.type === "link" ? classifyLink(fact.value) : null;
    if (!key) continue;
    const current = typeof social[key] === "string" ? (social[key] as string) : "";
    if (current) continue;
    social[key] = fact.value;
    markChanged(changed, `social.${key}`);
  }

  // skills ← skill facts, verbatim names in source order, no duplicates.
  // level/category are never invented: level is only preserved when the source
  // explicitly wrote it (splitSkillLevel); otherwise it stays empty.
  const skillFacts = facts.filter((f) => f.type === "skill");
  if (skillFacts.length > 0) {
    const seen = new Set<string>();
    const items: { name: string; level?: string; category: string }[] = [];
    for (const fact of skillFacts) {
      const { name, level } = splitSkillLevel(fact.value);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      // Omit an empty level so the schema default applies; an explicit
      // proficiency in source is preserved verbatim.
      items.push(level ? { name, level, category: "" } : { name, category: "" });
    }
    resume.skills = withIds(items);
    markChanged(changed, "skills");
  }

  // experience ← deterministic grouping of the WORK EXPERIENCE section.
  // When the evidence supports grouped entries, they replace whatever the
  // parser (or AI) produced — evidence wins for structure it can prove. Lines
  // that could not be confidently assigned are preserved in `uncertain`.
  const grouping = groupExperienceEntries(facts);
  uncertain.push(...grouping.unassigned);
  if (grouping.entries.length > 0) {
    resume.experience = withIds(grouping.entries);
    markChanged(changed, "experience");
  }

  // education ← deterministic grouping of the EDUCATION section. Only confident
  // entries replace whatever the parser produced; every unassigned line is
  // preserved in `uncertain` for review.
  const educGrouping = groupEducationEntries(facts);
  uncertain.push(...educGrouping.unassigned);
  if (educGrouping.entries.length > 0) {
    resume.education = withIds(educGrouping.entries);
    markChanged(changed, "education");
  }

  // projects ← deterministic grouping of the PROJECTS section.
  const projectGrouping = groupProjectEntries(facts);
  uncertain.push(...projectGrouping.unassigned);
  if (projectGrouping.entries.length > 0) {
    resume.projects = withIds(projectGrouping.entries);
    markChanged(changed, "projects");
  }

  // certifications ← deterministic grouping of the CERTIFICATIONS section.
  const certGrouping = groupCertificationEntries(facts);
  uncertain.push(...certGrouping.unassigned);
  if (certGrouping.entries.length > 0) {
    resume.certifications = withIds(certGrouping.entries);
    markChanged(changed, "certifications");
  }

  // languages ← explicit language entries from the LANGUAGES section. Names are
  // verbatim and proficiency is only set when the source explicitly wrote it.
  const langGrouping = groupLanguageEntries(facts);
  uncertain.push(...langGrouping.unassigned);
  if (langGrouping.entries.length > 0) {
    resume.languages = withIds(langGrouping.entries);
    markChanged(changed, "languages");
  }

  // Summary prose: a dedicated Summary section is the single source of truth
  // for the summary. Its lines are captured as other-facts by the document
  // record pipeline (nothing here invents wording) and are joined verbatim in
  // source order. Anything independently classified (email/phone/links) is
  // still surfaced separately by the normalization step below.
  const summaryFacts = facts
    .filter((f) => f.provenance.section === "summary")
    .sort((a, b) => a.provenance.line - b.provenance.line);
  if (summaryFacts.length > 0) {
    const joined = summaryFacts.map((f) => f.value).join(" ").replace(/\s+/g, " ").trim();
    if (joined && joined !== resume.summary) {
      resume.summary = joined;
      markChanged(changed, "summary");
    }
  }

  // Summary normalization: contact/link tokens that are independently and
  // deterministically classified (email, phone, LinkedIn/GitHub/website URL)
  // are removed from the summary prose and surfaced in their proper field when
  // that field is still empty. Prose, skills, roles, dates and technologies
  // are never removed — the summary is never rewritten or reworded.
  if (typeof resume.summary === "string" && resume.summary.trim()) {
    const normalized = normalizeSummaryTokens(resume.summary);

    for (const token of normalized.tokens) {
      if (token.type === "email") {
        const current = typeof resume.email === "string" ? resume.email.trim() : "";
        if (!current) {
          resume.email = token.value;
          markChanged(changed, "email");
        }
      } else if (token.type === "phone") {
        const current = typeof resume.phone === "string" ? resume.phone.trim() : "";
        if (!current) {
          resume.phone = token.value;
          markChanged(changed, "phone");
        }
      } else if (token.type === "link" && token.social) {
        const current = typeof social[token.social] === "string" ? (social[token.social] as string) : "";
        if (!current) {
          social[token.social] = token.value;
          markChanged(changed, `social.${token.social}`);
        }
      }
    }

    if (normalized.summary !== resume.summary) {
      resume.summary = normalized.summary;
    }
  }

  return { resume, changed, uncertain };
}

function ensureSocial(resume: Record<string, unknown>): Record<string, unknown> {
  if (!resume.social || typeof resume.social !== "object") {
    resume.social = {};
  }
  return resume.social as Record<string, unknown>;
}