"use strict";

/**
 * materializePlan — turns (Resume, plan) into the VIEW MODEL the renderers
 * draw. One integration point serves every template: the 25 factory configs
 * AND the bespoke components receive already-budgeted data.
 *
 * Hard rules:
 *  - Pure: the input resume is never mutated (master data untouched, §24).
 *  - Render-only: consumers must NOT persist the output — it is a projection.
 *  - Selection, never fabrication: arrays are reordered/sliced; text is
 *    never rewritten, added or removed inside an item.
 */

import type { ResumeContentPlan, SectionType } from "./types";

/**
 * Structural minimum the planner touches. Resume and DocxResumeData both
 * satisfy it without index-signature gymnastics; the generic keeps the
 * caller's exact type flowing through (materialize(Resume) → Resume).
 */
export interface MaterializableResume {
  experience?: Array<{ bulletPoints?: string[]; description?: string }>;
  skills?: Array<{ name?: string; highlighted?: boolean }>;
  projects?: Array<{ id?: string | number }>;
  certifications?: Array<{ id?: string | number }>;
  achievements?: Array<{ id?: string | number }>;
  languages?: Array<{ id?: string | number }>;
  interests?: Array<{ id?: string | number }>;
}

function section(plan: ResumeContentPlan, type: SectionType) {
  return plan.sections.find((s) => s.type === type);
}

const WORD_RE = /[a-z0-9+#.]+/g;

function words(text: string): string[] {
  return (text.toLowerCase().match(WORD_RE) ?? []).filter((w) => w.length >= 3);
}

/**
 * Cap bullets, preferring ones that touch the plan's emphasis tokens, then
 * restoring the user's original relative order (never renumber/reword).
 */
export function selectBullets(
  bullets: string[],
  cap: number | undefined,
  tokens: Set<string>,
): string[] {
  if (!cap || bullets.length <= cap) return bullets;

  const scored = bullets.map((text, index) => ({
    text,
    index,
    hot: words(text).some((w) => tokens.has(w)),
  }));

  const picked = scored.filter((s) => s.hot).slice(0, cap);
  if (picked.length < cap) {
    for (const s of scored) {
      if (picked.length >= cap) break;
      if (!s.hot) picked.push(s);
    }
  }
  picked.sort((a, b) => a.index - b.index);
  return picked.map((p) => p.text);
}

function orderAndSlice<T extends { id?: string | number }>(
  items: T[],
  preferredIds: string[] | undefined,
  maxItems: number | undefined,
): T[] {
  let ordered = items;
  if (preferredIds && preferredIds.length > 0) {
    const byId = new Map<string, T>();
    for (const it of items) {
      if (it.id !== undefined) byId.set(String(it.id), it);
    }
    const head: T[] = [];
    for (const id of preferredIds) {
      const it = byId.get(id);
      if (it) head.push(it);
    }
    const headSet = new Set(head);
    const tail = items.filter((it) => !headSet.has(it));
    ordered = [...head, ...tail];
  }
  return maxItems !== undefined ? ordered.slice(0, maxItems) : ordered;
}

/** Build the render view model for the given plan. Pure. */
export function materializePlan<T extends MaterializableResume>(
  resume: T,
  plan: ResumeContentPlan,
): T {
  const tokens = new Set(plan.emphasisTokens);
  const highlighted = new Set(plan.highlightedSkills.map((h) => h.toLowerCase()));

  // Shallow clone — the caller's object identity/content is preserved.
  const out = { ...resume } as MaterializableResume & Record<string, unknown>;

  /* ── Excluded sections → empty so length-guarded renderers skip them ── */
  for (const type of plan.excludedSections) {
    if (type === "interests") out.interests = [];
    if (type === "languages") out.languages = [];
    if (type === "achievements") out.achievements = [];
    if (type === "projects") out.projects = [];
    if (type === "certs") out.certifications = [];
  }

  /* ── Experience: bullet + description-line budget, original order ── */
  const expSection = section(plan, "experience");
  if (Array.isArray(out.experience)) {
    out.experience = out.experience.map((exp) => {
      let next = exp;
      const bullets = next.bulletPoints;
      if (Array.isArray(bullets)) {
        const selected = selectBullets(
          bullets,
          expSection?.maxBulletsPerItem,
          tokens,
        );
        if (selected.length !== bullets.length) {
          next = { ...next, bulletPoints: selected };
        }
      }
      // Description often carries the bullets as lines (DOCX path); apply
      // the same whole-line selection so preview and DOCX stay identical.
      if (typeof next.description === "string" && next.description.includes("\n")) {
        const lines = next.description.split("\n");
        if (lines.length > (expSection?.maxBulletsPerItem ?? Infinity)) {
          const selectedLines = selectBullets(lines, expSection?.maxBulletsPerItem, tokens);
          next = { ...next, description: selectedLines.join("\n") };
        }
      }
      return next;
    });
  }

  /* ── Skills: grouped order (highlighted first), deduped, budgeted ── */
  if (Array.isArray(out.skills)) {
    const byName = new Map<string, (typeof out.skills)[number]>();
    for (const s of out.skills) {
      const key = (s.name ?? "").toLowerCase();
      if (key && !byName.has(key)) byName.set(key, s);
    }

    const ordered: (typeof out.skills)[number][] = [];
    const used = new Set<string>();
    for (const group of plan.skillGroups) {
      for (const name of group.skills) {
        const key = name.toLowerCase();
        if (used.has(key)) continue;
        const s = byName.get(key);
        if (s) {
          ordered.push(s);
          used.add(key);
        }
      }
    }
    // Safety net: any skill the groups missed keeps its place.
    for (const [key, s] of byName) {
      if (!used.has(key)) ordered.push(s);
    }

    const capped = ordered.slice(0, plan.maxSkills);
    out.skills = capped.map((s) =>
      highlighted.has((s.name ?? "").toLowerCase())
        ? { ...s, highlighted: true }
        : s,
    );
  }

  /* ── Projects / certs: relevance-first, budgeted (§14/§15) ── */
  if (Array.isArray(out.projects)) {
    out.projects = orderAndSlice(
      out.projects,
      plan.relevantProjectIds,
      section(plan, "projects")?.maxItems,
    );
  }
  if (Array.isArray(out.certifications)) {
    out.certifications = orderAndSlice(
      out.certifications,
      plan.relevantCertificationIds,
      section(plan, "certs")?.maxItems,
    );
  }
  if (Array.isArray(out.achievements)) {
    out.achievements = orderAndSlice(
      out.achievements,
      undefined,
      section(plan, "achievements")?.maxItems,
    );
  }

  return out as unknown as T;
}
