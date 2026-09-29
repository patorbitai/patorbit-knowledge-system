"use strict";

/**
 * M5E — builder shell accessibility (focused regression tests).
 *
 * E — shell semantics:
 *   E1  <main> landmark + sr-only h1 + section headings at h2 (no skipped level)
 *   E2  mode toggles expose aria-pressed and reflect the active mode
 *   E3  resume selector: keyboard-activatable options, Escape restores focus
 *       to the trigger, rename/delete actions carry names and are revealed
 *       on keyboard focus (group-focus-within), not only on hover
 *   E4  mobile section nav: labelled nav, aria-current="step", decorative
 *       completion dots hidden from assistive tech
 *   E5  right-copilot collapsible cards expose aria-expanded
 *   E6  job selector: Escape closes the listbox and restores focus
 *   E7  icon-only controls in the header/nav expose accessible names
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";

// Same headroom as builder-ux/m5c: the shell renders real preview sheets.
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

// Same host mocks as m5c-workflow.test.tsx (builder page render requirements).
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
// Autosave AI calls are never part of these assertions.
vi.mock("@/lib/ai/client", () => ({
  ai: new Proxy({}, { get: () => vi.fn(async () => null) }),
}));

import ResumeBuilderPage from "../page";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import {
  renderToContainer,
  click,
  installObserverStubs,
  setFakeScrollHeight,
} from "@/components/resume-builder/__tests__/gallery-test-utils";
import type { Resume } from "@/types/resume";

const RID_A = "m5e-a";
const RID_B = "m5e-b";

function makeResume(overrides: Partial<Record<string, unknown>>): Resume {
  return {
    ...structuredClone(defaultResume),
    ...overrides,
  } as Resume;
}

function seed(): void {
  const a = makeResume({
    resumeId: RID_A,
    resumeName: "First Resume",
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+1 (555) 010-0001",
    title: "Analytical Engineer",
    summary: "Mathematician and computing pioneer.",
  });
  const b = makeResume({
    resumeId: RID_B,
    resumeName: "Second Resume",
    name: "Grace Hopper",
    email: "grace@example.com",
    phone: "+1 (555) 010-0002",
    title: "Rear Admiral",
    summary: "Compiler pioneer.",
  });
  useResumeBuilder.setState({
    resumes: [a, b],
    resume: a, // same reference — the self-healing subscription stays quiet
    activeResumeId: RID_A,
    saveStatus: "saved",
    versions: {},
    lineage: {},
    serverVersions: {},
    pendingDeletes: [],
    pendingSyncIds: [],
    styleConfigs: {},
    activeJobApplicationId: null,
    activeJobApplication: null,
    qualificationMatch: null,
    hydrated: true,
    hydratingFromServer: false,
    writeConflict: null,
  } as never);
}

beforeEach(() => {
  installObserverStubs();
  setFakeScrollHeight(900);
  seed();
  document.body.innerHTML = "";
  trackMock.mockClear();
  // Any autosave/share network chatter is irrelevant here; stub it so no
  // test can trip over an unhandled relative-URL fetch rejection.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => ({}) })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Dispatch on body so BOTH document- and window-level listeners see it. */
function pressKey(key: string, init: KeyboardEventInit = {}): void {
  act(() => {
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
    );
  });
}

async function flush(ms = 30): Promise<void> {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

function pressedButtons(text: string): HTMLButtonElement[] {
  return Array.from(
    document.body.querySelectorAll<HTMLButtonElement>("button[aria-pressed]"),
  ).filter((b) => b.textContent?.trim() === text);
}

function pressedBy(toggles: HTMLButtonElement[], text: string): string | null {
  return (
    toggles.find((b) => b.textContent?.trim() === text)?.getAttribute("aria-pressed") ??
    null
  );
}

/* ── E1 — landmarks + heading hierarchy ────────────────────────────────── */

describe("E1 — landmarks and heading hierarchy", () => {
  it("exposes <main> with a single sr-only h1; section titles render at h2 after it", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    const main = document.body.querySelector("main");
    expect(main, "<main> landmark").toBeTruthy();

    const h1s = Array.from(main!.querySelectorAll("h1"));
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent?.trim()).toBe("Resume Builder");
    expect(h1s[0].className).toContain("sr-only");

    // The active section card ("Profile") sits at h2 beneath the h1.
    const h2s = Array.from(main!.querySelectorAll("h2"));
    expect(
      h2s.some((h) => h.textContent?.trim() === "Profile"),
      "section card heading is an h2",
    ).toBe(true);

    // Document order inside main: h1 first, and any h3 follows an h2
    // (no skipped levels at the top of the hierarchy).
    const headings = Array.from(main!.querySelectorAll("h1, h2, h3"));
    expect(headings[0].tagName).toBe("H1");
    const firstH2 = headings.findIndex((h) => h.tagName === "H2");
    const firstH3 = headings.findIndex((h) => h.tagName === "H3");
    if (firstH3 !== -1) {
      expect(firstH2, "an h2 precedes any h3").not.toBe(-1);
      expect(firstH2).toBeLessThan(firstH3);
    }

    unmount();
  });
});

/* ── E2 — aria-pressed mode toggles ────────────────────────────────────── */

describe("E2 — mode toggles expose aria-pressed", () => {
  it("right-panel and mobile toggles reflect and update the active mode", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    // Mobile bar: identified via its md:hidden wrapper (Edit exists only there).
    const editToggle = pressedButtons("Edit")[0];
    expect(editToggle, "mobile Edit toggle").toBeTruthy();
    const mobileBar = editToggle.parentElement as HTMLElement;
    const mobileToggles = Array.from(
      mobileBar.querySelectorAll<HTMLButtonElement>("button[aria-pressed]"),
    );
    expect(mobileToggles).toHaveLength(3);
    expect(pressedBy(mobileToggles, "Edit")).toBe("true"); // default: edit mode
    expect(pressedBy(mobileToggles, "Match")).toBe("false");
    expect(pressedBy(mobileToggles, "Preview")).toBe("false");

    // Right panel: identified via the "Open full preview" link it hosts
    // (present while the panel is in Preview mode, the default).
    const previewLink = document.body.querySelector('a[aria-label="Open full preview"]');
    expect(previewLink, "right panel defaults to Preview mode").toBeTruthy();
    const rightBar = previewLink!.parentElement as HTMLElement;
    const rightToggles = Array.from(
      rightBar.querySelectorAll<HTMLButtonElement>("button[aria-pressed]"),
    );
    expect(rightToggles).toHaveLength(2);
    expect(pressedBy(rightToggles, "Preview")).toBe("true");
    expect(pressedBy(rightToggles, "Match")).toBe("false");

    // Switching the right panel to Match flips aria-pressed in place.
    const rightMatch = rightToggles.find((b) => b.textContent?.trim() === "Match")!;
    const rightPreview = rightToggles.find((b) => b.textContent?.trim() === "Preview")!;
    click(rightMatch);
    expect(rightMatch.getAttribute("aria-pressed")).toBe("true");
    expect(rightPreview.getAttribute("aria-pressed")).toBe("false");
    // Mobile group untouched by the desktop toggle.
    expect(pressedBy(mobileToggles, "Edit")).toBe("true");

    unmount();
  });
});

/* ── E3 — resume selector keyboard support ─────────────────────────────── */

describe("E3 — resume selector is keyboard-operable", () => {
  it("options activate with Enter, Escape closes and restores focus, actions are named", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    const trigger = document.body.querySelector<HTMLButtonElement>(
      'button[aria-label="Select resume"]',
    );
    expect(trigger, "selector trigger").toBeTruthy();
    expect(trigger!.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger!.getAttribute("aria-expanded")).toBe("false");

    trigger!.focus();
    click(trigger);
    const openListbox = () =>
      document.body.querySelector('[role="listbox"][aria-label="My Resumes"]');
    expect(openListbox()).toBeTruthy();

    const listbox = openListbox()!;
    const options = Array.from(listbox.querySelectorAll('[role="option"]'));
    expect(options).toHaveLength(2);
    expect(options[0].getAttribute("tabindex")).toBe("0"); // reachable without a pointer

    // Enter on the focused option switches the active resume and closes.
    (options[1] as HTMLElement).focus();
    act(() => {
      options[1].dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    expect(useResumeBuilder.getState().activeResumeId).toBe(RID_B);
    expect(openListbox()).toBeNull();

    // Escape closes the listbox and returns focus to the trigger.
    trigger!.focus();
    click(trigger);
    expect(openListbox()).toBeTruthy();
    pressKey("Escape");
    expect(openListbox()).toBeNull();
    expect(document.activeElement).toBe(trigger);

    // Rename/delete actions carry accessible names and are revealed on
    // keyboard focus (group-focus-within), not only on hover.
    click(trigger);
    const rename = document.body.querySelector<HTMLButtonElement>(
      'button[aria-label="Rename Second Resume"]',
    );
    expect(rename, "named rename action").toBeTruthy();
    expect(
      document.body.querySelector('button[aria-label="Delete Second Resume"]'),
      "named delete action (multi-resume)",
    ).toBeTruthy();
    expect(rename!.parentElement!.className).toContain(
      "group-focus-within:opacity-100",
    );

    pressKey("Escape"); // close before unmount — no leaked listener
    unmount();
  });
});

/* ── E4 — mobile section nav ───────────────────────────────────────────── */

describe("E4 — mobile section navigation", () => {
  it("labelled nav, aria-current step, decorative completion dots hidden from AT", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    // Two navs share this label: the desktop LeftSidebar outline and the
    // mobile section strip. Both must mark the active section.
    const navs = Array.from(
      document.body.querySelectorAll('nav[aria-label="Resume sections"]'),
    );
    expect(navs.length, "both section navs render").toBeGreaterThanOrEqual(2);

    const mobileNav = navs.find((n) =>
      n.querySelector('button[aria-current="step"]'),
    );
    expect(mobileNav, "mobile nav marks active section with aria-current").toBeTruthy();
    const current = mobileNav!.querySelector('button[aria-current="step"]');
    expect(current!.textContent).toContain("Profile"); // activeSection default

    const desktopNav = navs.find((n) =>
      n.querySelector('button[aria-current="true"]'),
    );
    expect(desktopNav, "sidebar marks active section with aria-current").toBeTruthy();
    expect(
      desktopNav!.querySelector('button[aria-current="true"]')!.textContent,
    ).toContain("Profile");

    // Personal section is complete in this seed → the mobile dot renders,
    // and it is decorative (hidden from assistive tech).
    const dots = Array.from(mobileNav!.querySelectorAll("span.bg-emerald-400"));
    expect(dots.length).toBeGreaterThan(0);
    for (const dot of dots) {
      expect(dot.getAttribute("aria-hidden")).toBe("true");
    }

    unmount();
  });
});

/* ── E5 — right copilot collapsible cards ──────────────────────────────── */

describe("E5 — right copilot disclosures", () => {
  it("collapsible cards expose aria-expanded and toggle on activation", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    // Switch the right panel to Match (copilot) mode.
    const previewLink = document.body.querySelector('a[aria-label="Open full preview"]');
    expect(previewLink).toBeTruthy();
    const rightBar = previewLink!.parentElement as HTMLElement;
    const matchTab = Array.from(rightBar.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Match",
    );
    expect(matchTab).toBeTruthy();
    click(matchTab!);
    expect(matchTab!.getAttribute("aria-pressed")).toBe("true");

    // CollapsibleCard headers expose their expanded state.
    const scoreToggle = Array.from(
      document.body.querySelectorAll("button[aria-expanded]"),
    ).find((b) => b.textContent?.includes("Resume Score"));
    expect(scoreToggle, "RightCopilot collapsible card renders").toBeTruthy();
    expect(scoreToggle!.getAttribute("aria-expanded")).toBe("true");

    click(scoreToggle!);
    expect(scoreToggle!.getAttribute("aria-expanded")).toBe("false");

    unmount();
  });
});

/* ── E6 — job application selector ─────────────────────────────────────── */

describe("E6 — job application selector", () => {
  it("Escape closes the listbox and returns focus to the trigger", async () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    const trigger = document.body.querySelector<HTMLButtonElement>(
      'button[aria-label="Select job application"]',
    );
    expect(trigger, "job selector trigger").toBeTruthy();
    expect(trigger!.getAttribute("aria-haspopup")).toBe("listbox");

    trigger!.focus();
    click(trigger);
    await flush(30); // fetch stub resolves on open
    expect(trigger!.getAttribute("aria-expanded")).toBe("true");
    expect(
      document.body.querySelector('[role="listbox"][aria-label="Job applications"]'),
    ).toBeTruthy();

    pressKey("Escape");
    expect(
      document.body.querySelector('[role="listbox"][aria-label="Job applications"]'),
    ).toBeNull();
    expect(trigger!.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);

    unmount();
  });
});

/* ── E8 — save status is announced politely ───────────────────────────── */

describe("E8 — dynamic save status announcement", () => {
  it("the header save indicator is a polite live region reflecting store state", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    const status = document.body.querySelector<HTMLElement>(
      '[role="status"][data-save-status]',
    );
    expect(status, "save indicator renders in the builder").toBeTruthy();
    expect(status!.getAttribute("aria-live")).toBe("polite");
    expect(status!.getAttribute("data-save-status")).toBe("saved");

    act(() => {
      useResumeBuilder.setState({ saveStatus: "sync-failed" });
    });
    expect(status!.getAttribute("data-save-status")).toBe("sync-failed");

    unmount();
  });
});

/* ── E7 — icon-only control names ──────────────────────────────────────── */

describe("E7 — icon-only controls", () => {
  it("every icon-only control in the header and section nav has an accessible name", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    const scopes = Array.from(
      document.body.querySelectorAll(
        'header, nav[aria-label="Resume sections"]',
      ),
    );
    expect(scopes.length, "header + both section navs").toBeGreaterThanOrEqual(3);
    const iconOnly: Element[] = [];
    for (const scope of scopes) {
      for (const el of scope.querySelectorAll("button, a")) {
        if (!(el.textContent ?? "").trim()) iconOnly.push(el);
      }
    }
    for (const el of iconOnly) {
      expect(
        el.getAttribute("aria-label") || el.getAttribute("title"),
        `icon-only <${el.tagName.toLowerCase()}> needs an accessible name`,
      ).toBeTruthy();
    }

    unmount();
  });
});

/* ── E9 — minimum tap target for the icon-only back link ───────────────── */

describe("E9 — header back link tap target", () => {
  it('the "Back to resumes" link keeps a >=24px touch target at phone widths', () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    const back = document.body.querySelector<HTMLAnchorElement>(
      'header a[aria-label="Back to resumes"]',
    );
    expect(back, "back link renders in the header").toBeTruthy();
    // jsdom has no layout engine, so assert the padding the 24px math depends
    // on: below sm the text label is hidden, so the box is
    //   14px icon (h-3.5) + py-1.5 (6+6) = 26px tall
    //   14px icon (w-3.5) + px-1.5 (6+6) = 26px wide.
    // M5E browser QA at 390x844 measured 26x22px with py-1 — under the 24px
    // floor — before this fix; a future padding trim must fail here.
    expect(back!.className).toContain("py-1.5");
    expect(back!.className).toContain("px-1.5");

    unmount();
  });
});
