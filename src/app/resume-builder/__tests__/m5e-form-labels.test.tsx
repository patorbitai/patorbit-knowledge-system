"use strict";

/**
 * M5E — form labels, validation messaging, live status, and inline-edit
 * focus restoration (focused regression tests).
 *
 * F1  FieldInput — label↔control association (htmlFor/id), aria-invalid +
 *     aria-describedby pointing at a role="alert" error, and the AI action
 *     indicator announced through a persistent polite live region
 * F2  ImportReviewScreen — every import field is labelled and associated,
 *     aria-invalid reflects missing values, unique per-entry remove labels,
 *     heading hierarchy (h2 → h3, no skips), section nav exposes the active
 *     section with aria-current (not color alone)
 * F3  InlinePopover — Escape cancels the edit and restores focus to the
 *     element that invoked the popover
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";

vi.setConfig({ testTimeout: 20000, hookTimeout: 20000 });

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));

vi.mock("@/lib/analytics", () => ({
  track: (...args: unknown[]) => trackMock(...args),
  trackOnce: vi.fn(),
  trackEvent: vi.fn(),
  isTrackedEvent: () => true,
  buildFunnelReport: vi.fn(() => ({ total: 0, events: [] })),
  FUNNEL_EVENTS: [] as string[],
  WORKFLOW_EVENTS: [] as string[],
  WORKFLOW_SET: new Set<string>(),
  ALL_EVENTS: new Set<string>(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));
vi.mock("@/components/providers/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: "dark", setTheme: vi.fn(), toggleTheme: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/resume-builder",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/ai/client", () => ({
  ai: new Proxy({}, { get: () => vi.fn(async () => null) }),
}));

import { FieldInput } from "@/components/resume-builder/fields/FieldInput";
import { ImportReviewScreen } from "@/components/resume-builder/ImportReviewScreen";
import { LiveStylePreview } from "@/components/resume-builder/LiveStylePreview";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import {
  renderToContainer,
  click,
  installObserverStubs,
  setFakeScrollHeight,
} from "@/components/resume-builder/__tests__/gallery-test-utils";
import { normalizeForMatch } from "@/components/resume-builder/inline/resolveInlineTarget";
import type { Resume } from "@/types/resume";

const SUMMARY = "Platform engineer who ships reliable systems with clear tradeoffs.";

function seed(): void {
  const resume = {
    ...structuredClone(defaultResume),
    resumeId: "m5e-f",
    resumeName: "M5E Form Resume",
    name: "Jordan Rivera",
    title: "Senior Platform Engineer",
    email: "jordan.rivera@example.com",
    phone: "+1 (415) 555-0184",
    summary: SUMMARY,
  } as Resume;
  useResumeBuilder.setState({
    resumes: [resume],
    resume,
    activeResumeId: "m5e-f",
    saveStatus: "saved",
    versions: {},
    lineage: {},
    serverVersions: {},
    pendingDeletes: [],
    pendingSyncIds: [],
    styleConfigs: {},
    aiActions: {},
    activeJobApplicationId: null,
    activeJobApplication: null,
    qualificationMatch: null,
    hydrated: true,
    hydratingFromServer: false,
    writeConflict: null,
    previewJobAware: false,
  } as never);
}

beforeEach(() => {
  installObserverStubs();
  setFakeScrollHeight(900);
  seed();
  document.body.innerHTML = "";
  trackMock.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => ({}) })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeOpener(label: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = label;
  document.body.appendChild(btn);
  btn.focus();
  return btn;
}

/** Innermost element whose textContent matches `text` (m4 normalization). */
function findExact(text: string, root: ParentNode): HTMLElement | null {
  const want = normalizeForMatch(text);
  const all = Array.from(
    root.querySelectorAll<HTMLElement>("span, p, li, div, h1, h2, h3, a, button"),
  );
  const matches = all.filter((el) => normalizeForMatch(el.textContent ?? "") === want);
  if (matches.length === 0) return null;
  return matches.reduce((deepest, el) => (deepest.contains(el) ? el : deepest));
}

/* ── F1 — FieldInput ──────────────────────────────────────────────────── */

describe("F1 — FieldInput label and validation semantics", () => {
  it("associates the label, marks invalid input, and announces the error via role=alert", () => {
    const { container, unmount } = renderToContainer(
      <FieldInput
        label="Email address"
        placeholder="you@example.com"
        value=""
        onChange={vi.fn()}
        error="Email is required"
        type="email"
      />,
    );

    const input = container.querySelector("input")!;
    expect(input).toBeTruthy();
    const label = container.querySelector("label")!;
    expect(label, "label renders").toBeTruthy();
    expect(label.getAttribute("for")).toBe(input.id);
    expect(label.textContent).toContain("Email address");

    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy, "error is referenced by aria-describedby").toBeTruthy();

    const alert = container.querySelector<HTMLElement>('[role="alert"]');
    expect(alert, "error renders as role=alert").toBeTruthy();
    expect(alert!.id).toBe(describedBy);
    expect(alert!.textContent).toContain("Email is required");

    unmount();
  });

  it("clean fields expose no aria-invalid/-describedby; the textarea variant is associated too", () => {
    const { container, unmount } = renderToContainer(
      <FieldInput
        label="Professional summary"
        placeholder="Summarize your experience"
        value="Some summary"
        onChange={vi.fn()}
        type="textarea"
      />,
    );

    const textarea = container.querySelector("textarea")!;
    expect(textarea).toBeTruthy();
    const label = container.querySelector("label")!;
    expect(label.getAttribute("for")).toBe(textarea.id);
    expect(textarea.getAttribute("aria-invalid")).toBeNull();
    expect(textarea.getAttribute("aria-describedby")).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();

    unmount();
  });

  it("AI action status is announced through a persistent polite live region", () => {
    const { container, unmount } = renderToContainer(
      <FieldInput
        label="Summary"
        placeholder="Summarize your experience"
        value="Some summary"
        onChange={vi.fn()}
        aiActionKey="summary-rewrite"
        type="textarea"
      />,
    );

    const live = container.querySelector<HTMLElement>('[role="status"][aria-live="polite"]');
    expect(live, "persistent live region").toBeTruthy();
    expect(live!.textContent).not.toContain("AI generating");

    act(() => {
      useResumeBuilder.setState({
        aiActions: {
          "summary-rewrite": { status: "streaming", result: null, error: null },
        },
      } as never);
    });
    expect(live!.textContent).toContain("AI generating...");

    act(() => {
      useResumeBuilder.setState({
        aiActions: {
          "summary-rewrite": { status: "success", result: "Updated", error: null },
        },
      } as never);
    });
    expect(live!.textContent).toContain("AI updated");

    unmount();
  });
});

/* ── F2 — ImportReviewScreen ──────────────────────────────────────────── */

function mkImportResume(): Resume {
  const base = {
    ...structuredClone(defaultResume),
    resumeId: "imp-1",
    resumeName: "Imported Resume",
    name: "Ada Lovelace",
    title: "", // intentionally missing → aria-invalid on imp-title
    email: "ada@example.com",
    phone: "+1 (555) 010-0001",
    summary: "Imported summary text.",
  } as Resume;
  base.experience = [
    {
      id: "exp1",
      company: "Northwind Labs",
      position: "Staff Engineer",
      location: "San Francisco, CA",
      employmentType: "Full-time",
      industry: "",
      startDate: "2021-06",
      endDate: "",
      current: true,
      duration: "2021 – Present",
      description: "Built systems.",
      achievements: "",
      techUsed: "",
      bulletPoints: ["Shipped a platform"],
    },
    {
      id: "exp2",
      company: "Acme Corp",
      position: "Engineer",
      location: "Austin, TX",
      employmentType: "Full-time",
      industry: "",
      startDate: "2018-01",
      endDate: "2021-05",
      current: false,
      duration: "2018 – 2021",
      description: "Maintained services.",
      achievements: "",
      techUsed: "",
      bulletPoints: [],
    },
  ];
  base.skills = [
    { id: "sk1", name: "Kubernetes", level: "Expert", category: "", years: "" },
    { id: "sk2", name: "TypeScript", level: "Advanced", category: "", years: "" },
  ];
  return base;
}

function meta() {
  return { path: "regex" as const, truncated: false, charCount: 10, rawText: "raw" };
}

function sectionButton(label: string): HTMLButtonElement | undefined {
  return Array.from(document.body.querySelectorAll<HTMLButtonElement>("nav button")).find(
    (b) => b.textContent?.trim() === label,
  );
}

describe("F2 — ImportReviewScreen labels, validation, and structure", () => {
  it("profile fields are labelled/associated, aria-invalid flags missing values, headings don't skip", () => {
    const { unmount } = renderToContainer(
      <ImportReviewScreen
        resume={mkImportResume()}
        meta={meta()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    for (const id of ["imp-name", "imp-email", "imp-phone"]) {
      const el = document.getElementById(id);
      expect(el, `#${id} renders`).toBeTruthy();
      const label = document.body.querySelector(`label[for="${id}"]`);
      expect(label, `label[for="${id}"]`).toBeTruthy();
    }

    const title = document.getElementById("imp-title")!;
    expect(title.getAttribute("aria-invalid"), "empty title is flagged").toBe("true");
    expect(document.getElementById("imp-name")!.getAttribute("aria-invalid")).toBeNull();

    // Heading structure: an h1/h2 leads, the section title is h2, the
    // "Social Links" sub-heading is h3 after it, and nothing skips to h4+.
    const headings = Array.from(document.body.querySelectorAll("h1, h2, h3, h4"));
    expect(["H1", "H2"]).toContain(headings[0].tagName);
    const h2i = headings.findIndex((h) => h.tagName === "H2");
    const h3i = headings.findIndex((h) => h.tagName === "H3");
    expect(h2i, "an h2 leads the panel").toBeGreaterThanOrEqual(0);
    expect(h3i, "h3 follows the h2").toBeGreaterThan(h2i);
    expect(headings[h2i].textContent?.trim()).toBe("Profile");
    expect(headings[h3i].textContent).toContain("Social Links");
    expect(headings.some((h) => h.tagName === "H4"), "no h4 or deeper").toBe(false);

    // The active section is exposed programmatically, not by color alone.
    const active = document.body.querySelector("nav button[aria-current]");
    expect(active, "active section exposes aria-current").toBeTruthy();
    expect(active!.getAttribute("aria-current")).toBe("true");
    expect(active!.textContent).toContain("Profile");

    // The Summary section's textarea is labelled and associated too.
    const summaryBtn = sectionButton("Summary");
    expect(summaryBtn, "Summary section button").toBeTruthy();
    click(summaryBtn!);
    const summary = document.getElementById("imp-summary");
    expect(summary, "#imp-summary renders").toBeTruthy();
    expect(
      document.body.querySelector('label[for="imp-summary"]'),
      "label[for=imp-summary]",
    ).toBeTruthy();
    expect(summary!.getAttribute("aria-invalid")).toBeNull();
    expect(document.body.querySelector("h2")!.textContent?.trim()).toBe("Summary");

    unmount();
  });

  it("per-entry remove labels are unique and experience fields stay labelled after switching sections", () => {
    const { unmount } = renderToContainer(
      <ImportReviewScreen
        resume={mkImportResume()}
        meta={meta()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const expBtn = sectionButton("Experience");
    expect(expBtn, "Experience section button").toBeTruthy();
    click(expBtn!);

    // Section title follows the switch (dynamic h2)…
    const h2 = document.body.querySelector("h2");
    expect(h2!.textContent?.trim()).toBe("Experience");

    // …and the fields of BOTH entries render with labelled, unique controls.
    for (const id of ["imp-exp-0-company", "imp-exp-0-position", "imp-exp-1-company"]) {
      expect(document.getElementById(id), `#${id}`).toBeTruthy();
      expect(
        document.body.querySelector(`label[for="${id}"]`),
        `label[for="${id}"]`,
      ).toBeTruthy();
    }
    const rm1 = document.body.querySelector('button[aria-label="Remove experience entry 1"]');
    const rm2 = document.body.querySelector('button[aria-label="Remove experience entry 2"]');
    expect(rm1, "remove label entry 1").toBeTruthy();
    expect(rm2, "remove label entry 2").toBeTruthy();
    expect(rm1!.getAttribute("aria-label")).not.toBe(rm2!.getAttribute("aria-label"));

    // aria-current moved with the active section.
    const active = document.body.querySelector("nav button[aria-current]");
    expect(active!.textContent).toContain("Experience");

    // Skills panel: per-skill inputs and remove buttons carry distinct names.
    const skillsBtn = sectionButton("Skills");
    expect(skillsBtn, "Skills section button").toBeTruthy();
    click(skillsBtn!);
    expect(document.body.querySelector('input[aria-label="Skill 1 name"]')).toBeTruthy();
    expect(document.body.querySelector('input[aria-label="Skill 2 name"]')).toBeTruthy();
    const rmSkill = document.body.querySelector('button[aria-label="Remove skill Kubernetes"]');
    expect(rmSkill, "remove button names the skill").toBeTruthy();

    unmount();
  });
});

/* ── F3 — InlinePopover focus restoration ─────────────────────────────── */

describe("F3 — InlinePopover focus restoration", () => {
  it("focus moves into the popover on open; Escape cancels and restores the opener", () => {
    const { container, unmount } = renderToContainer(<LiveStylePreview fitMode="contain" />);
    const opener = makeOpener("Edit summary");

    const summaryEl = findExact(SUMMARY, container);
    expect(summaryEl, "summary renders in the live preview").toBeTruthy();
    click(summaryEl);

    const popover = container.querySelector<HTMLElement>('[data-testid="inline-popover"]');
    expect(popover, "popover opens").toBeTruthy();
    const textarea = popover!.querySelector("textarea");
    expect(textarea, "popover editor renders").toBeTruthy();
    expect(document.activeElement, "focus moves into the editor").toBe(textarea);

    act(() => {
      textarea!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      );
    });
    expect(
      container.querySelector('[data-testid="inline-popover"]'),
      "Escape closes the popover",
    ).toBeNull();
    expect(document.activeElement, "opener restored after cancel").toBe(opener);

    unmount();
  });
});
