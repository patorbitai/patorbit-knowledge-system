"use strict";

/**
 * BUG-1 regression — AI description rewrite must NOT collapse bullets.
 *
 * "Rewrite with AI" (ATS / Impact / Concise / Expand / Professional) only
 * rewrites the narrative DESCRIPTION. Accepting the suggestion must never
 * overwrite the entry's curated bulletPoints with a single fabricated bullet.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import React, { act } from "react";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { ExperienceSection } from "../sections/ExperienceSection";
import {
  renderToContainer,
  click,
  findButton,
  installObserverStubs,
} from "./gallery-test-utils";
import type { Resume } from "@/types/resume";

installObserverStubs();

const { mockRewrite, mockAtsOptimization } = vi.hoisted(() => ({
  mockRewrite: vi.fn(),
  mockAtsOptimization: vi.fn(),
}));

vi.mock("@/lib/ai/client", () => ({
  ai: {
    rewrite: mockRewrite,
    atsOptimization: mockAtsOptimization,
    generateAchievements: vi.fn(),
    improveBulletPoints: vi.fn(),
  },
}));

const ORIGINAL_BULLETS = ["Built pipelines", "Automated reports", "Cut costs 20%"];

function seedExperience(): void {
  const resume: Resume = {
    ...defaultResume,
    experience: [
      {
        id: "e1",
        company: "Acme",
        position: "Engineer",
        location: "",
        employmentType: "",
        industry: "",
        startDate: "",
        endDate: "",
        current: false,
        duration: "",
        description: "Legacy narrative summary",
        achievements: "",
        techUsed: "",
        bulletPoints: [...ORIGINAL_BULLETS],
      },
    ],
  };
  useResumeBuilder.setState({
    resumes: [resume],
    activeResumeId: resume.resumeId,
    resume,
    styleConfigs: {},
    saveStatus: "saved",
    aiActions: {},
  });
}

async function waitForButton(label: string): Promise<HTMLButtonElement> {
  await act(async () => {
    await vi.waitFor(
      () => {
        const btn = findButton(label);
        if (!btn) throw new Error(`button "${label}" not found`);
      },
      { timeout: 2000 },
    );
  });
  const btn = findButton(label);
  if (!btn) throw new Error(`button "${label}" not found`);
  return btn;
}

describe("ExperienceSection — AI rewrite acceptance preserves bullets (BUG-1)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    mockRewrite.mockReset();
    mockAtsOptimization.mockReset();
  });

  it("accepting an impact rewrite changes ONLY the description", async () => {
    seedExperience();
    const { unmount } = renderToContainer(<ExperienceSection />);

    // Open the card's edit mode, then the "Rewrite with AI" dropdown.
    click(findButton("Edit"));
    click(findButton("Rewrite with AI"));

    mockRewrite.mockResolvedValue({ content: "Fresh rewritten narrative" });
    await act(async () => {
      click(findButton("Improve Impact"));
    });

    const acceptBtn = await waitForButton("Accept");
    click(acceptBtn);

    const stored = useResumeBuilder.getState().resume.experience[0];
    expect(stored.description).toBe("Fresh rewritten narrative");
    // The curated bullets must be untouched by a description rewrite.
    expect(stored.bulletPoints).toEqual(ORIGINAL_BULLETS);
    unmount();
  });

  it("accepting an ATS rewrite changes ONLY the description", async () => {
    seedExperience();
    const { unmount } = renderToContainer(<ExperienceSection />);

    click(findButton("Edit"));
    click(findButton("Rewrite with AI"));

    mockAtsOptimization.mockResolvedValue({ content: "ATS optimized narrative" });
    await act(async () => {
      click(findButton("ATS Optimize"));
    });

    const acceptBtn = await waitForButton("Accept");
    click(acceptBtn);

    const stored = useResumeBuilder.getState().resume.experience[0];
    expect(stored.description).toBe("ATS optimized narrative");
    expect(stored.bulletPoints).toEqual(ORIGINAL_BULLETS);
    unmount();
  });

  it("description is actually replaced (fix still applies the rewrite)", async () => {
    seedExperience();
    const { unmount } = renderToContainer(<ExperienceSection />);

    click(findButton("Edit"));
    click(findButton("Rewrite with AI"));

    mockRewrite.mockResolvedValue({ content: "Only description changed" });
    await act(async () => {
      click(findButton("Make Concise"));
    });

    const acceptBtn = await waitForButton("Accept");
    click(acceptBtn);

    const stored = useResumeBuilder.getState().resume.experience[0];
    expect(stored.description).toBe("Only description changed");
    // And nothing else about the entry was fabricated.
    expect(stored.company).toBe("Acme");
    expect(stored.position).toBe("Engineer");
    unmount();
  });
});
