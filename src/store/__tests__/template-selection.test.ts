"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import {
  useResumeBuilder,
  defaultResume,
  mergePersistedResumeState,
  type ResumeBuilderState,
} from "../resume-builder";

/**
 * Regression tests for the Template Gallery → "Use This Template" flow:
 * 1. applyTemplate must change ONLY templateId — the user's real resume data
 *    (name, contact, sections, font/color prefs) is never replaced by gallery
 *    sample data or by the template's suggested font.
 * 2. Legacy single-resume localStorage (persisted `resume` with no `resumes`
 *    array) must migrate into the multi-resume shape during rehydration
 *    WITHOUT losing data — the store's placeholder default resume must never
 *    be persisted over the user's real resume.
 */

const REAL_RESUME = {
  ...defaultResume,
  resumeId: "real-user-resume-1",
  resumeName: "Arvind's Resume",
  name: "Arvind Sharma",
  title: "Staff Platform Engineer",
  email: "arvind.sharma@example.com",
  phone: "+1 555 010 2233",
  address: "San Francisco, CA",
  summary: "Platform engineer with 12 years of experience.",
  experience: [
    {
      ...defaultResume.experience[0],
      id: "exp1",
      company: "Northwind Labs",
      position: "Staff Platform Engineer",
      bulletPoints: ["Built a multi-tenant control plane."],
    },
  ],
  education: [
    {
      ...defaultResume.education[0],
      id: "edu1",
      school: "Carnegie Mellon University",
      degree: "M.S., Computer Science",
    },
  ],
  skills: [{ ...defaultResume.skills[0], id: "sk1", name: "Kubernetes", level: "Expert" as const }],
  projects: [{ ...defaultResume.projects[0], id: "pr1", name: "Helmless", description: "GitOps tool." }],
  certifications: [{ ...defaultResume.certifications[0], id: "ce1", name: "AWS Certified Solutions Architect" }],
  templateId: "modern-clean",
  fontPreference: "inter",
  claims: [],
};

describe("Template Gallery → applyTemplate (template-selection flow)", () => {
  beforeEach(() => {
    useResumeBuilder.setState({
      resumes: [{ ...REAL_RESUME }],
      activeResumeId: "real-user-resume-1",
      resume: { ...REAL_RESUME },
      styleConfigs: { "real-user-resume-1": { ...useResumeBuilder.getState().styleConfigs["real-user-resume-1"] } },
    });
  });

  it("applies the selected template and changes ONLY templateId", () => {
    const before = useResumeBuilder.getState().resume;
    useResumeBuilder.getState().applyTemplate("executive-pro");

    const after = useResumeBuilder.getState().resume;
    expect(after.templateId).toBe("executive-pro");
    // Every other field is preserved byte-for-byte.
    expect(after.name).toBe(before.name);
    expect(after.email).toBe(before.email);
    expect(after.phone).toBe(before.phone);
    expect(after.address).toBe(before.address);
    expect(after.summary).toBe(before.summary);
    expect(after.experience).toEqual(before.experience);
    expect(after.education).toEqual(before.education);
    expect(after.skills).toEqual(before.skills);
    expect(after.projects).toEqual(before.projects);
    expect(after.certifications).toEqual(before.certifications);
    expect(after.claims).toEqual(before.claims);
    // The template's suggested font must NOT overwrite the user's preference.
    expect(after.fontPreference).toBe(before.fontPreference);
    // The persisted resumes array carries the same change.
    const persisted = useResumeBuilder.getState().resumes.find((r) => r.resumeId === "real-user-resume-1");
    expect(persisted?.templateId).toBe("executive-pro");
    expect(persisted?.name).toBe(before.name);
    expect(persisted?.experience).toEqual(before.experience);
  });

  it("can switch to another template and back without data loss", () => {
    useResumeBuilder.getState().applyTemplate("executive-pro");
    expect(useResumeBuilder.getState().resume.templateId).toBe("executive-pro");

    useResumeBuilder.getState().applyTemplate("minimal-ats");
    const after = useResumeBuilder.getState().resume;
    expect(after.templateId).toBe("minimal-ats");
    expect(after.name).toBe("Arvind Sharma");
    expect(after.email).toBe("arvind.sharma@example.com");
    expect(after.experience[0].company).toBe("Northwind Labs");
    expect(after.education[0].school).toBe("Carnegie Mellon University");
    expect(after.skills[0].name).toBe("Kubernetes");
  });

  it("ignores unknown template ids and leaves the resume untouched", () => {
    const before = useResumeBuilder.getState().resume;
    useResumeBuilder.getState().applyTemplate("not-a-real-template");
    const after = useResumeBuilder.getState().resume;
    expect(after.templateId).toBe(before.templateId);
    expect(after.name).toBe(before.name);
  });
});

describe("Legacy single-resume persistence migration (patorbit-resume-v2)", () => {
  const current = {
    resume: defaultResume,
    resumes: [{ ...defaultResume, resumeId: "placeholder-id", resumeName: "My Resume" }],
    activeResumeId: "placeholder-id",
    evidence: [],
    styleConfigs: {},
  } as unknown as ResumeBuilderState;

  it("migrates a persisted top-level resume into the resumes array without losing data", () => {
    const persisted = { resume: { ...REAL_RESUME }, evidence: [] };
    const merged = mergePersistedResumeState(persisted, current);

    expect(merged.resumes).toHaveLength(1);
    expect(merged.resumes[0].resumeId).toBe("real-user-resume-1");
    expect(merged.resumes[0].name).toBe("Arvind Sharma");
    expect(merged.resumes[0].email).toBe("arvind.sharma@example.com");
    expect(merged.resumes[0].templateId).toBe("modern-clean");
    expect(merged.resumes[0].experience).toHaveLength(1);
    expect(merged.resumes[0].education).toHaveLength(1);
    expect(merged.resumes[0].skills).toHaveLength(1);
    expect(merged.activeResumeId).toBe("real-user-resume-1");
    expect(merged.resume.name).toBe("Arvind Sharma");
    // Evidence from the legacy shape is preserved too.
    expect(merged.evidence).toEqual([]);
  });

  it("assigns a fresh id when the legacy resume has none", () => {
    const legacy = { ...REAL_RESUME, resumeId: undefined, resumeName: undefined };
    const merged = mergePersistedResumeState({ resume: legacy }, current);
    expect(merged.resumes[0].resumeId).toBeTruthy();
    expect(merged.resumes[0].resumeName).toBe("Arvind Sharma");
    expect(merged.resumes[0].name).toBe("Arvind Sharma");
  });

  it("keeps the current-shape passthrough intact", () => {
    const persisted = { resumes: [{ ...REAL_RESUME }], activeResumeId: "real-user-resume-1", evidence: [], styleConfigs: {} };
    const merged = mergePersistedResumeState(persisted, current);
    expect(merged.resumes).toHaveLength(1);
    expect(merged.resumes[0].name).toBe("Arvind Sharma");
    expect(merged.activeResumeId).toBe("real-user-resume-1");
  });
});
