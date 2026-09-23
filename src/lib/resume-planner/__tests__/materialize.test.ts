"use strict";

/**
 * materializePlan tests — purity (master data untouched), bullet budgets,
 * relevance-first ordering, dedupe and exclusions (§9, §13, §23, §24).
 */

import { describe, expect, it } from "vitest";
import {
  buildContentPlan,
  materializePlan,
  selectBullets,
} from "@/lib/resume-planner";
import { EARLY_CAREER, MID_CAREER, TECHNICAL, makeMatchFixture, makeResume } from "./fixtures";

describe("selectBullets (§11, §12)", () => {
  const tokens = new Set(["kubernetes", "latency"]);

  it("returns bullets untouched when under the cap", () => {
    const b = ["one", "two"];
    expect(selectBullets(b, 4, tokens)).toEqual(b);
  });

  it("prefers job-relevant bullets but keeps original order", () => {
    const bullets = [
      "Managed the roadmap", // 0 cold
      "Cut p99 latency 45%", // 1 hot
      "Wrote documentation", // 2 cold
      "Led Kubernetes migration", // 3 hot
      "Ran interviews", // 4 cold
    ];
    const out = selectBullets(bullets, 3, tokens);
    expect(out).toHaveLength(3);
    expect(out).toContain("Cut p99 latency 45%");
    expect(out).toContain("Led Kubernetes migration");
    // Original relative order restored (we select, we never reorder)
    expect(out).toEqual([
      "Managed the roadmap",
      "Cut p99 latency 45%",
      "Led Kubernetes migration",
    ]);
  });

  it("falls back to leading bullets when nothing matches tokens", () => {
    const bullets = ["a", "b", "c", "d", "e", "f"];
    expect(selectBullets(bullets, 4, tokens)).toEqual(["a", "b", "c", "d"]);
  });

  it("no cap → identity", () => {
    const bullets = ["a", "b", "c"];
    expect(selectBullets(bullets, undefined, tokens)).toEqual(bullets);
  });
});

describe("materializePlan", () => {
  it("never mutates the input resume (§24 master integrity)", () => {
    const resume = TECHNICAL;
    const before = JSON.parse(JSON.stringify(resume));
    const plan = buildContentPlan(resume, {
      qualificationMatch: makeMatchFixture([
        { classification: "PROVEN", requirement: "Go", evidence: [] },
      ]),
      jobTitle: "Software Engineer",
    });
    materializePlan(resume, plan);
    expect(JSON.parse(JSON.stringify(resume))).toEqual(before);
  });

  it("caps bullets per role for a one-page target", () => {
    const plan = buildContentPlan(EARLY_CAREER, { jobAware: false });
    const vm = materializePlan(EARLY_CAREER, plan);
    // 3 bullets, cap 4 → untouched
    expect(vm.experience[0].bulletPoints).toHaveLength(3);

    const longRole = makeResume({
      experience: [
        {
          ...EARLY_CAREER.experience[0],
          bulletPoints: ["b1", "b2", "b3", "b4", "b5", "b6", "b7"],
        },
      ],
    });
    const plan2 = buildContentPlan(longRole, { jobAware: false });
    const vm2 = materializePlan(longRole, plan2);
    expect(vm2.experience[0].bulletPoints).toHaveLength(4);
    expect(vm2.experience[0].bulletPoints).toEqual(["b1", "b2", "b3", "b4"]);
  });

  it("dedupes and budgets skills, highlighted first (§13)", () => {
    const duped = makeResume({
      skills: [
        { id: "1", name: "React", level: "Advanced", category: "Frameworks", years: "3" },
        { id: "2", name: "react", level: "Advanced", category: "Frameworks", years: "3" },
        { id: "3", name: "SQL", level: "Advanced", category: "Databases", years: "3" },
      ],
    });
    const match = makeMatchFixture([
      { classification: "PROVEN", requirement: "SQL", evidence: [] },
    ]);
    const plan = buildContentPlan(duped, { qualificationMatch: match, jobTitle: "Data Analyst" });
    const vm = materializePlan(duped, plan);
    const names = vm.skills.map((s) => s.name);
    expect(new Set(names.map((n) => n.toLowerCase())).size).toBe(names.length);
    expect(names[0]).toBe("SQL"); // highlighted first
    expect(vm.skills.find((s) => s.name === "SQL")?.highlighted).toBe(true);
    expect(vm.skills).toHaveLength(2);
  });

  it("renders excluded sections empty so length-guarded templates skip them", () => {
    const plan = buildContentPlan(EARLY_CAREER, {
      qualificationMatch: makeMatchFixture([
        { classification: "PROVEN", requirement: "SQL", evidence: [] },
      ]),
      jobTitle: "Data Analyst",
    });
    expect(plan.excludedSections).toContain("interests");
    const vm = materializePlan(EARLY_CAREER, plan);
    expect(vm.interests).toEqual([]);
  });

  it("orders projects relevance-first and slices to the plan budget (§14)", () => {
    const plan = buildContentPlan(TECHNICAL, { jobAware: false });
    const vm = materializePlan(TECHNICAL, plan);
    expect(vm.projects.length).toBeLessThanOrEqual(
      plan.sections.find((s) => s.type === "projects")?.maxItems ?? Infinity,
    );
    expect(vm.projects.length).toBeGreaterThan(0);
    // All ids still come from the profile
    for (const p of vm.projects) {
      expect(TECHNICAL.projects.some((x) => x.id === p.id)).toBe(true);
    }
  });

  it("works without a plan-affected profile (empty resume stays empty)", () => {
    const empty = makeResume();
    const plan = buildContentPlan(empty, { jobAware: false });
    const vm = materializePlan(empty, plan);
    expect(vm.experience).toEqual([]);
    expect(vm.skills).toEqual([]);
    expect(plan.sections).toEqual([]); // nothing renderable
  });

  it("mid-career two-page plans keep up to 6 bullets", () => {
    const plan = buildContentPlan(MID_CAREER, { jobAware: false });
    expect(plan.pageTarget).toBe(2);
    const vm = materializePlan(MID_CAREER, plan);
    // First role has 4 bullets → untouched
    expect(vm.experience[0].bulletPoints).toHaveLength(4);
  });
});
