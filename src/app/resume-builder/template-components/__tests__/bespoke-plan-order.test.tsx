"use strict";

/**
 * §2/§5 regression — the four BESPOKE templates (modern-clean,
 * engineering-clean, executive-pro, patorbit-modern) historically hardcoded
 * their section sequence, so the content plan's hierarchy never reached them
 * (caught by the live /resume-gallery probe: plan said
 * "summary → skills → experience" while the card rendered
 * "summary → experience → skills").
 *
 * These tests pin both behaviors:
 *  1. With a plan provider: heading order == plan order, and sections the
 *     plan drops do not render at all (INCLUSION, not just ORDER).
 *  2. Without a provider: each template's native order is preserved.
 */

import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import type { ReactNode } from "react";
import { ModernCleanPreview } from "../modern-clean";
import { EngineeringCleanPreview } from "../engineering-clean";
import { ExecutiveProPreview } from "../executive-pro";
import { PatorbitModernPreview } from "../patorbit-modern";
import { ResumePlanContext } from "@/components/resume/ResumePlanContext";
import {
  buildContentPlan,
  type ResumeContentPlan,
  type SectionType,
} from "@/lib/resume-planner";
import { MID_CAREER } from "@/lib/resume-planner/__tests__/fixtures";
import { renderToContainer } from "@/components/resume-builder/__tests__/gallery-test-utils";
import type { Resume } from "@/types/resume";

/** All nine sections must have content so ordering is fully observable. */
const RESUME: Resume = {
  ...MID_CAREER,
  languages: [{ id: "l1", name: "English", proficiency: "Native" }],
};

type TemplateProps = { resume: Resume; bulletChar?: string };

interface Case {
  id: string;
  Comp: (p: TemplateProps) => React.ReactElement;
  native: SectionType[];
  titles: Record<SectionType, string>;
}

const CASES: Case[] = [
  {
    id: "modern-clean",
    Comp: ModernCleanPreview,
    native: ["summary", "experience", "projects", "skills", "education", "certs", "achievements", "languages", "interests"],
    titles: {
      summary: "Professional Summary",
      experience: "Professional Experience",
      projects: "Projects",
      skills: "Technical Skills",
      education: "Education",
      certs: "Certifications",
      achievements: "Achievements",
      languages: "Languages",
      interests: "Interests",
    },
  },
  {
    id: "engineering-clean",
    Comp: EngineeringCleanPreview,
    native: ["summary", "experience", "projects", "skills", "education", "certs", "achievements", "languages", "interests"],
    titles: {
      summary: "Summary",
      experience: "Experience",
      projects: "Projects",
      skills: "Technical Skills",
      education: "Education",
      certs: "Certifications",
      achievements: "Achievements",
      languages: "Languages",
      interests: "Interests",
    },
  },
  {
    id: "executive-pro",
    Comp: ExecutiveProPreview,
    native: ["summary", "experience", "skills", "projects", "education", "certs", "achievements", "languages", "interests"],
    titles: {
      summary: "Executive Summary",
      experience: "Professional Experience",
      skills: "Core Competencies",
      projects: "Key Projects",
      education: "Education",
      certs: "Certifications",
      achievements: "Achievements",
      languages: "Languages",
      interests: "Interests",
    },
  },
  {
    id: "patorbit-modern",
    Comp: PatorbitModernPreview,
    native: ["summary", "experience", "skills", "projects", "education", "certs", "languages", "achievements", "interests"],
    titles: {
      summary: "Professional Profile",
      experience: "Professional Experience",
      skills: "Technical Skills",
      projects: "Projects",
      education: "Education",
      certs: "Certifications",
      languages: "Languages",
      achievements: "Achievements",
      interests: "Interests",
    },
  },
];

/**
 * A plan order that differs from EVERY native order and drops interests:
 * skills and education first proves role-aware reprioritization; the dropped
 * section proves plan-driven inclusion.
 */
const CUSTOM_ORDER: SectionType[] = [
  "skills", "education", "summary", "experience", "projects",
  "certs", "achievements", "languages",
];

function customPlan(base: ResumeContentPlan): ResumeContentPlan {
  const byType = new Map(base.sections.map((s) => [s.type, s]));
  return {
    ...base,
    sections: CUSTOM_ORDER.map((t) => byType.get(t)).filter(
      (s): s is ResumeContentPlan["sections"][number] => Boolean(s),
    ),
  };
}

function headings(node: ReactNode): string[] {
  const { container, unmount } = renderToContainer(node);
  const out = Array.from(container.querySelectorAll("h2")).map(
    (h) => h.textContent?.trim() ?? "",
  );
  unmount();
  return out;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("bespoke templates honor the content plan's section order", () => {
  const plan = customPlan(buildContentPlan(RESUME));

  it("the reordered plan contains the sections the fixtures render", () => {
    expect(plan.sections.map((s) => s.type)).toEqual(CUSTOM_ORDER);
  });

  for (const c of CASES) {
    it(`${c.id}: renders plan order (skills/education promoted, interests dropped)`, () => {
      const { Comp } = c;
      const got = headings(
        <ResumePlanContext.Provider value={plan}>
          <Comp resume={RESUME} />
        </ResumePlanContext.Provider>,
      );
      expect(got).toEqual(CUSTOM_ORDER.map((t) => c.titles[t]));
      expect(got).not.toContain(c.titles.interests);
    });

    it(`${c.id}: keeps native order without a plan`, () => {
      const { Comp } = c;
      const got = headings(<Comp resume={RESUME} />);
      expect(got).toEqual(c.native.map((t) => c.titles[t]));
    });
  }
});
