"use strict";

/**
 * Content plan tests (§3–§5, §9–§15, §22, §29 no-fabrication).
 */

import { describe, expect, it } from "vitest";
import {
  buildContentPlan,
  buildLayoutPlan,
  detectRoleStrategy,
  ROLE_STRATEGIES,
} from "@/lib/resume-planner";
import {
  EARLY_CAREER,
  EXECUTIVE,
  JOBS,
  MID_CAREER,
  SENIOR,
  TECHNICAL,
  makeMatchFixture,
  makeResume,
} from "./fixtures";

describe("detectRoleStrategy (§5, §26)", () => {
  it("maps all 9 job-type fixtures to sensible strategies", () => {
    const expected: Record<string, string> = {
      "Software Engineer": "engineering",
      "Senior Product Manager": "product",
      "Data Analyst": "general",
      "Marketing Manager": "creative",
      "Product Designer": "creative",
      "Account Executive": "general",
      "Financial Analyst": "general",
      "Operations Manager": "product",
      "Chief Operating Officer": "executive",
    };
    for (const job of JOBS) {
      expect(
        detectRoleStrategy(job.title),
        `${job.title} → strategy`,
      ).toBe(expected[job.title]);
    }
  });

  it("falls back to the profile headline, then general", () => {
    expect(detectRoleStrategy("", "Staff Software Engineer")).toBe("engineering");
    expect(detectRoleStrategy("", "Mystery Role")).toBe("general");
    expect(detectRoleStrategy()).toBe("general");
  });

  it("prefers the job title over the profile title", () => {
    expect(
      detectRoleStrategy("Chief Operating Officer", "Software Engineer"),
    ).toBe("executive");
  });
});

describe("section ordering per strategy (§5)", () => {
  const noMatch = { jobAware: false as const };

  it("engineering puts skills before experience projects before education", () => {
    const plan = buildContentPlan(TECHNICAL, { ...noMatch, roleHint: "engineering" });
    const order = plan.sections.map((s) => s.type);
    expect(order.indexOf("skills")).toBeLessThan(order.indexOf("experience"));
    expect(order.indexOf("projects")).toBeLessThan(order.indexOf("education"));
    expect(order[0]).toBe("summary");
  });

  it("product prioritizes achievements (impact) above skills", () => {
    const plan = buildContentPlan(MID_CAREER, { ...noMatch, roleHint: "product" });
    const order = plan.sections.map((s) => s.type);
    expect(order.indexOf("experience")).toBeLessThan(order.indexOf("achievements"));
    expect(order.indexOf("achievements")).toBeLessThan(order.indexOf("skills"));
  });

  it("executive leads with summary + core competencies, drops interests", () => {
    const plan = buildContentPlan(EXECUTIVE, { ...noMatch, roleHint: "executive" });
    const order = plan.sections.map((s) => s.type);
    expect(order.slice(0, 2)).toEqual(["summary", "skills"]);
    expect(plan.excludedSections).toContain("interests");
    expect(order).not.toContain("interests");
  });

  it("creative puts selected projects above skills", () => {
    const plan = buildContentPlan(TECHNICAL, { ...noMatch, roleHint: "creative" });
    const order = plan.sections.map((s) => s.type);
    expect(order.indexOf("projects")).toBeLessThan(order.indexOf("skills"));
  });

  it("every strategy only emits sections the profile actually has (§3)", () => {
    for (const profile of [EARLY_CAREER, MID_CAREER, SENIOR, TECHNICAL, EXECUTIVE]) {
      const plan = buildContentPlan(profile, { jobAware: false });
      for (const s of plan.sections) {
        if (s.type === "summary") expect(profile.summary).toBeTruthy();
        if (s.type === "experience") expect(profile.experience.length).toBeGreaterThan(0);
        if (s.type === "interests") expect(profile.interests.length).toBeGreaterThan(0);
      }
      // No duplicates
      const types = plan.sections.map((s) => s.type);
      expect(new Set(types).size).toBe(types.length);
    }
  });
});

describe("page target and density (§9, §10)", () => {
  it("1–3 roles target one page; 4+ roles target two pages", () => {
    expect(buildContentPlan(EARLY_CAREER, { jobAware: false }).pageTarget).toBe(1);
    expect(
      buildContentPlan(
        makeResume({
          experience: [...MID_CAREER.experience],
        }),
        { jobAware: false },
      ).pageTarget,
    ).toBe(2); // mid-career fixture has 5 roles
    expect(buildContentPlan(SENIOR, { jobAware: false }).pageTarget).toBe(2);
  });

  it("never returns an unknown density and defaults are balanced", () => {
    for (const profile of [EARLY_CAREER, MID_CAREER, SENIOR, TECHNICAL, EXECUTIVE]) {
      const plan = buildContentPlan(profile, { jobAware: false });
      expect(["compact", "balanced", "spacious"]).toContain(plan.density);
    }
    // Tiny profile → spacious; heavy → compact
    const tiny = buildContentPlan(EARLY_CAREER, { jobAware: false });
    expect(["balanced", "spacious"]).toContain(tiny.density);
    const heavy = buildContentPlan(TECHNICAL, { jobAware: false });
    expect(heavy.density).toBe("compact"); // 32 bullets, >30 skills
  });
});

describe("job-aware emphasis (§4, §22) — no fabrication ever", () => {
  const SRC = {
    sourceType: "resume-import" as const,
    sourceRef: "resume:skills",
    capturedAt: "2026-01-01T00:00:00.000Z",
    claimIds: [],
    evidenceIds: [],
  };
  const match = makeMatchFixture([
    { classification: "PROVEN", requirement: "Python", evidence: [{ itemId: "cp_s1", itemKind: "skill", text: "Python", source: SRC }] },
    { classification: "PROVEN", requirement: "distributed systems", evidence: [{ itemId: "cp_e1", itemKind: "experience", text: "Designed event-driven pipeline processing 2B events/day", source: { ...SRC, sourceRef: "resume:experience:e1" } }] },
    { classification: "RELATED", requirement: "Go", evidence: [{ itemId: "cp_s2", itemKind: "skill", text: "Go", source: SRC }] },
    { classification: "COMMUNICATION_GAP", requirement: "Kubernetes", evidence: [{ itemId: "cp_e2", itemKind: "experience", text: "Led migration of 60 services to Kubernetes", source: { ...SRC, sourceRef: "resume:experience:e1" } }] },
    { classification: "MISSING", requirement: "Rust", evidence: [] },
    { classification: "MISSING", requirement: "COBOL", evidence: [] },
  ]);

  it("detects the job role and flags jobAware", () => {
    const plan = buildContentPlan(TECHNICAL, {
      qualificationMatch: match,
      jobTitle: JOBS[0].title,
      jobCompany: JOBS[0].company,
    });
    expect(plan.jobAware).toBe(true);
    expect(plan.roleStrategy).toBe("engineering");
    expect(plan.targetRole).toBe("Software Engineer");
    expect(plan.targetCompany).toBe("Acme Cloud");
  });

  it("highlights only profile skills supported by non-MISSING items", () => {
    const plan = buildContentPlan(TECHNICAL, { qualificationMatch: match });
    expect(plan.highlightedSkills).toContain("Python");
    expect(plan.highlightedSkills).toContain("Go");
    // MISSING must never be promoted — even though this profile HAS Rust.
    expect(plan.emphasisTokens).not.toContain("cobol");
    expect(plan.emphasisTokens).not.toContain("rust");
    // Everything highlighted exists in the profile (subset invariant).
    const names = new Set(TECHNICAL.skills.map((s) => s.name.toLowerCase()));
    for (const h of plan.highlightedSkills) {
      expect(names.has(h.toLowerCase())).toBe(true);
    }
  });

  it("identifies experience entries that carry the evidence", () => {
    const plan = buildContentPlan(TECHNICAL, { qualificationMatch: match });
    expect(plan.highlightedExperienceIds).toContain("e1"); // pipeline + Kubernetes
    // Subset invariant: every highlighted id exists in the profile.
    for (const id of plan.highlightedExperienceIds) {
      expect(TECHNICAL.experience.some((e) => e.id === id)).toBe(true);
    }
  });

  it("drops interests on job-specific resumes to spend space on evidence", () => {
    const plan = buildContentPlan(EARLY_CAREER, { qualificationMatch: match });
    expect(plan.excludedSections).toContain("interests");
    expect(plan.sections.map((s) => s.type)).not.toContain("interests");
  });

  it("jobAware:false ignores the match entirely (§23 switch)", () => {
    const plan = buildContentPlan(TECHNICAL, {
      qualificationMatch: match,
      jobAware: false,
    });
    expect(plan.jobAware).toBe(false);
    expect(plan.highlightedSkills).toEqual([]);
    expect(plan.emphasisTokens).toEqual([]);
  });

  it("no match + no toggle → not job aware", () => {
    const plan = buildContentPlan(TECHNICAL, { jobTitle: "Software Engineer" });
    expect(plan.jobAware).toBe(false);
    expect(plan.roleStrategy).toBe("engineering"); // structure still role-aware
  });
});

describe("budgets (§11, §13, §14)", () => {
  it("caps bullets at 4 for one-page targets and 6 for two-page", () => {
    const one = buildContentPlan(EARLY_CAREER, { jobAware: false });
    expect(one.sections.find((s) => s.type === "experience")?.maxBulletsPerItem).toBe(4);
    const two = buildContentPlan(SENIOR, { jobAware: false });
    expect(two.sections.find((s) => s.type === "experience")?.maxBulletsPerItem).toBe(6);
  });

  it("caps projects and skills (keyword-wall guard)", () => {
    const plan = buildContentPlan(TECHNICAL, { jobAware: false });
    expect(plan.pageTarget).toBe(2); // 4 roles
    expect(plan.sections.find((s) => s.type === "projects")?.maxItems).toBe(5);
    const onePage = buildContentPlan(
      makeResume({
        experience: [{ ...TECHNICAL.experience[0], id: "x1", bulletPoints: ["a", "b"] }],
        projects: TECHNICAL.projects,
      }),
      { jobAware: false },
    );
    expect(onePage.pageTarget).toBe(1);
    expect(onePage.sections.find((s) => s.type === "projects")?.maxItems).toBe(3);
    expect(plan.maxSkills).toBe(30);
    expect(plan.skillGroups.length).toBeGreaterThan(0);
  });

  it("computs education as compact for experienced profiles (§15)", () => {
    expect(buildContentPlan(SENIOR, { jobAware: false }).compressedSections).toContain("education");
    expect(buildContentPlan(EARLY_CAREER, { jobAware: false }).compressedSections).not.toContain("education");
  });

  it("promotes education for early-career profiles (§15)", () => {
    const order = buildContentPlan(EARLY_CAREER, { jobAware: false })
      .sections.map((s) => s.type);
    expect(order.indexOf("education")).toBeLessThanOrEqual(2);
    expect(order.indexOf("education")).toBeLessThan(order.indexOf("interests"));
  });

  it("groups skills by category with dedupe (§13)", () => {
    const plan = buildContentPlan(TECHNICAL, { jobAware: false });
    const flat = plan.skillGroups.flatMap((g) => g.skills);
    expect(new Set(flat.map((s) => s.toLowerCase())).size).toBe(flat.length);
    // Category labels come from the profile
    expect(plan.skillGroups.map((g) => g.label)).toContain("Languages");
  });
});

describe("layout plan (architecture step 4)", () => {
  it("maps the content plan onto renderer vocabulary", () => {
    const plan = buildContentPlan(TECHNICAL, { jobAware: false, roleHint: "engineering" });
    const layout = buildLayoutPlan(plan);
    expect(layout.sectionOrder).toEqual(plan.sections.map((s) => s.type));
    expect(["compact", "normal", "spacious"]).toContain(layout.spacingDensity);
    expect(layout.pageTarget).toBe(plan.pageTarget);
    // Every rendered section carries its honest reason.
    for (const s of plan.sections) {
      expect(layout.reasons[s.type]).toBe(s.reason);
      expect(layout.reasons[s.type].length).toBeGreaterThan(10);
    }
  });

  it("maps balanced density to the renderer's normal spacing", () => {
    const plan = buildContentPlan(EARLY_CAREER, { jobAware: false });
    const layout = buildLayoutPlan(plan);
    const expected =
      plan.density === "balanced" ? "normal" : plan.density;
    expect(layout.spacingDensity).toBe(expected);
  });
});

describe("strategy registry sanity", () => {
  it("has exactly the five §5 strategies, each with recommended families", () => {
    expect(Object.keys(ROLE_STRATEGIES).sort()).toEqual(
      ["creative", "engineering", "executive", "general", "product"].sort(),
    );
    for (const s of Object.values(ROLE_STRATEGIES)) {
      expect(s.order.length).toBeGreaterThan(3);
      expect(s.recommendedFamilies.length).toBeGreaterThan(0);
      // order must contain unique section types
      expect(new Set(s.order).size).toBe(s.order.length);
    }
  });
});
