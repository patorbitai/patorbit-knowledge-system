"use strict";

/**
 * §5 master-profile safety:
 *  - findings round-trip the EXISTING detectUnsupportedAdditions labels
 *  - baseline resolution (lineage → legacy name heuristic → null)
 *  - removeFinding strips unsupported items without mutating inputs
 *  - promoteFindingToMaster is the only path that writes the master,
 *    it's explicit, and it clears the finding on re-run
 *  - promoteResumeContent copies content but never identity/presentation
 */

import { describe, it, expect } from "vitest";
import {
  getSafetyFindings,
  parseFindingLabel,
  promoteFindingToMaster,
  promoteResumeContent,
  removeFinding,
  resolveSafetyBaseline,
  type ResumeLineage,
} from "@/lib/resume-safety";
import { defaultResume } from "@/store/resume-builder";
import type { Resume, Skill } from "@/types/resume";

function skill(name: string): Skill {
  return {
    id: `s_${name}`,
    name,
    level: "Intermediate",
    category: "",
    years: "",
  };
}

function masterResume(): Resume {
  return {
    ...structuredClone(defaultResume),
    resumeId: "r_master",
    resumeName: "Marcus Green",
    summary: "Backend engineer focused on APIs.",
    skills: [skill("Python"), skill("AWS")],
    experience: [
      {
        id: "e1",
        company: "Acme",
        position: "Software Engineer",
        location: "",
        employmentType: "",
        industry: "",
        startDate: "2024",
        endDate: "2026",
        current: false,
        duration: "",
        description: "Backend services.",
        achievements: "",
        techUsed: "",
        bulletPoints: ["Shipped REST APIs in Python"],
      },
    ],
    education: [],
    certifications: [],
  };
}

function tailoredFrom(master: Resume): Resume {
  const t = structuredClone(master);
  t.resumeId = "r_tailored";
  t.resumeName = "Marcus Green — Tailored";
  t.skills = [...(t.skills ?? []), skill("Kubernetes")];
  t.experience = [
    ...(t.experience ?? []),
    {
      id: "e2",
      company: "Invented Corp",
      position: "Platform Lead",
      location: "",
      employmentType: "",
      industry: "",
      startDate: "2026",
      endDate: "",
      current: true,
      duration: "",
      description: "Led platform.",
      achievements: "",
      techUsed: "",
      bulletPoints: ["Ran Kubernetes at scale"],
    },
  ];
  t.certifications = [
    {
      id: "c1",
      name: "AWS Solutions Architect",
      issuer: "AWS",
      date: "2025",
      link: "",
      description: "",
      expiryDate: "",
      skills: "",
    },
  ];
  t.education = [
    {
      id: "ed1",
      degree: "MS",
      school: "MIT",
      year: "2020",
      field: "Computer Science",
      gpa: "",
      minor: "",
      honors: "",
      activities: "",
      location: "",
    },
  ];
  return t;
}

const lineage: ResumeLineage = {
  sourceResumeId: "r_master",
  sourceResumeName: "Marcus Green",
  tailoredAt: 1,
};

describe("getSafetyFindings", () => {
  it("round-trips the existing detectUnsupportedAdditions labels", () => {
    const master = masterResume();
    const tailored = tailoredFrom(master);
    const findings = getSafetyFindings(master, tailored);
    const values = findings.map((f) => f.label).sort();
    expect(values).toEqual(
      [
        "Certification: AWS Solutions Architect",
        "Education: MS, MIT",
        "Employer: Invented Corp",
        "Skill: Kubernetes",
        // the fabricated entry's bullet also drags in an uncovered tech token
        "Technology not in your profile: Kubernetes",
      ].sort(),
    );
    expect(findings.find((f) => f.label === "Skill: Kubernetes")).toEqual({
      kind: "skill",
      value: "Kubernetes",
      label: "Skill: Kubernetes",
    });
  });

  it("returns [] for a master resume (its own content is the truth)", () => {
    expect(getSafetyFindings(null, tailoredFrom(masterResume()))).toEqual([]);
    expect(getSafetyFindings(undefined, masterResume())).toEqual([]);
  });

  it("returns [] when comparing a resume with itself", () => {
    const master = masterResume();
    expect(getSafetyFindings(master, master)).toEqual([]);
  });
});

describe("resolveSafetyBaseline", () => {
  it("prefers explicit lineage", () => {
    const resumes = [masterResume(), tailoredFrom(masterResume())];
    const base = resolveSafetyBaseline(resumes, resumes[1], lineage);
    expect(base?.resumeId).toBe("r_master");
  });

  it("falls back to the legacy name heuristic for pre-lineage resumes", () => {
    const resumes = [masterResume(), tailoredFrom(masterResume())];
    const base = resolveSafetyBaseline(resumes, resumes[1], null);
    expect(base?.resumeId).toBe("r_master");
  });

  it("never guesses an ambiguous or missing master", () => {
    const a = { ...masterResume(), resumeName: "Duplicate" };
    const b = { ...masterResume(), resumeId: "r2", resumeName: "Duplicate" };
    const tailored = { ...tailoredFrom(a), resumeName: "Duplicate — Tailored" };
    expect(resolveSafetyBaseline([a, b, tailored], tailored, null)).toBeNull();
    // plain master name → no baseline
    expect(resolveSafetyBaseline([a, b], a, null)).toBeNull();
    // dangling lineage → null
    expect(resolveSafetyBaseline([a], tailored, { ...lineage, sourceResumeId: "gone" })).toBeNull();
  });
});

describe("removeFinding", () => {
  it("removes an unsupported skill without mutating the input", () => {
    const master = masterResume();
    const tailored = tailoredFrom(master);
    const before = structuredClone(tailored);
    const finding = parseFindingLabel("Skill: Kubernetes");
    expect(finding).not.toBeNull();
    const next = removeFinding(tailored, finding!, master);

    expect(next.skills?.map((s) => s.name)).not.toContain("Kubernetes");
    expect(tailored).toEqual(before); // input untouched
    // re-run: the finding is gone
    expect(getSafetyFindings(master, next).map((f) => f.label)).not.toContain(
      "Skill: Kubernetes",
    );
  });

  it("removes a fabricated experience entry (employer finding)", () => {
    const master = masterResume();
    const tailored = tailoredFrom(master);
    const finding = parseFindingLabel("Employer: Invented Corp");
    const next = removeFinding(tailored, finding!, master);
    expect(next.experience).toHaveLength(1);
    expect(next.experience?.[0].company).toBe("Acme");
    expect(getSafetyFindings(master, next).map((f) => f.label)).not.toContain(
      "Employer: Invented Corp",
    );
  });

  it("handles the empty \"entry #N\" employer label", () => {
    const master = masterResume();
    const tailored = tailoredFrom(master);
    const finding = parseFindingLabel("Employer: entry #2");
    expect(finding).not.toBeNull();
    const next = removeFinding(tailored, finding!, master);
    expect(next.experience).toHaveLength(1);
  });

  it("removes an unsupported certification and education entry", () => {
    const master = masterResume();
    const tailored = tailoredFrom(master);
    let next = removeFinding(
      tailored,
      parseFindingLabel("Certification: AWS Solutions Architect")!,
      master,
    );
    next = removeFinding(next, parseFindingLabel("Education: MS, MIT")!, master);
    expect(next.certifications).toHaveLength(0);
    expect(next.education).toHaveLength(0);
    const rest = getSafetyFindings(master, next).map((f) => f.label);
    expect(rest).not.toContain("Certification: AWS Solutions Architect");
    expect(rest).not.toContain("Education: MS, MIT");
  });

  it("strips an unsupported technology token from free text", () => {
    const master = masterResume();
    const tailored = tailoredFrom(master);
    tailored.summary = "Shipped React dashboards with the React team.";
    tailored.experience[0].bulletPoints = ["Built React components"];
    const finding = parseFindingLabel("Technology not in your profile: React");
    expect(finding).toEqual({
      kind: "technology",
      value: "React",
      label: "Technology not in your profile: React",
    });
    const next = removeFinding(tailored, finding!, master);
    expect(next.summary?.toLowerCase()).not.toContain("react");
    expect(next.experience[0].bulletPoints[0].toLowerCase()).not.toContain("react");
  });
});

describe("promoteFindingToMaster", () => {
  it("explicitly adds the item to the master and clears the finding on re-run", () => {
    const master = masterResume();
    const tailored = tailoredFrom(master);
    const masterBefore = structuredClone(master);
    const finding = parseFindingLabel("Skill: Kubernetes")!;

    const updated = promoteFindingToMaster(master, tailored, finding);
    expect(updated.skills?.map((s) => s.name)).toContain("Kubernetes");
    expect(master).toEqual(masterBefore); // master input never mutated

    // re-run with the NEW baseline: the finding is substantiated now
    expect(getSafetyFindings(updated, tailored).map((f) => f.label)).not.toContain(
      "Skill: Kubernetes",
    );
    // and the other findings are untouched by this single promote
    expect(getSafetyFindings(updated, tailored).map((f) => f.label)).toContain(
      "Employer: Invented Corp",
    );
  });

  it("promotes a certification by copying it from the tailored version", () => {
    const master = masterResume();
    const tailored = tailoredFrom(master);
    const finding = parseFindingLabel("Certification: AWS Solutions Architect")!;
    const updated = promoteFindingToMaster(master, tailored, finding);
    expect(updated.certifications?.map((c) => c.name)).toContain(
      "AWS Solutions Architect",
    );
    expect(master.certifications).toHaveLength(0);
  });
});

describe("promoteResumeContent (whole-resume promote)", () => {
  it("copies content fields but never identity or presentation", () => {
    const master = masterResume();
    const tailored = tailoredFrom(master);
    tailored.templateId = "some-other-template";
    tailored.claims = [{ id: "claim1" } as never];

    const updated = promoteResumeContent(master, tailored);
    // content adopted
    expect(updated.skills?.map((s) => s.name)).toContain("Kubernetes");
    expect(updated.summary).toBe(tailored.summary);
    // identity/presentation preserved
    expect(updated.resumeId).toBe("r_master");
    expect(updated.resumeName).toBe("Marcus Green");
    expect(updated.templateId).toBe(master.templateId);
    expect(updated.claims).toEqual(master.claims);
    // inputs untouched
    expect(master.skills?.map((s) => s.name)).toEqual(["Python", "AWS"]);
  });
});
