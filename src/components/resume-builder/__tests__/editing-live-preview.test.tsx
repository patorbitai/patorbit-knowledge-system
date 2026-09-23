"use strict";

/**
 * §1 resume editor — changes update the preview immediately:
 *  - typing in the summary field writes through to the store
 *  - the visual preview (LiveStylePreview) re-renders with the new text
 *    in the same interaction (no save required)
 *  - saveStatus flips to "unsaved" so the autosave pipeline picks it up
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import React, { act } from "react";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { PersonalSection } from "@/components/resume-builder/sections/PersonalSection";
import { LiveStylePreview } from "@/components/resume-builder/LiveStylePreview";
import {
  renderToContainer,
  click,
  findButton,
  installObserverStubs,
  setFakeScrollHeight,
} from "./gallery-test-utils";
import type { Resume } from "@/types/resume";

installObserverStubs();
setFakeScrollHeight(900);

vi.mock("@/lib/ai/client", () => ({
  ai: new Proxy({}, { get: () => vi.fn(async () => null) }),
}));

function seed(summary: string): void {
  const resume: Resume = {
    ...structuredClone(defaultResume),
    resumeId: "r1",
    resumeName: "Jane Resume",
    name: "Jane Doe",
    summary,
  };
  useResumeBuilder.setState({
    resumes: [structuredClone(resume)],
    activeResumeId: "r1",
    resume: structuredClone(resume),
    saveStatus: "saved",
    versions: {},
    lineage: {},
    serverVersions: {},
    pendingDeletes: [],
  });
}

beforeEach(() => {
  seed("Original summary text.");
});

describe("resume editor — live preview", () => {
  it("typing the summary updates store + preview immediately", () => {
    const { container, unmount } = renderToContainer(
      <>
        <div data-testid="editor">
          <PersonalSection />
        </div>
        <div data-testid="preview">
          <LiveStylePreview fitMode="contain" />
        </div>
      </>,
    );

    // Preview shows the ORIGINAL text before editing.
    expect(
      container.querySelector('[data-testid="preview"]')?.textContent,
    ).toContain("Original summary text.");

    // Open the structured editor.
    click(findButton("Edit Profile"));
    const textarea = container.querySelector(
      'textarea[placeholder^="Write 2-4"]',
    ) as HTMLTextAreaElement | null;
    expect(textarea).not.toBeNull();

    const NEW = "Freshly typed summary about platform engineering.";
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    act(() => {
      setter?.call(textarea, NEW);
      textarea!.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // 1. store updated
    expect(useResumeBuilder.getState().resume.summary).toBe(NEW);
    expect(
      useResumeBuilder.getState().resumes.find((r) => r.resumeId === "r1")
        ?.summary,
    ).toBe(NEW);
    // 2. autosave picked it up
    expect(useResumeBuilder.getState().saveStatus).toBe("unsaved");
    // 3. preview re-rendered with the SAME text — no save required
    expect(
      container.querySelector('[data-testid="preview"]')?.textContent,
    ).toContain(NEW);

    unmount();
  });
});
