"use strict";

/**
 * §6 template-family taxonomy tests — every registered template must belong
 * to exactly one of the 7 families, and each family must be non-empty with a
 * distinct purpose (no color/font-only "families").
 */

import { describe, expect, it } from "vitest";
import {
  TEMPLATES,
  TEMPLATE_FAMILIES,
  FAMILY_BY_TEMPLATE,
  familyIdOf,
} from "@/app/resume-builder/templates";
import { ROLE_STRATEGIES } from "@/lib/resume-planner";

describe("template families (§6)", () => {
  it("defines exactly the 7 suggested families", () => {
    expect(TEMPLATE_FAMILIES.map((f) => f.id).sort()).toEqual(
      [
        "academic",
        "classic-ats",
        "compact",
        "creative",
        "executive",
        "modern-professional",
        "technical",
      ].sort(),
    );
  });

  it("maps every registered template to a family (no orphans)", () => {
    for (const t of TEMPLATES) {
      expect(
        FAMILY_BY_TEMPLATE[t.id],
        `template ${t.id} has no family`,
      ).toBeDefined();
      expect(familyIdOf(t.id)).toBe(FAMILY_BY_TEMPLATE[t.id]);
    }
  });

  it("has no stray family-map entries and every family is non-empty", () => {
    const registered = new Set(TEMPLATES.map((t) => t.id));
    for (const id of Object.keys(FAMILY_BY_TEMPLATE)) {
      expect(registered.has(id), `family map references unknown id ${id}`).toBe(true);
    }
    for (const f of TEMPLATE_FAMILIES) {
      const members = TEMPLATES.filter((t) => familyIdOf(t.id) === f.id);
      expect(members.length, `family ${f.id} is empty`).toBeGreaterThan(0);
      expect(f.purpose.length).toBeGreaterThan(20);
      expect(f.bestFor.length).toBeGreaterThan(10);
    }
  });

  it("every role strategy recommends real families", () => {
    const known = new Set<string>(TEMPLATE_FAMILIES.map((f) => f.id));
    for (const s of Object.values(ROLE_STRATEGIES)) {
      for (const fam of s.recommendedFamilies) {
        expect(known.has(fam), `unknown family ${fam}`).toBe(true);
      }
    }
  });
});
