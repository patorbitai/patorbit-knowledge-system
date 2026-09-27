"use strict";

/**
 * Section preferences helpers (M4 §6) — pure, store-agnostic.
 *
 * The prefs live ON the resume document (`resume.sectionPrefs`), so every
 * helper here is resume-version scoped by construction: applying them to a
 * job version can never reorder the Master Profile.
 *
 * Used by:
 *  - SectionManager dialog (editor pane)
 *  - the inline section popover (click a section heading in the preview)
 *  - tests
 */

import type {
  Resume,
  ResumeSectionKey,
  SectionId,
  SectionPrefs,
} from "@/types/resume";

/** Every section the rendering system can draw, in canonical order. */
export const SECTION_KEYS: ResumeSectionKey[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certs",
  "achievements",
  "languages",
  "interests",
];

/** UI metadata: label + the builder editor that can add content for the key. */
export const SECTION_META: Record<
  ResumeSectionKey,
  { label: string; editorSection?: SectionId }
> = {
  summary: { label: "Summary", editorSection: "personal" },
  experience: { label: "Experience", editorSection: "experience" },
  education: { label: "Education", editorSection: "education" },
  skills: { label: "Skills", editorSection: "skills" },
  projects: { label: "Projects", editorSection: "projects" },
  certs: { label: "Certifications", editorSection: "certifications" },
  achievements: { label: "Achievements", editorSection: "achievements" },
  languages: { label: "Languages", editorSection: "languages" },
  interests: { label: "Interests" },
};

/** Does this resume have content for the section key? */
export function sectionHasContent(resume: Resume, key: ResumeSectionKey): boolean {
  switch (key) {
    case "summary":
      return !!resume.summary?.trim();
    case "experience":
      return resume.experience.length > 0;
    case "education":
      return resume.education.length > 0;
    case "skills":
      return resume.skills.length > 0;
    case "projects":
      return resume.projects.length > 0;
    case "certs":
      return resume.certifications.length > 0;
    case "achievements":
      return resume.achievements.length > 0;
    case "languages":
      return resume.languages.length > 0;
    case "interests":
      return resume.interests.length > 0;
  }
}

export interface SectionOrderView {
  /** Effective order: what renders, then what's user-hidden, then auto-dropped. */
  order: ResumeSectionKey[];
  /** User-hidden keys that still have content. */
  userHidden: ResumeSectionKey[];
  /** Content sections the planner dropped on its own (not user-hidden). */
  autoDropped: ResumeSectionKey[];
}

/**
 * Build the manager's view of the current order.
 * `visibleOrder` is the REAL planner output (`plan.sections`), so what the
 * user sees here is exactly what the resume draws.
 */
export function computeSectionOrder(
  resume: Resume,
  visibleOrder: ResumeSectionKey[],
  prefs: SectionPrefs,
): SectionOrderView {
  const hidden = new Set<ResumeSectionKey>(prefs.hidden ?? []);
  const autoDropped = SECTION_KEYS.filter(
    (k) =>
      sectionHasContent(resume, k) &&
      !visibleOrder.includes(k) &&
      !hidden.has(k),
  );
  const prefIndex = (k: ResumeSectionKey) => {
    const i = prefs.order?.indexOf(k) ?? -1;
    return i < 0 ? (prefs.order?.length ?? 0) : i;
  };
  const userHidden = [...hidden]
    .filter((k) => sectionHasContent(resume, k))
    .sort((a, b) => prefIndex(a) - prefIndex(b));
  return {
    order: [...visibleOrder, ...userHidden, ...autoDropped],
    userHidden,
    autoDropped,
  };
}

/** Swap `key` up/down within the effective order. Returns the new order. */
export function moveInSectionOrder(
  order: ResumeSectionKey[],
  key: ResumeSectionKey,
  dir: -1 | 1,
): ResumeSectionKey[] {
  const idx = order.indexOf(key);
  const to = idx + dir;
  if (idx < 0 || to < 0 || to >= order.length) return order;
  const next = [...order];
  const [moved] = next.splice(idx, 1);
  next.splice(to, 0, moved);
  return next;
}

/** New prefs hiding `key`, keeping the effective order stable. */
export function hideSection(
  prefs: SectionPrefs,
  order: ResumeSectionKey[],
  key: ResumeSectionKey,
): SectionPrefs {
  const hidden = new Set<ResumeSectionKey>(prefs.hidden ?? []);
  hidden.add(key);
  return {
    ...(order.length ? { order } : {}),
    hidden: [...hidden],
  };
}

/** New prefs re-showing `key`. */
export function showSection(
  prefs: SectionPrefs,
  order: ResumeSectionKey[],
  key: ResumeSectionKey,
): SectionPrefs {
  const hidden = (prefs.hidden ?? []).filter((k) => k !== key);
  return {
    ...(order.length ? { order } : {}),
    ...(hidden.length ? { hidden } : {}),
  };
}
