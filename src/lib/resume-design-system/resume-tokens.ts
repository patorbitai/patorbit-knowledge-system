/**
 * M4B — semantic resume design tokens.
 *
 * The ONE place font sizes, colors, spacing and dividers are defined for the
 * rendered resume document. Templates consume these values (directly through
 * the helpers below, or through the `--resume-*` custom properties emitted on
 * the `[data-rs-scope]` root by StyleScope) instead of inventing their own.
 *
 * Rules encoded here (M4B brief):
 *  - Type hierarchy: name 28–34, title 16–19, section 14–16, company 14–15,
 *    role 13–14, body 12.5–14, meta/skill 11.5–12.5. Nothing readable below
 *    11.5px; never shrink type to solve pagination.
 *  - Color: professional/ATS bodies and headings are dark neutrals; metadata
 *    muted neutral; links a subtle accent; accent used sparingly. Normal body
 *    text is never blue.
 *  - Spacing rhythm: section18–24, heading→content8–10, item12–18,
 *    bullet4–7, company→role2–5, role→bullets5–8.
 *  - All sizes multiply by `--rs-type` (the user's Small/Comfortable/Large
 *    sheet scale) through rs(), so preview, print/PDF and DOCX stay in sync.
 *
 * Families may tune these values through FAMILY_TOKENS; sections may not.
 */

import { familyIdOf, type FamilyId } from "@/app/resume-builder/templates";

/** Type scale in document px (at --rs-type = 1). Within the brief's ranges. */
export const RESUME_TYPE = {
  /** Candidate name — brief: 28–34px */
  name: 30,
  /** Professional title under the name — brief: 16–19px */
  title: 17,
  /** Section heading — brief: 14–16px */
  section: 15,
  /** Company / school / project name — brief: 14–15px */
  company: 15,
  /** Job title / role — brief: 13–14px */
  role: 14,
  /** Body + bullets — brief: 12.5–14px */
  body: 14,
  /** Metadata (dates, location, issuer) — brief: 11.5–12.5px */
  meta: 12,
  /** Skill / tag text — brief: 11.5–12.5px */
  skill: 12.5,
  /** Bullet glyph — decorative marker, sized near body for alignment */
  bullet: 13,
} as const;

/** Semantic colors. Families/templates tune accents; body/heading stay neutral. */
export const RESUME_COLOR = {
  /** Normal body text — dark neutral (never blue) */
  text: "#374151",
  /** Headings (name, section, company) — near black */
  heading: "#0f172a",
  /** Dates, location, issuer, secondary lines — muted neutral */
  muted: "#64748b",
  /** Accent — used sparingly (links, subtle rules) */
  accent: "#2563eb",
  /** Hairline borders/dividers */
  border: "#e5e7eb",
  /** Link color — subtle accent */
  link: "#1d4ed8",
} as const;

/** Spacing rhythm in px — brief targets in parentheses. */
export const RESUME_SPACE = {
  /** section → section (18–24) */
  sectionGap: 20,
  /** section heading → content (8–10) */
  headingGap: 9,
  /** experience/education item → item (12–18) */
  itemGap: 14,
  /** bullet → bullet (4–7) */
  bulletGap: 5,
  /** company → role line (2–5) */
  metaGap: 3,
  /** role line → bullets (5–8) */
  roleGap: 6,
  /** entry (company/name) → next meta line */
  entryGap: 3,
} as const;

/** Divider (section-heading rule). */
export const RESUME_DIVIDER = {
  color: "#cbd5e1",
  width: "1.5px",
  style: "solid",
} as const;

export interface ResumeTokens {
  type: typeof RESUME_TYPE;
  color: { text: string; heading: string; muted: string; accent: string; border: string; link: string };
  /** Numeric px values — families may tune within the brief's ranges. */
  space: { [K in keyof typeof RESUME_SPACE]: number };
  divider: { color: string; width: string; style: string };
}

/**
 * Per-family tuning. Values omitted inherit the professional base. Colors
 * here are FAMILY-level defaults for the `--resume-*` variables — a
 * template's native palette still styles its own accents, and may override
 * the vars on its root when it diverges.
 */
type FamilyTune = {
  color?: Partial<ResumeTokens["color"]>;
  space?: Partial<ResumeTokens["space"]>;
  divider?: ResumeTokens["divider"];
};

const FAMILY_TOKENS: Record<FamilyId, FamilyTune> = {
  "classic-ats": {
    // Restrained: near-neutral accent, hairline rules.
    color: { accent: "#334151", link: "#1e3a8a" },
    divider: { color: "#9ca3af", width: "1px", style: "solid" },
  },
  "modern-professional": {
    color: { accent: "#2563eb", link: "#1d4ed8" },
    divider: { color: "#cbd5e1", width: "1.5px", style: "solid" },
  },
  technical: {
    color: { accent: "#475569", link: "#1d4ed8" },
    divider: { color: "#cbd5e1", width: "1px", style: "solid" },
  },
  executive: {
    // Generous whitespace, restrained gold-ish accent.
    color: { accent: "#b45309", link: "#92400e" },
    space: { ...RESUME_SPACE, sectionGap: 24, itemGap: 16 },
    divider: { color: "#d6c89a", width: "1px", style: "solid" },
  },
  compact: {
    // Dense but readable — never microscopic.
    color: { accent: "#475569", link: "#334155" },
    space: { ...RESUME_SPACE, sectionGap: 16, itemGap: 12, bulletGap: 4 },
    divider: { color: "#cbd5e1", width: "1px", style: "solid" },
  },
  creative: {
    color: { accent: "#7c3aed", link: "#6d28d9" },
    divider: { color: "#c4b5fd", width: "1.5px", style: "solid" },
  },
  academic: {
    color: { accent: "#1e3a8a", link: "#1e3a8a" },
    divider: { color: "#9ca3af", width: "1px", style: "solid" },
  },
};

/** Resolve the token set for a template id (family-tuned over the base). */
export function resolveResumeTokens(templateId: string): ResumeTokens {
  const family = familyIdOf(templateId);
  const tune = FAMILY_TOKENS[family];
  return {
    type: RESUME_TYPE,
    color: { ...RESUME_COLOR, ...(tune.color ?? {}) },
    space: { ...RESUME_SPACE, ...(tune.space ?? {}) },
    divider: { ...RESUME_DIVIDER, ...(tune.divider ?? {}) },
  };
}

/**
 * `--resume-*` custom properties for the `[data-rs-scope]` root. They flow
 * through serializePage with the rest of the vars, so preview, gallery,
 * print/PDF and serialized pages all agree. Templates that diverge may
 * override individual vars on their own root.
 */
export function resumeVars(templateId: string): Record<string, string> {
  const t = resolveResumeTokens(templateId);
  return {
    "--resume-name": `${t.type.name}px`,
    "--resume-title": `${t.type.title}px`,
    "--resume-section": `${t.type.section}px`,
    "--resume-company": `${t.type.company}px`,
    "--resume-role": `${t.type.role}px`,
    "--resume-body": `${t.type.body}px`,
    "--resume-meta": `${t.type.meta}px`,
    "--resume-skill": `${t.type.skill}px`,
    "--resume-bullet-glyph": `${t.type.bullet}px`,
    "--resume-text": t.color.text,
    "--resume-heading": t.color.heading,
    "--resume-muted": t.color.muted,
    "--resume-accent": t.color.accent,
    "--resume-border": t.color.border,
    "--resume-link": t.color.link,
    "--resume-section-gap": `${t.space.sectionGap}px`,
    "--resume-heading-gap": `${t.space.headingGap}px`,
    "--resume-item-gap": `${t.space.itemGap}px`,
    "--resume-bullet-gap": `${t.space.bulletGap}px`,
    "--resume-meta-gap": `${t.space.metaGap}px`,
    "--resume-role-gap": `${t.space.roleGap}px`,
    "--resume-divider": t.divider.color,
    "--resume-divider-width": t.divider.width,
    "--resume-divider-style": t.divider.style,
  };
}

/**
 * Scale-aware px string for a type token — e.g. `typeSize("section")` →
 * `calc(var(--rs-type, 1) * var(--resume-section, 15px))`. Falls back to the
 * base token when rendered outside a StyleScope (tests, DOCX validation).
 */
export function typeSize<K extends keyof typeof RESUME_TYPE>(token: K): string {
  return `calc(var(--rs-type, 1) * var(--resume-${kebab(token)}, ${RESUME_TYPE[token]}px))`;
}

/** CSS var reference with a fallback for a spacing token. */
export function spaceSize<K extends keyof typeof RESUME_SPACE>(token: K): string {
  return `var(--resume-${kebab(token)}, ${RESUME_SPACE[token]}px)`;
}

/** CSS var reference with a fallback for a semantic color. */
export function colorVar(token: keyof typeof RESUME_COLOR): string {
  return `var(--resume-${token}, ${RESUME_COLOR[token]})`;
}

function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
