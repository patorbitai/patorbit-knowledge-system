"use strict";

/**
 * M5A — editor discoverability.
 *
 * Coverage for the milestone's Definition of Done:
 *  1. hovering an editable preview region applies the discoverability
 *     styling hook (pointer cursor + `data-rs-edit-hover` ring)
 *  2. clicking that region still opens the EXISTING structured popover
 *  3. non-editable/structural content is never marked editable
 *  4. the first-use hint appears, hides on first popover open, stays hidden
 *  5. the summary read view has a normal-edit affordance of its own
 *  6. "Improve summary" (AI) stays a separate action from editing
 *  7. hover/hint interactions never touch editor state or saveStatus
 *
 * (Mobile no-horizontal-overflow is asserted by the existing M4 mobile
 * popover test plus the Playwright visual QA run at 390px.)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { LiveStylePreview } from "@/components/resume-builder/LiveStylePreview";
import { PersonalSection } from "@/components/resume-builder/sections/PersonalSection";
import {
  EDIT_HINT_KEY,
  isEditHintDismissed,
} from "@/components/resume-builder/inline/edit-hint";
import {
  renderToContainer,
  click,
  installObserverStubs,
  setFakeScrollHeight,
} from "./gallery-test-utils";
import { normalizeForMatch } from "@/components/resume-builder/inline/resolveInlineTarget";
import type { Resume } from "@/types/resume";

installObserverStubs();
setFakeScrollHeight(2000);

vi.mock("@/lib/ai/client", () => ({
  ai: new Proxy({}, { get: () => vi.fn(async () => null) }),
}));

const SUMMARY = "Platform engineer who ships reliable systems with clear tradeoffs.";

function seed(): void {
  const resume: Resume = {
    ...structuredClone(defaultResume),
    resumeId: "r1",
    resumeName: "Version A",
    name: "Jordan Rivera",
    title: "Senior Platform Engineer",
    email: "jordan.rivera@example.com",
    phone: "+1 (415) 555-0184",
    summary: SUMMARY,
    social: {
      linkedin: "linkedin.com/in/jordanrivera",
      github: "github.com/jordanrivera",
      website: "jordanrivera.dev",
      twitter: "",
      portfolio: "jordanrivera.dev/work",
      stackoverflow: "",
    },
    experience: [
      {
        id: "exp1",
        company: "Northwind Labs",
        position: "Staff Platform Engineer",
        location: "San Francisco, CA",
        employmentType: "Full-time",
        industry: "",
        startDate: "2021-06",
        endDate: "",
        current: true,
        duration: "2021 – Present",
        description: "",
        achievements: "",
        techUsed: "",
        bulletPoints: ["Built payment platform processing millions of transactions"],
      },
    ],
    education: [],
    skills: [{ id: "sk1", name: "Kubernetes", level: "Expert", category: "", years: "" }],
    claims: [],
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
    styleConfigs: {},
    qualificationMatch: null,
    previewJobAware: false,
  });
}

beforeEach(() => {
  seed();
  localStorage.removeItem(EDIT_HINT_KEY);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Innermost element whose normalized text equals `text` (real click order). */
function findExact(text: string, root: ParentNode = document.body): HTMLElement | null {
  const want = normalizeForMatch(text);
  const all = Array.from(
    root.querySelectorAll<HTMLElement>("span, p, li, div, h1, h2, h3, a, button"),
  );
  const matches = all.filter((el) => normalizeForMatch(el.textContent ?? "") === want);
  if (matches.length === 0) return null;
  return matches.reduce((deepest, el) => (deepest.contains(el) ? el : deepest));
}

function pointerOver(el: Element): void {
  act(() => {
    el.dispatchEvent(
      new MouseEvent("pointerover", { bubbles: true, cancelable: true }),
    );
  });
}

const marked = (el: Element | null): boolean =>
  !!el && el.hasAttribute("data-rs-edit-hover");

describe("M5A — preview hover affordance", () => {
  it("marks exactly the editable region (pointer + ring hook) and clears it", () => {
    const { container, unmount } = renderToContainer(
      <LiveStylePreview fitMode="contain" />,
    );

    const summaryEl = findExact(SUMMARY, container);
    expect(summaryEl, "summary element in preview").not.toBeNull();

    // Nothing is marked before any interaction — idle resume stays clean.
    expect(container.querySelectorAll("[data-rs-edit-hover]")).toHaveLength(0);

    pointerOver(summaryEl!);
    expect(marked(summaryEl), "summary marked on hover").toBe(true);
    expect(summaryEl!.style.cursor).toBe("pointer");

    // Moving the pointer out of the region (native pointerout → React
    // synthesizes pointerleave) clears the mark.
    act(() => {
      summaryEl!.dispatchEvent(
        new MouseEvent("pointerout", {
          bubbles: true,
          cancelable: true,
          relatedTarget: document.body,
        }),
      );
    });
    expect(marked(summaryEl), "mark cleared on pointerleave").toBe(false);
    expect(summaryEl!.style.cursor).toBe("");

    // Re-hover, then move onto structural (non-editable) content → cleared.
    pointerOver(summaryEl!);
    expect(marked(summaryEl)).toBe(true);
    const sheet = container.querySelector('[data-testid="live-page-sheet"]')!;
    pointerOver(sheet);
    expect(marked(sheet), "structural content never marked").toBe(false);
    expect(marked(summaryEl), "previous mark cleared when moving away").toBe(false);

    unmount();
  });

  it("clicking the hovered region still opens the existing edit popover", () => {
    const { container, unmount } = renderToContainer(
      <LiveStylePreview fitMode="contain" />,
    );

    const summaryEl = findExact(SUMMARY, container);
    expect(summaryEl).not.toBeNull();
    pointerOver(summaryEl!); // hover first — must not interfere with click
    click(summaryEl);

    const popover = container.querySelector(
      '[data-testid="inline-popover"]',
    ) as HTMLElement | null;
    expect(popover, "existing popover opens").not.toBeNull();
    const textarea = popover!.querySelector(
      'textarea[placeholder^="Write 2–4"]',
    ) as HTMLTextAreaElement | null;
    expect(textarea, "same structured summary editor").not.toBeNull();
    expect(textarea!.value).toBe(SUMMARY);

    unmount();
  });

  it("hover and popover-open never touch editor state or saveStatus", () => {
    const before = JSON.stringify(useResumeBuilder.getState().resume);
    const { container, unmount } = renderToContainer(
      <LiveStylePreview fitMode="contain" />,
    );

    const summaryEl = findExact(SUMMARY, container);
    pointerOver(summaryEl!);
    click(summaryEl);
    expect(
      container.querySelector('[data-testid="inline-popover"]'),
    ).not.toBeNull();

    const st = useResumeBuilder.getState();
    expect(st.saveStatus).toBe("saved");
    expect(JSON.stringify(st.resume)).toBe(before);
    expect(st.versions).toEqual({});

    unmount();
  });
});

describe("M5A — first-use edit hint", () => {
  it("appears on first render and hides permanently after the first popover open", () => {
    const { container, unmount } = renderToContainer(
      <LiveStylePreview fitMode="contain" />,
    );

    const hint = container.querySelector('[data-testid="edit-hint"]');
    expect(hint, "hint visible before first use").not.toBeNull();
    expect(hint!.textContent).toContain("Click any text to edit");
    expect(isEditHintDismissed()).toBe(false);

    const summaryEl = findExact(SUMMARY, container);
    click(summaryEl);
    expect(
      container.querySelector('[data-testid="inline-popover"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="edit-hint"]'),
      "hint hidden after first edit",
    ).toBeNull();
    expect(isEditHintDismissed()).toBe(true);

    unmount();

    // A fresh mount stays hidden — first-use only, never persistent.
    const second = renderToContainer(<LiveStylePreview fitMode="contain" />);
    expect(
      second.container.querySelector('[data-testid="edit-hint"]'),
      "hint stays hidden on later mounts",
    ).toBeNull();
    second.unmount();
  });

  it("can be dismissed manually without opening the popover", () => {
    const { container, unmount } = renderToContainer(
      <LiveStylePreview fitMode="contain" />,
    );
    const dismiss = container.querySelector(
      '[aria-label="Dismiss edit hint"]',
    ) as HTMLButtonElement | null;
    expect(dismiss).not.toBeNull();
    click(dismiss);
    expect(
      container.querySelector('[data-testid="edit-hint"]'),
    ).toBeNull();
    expect(isEditHintDismissed()).toBe(true);
    unmount();
  });
});

describe("M5A — summary edit affordance (form side)", () => {
  it("read view exposes a normal Edit control and a separate AI action", () => {
    const { container, unmount } = renderToContainer(<PersonalSection />);

    // Read view: summary text present.
    expect(container.textContent).toContain(SUMMARY);

    const editBtn = container.querySelector(
      'button[aria-label="Edit summary"]',
    ) as HTMLButtonElement | null;
    expect(editBtn, "restrained edit affordance on the summary").not.toBeNull();
    expect(editBtn!.textContent).toContain("Edit");

    const aiBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => (b.textContent || "").includes("Improve summary"),
    );
    expect(aiBtn, "AI action still present").toBeTruthy();
    expect(aiBtn, "Edit and Improve are separate controls").not.toBe(editBtn);

    // Entering edit via the summary affordance opens the SAME edit view.
    click(editBtn);
    const textarea = container.querySelector(
      'textarea[placeholder^="Write 2-4 lines"]',
    ) as HTMLTextAreaElement | null;
    expect(textarea, "existing summary textarea in edit view").not.toBeNull();
    expect(textarea!.value).toBe(SUMMARY);

    // No AI side effects from a plain edit affordance.
    expect(useResumeBuilder.getState().aiActions).toEqual({});

    unmount();
  });

  it("keeps save behavior byte-identical: opening the editor changes nothing", () => {
    const before = JSON.stringify(useResumeBuilder.getState().resume);
    const { container, unmount } = renderToContainer(<PersonalSection />);
    click(
      container.querySelector('button[aria-label="Edit summary"]') as Element,
    );
    const st = useResumeBuilder.getState();
    expect(st.saveStatus).toBe("saved");
    expect(JSON.stringify(st.resume)).toBe(before);
    unmount();
  });
});
