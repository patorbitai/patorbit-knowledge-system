"use strict";

/**
 * M4B — semantic resume design tokens.
 *
 * Guards the centralized design system against drift:
 *  1. Typography hierarchy stays inside the M4B brief's ranges.
 *  2. Professional/ATS colors stay dark neutrals (body is never blue).
 *  3. Spacing rhythm stays inside the brief's targets.
 *  4. Every family resolves to a coherent token set.
 *  5. resumeVars emits the complete `--resume-*` contract.
 */

import { describe, it, expect } from "vitest";
import {
  RESUME_TYPE,
  RESUME_COLOR,
  RESUME_SPACE,
  RESUME_DIVIDER,
  resolveResumeTokens,
  resumeVars,
  typeSize,
  spaceSize,
  colorVar,
} from "../resume-tokens";
import { TEMPLATE_FAMILIES, familyIdOf, TEMPLATES } from "@/app/resume-builder/templates";

/** Parse a CSS color into [r,g,b] (hex6 or rgb()). */
function rgb(color: string): [number, number, number] {
  if (color.startsWith("#")) {
    const h = color.slice(1);
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) throw new Error(`unparseable color: ${color}`);
  return [+m[1], +m[2], +m[3]];
}

/** Blue-dominant means "links/visited blue", never body text. */
function isBlueDominant(color: string): boolean {
  const [r, g, b] = rgb(color);
  return b > 120 && b - r > 40 && b - g > 30;
}

describe("typography token consistency (M4B hierarchy)", () => {
  it("keeps every role inside the brief's px ranges", () => {
    expect(RESUME_TYPE.name).toBeGreaterThanOrEqual(28);
    expect(RESUME_TYPE.name).toBeLessThanOrEqual(34);
    expect(RESUME_TYPE.title).toBeGreaterThanOrEqual(16);
    expect(RESUME_TYPE.title).toBeLessThanOrEqual(19);
    expect(RESUME_TYPE.section).toBeGreaterThanOrEqual(14);
    expect(RESUME_TYPE.section).toBeLessThanOrEqual(16);
    expect(RESUME_TYPE.company).toBeGreaterThanOrEqual(14);
    expect(RESUME_TYPE.company).toBeLessThanOrEqual(15);
    expect(RESUME_TYPE.role).toBeGreaterThanOrEqual(13);
    expect(RESUME_TYPE.role).toBeLessThanOrEqual(14);
    expect(RESUME_TYPE.body).toBeGreaterThanOrEqual(12.5);
    expect(RESUME_TYPE.body).toBeLessThanOrEqual(14);
    expect(RESUME_TYPE.meta).toBeGreaterThanOrEqual(11.5);
    expect(RESUME_TYPE.meta).toBeLessThanOrEqual(12.5);
    expect(RESUME_TYPE.skill).toBeGreaterThanOrEqual(11.5);
    expect(RESUME_TYPE.skill).toBeLessThanOrEqual(12.5);
  });

  it("never sets readable content below the11.5px floor", () => {
    for (const [role, px] of Object.entries(RESUME_TYPE)) {
      expect(px, `${role} below readability floor`).toBeGreaterThanOrEqual(11.5);
    }
  });

  it("keeps the hierarchy strictly descending: name > title > section ≈ company > role = body > meta", () => {
    expect(RESUME_TYPE.name).toBeGreaterThan(RESUME_TYPE.title);
    expect(RESUME_TYPE.title).toBeGreaterThan(RESUME_TYPE.section);
    expect(RESUME_TYPE.section).toBeGreaterThanOrEqual(RESUME_TYPE.company);
    expect(RESUME_TYPE.company).toBeGreaterThanOrEqual(RESUME_TYPE.role);
    expect(RESUME_TYPE.body).toBeGreaterThanOrEqual(RESUME_TYPE.meta);
  });
});

describe("color token consistency (no blue body/headings)", () => {
  it("body, headings and muted are dark neutrals", () => {
    for (const key of ["text", "heading", "muted"] as const) {
      expect(isBlueDominant(RESUME_COLOR[key]), `${key} is blue-dominant`).toBe(false);
    }
    const [r, g, b] = rgb(RESUME_COLOR.text);
    expect(r).toBeGreaterThan(30); // dark gray, not navy-black-blue
    expect(Math.max(r, g, b)).toBeLessThanOrEqual(120); // muted-neutral range
    // Near-black slate (#0f172a →15,23,42): every channel ≤60 = "near black".
    expect(rgb(RESUME_COLOR.heading).every((c) => c <= 60)).toBe(true);
  });

  it("link/accent may carry a restrained accent but stay legible", () => {
    for (const key of ["accent", "link"] as const) {
      const [r, g, b] = rgb(RESUME_COLOR[key]);
      expect(r + g + b).toBeGreaterThan(60);
      expect(b).toBeLessThanOrEqual(240);
    }
  });

  it("divider is a light hairline neutral", () => {
    const [r, g, b] = rgb(RESUME_DIVIDER.color);
    expect(r).toBeGreaterThan(180);
    expect(g).toBeGreaterThan(180);
    expect(b).toBeGreaterThan(180);
    expect(RESUME_DIVIDER.width).toMatch(/^\d+(\.\d+)?px$/);
    expect(RESUME_DIVIDER.style).toBe("solid");
  });
});

describe("spacing token consistency (M4B rhythm)", () => {
  it("base rhythm matches the brief's targets", () => {
    expect(RESUME_SPACE.sectionGap).toBeGreaterThanOrEqual(18);
    expect(RESUME_SPACE.sectionGap).toBeLessThanOrEqual(24);
    expect(RESUME_SPACE.headingGap).toBeGreaterThanOrEqual(8);
    expect(RESUME_SPACE.headingGap).toBeLessThanOrEqual(10);
    expect(RESUME_SPACE.itemGap).toBeGreaterThanOrEqual(12);
    expect(RESUME_SPACE.itemGap).toBeLessThanOrEqual(18);
    expect(RESUME_SPACE.bulletGap).toBeGreaterThanOrEqual(4);
    expect(RESUME_SPACE.bulletGap).toBeLessThanOrEqual(7);
    expect(RESUME_SPACE.metaGap).toBeGreaterThanOrEqual(2);
    expect(RESUME_SPACE.metaGap).toBeLessThanOrEqual(5);
    expect(RESUME_SPACE.roleGap).toBeGreaterThanOrEqual(5);
    expect(RESUME_SPACE.roleGap).toBeLessThanOrEqual(8);
  });

  it("every registered template family resolves to a coherent token set", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const t = resolveResumeTokens(id);
      expect(t.type.section).toBeGreaterThanOrEqual(14);
      expect(t.type.section).toBeLessThanOrEqual(16);
      expect(t.space.sectionGap).toBeGreaterThanOrEqual(16);
      expect(t.space.sectionGap).toBeLessThanOrEqual(24);
      expect(t.space.itemGap).toBeGreaterThanOrEqual(12);
      expect(t.space.itemGap).toBeLessThanOrEqual(18);
      expect(t.space.bulletGap).toBeGreaterThanOrEqual(4);
      expect(t.space.bulletGap).toBeLessThanOrEqual(7);
      expect(isBlueDominant(t.color.text), `${id} body blue`).toBe(false);
      expect(isBlueDominant(t.color.heading), `${id} heading blue`).toBe(false);
      // familyIdOf covers every registered template (fallback = modern-professional)
      expect(TEMPLATE_FAMILIES.some((f) => f.id === familyIdOf(id))).toBe(true);
    }
  });
});

describe("--resume-* variable contract", () => {
  it("emits every variable the brief requires", () => {
    const vars = resumeVars("modern-clean");
    for (const key of [
      "--resume-name",
      "--resume-title",
      "--resume-section",
      "--resume-company",
      "--resume-role",
      "--resume-body",
      "--resume-meta",
      "--resume-skill",
      "--resume-text",
      "--resume-heading",
      "--resume-muted",
      "--resume-accent",
      "--resume-border",
      "--resume-link",
      "--resume-section-gap",
      "--resume-heading-gap",
      "--resume-item-gap",
      "--resume-bullet-gap",
      "--resume-meta-gap",
      "--resume-divider",
      "--resume-divider-width",
      "--resume-divider-style",
    ]) {
      expect(vars[key], key).toBeTruthy();
    }
  });

  it("helpers emit scale-aware refs with readable fallbacks", () => {
    expect(typeSize("section")).toBe(
      "calc(var(--rs-type, 1) * var(--resume-section, 15px))",
    );
    expect(spaceSize("sectionGap")).toBe("var(--resume-section-gap, 20px)");
    expect(colorVar("heading")).toBe("var(--resume-heading, #0f172a)");
  });
});
