"use strict";

/**
 * M4 Phase 3 — inline click resolver.
 *
 * Maps the TEXT a user clicked in the live preview back to the resume field
 * that produced it. Content-based (not markup-based), so it works across all
 * 32 templates without touching a single template component: every template
 * draws the same normalized resume, so identical text ⇒ identical field.
 *
 * Pure + deterministic — heavily unit-tested. The caller walks from the
 * clicked element OUTWARD and takes the first non-null resolution, so
 * innermost (most precise) text wins; compound parent rows (contact lines,
 * "Position · Type · City") are handled by the split/contains fallbacks
 * below.
 */

import type { Resume, ResumeSectionKey, SocialLinks } from "@/types/resume";
import { linkLabel } from "@/lib/resume-links";

export type HeaderField = "name" | "title" | "email" | "phone" | "address";

export type InlineTarget =
  | { kind: "header"; field: HeaderField }
  | { kind: "summary" }
  | { kind: "social"; key: keyof SocialLinks }
  | { kind: "experience"; expId: string; part: "entry" | "description" }
  | { kind: "bullet"; expId: string; index: number }
  | { kind: "education"; eduId: string }
  | { kind: "skill"; skillId: string }
  | { kind: "project"; projectId: string; part: "entry" | "description" }
  | { kind: "project-bullet"; projectId: string; index: number }
  | { kind: "section"; section: ResumeSectionKey };

/** Case/whitespace/bullet-marker-insensitive comparison form. */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\s*[•▪◦‣·*–-]+\s*/, "") // leading bullet glyph / dash
    .replace(/[.,;:]+$/, "") // trailing sentence punctuation
    .trim();
}

/** Section heading aliases actually used across the template families. */
const SECTION_ALIASES: Record<string, ResumeSectionKey> = {
  summary: "summary",
  "professional summary": "summary",
  "professional profile": "summary",
  "profile summary": "summary",
  "about me": "summary",
  experience: "experience",
  "professional experience": "experience",
  "work experience": "experience",
  "employment": "experience",
  "employment history": "experience",
  education: "education",
  "academic background": "education",
  "academic history": "education",
  skills: "skills",
  "technical skills": "skills",
  "key skills": "skills",
  "core competencies": "skills",
  projects: "projects",
  "selected projects": "projects",
  "personal projects": "projects",
  certifications: "certs",
  "certifications & licenses": "certs",
  "licenses & certifications": "certs",
  credentials: "certs",
  achievements: "achievements",
  "awards": "achievements",
  "awards & honors": "achievements",
  "honors & awards": "achievements",
  languages: "languages",
  interests: "interests",
};

const HEADER_FIELDS: HeaderField[] = ["name", "title", "email", "phone", "address"];

const SOCIAL_KEYS: Array<keyof SocialLinks> = [
  "linkedin",
  "github",
  "website",
  "portfolio",
  "twitter",
  "stackoverflow",
];

const SOCIAL_LABELS: Record<string, keyof SocialLinks> = {
  linkedin: "linkedin",
  "linked in": "linkedin",
  github: "github",
  "git hub": "github",
  website: "website",
  portfolio: "portfolio",
  twitter: "twitter",
  x: "twitter",
  stackoverflow: "stackoverflow",
  "stack overflow": "stackoverflow",
};

/** Format an experience/project date the way the templates display it. */
function dateText(item: { duration?: string; startDate?: string; endDate?: string }): string {
  return item.duration || [item.startDate, item.endDate].filter(Boolean).join(" – ");
}

/**
 * Resolve ONE text against the resume. Callers should try innermost text
 * first and stop at the first hit.
 */
export function resolveInlineTarget(
  resume: Resume,
  rawText: string,
): InlineTarget | null {
  // Structural texts (whole sections/pages) are never a single field —
  // guarding here keeps the containment fallbacks from misfiring on huge
  // ancestors when a click lands on whitespace.
  if (rawText.length > 600) return null;
  const text = normalizeForMatch(rawText);
  if (!text) return null;

  /* ── Exact matches (innermost elements) ── */

  // Header identity/contact values.
  for (const field of HEADER_FIELDS) {
    const value = normalizeForMatch(resume[field] ?? "");
    if (value && text === value) return { kind: "header", field };
  }

  // Social links (anchor label OR raw value).
  for (const key of SOCIAL_KEYS) {
    const value = resume.social?.[key];
    if (!value) continue;
    if (text === normalizeForMatch(value) || text === normalizeForMatch(linkLabel(value))) {
      return { kind: "social", key };
    }
  }

  // Section headings.
  const section = SECTION_ALIASES[text];
  if (section) return { kind: "section", section };

  // Social link names (e.g. "LinkedIn" label variants).
  const socialByLabel = SOCIAL_LABELS[text];
  if (socialByLabel && resume.social?.[socialByLabel]) {
    return { kind: "social", key: socialByLabel };
  }

  // Experience: company / position / location / employment type / dates.
  for (const exp of resume.experience) {
    if (
      (exp.company && text === normalizeForMatch(exp.company)) ||
      (exp.position && text === normalizeForMatch(exp.position)) ||
      (exp.location && text === normalizeForMatch(exp.location)) ||
      (exp.employmentType && text === normalizeForMatch(exp.employmentType)) ||
      (dateText(exp) && text === normalizeForMatch(dateText(exp)))
    ) {
      return { kind: "experience", expId: exp.id, part: "entry" };
    }
  }

  // Experience bullets (exact).
  for (const exp of resume.experience) {
    const bullets = exp.bulletPoints ?? [];
    for (let i = 0; i < bullets.length; i++) {
      if (normalizeForMatch(bullets[i]) === text) {
        return { kind: "bullet", expId: exp.id, index: i };
      }
    }
  }

  // Experience description lines (exact line match).
  for (const exp of resume.experience) {
    const lines = (exp.description ?? "")
      .split("\n")
      .map((l) => normalizeForMatch(l))
      .filter(Boolean);
    if (lines.includes(text)) {
      return { kind: "experience", expId: exp.id, part: "description" };
    }
  }

  // Education: school / degree / field / year / gpa / honors.
  for (const edu of resume.education) {
    if (
      (edu.school && text === normalizeForMatch(edu.school)) ||
      (edu.degree && text === normalizeForMatch(edu.degree)) ||
      (edu.field && text === normalizeForMatch(edu.field)) ||
      (edu.year && text === normalizeForMatch(edu.year)) ||
      (edu.gpa && text === normalizeForMatch(`gpa ${edu.gpa}`)) ||
      (edu.honors && text === normalizeForMatch(edu.honors))
    ) {
      return { kind: "education", eduId: edu.id };
    }
  }

  // Skills (name alone or "Name (level)").
  for (const skill of resume.skills) {
    const name = normalizeForMatch(skill.name);
    if (!name) continue;
    if (text === name || text === `${name} (${skill.level.toLowerCase()})`) {
      return { kind: "skill", skillId: skill.id };
    }
  }

  // Projects: name / role / tech / dates.
  for (const proj of resume.projects) {
    if (
      (proj.name && text === normalizeForMatch(proj.name)) ||
      (proj.role && text === normalizeForMatch(proj.role)) ||
      (dateText(proj) && text === normalizeForMatch(dateText(proj)))
    ) {
      return { kind: "project", projectId: proj.id, part: "entry" };
    }
  }

  // Project bullets (exact).
  for (const proj of resume.projects) {
    const bullets = proj.bulletPoints ?? [];
    for (let i = 0; i < bullets.length; i++) {
      if (normalizeForMatch(bullets[i]) === text) {
        return { kind: "project-bullet", projectId: proj.id, index: i };
      }
    }
  }

  /* ── Compound rows: split on separators, all parts must agree ──
   * Handles contact lines ("email | phone | address"), split headers
   * ("Position  ·  Type  ·  City") and joined social rows. */
  const parts = text
    .split(/\s*[|·•–—]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const resolved = parts
      .map((p) => resolveInlineTarget(resume, p))
      .filter((t): t is InlineTarget => t !== null);
    if (resolved.length > 0) {
      // Majority vote on the field family, first occurrence breaks ties:
      //  - contact rows (email | phone | address) → the header editor
      //  - entry rows (position · type · city)     → the experience editor
      //  - joined social rows                      → the social editor
      const counts = new Map<string, number>();
      for (const t of resolved) counts.set(t.kind, (counts.get(t.kind) ?? 0) + 1);
      let best = resolved[0];
      let bestCount = 0;
      for (const t of resolved) {
        const c = counts.get(t.kind) ?? 0;
        if (c > bestCount) {
          best = t;
          bestCount = c;
        }
      }
      return best;
    }
  }

  /* ── Fallback containment rules (compound / wrapped text) ── */

  // Summary BEFORE the loose entry-line fallbacks: a summary often opens
  // with the person's title ("Senior Software engineer with 7+ years…") —
  // exact field matches above still win, but a prefix heuristic must never
  // hijack the summary paragraph. Containment only, ≥8 chars, so headings
  // and field values can't be swallowed by it either.
  const summary = normalizeForMatch(resume.summary ?? "");
  if (summary && (text === summary || (text.length >= 8 && summary.includes(text)))) {
    return { kind: "summary" };
  }

  // "Position · Type · City" style entry line. Bounded: an entry line is a
  // short line, never a paragraph.
  for (const exp of resume.experience) {
    const position = normalizeForMatch(exp.position ?? "");
    if (
      position.length >= 4 &&
      text.startsWith(position) &&
      text.length <= position.length + 120
    ) {
      return { kind: "experience", expId: exp.id, part: "entry" };
    }
  }
  for (const proj of resume.projects) {
    const name = normalizeForMatch(proj.name ?? "");
    if (
      name.length >= 4 &&
      text.startsWith(name) &&
      text.length <= name.length + 120
    ) {
      return { kind: "project", projectId: proj.id, part: "entry" };
    }
  }

  // Education compound ("BS, Computer Science — State University").
  for (const edu of resume.education) {
    const school = normalizeForMatch(edu.school ?? "");
    const degree = normalizeForMatch(edu.degree ?? "");
    if ((school.length >= 4 && text.includes(school)) || (degree.length >= 4 && text.includes(degree))) {
      return { kind: "education", eduId: edu.id };
    }
  }

  return null;
}
