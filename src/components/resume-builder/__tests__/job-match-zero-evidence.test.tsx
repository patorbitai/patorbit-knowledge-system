"use strict";

/**
 * Activation (M3): thin-profile first-session activation in the match panel.
 *
 * Path A — a resume carrying REAL evidence analyzes to a non-zero, evidence-
 * backed match: the 0%-recovery CTA must NOT appear, unevidenced requirements
 * must stay "No evidence" with empty evidence (nothing is invented), and the
 * master profile is untouched by analysis.
 *
 * Path B — a thin (basics-only) profile stays an honest 0%: the panel explains
 * the result and offers an explicit "Add experience" CTA that routes straight
 * to the profile editor WITHOUT mutating the master profile (no fabricated
 * evidence). Matching classification itself is never changed by the CTA.
 *
 * The M1 counterpart (ApplicationDetailClient zero-evidence CTA) is covered by
 * src/app/(hub)/overview/applications/[applicationId]/__tests__/
 * application-detail-zero-evidence.test.tsx and must stay green.
 */
import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { computeOverallMatch } from "@/lib/match-score";
import { JobMatchPanel } from "../JobMatchPanel";
import {
  renderToContainer,
  click,
  installObserverStubs,
  type Rendered,
} from "./gallery-test-utils";
import type { Resume, Experience, Skill } from "@/types/resume";

installObserverStubs();

const JD = `
Data Engineer

Requirements:
- Strong proficiency with Python
- Experience with SQL
- Experience with Kubernetes

Skills:
- Python, SQL, Kubernetes
`;

function realExperience(): Experience {
  return {
    id: "exp-1",
    company: "Contoso Analytics",
    position: "Data Engineer",
    location: "",
    employmentType: "Full-time",
    industry: "Technology",
    startDate: "Mar 2021",
    endDate: "",
    current: true,
    duration: "",
    description: "Built data pipelines with Python and SQL.",
    achievements: "",
    techUsed: "Python, SQL",
    bulletPoints: ["Built PySpark pipelines for analytics."],
  };
}

function skill(name: string): Skill {
  return { id: `s_${name}`, name, level: "Advanced", category: "Languages", years: "4" };
}

/** Path A: the user saved one real role + real skills during onboarding. */
function evidencedResume(): Resume {
  return {
    ...structuredClone(defaultResume),
    resumeId: "r_evidence",
    resumeName: "My Resume",
    name: "Test User",
    title: "Data Engineer",
    summary: "Data engineer focused on analytics pipelines.",
    experience: [realExperience()],
    skills: [skill("Python"), skill("SQL")],
  };
}

/** Path B: the user skipped the evidence step — basics only, nothing invented. */
function thinResume(): Resume {
  return {
    ...structuredClone(defaultResume),
    resumeId: "r_thin",
    resumeName: "My Resume",
    name: "Test User",
    summary: "Data enthusiast.",
  };
}

/**
 * Seed the store, then run the SAME three deterministic stages `handleAnalyze`
 * runs (career profile → job profile → qualification match). Local + rule-based
 * only — no network, no AI, no classification changes.
 */
function setup(resume: Resume) {
  useResumeBuilder.setState({
    resumes: [resume],
    activeResumeId: resume.resumeId!,
    resume: structuredClone(resume),
    jobDescription: JD,
    qualificationMatch: null,
    jobProfile: null,
    careerProfile: null,
    activeJobApplicationId: null,
    activeJobApplication: null,
    activeSection: "personal",
  });
  const state = useResumeBuilder.getState();
  state.rebuildCareerProfile();
  state.rebuildJobProfile();
  const match = state.rebuildQualificationMatch();
  return match;
}

const get = () => useResumeBuilder.getState();

describe("JobMatchPanel — thin-profile activation (§activation, M3)", () => {
  let rendered: Rendered | null = null;
  const editorEvents: string[] = [];
  const onEditorEvent = (e: Event) => editorEvents.push(e.type);

  afterEach(() => {
    rendered?.unmount();
    rendered = null;
    editorEvents.length = 0;
    window.removeEventListener("patorbit:open-editor", onEditorEvent);
    document.body.innerHTML = "";
  });

  it("Path A: saved evidence produces an evidence-backed match with no recovery CTA", () => {
    const match = setup(evidencedResume());
    expect(match).toBeTruthy();

    const score = computeOverallMatch(match!);
    // Real evidence must lift the match off the empty-profile 0% state.
    expect(score).toBeGreaterThan(0);

    rendered = renderToContainer(<JobMatchPanel />);
    const text = rendered.container.textContent ?? "";
    expect(text).toContain(`${score}% match`);
    // Evidence-backed → the 0%-recovery CTA must not appear.
    expect(rendered.container.querySelector('[data-testid="match-zero-evidence-cta"]')).toBeNull();

    // The unevidenced requirement stays Missing with EMPTY evidence — no invention.
    const kubernetes = match!.items.filter((i) => /kubernetes/i.test(i.requirement));
    expect(kubernetes.length).toBeGreaterThan(0);
    for (const item of kubernetes) {
      expect(item.classification).toBe("MISSING");
      expect(item.evidence).toEqual([]);
    }

    // Analysis never writes to the master profile.
    expect(get().resume.experience).toHaveLength(1);
    expect(get().resume.claims).toEqual([]);
    expect(get().resume.skills.map((s) => s.name)).toEqual(["Python", "SQL"]);
  });

  it("Path B: honest 0%, explicit explanation, CTA routes to the editor without fabricating", () => {
    const match = setup(thinResume());
    expect(match).toBeTruthy();
    // Classification is unchanged: no evidence ⇒ honest 0%.
    expect(computeOverallMatch(match!)).toBe(0);

    window.addEventListener("patorbit:open-editor", onEditorEvent);
    rendered = renderToContainer(<JobMatchPanel />);

    // Honest 0% headline.
    expect(rendered.container.textContent).toContain("0% match");

    const cta = rendered.container.querySelector('[data-testid="match-zero-evidence-cta"]');
    expect(cta).toBeTruthy();
    const ctaText = cta!.textContent ?? "";
    expect(ctaText).toContain("No evidence matches this job yet");
    expect(ctaText).toContain("Add experience or skills to improve your match");
    expect(ctaText).toContain("will not invent missing");
    expect(ctaText).toContain("Add experience");

    // Master-profile snapshot BEFORE any CTA interaction.
    const before = JSON.stringify(get().resume);

    click(rendered.container.querySelector('[data-testid="match-zero-cta-add-experience"]'));
    expect(get().activeSection).toBe("experience");
    expect(editorEvents).toContain("patorbit:open-editor");
    // No fake evidence was created — the resume is byte-identical.
    expect(JSON.stringify(get().resume)).toBe(before);
    expect(get().resume.experience).toHaveLength(0);
    expect(get().resume.claims).toEqual([]);

    click(rendered.container.querySelector('[data-testid="match-zero-cta-add-skills"]'));
    expect(get().activeSection).toBe("skills");
    expect(JSON.stringify(get().resume)).toBe(before);
  });
});
