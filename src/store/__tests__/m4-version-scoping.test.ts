"use strict";

/**
 * M4 — Resume Version editing is INDEPENDENT of the Master Profile.
 *
 * Regression coverage for:
 *  - item 9:  Master Profile remains unchanged after Resume Version editing
 *             (content, social, section order — nothing leaks back)
 *  - item 6:  section ordering persists (version-scoped, planner-honored)
 *  - item 7:  hidden section stays hidden (presentation only — data intact)
 *  - item 8:  edited resume survives a reload (persist JSON round-trip)
 *  - item 16: template switching preserves content + prefs
 *  - Phase 2: skills can be reordered (moveSkill)
 *  - Phase 9: edits arm autosave (saveStatus "unsaved")
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  useResumeBuilder,
  defaultResume,
  mergePersistedResumeState,
} from "../resume-builder";
import { buildContentPlan } from "@/lib/resume-planner";
import type { Resume, Skill } from "@/types/resume";

function skill(name: string): Skill {
  return { id: `s_${name}`, name, level: "Intermediate", category: "", years: "" };
}

function mkResume(id: string, name: string, summary: string): Resume {
  const r: Resume = {
    ...structuredClone(defaultResume),
    resumeId: id,
    resumeName: name,
    summary,
  };
  r.skills = [skill("Python"), skill("Kubernetes"), skill("TypeScript")];
  r.education = [
    {
      id: "edu1",
      school: "State University",
      degree: "B.S.",
      year: "2019",
      field: "Computer Science",
      gpa: "",
      minor: "",
      honors: "",
      activities: "",
      location: "",
    },
  ];
  r.experience = [
    {
      id: "exp1",
      company: "Northwind Labs",
      position: "Engineer",
      location: "",
      employmentType: "",
      industry: "",
      startDate: "2021",
      endDate: "",
      current: true,
      duration: "2021 – Present",
      description: "",
      achievements: "",
      techUsed: "",
      bulletPoints: ["Bullet one", "Bullet two"],
    },
  ];
  return r;
}

beforeEach(() => {
  const m = mkResume("r_master", "Master", "Master summary");
  m.social.linkedin = "linkedin.com/in/master";
  const t = mkResume("r_tailored", "Master — Tailored", "Tailored summary");
  t.social.linkedin = "linkedin.com/in/tailored";
  useResumeBuilder.setState({
    resumes: [structuredClone(m), structuredClone(t)],
    activeResumeId: "r_tailored",
    resume: structuredClone(t),
    lineage: {
      r_tailored: {
        sourceResumeId: "r_master",
        sourceResumeName: "Master",
        tailoredAt: 1,
      },
    },
    versions: {},
    saveStatus: "saved",
    serverVersions: {},
    pendingDeletes: [],
  });
});

const get = () => useResumeBuilder.getState();
const findResume = (id: string) => get().resumes.find((r) => r.resumeId === id)!;

describe("M4 item 9 — Master Profile untouched by Resume Version editing", () => {
  it("content, social and section-order edits on the version never reach the master", () => {
    const masterBefore = structuredClone(findResume("r_master"));
    const st = get();

    // A realistic burst of inline-editor writes against the ACTIVE version.
    st.updateField("summary", "Edited version summary — backend focus.");
    st.updateSocial("linkedin", "linkedin.com/in/tailored-backend");
    const exp = st.resume.experience[0];
    st.updateExperience(exp.id, "bulletPoints", [
      exp.bulletPoints[1],
      exp.bulletPoints[0],
    ]);
    st.updateExperience(exp.id, "position", "Senior Engineer");
    st.setSectionPrefs({ order: ["experience", "summary"], hidden: ["education"] });

    const masterAfter = findResume("r_master");
    expect(masterAfter).toEqual(masterBefore);
    expect(masterAfter.summary).toBe("Master summary");
    expect(masterAfter.social.linkedin).toBe("linkedin.com/in/master");
    expect(masterAfter.sectionPrefs).toBeUndefined();

    // Lineage — the version still points at the master.
    expect(get().lineage["r_tailored"]?.sourceResumeId).toBe("r_master");

    // The version itself carries every edit.
    const v = findResume("r_tailored");
    expect(v.summary).toBe("Edited version summary — backend focus.");
    expect(v.social.linkedin).toBe("linkedin.com/in/tailored-backend");
    expect(v.experience[0].bulletPoints).toEqual([
      "Bullet two",
      "Bullet one",
    ]);
    expect(v.sectionPrefs?.hidden).toContain("education");
    // And autosave is armed (Phase 9 reuses the existing pipeline).
    expect(get().saveStatus).toBe("unsaved");
  });
});

describe("M4 items 6/7 — section order + visibility are version-scoped", () => {
  it("planner honors the version's section order", () => {
    get().setSectionPrefs({
      order: ["education", "summary", "experience", "skills"],
    });
    const plan = buildContentPlan(get().resume, { jobAware: false });
    expect(plan.sections.map((s) => s.type)).toEqual([
      "education",
      "summary",
      "experience",
      "skills",
    ]);
    // The master's plan is untouched (it has no prefs).
    const masterPlan = buildContentPlan(findResume("r_master"), {
      jobAware: false,
    });
    expect(findResume("r_master").sectionPrefs).toBeUndefined();
    expect(masterPlan.sections[0]).not.toBe("education"); // strategy order
  });

  it("hidden section disappears from the plan but the data survives", () => {
    get().setSectionPrefs({ hidden: ["skills"] });
    const plan = buildContentPlan(get().resume, { jobAware: false });
    expect(plan.sections.map((s) => s.type)).not.toContain("skills");
    expect(plan.sections.map((s) => s.type)).toContain("experience");

    const v = findResume("r_tailored");
    expect(v.skills).toHaveLength(3); // hiding is presentation-only
    expect(get().resume.skills).toHaveLength(3);
  });

  it("defaults are unchanged when no prefs exist", () => {
    const plan = buildContentPlan(get().resume, { jobAware: false });
    const types = plan.sections.map((s) => s.type);
    expect(types).toContain("summary");
    expect(types).toContain("experience");
    expect(types).toContain("skills");
    expect(plan.excludedSections).toHaveLength(0);
  });

  it("sectionPrefs survive the persist merge (reload)", () => {
    get().setSectionPrefs({
      order: ["skills", "experience", "summary", "education"],
      hidden: ["education"],
    });
    const persisted = JSON.parse(
      JSON.stringify({
        resumes: get().resumes,
        activeResumeId: get().activeResumeId,
        evidence: [],
        styleConfigs: {},
        serverVersions: {},
      }),
    );
    const merged = mergePersistedResumeState(
      persisted,
      get() as never,
    ) as ReturnType<typeof get>;
    const v = merged.resumes.find((r) => r.resumeId === "r_tailored");
    expect(v?.sectionPrefs?.order).toEqual([
      "skills",
      "experience",
      "summary",
      "education",
    ]);
    expect(v?.sectionPrefs?.hidden).toEqual(["education"]);
  });
});

describe("M4 item 8 — edits survive a reload (persist round-trip)", () => {
  it("summary, bullets, links and prefs all survive", () => {
    const st = get();
    st.updateField("summary", "Reload-surviving summary.");
    st.updateSocial("github", "github.com/tailored");
    const exp = st.resume.experience[0];
    st.updateExperience(exp.id, "bulletPoints", [
      exp.bulletPoints[1],
      exp.bulletPoints[0],
    ]);
    st.setSectionPrefs({ hidden: ["education"] });

    const persisted = JSON.parse(
      JSON.stringify({
        resumes: get().resumes,
        activeResumeId: get().activeResumeId,
        evidence: [],
        styleConfigs: {},
        serverVersions: {},
      }),
    );
    const merged = mergePersistedResumeState(
      persisted,
      get() as never,
    ) as ReturnType<typeof get>;
    const v = merged.resumes.find((r) => r.resumeId === "r_tailored");
    expect(v?.summary).toBe("Reload-surviving summary.");
    expect(v?.social.github).toBe("github.com/tailored");
    expect(v?.experience[0].bulletPoints).toEqual([
      "Bullet two",
      "Bullet one",
    ]);
    expect(v?.sectionPrefs?.hidden).toEqual(["education"]);
    // Master still pristine after the round-trip.
    expect(merged.resumes.find((r) => r.resumeId === "r_master")?.summary).toBe(
      "Master summary",
    );
  });
});

describe("M4 item 16 — template switch preserves content and prefs", () => {
  it("applyTemplate changes only the templateId", () => {
    const st = get();
    st.updateField("summary", "Template-proof summary.");
    st.setSectionPrefs({ hidden: ["education"] });
    const before = structuredClone(get().resume);

    get().applyTemplate("executive");
    const after = get().resume;
    expect(after.templateId).toBe("executive");
    expect({ ...after, templateId: before.templateId }).toEqual(before);
    expect(after.summary).toBe("Template-proof summary.");
    expect(after.sectionPrefs?.hidden).toEqual(["education"]);
  });
});

describe("M4 Phase 2 — skill reorder", () => {
  it("moveSkill swaps adjacent skills and arms autosave", () => {
    const st = get();
    expect(st.resume.skills.map((s) => s.name)).toEqual([
      "Python",
      "Kubernetes",
      "TypeScript",
    ]);
    st.moveSkill("s_Kubernetes", -1);
    expect(get().resume.skills.map((s) => s.name)).toEqual([
      "Kubernetes",
      "Python",
      "TypeScript",
    ]);
    st.moveSkill("s_Kubernetes", -1); // already first — no-op
    expect(get().resume.skills.map((s) => s.name)).toEqual([
      "Kubernetes",
      "Python",
      "TypeScript",
    ]);
    st.moveSkill("s_Kubernetes", 1);
    expect(get().resume.skills.map((s) => s.name)).toEqual([
      "Python",
      "Kubernetes",
      "TypeScript",
    ]);
    expect(get().saveStatus).toBe("unsaved");
  });
});
