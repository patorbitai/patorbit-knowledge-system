"use strict";

/**
 * M4 Phases 2/3/5/6 — click-to-edit on the live preview.
 *
 * Regression coverage for the Definition of Done:
 *  1. click resume content → structured popover → type → store + preview
 *     update immediately (autosave picks up saveStatus "unsaved")
 *  2. add / delete / reorder bullets with Enter / Backspace / controls
 *  3. Escape cancels the active edit (snapshot restore)
 *  4. LinkedIn / GitHub / Portfolio / Email are real clickable links in the
 *     preview and inside the print target (#pdf-export-target = PDF path)
 *  5. clicking a link in the builder opens its editor (edit, don't navigate)
 *  6. section hide via the section popover takes effect immediately
 *  7. mobile: the popover renders as a full-width bottom sheet (no fixed
 *     pixel width → no horizontal overflow at 390px)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { LiveStylePreview } from "@/components/resume-builder/LiveStylePreview";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { GALLERY_SAMPLE_RESUME } from "@/components/resume-builder/gallery-sample-resume";
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
const BULLET_A = "Built payment platform processing millions of transactions";
const BULLET_B = "Reduced processing time by 40 percent";
const NEW_BULLET = "Led migration to a multi-region architecture";

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
        bulletPoints: [BULLET_A, BULLET_B],
      },
    ],
    education: [
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
    ],
    skills: [
      { id: "sk1", name: "Kubernetes", level: "Expert", category: "", years: "" },
      { id: "sk2", name: "TypeScript", level: "Advanced", category: "", years: "" },
    ],
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
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Element whose textContent matches `text` after the same normalization the
 * resolver uses (so a rendered bullet glyph or case transform still finds
 * the element a real click would resolve).
 */
function findExact(text: string, root: ParentNode = document.body): HTMLElement | null {
  const want = normalizeForMatch(text);
  const all = Array.from(
    root.querySelectorAll<HTMLElement>("span, p, li, div, h1, h2, h3, a, button"),
  );
  const matches = all.filter(
    (el) => normalizeForMatch(el.textContent ?? "") === want,
  );
  if (matches.length === 0) return null;
  // Prefer the innermost match — that is what a real click targets first.
  return matches.reduce((deepest, el) =>
    deepest.contains(el) ? el : deepest,
  );
}

function typeInto(el: HTMLTextAreaElement | HTMLInputElement, value: string): void {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  act(() => {
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function pressKey(el: Element, key: string, init: KeyboardEventInit = {}): void {
  act(() => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, ...init }),
    );
  });
}

const previewText = (container: Element) =>
  container.querySelector('[data-testid="live-page-sheet"]')?.textContent ?? "";

describe("M4 — inline click-to-edit (live preview)", () => {
  it(
    "click summary → edit → store + preview update immediately (autosave armed)",
    { timeout: 20000 },
    () => {
      const { container, unmount } = renderToContainer(
        <LiveStylePreview fitMode="contain" />,
      );

      expect(previewText(container)).toContain(SUMMARY);

      const summaryEl = findExact(SUMMARY, container);
      expect(summaryEl, "summary element in preview").not.toBeNull();
      click(summaryEl);

      const popover = container.querySelector(
        '[data-testid="inline-popover"]',
      ) as HTMLElement | null;
      expect(popover, "popover opens on click").not.toBeNull();
      const textarea = popover!.querySelector(
        'textarea[placeholder^="Write 2–4"]',
      ) as HTMLTextAreaElement | null;
      expect(textarea, "summary textarea in popover").not.toBeNull();
      expect(textarea!.value).toBe(SUMMARY);

      const NEW = "Edited summary focused on distributed systems.";
      typeInto(textarea!, NEW);

      const st = useResumeBuilder.getState();
      expect(st.resume.summary).toBe(NEW);
      expect(st.resumes.find((r) => r.resumeId === "r1")?.summary).toBe(NEW);
      expect(st.saveStatus).toBe("unsaved");
      expect(previewText(container)).toContain(NEW);

      unmount();
    },
  );

  it(
    "experience bullet: edit, add (Enter), reorder, delete — preview follows",
    { timeout: 20000 },
    () => {
      const { container, unmount } = renderToContainer(
        <LiveStylePreview fitMode="contain" />,
      );

      /* ── EDIT an existing bullet ── */
      const bullet = findExact(BULLET_A, container);
      expect(bullet, "bullet element").not.toBeNull();
      click(bullet);

      const popover = container.querySelector(
        '[data-testid="inline-popover"]',
      ) as HTMLElement;
      expect(popover).not.toBeNull();
      expect(popover.textContent).toContain("Bullet");
      const textarea = popover.querySelector(
        'textarea[placeholder^="Describe an achievement"]',
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe(BULLET_A);

      const EDITED = BULLET_A + " with 99.99% uptime";
      typeInto(textarea, EDITED);
      expect(useResumeBuilder.getState().resume.experience[0].bulletPoints[0]).toBe(
        EDITED,
      );
      expect(previewText(container)).toContain(EDITED);

      /* ── ADD via Enter (new focused empty bullet) ── */
      pressKey(textarea, "Enter");
      let points = useResumeBuilder.getState().resume.experience[0].bulletPoints;
      expect(points).toHaveLength(3);
      expect(points[1]).toBe("");

      const popoverAfterAdd = container.querySelector(
        '[data-testid="inline-popover"]',
      ) as HTMLElement;
      const newArea = popoverAfterAdd.querySelector(
        'textarea[placeholder^="Describe an achievement"]',
      ) as HTMLTextAreaElement;
      typeInto(newArea, NEW_BULLET);
      expect(previewText(container)).toContain(NEW_BULLET);

      /* ── REORDER: move the new bullet up ── */
      click(
        Array.from(popoverAfterAdd.querySelectorAll("button")).find(
          (b) => b.getAttribute("aria-label") === "Move bullet down",
        )!,
      );
      points = useResumeBuilder.getState().resume.experience[0].bulletPoints;
      // EDITED was index0, new bullet index1 → after moving index1 down it
      // lands after the second original bullet.
      expect(points[2]).toBe(NEW_BULLET);

      /* ── DELETE: back on the new bullet, delete it ── */
      const popover2 = container.querySelector(
        '[data-testid="inline-popover"]',
      ) as HTMLElement;
      click(
        Array.from(popover2.querySelectorAll("button")).find(
          (b) => b.getAttribute("aria-label") === "Delete bullet",
        )!,
      );
      points = useResumeBuilder.getState().resume.experience[0].bulletPoints;
      expect(points).toHaveLength(2);
      expect(points).not.toContain(NEW_BULLET);
      expect(previewText(container)).not.toContain(NEW_BULLET);

      unmount();
    },
  );

  it(
    "Backspace on an empty bullet removes it",
    { timeout: 20000 },
    () => {
      const { container, unmount } = renderToContainer(
        <LiveStylePreview fitMode="contain" />,
      );

      const bullet = findExact(BULLET_A, container)!;
      click(bullet);
      let popover = container.querySelector(
        '[data-testid="inline-popover"]',
      ) as HTMLElement;
      let textarea = popover.querySelector(
        'textarea[placeholder^="Describe an achievement"]',
      ) as HTMLTextAreaElement;

      // Enter → empty bullet is focused.
      pressKey(textarea, "Enter");
      popover = container.querySelector(
        '[data-testid="inline-popover"]',
      ) as HTMLElement;
      textarea = popover.querySelector(
        'textarea[placeholder^="Describe an achievement"]',
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("");
      expect(
        useResumeBuilder.getState().resume.experience[0].bulletPoints,
      ).toHaveLength(3);

      // Backspace on the empty bullet removes it again.
      pressKey(textarea, "Backspace");
      expect(
        useResumeBuilder.getState().resume.experience[0].bulletPoints,
      ).toHaveLength(2);

      unmount();
    },
  );

  it(
    "Escape cancels the active edit (snapshot restore)",
    { timeout: 20000 },
    () => {
      const { container, unmount } = renderToContainer(
        <LiveStylePreview fitMode="contain" />,
      );

      const summaryEl = findExact(SUMMARY, container)!;
      click(summaryEl);
      const textarea = container.querySelector(
        '[data-testid="inline-popover"] textarea',
      ) as HTMLTextAreaElement;
      typeInto(textarea, "Half-typed edit that should vanish");
      expect(useResumeBuilder.getState().resume.summary).toBe(
        "Half-typed edit that should vanish",
      );

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      });

      expect(useResumeBuilder.getState().resume.summary).toBe(SUMMARY);
      expect(
        container.querySelector('[data-testid="inline-popover"]'),
      ).toBeNull();
      expect(previewText(container)).toContain(SUMMARY);

      unmount();
    },
  );

  it(
    "clicking a social link opens its editor (edit, don't navigate) with validation",
    { timeout: 20000 },
    () => {
      const { container, unmount } = renderToContainer(
        <LiveStylePreview fitMode="contain" />,
      );

      const linkedin = container.querySelector(
        'a[href="https://linkedin.com/in/jordanrivera"]',
      ) as HTMLAnchorElement | null;
      expect(linkedin, "LinkedIn anchor in builder preview").not.toBeNull();
      click(linkedin);

      const popover = container.querySelector(
        '[data-testid="inline-popover"]',
      ) as HTMLElement | null;
      expect(popover, "link click opens the social editor").not.toBeNull();
      expect(popover!.textContent).toContain("LinkedIn");
      const input = popover!.querySelector(
        'input[type="url"]',
      ) as HTMLInputElement;
      expect(input.value).toBe("linkedin.com/in/jordanrivera");

      // Unsafe scheme → inline validation, never a clickable href.
      typeInto(input, "javascript:alert(1)");
      expect(popover!.textContent).toContain(
        "Only http:// and https:// links are allowed.",
      );

      unmount();
    },
  );

  it(
    "section heading click → hide section → preview stops rendering it",
    { timeout: 20000 },
    () => {
      const { container, unmount } = renderToContainer(
        <LiveStylePreview fitMode="contain" />,
      );

      expect(previewText(container)).toContain("Education");
      const heading = findExact("Education", container);
      expect(heading, "education heading").not.toBeNull();
      click(heading);

      const popover = container.querySelector(
        '[data-testid="inline-popover"]',
      ) as HTMLElement | null;
      expect(popover, "section popover").not.toBeNull();

      const hideBtn = Array.from(popover!.querySelectorAll("button")).find(
        (b) => b.getAttribute("aria-label") === "Hide section",
      );
      expect(hideBtn, "Hide section control").toBeTruthy();
      click(hideBtn!);

      const st = useResumeBuilder.getState();
      expect(st.resume.sectionPrefs?.hidden).toContain("education");
      // Version-scoped: only this resume carries the pref.
      expect(st.resumes[0].sectionPrefs?.hidden).toContain("education");
      expect(previewText(container)).not.toContain("Education");
      // The content itself is untouched — hiding is presentation only.
      expect(st.resume.education).toHaveLength(1);

      unmount();
    },
  );

  it(
    "mobile (390px): the popover renders as a full-width bottom sheet",
    { timeout: 20000 },
    () => {
      // Force the mobile breakpoint for this test only.
      vi.stubGlobal(
        "matchMedia",
        (query: string) => ({
          matches: query.includes("max-width: 767px"),
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }),
      );

      const { container, unmount } = renderToContainer(
        <LiveStylePreview fitMode="contain" />,
      );
      const summaryEl = findExact(SUMMARY, container)!;
      click(summaryEl);

      const popover = container.querySelector(
        '[data-testid="inline-popover"]',
      ) as HTMLElement;
      expect(popover).not.toBeNull();
      const style = popover.style;
      expect(style.left).toBe("0px");
      expect(style.right).toBe("0px");
      expect(style.bottom).toBe("0px");
      // Width is relative — no fixed pixel width that could overflow 390px.
      expect(style.width).toBe("100%");
      expect(style.maxHeight).toBe("70vh");

      unmount();
    },
  );

  it(
    "template switch preserves every edit (content and prefs)",
    { timeout: 20000 },
    () => {
      const { container, unmount } = renderToContainer(
        <LiveStylePreview fitMode="contain" />,
      );

      const summaryEl = findExact(SUMMARY, container)!;
      click(summaryEl);
      const textarea = container.querySelector(
        '[data-testid="inline-popover"] textarea',
      ) as HTMLTextAreaElement;
      const NEW = "Edited summary that must survive a template switch.";
      typeInto(textarea, NEW);

      act(() => {
        useResumeBuilder.getState().setSectionPrefs({
          hidden: ["education"],
        });
        useResumeBuilder.getState().applyTemplate("executive");
      });

      const st = useResumeBuilder.getState();
      expect(st.resume.templateId).toBe("executive");
      expect(st.resume.summary).toBe(NEW);
      expect(st.resume.experience[0].bulletPoints[0]).toBe(BULLET_A);
      expect(st.resume.sectionPrefs?.hidden).toContain("education");
      expect(previewText(container)).toContain(NEW);
      expect(previewText(container)).not.toContain("Education");

      unmount();
    },
  );
});

describe("M4 Phase 5 — hyperlinks survive Preview → print/PDF target", () => {
  beforeEach(() => {
    seed();
  });

  it(
    "LinkedIn, GitHub, Portfolio, Email and Phone are real anchors in the print target",
    { timeout: 30000 },
    () => {
      const resume: Resume = {
        ...structuredClone(GALLERY_SAMPLE_RESUME),
        social: {
          ...GALLERY_SAMPLE_RESUME.social,
          linkedin: "linkedin.com/in/jordanrivera",
          github: "github.com/jordanrivera",
          website: "jordanrivera.dev",
          portfolio: "jordanrivera.dev/work",
          twitter: "",
          stackoverflow: "",
        },
      };
      const template = TEMPLATES.find((t) => t.id === "modern-clean")!;

      const { container, unmount } = renderToContainer(
        <div id="pdf-export-target">
          <ResumePreview resume={resume} template={template} />
        </div>,
      );

      const target = container.querySelector(
        "#pdf-export-target",
      ) as HTMLElement;
      // Browser print → PDF keeps these <a> annotations (where supported).
      expect(
        target.querySelector('a[href="https://linkedin.com/in/jordanrivera"]'),
      ).not.toBeNull();
      expect(
        target.querySelector('a[href="https://github.com/jordanrivera"]'),
      ).not.toBeNull();
      expect(
        target.querySelector('a[href="https://jordanrivera.dev"]'),
      ).not.toBeNull();
      expect(
        target.querySelector('a[href="https://jordanrivera.dev/work"]'),
      ).not.toBeNull();
      expect(
        target.querySelector('a[href="mailto:jordan.rivera@example.com"]'),
      ).not.toBeNull();
      expect(target.querySelector('a[href^="tel:"]')).not.toBeNull();

      unmount();
    },
  );
});
