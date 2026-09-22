"use strict";

/**
 * Phase 1.5 — requirement correction ("Actually I have this" and friends).
 *
 * Safety contract under test:
 *   - a user correction NEVER produces verified/accepted status (P1.5/P4)
 *   - the original resume is never mutated (§7 master-profile protection)
 *   - the addition lands in the correct section per kind
 *   - invalid input returns null instead of writing garbage
 */

import { describe, expect, it } from "vitest";
import {
  applyRequirementCorrection,
  correctionField,
} from "@/lib/gap-correction";
import type { Resume } from "@/types/resume";

function makeResume(): Resume {
  return {
    experience: [
      {
        id: 1,
        position: "Software Engineer",
        company: "Brightloop",
        location: "",
        startDate: "2021",
        endDate: "2024",
        bulletPoints: ["Built REST APIs"],
      },
    ],
    skills: [{ id: "s1", name: "Python", level: "Advanced", category: "", years: "" }],
    certifications: [],
    education: [],
    claims: [],
  } as unknown as Resume;
}

describe("applyRequirementCorrection", () => {
  it("never marks a correction verified/accepted (P1.5: no silent promotion)", () => {
    for (const kind of [
      "skill",
      "domain-skill",
      "certification",
      "education",
      "experience-bullet",
    ] as const) {
      const res = applyRequirementCorrection(makeResume(), {
        kind,
        text: "Kubernetes",
        experienceIndex: 0,
      });
      expect(res, `kind=${kind}`).not.toBeNull();
      expect(res!.claim.verificationStatus).toBe("suggested");
      expect(res!.claim.accepted).toBe(false);
      expect(res!.claim.reviewed).toBe(false);
      expect(res!.claim.sourceActivityId).toBe("job-gap-review");
    }
  });

  it("adds a skill to the skills section without touching other sections", () => {
    const original = makeResume();
    const snapshot = JSON.parse(JSON.stringify(original));
    const res = applyRequirementCorrection(original, {
      kind: "skill",
      text: "Kubernetes",
    });
    expect(res).not.toBeNull();
    expect(res!.resume.skills!.map((s) => s.name)).toContain("Kubernetes");
    expect(res!.resume.experience).toEqual(snapshot.experience);
    expect(original.skills).toEqual(snapshot.skills); // original untouched
    expect(res!.sectionLabel).toBe("Skills");
  });

  it("refuses a duplicate skill (nothing to correct)", () => {
    const res = applyRequirementCorrection(makeResume(), {
      kind: "skill",
      text: "python", // case-insensitive duplicate
    });
    expect(res).toBeNull();
  });

  it("adds a certification with user-provided provenance", () => {
    const res = applyRequirementCorrection(makeResume(), {
      kind: "certification",
      text: "AWS Certified Solutions Architect",
    });
    expect(res).not.toBeNull();
    expect(res!.resume.certifications).toHaveLength(1);
    expect(res!.resume.certifications![0].name).toBe(
      "AWS Certified Solutions Architect",
    );
    expect(res!.sectionLabel).toBe("Certifications");
  });

  it("adds education entries", () => {
    const res = applyRequirementCorrection(makeResume(), {
      kind: "education",
      text: "B.S. Computer Science, State University",
    });
    expect(res).not.toBeNull();
    expect(res!.resume.education).toHaveLength(1);
    expect(res!.sectionLabel).toBe("Education");
  });

  it("appends an experience bullet only to the addressed position", () => {
    const res = applyRequirementCorrection(makeResume(), {
      kind: "experience-bullet",
      text: "Designed distributed systems serving 2M requests/day",
      experienceIndex: 0,
    });
    expect(res).not.toBeNull();
    expect(res!.resume.experience[0].bulletPoints).toHaveLength(2);
    expect(res!.sectionLabel).toBe("Experience");
    expect(res!.claim.claimType).toBe("Employment");
  });

  it("rejects an out-of-range experience index", () => {
    expect(
      applyRequirementCorrection(makeResume(), {
        kind: "experience-bullet",
        text: "anything",
        experienceIndex: 5,
      }),
    ).toBeNull();
    expect(
      applyRequirementCorrection(makeResume(), {
        kind: "experience-bullet",
        text: "anything",
      }),
    ).toBeNull();
  });

  it("rejects empty text", () => {
    expect(
      applyRequirementCorrection(makeResume(), { kind: "skill", text: "   " }),
    ).toBeNull();
  });

  it("rejects a duplicate experience bullet", () => {
    expect(
      applyRequirementCorrection(makeResume(), {
        kind: "experience-bullet",
        text: "Built REST APIs",
        experienceIndex: 0,
      }),
    ).toBeNull();
  });
});

describe("correctionField", () => {
  it("maps kinds to their resume section", () => {
    expect(correctionField("skill")).toBe("skills");
    expect(correctionField("domain-skill")).toBe("skills");
    expect(correctionField("certification")).toBe("certifications");
    expect(correctionField("education")).toBe("education");
    expect(correctionField("experience-bullet")).toBe("experience");
  });
});
