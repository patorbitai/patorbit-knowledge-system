"use strict";

/**
 * M5G — mobile polish.
 *
 * D1  the mobile mode toggle sat at z-[60], floating OVER the z-50 modals
 *     (template gallery / export / history) and stealing their taps; it now
 *     renders at z-40 — above main content and the z-30 mobile overlays,
 *     below every modal.
 * D2  MobilePreview scaled the sheet from window.innerWidth, but the scroller
 *     is narrower than the window (vertical scrollbar/padding), so the sheet
 *     overflowed its container and scrolled sideways; scale now clamps to the
 *     measured container width.
 * D3  TemplateGallery's fixed w-44 category rail squeezed the template grid
 *     to ~104–124px at 375/390; below md it becomes a wrapping chip row and
 *     the grid gets the full width (desktop rail unchanged).
 * D5  tiny tap targets: profile links (17px), Edit summary (21px),
 *     Improve summary (17px), section collapse heading (18px) gain
 *     padding-only hit area.
 * D7  the horizontally scrolling section strip left the active chip
 *     off-screen (Portfolio at left=818 in a 768px nav); it now centers the
 *     active chip whenever the active section changes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";

// Same headroom as builder-ux/m5c/m5e: the shell renders real preview sheets.
vi.setConfig({ testTimeout: 20000, hookTimeout: 20000 });

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
  trackOnce: vi.fn(),
  trackEvent: vi.fn(),
  trackPreviewOpened: vi.fn(),
  isTrackedEvent: () => true,
  buildFunnelReport: vi.fn(() => ({ total: 0, events: [] })),
  FUNNEL_EVENTS: [] as string[],
  WORKFLOW_EVENTS: [] as string[],
  WORKFLOW_SET: new Set<string>(),
  ALL_EVENTS: new Set<string>(),
}));

// Same host mocks as m5e-a11y / m5c-workflow (builder page render requirements).
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
import MobileSectionNav from "@/components/resume-builder/MobileSectionNav";
import { MobilePreview } from "@/components/resume-builder/MobilePreview";
import { TemplateGallery } from "@/components/resume-builder/TemplateGallery";
import { PersonalSection } from "@/components/resume-builder/sections/PersonalSection";
import { SectionCard } from "@/components/resume-builder/section-card";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { A4 } from "@/lib/resume-design-system/geometry";
import {
  renderToContainer,
  click,
  installObserverStubs,
  setFakeScrollHeight,
} from "@/components/resume-builder/__tests__/gallery-test-utils";
import type { Resume } from "@/types/resume";

const SUMMARY =
  "Platform engineer who ships reliable systems with clear tradeoffs.";

function seed(): void {
  const a = {
    ...structuredClone(defaultResume),
    resumeId: "m5g-a",
    resumeName: "My Resume",
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
  } as Resume;
  useResumeBuilder.setState({
    resumes: [a],
    resume: a, // same reference — the self-healing subscription stays quiet
    activeResumeId: "m5g-a",
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
    previewJobAware: false,
    activeSection: "personal",
    hydrated: true,
    hydratingFromServer: false,
    writeConflict: null,
    analysis: null,
    lastSaveError: null,
  });
}

beforeEach(() => {
  installObserverStubs();
  setFakeScrollHeight(900);
  seed();
  document.body.innerHTML = "";
  // jsdom has no matchMedia; components fall back to "not mobile".
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  // Any autosave/share network chatter is irrelevant here.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => ({}) })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function pressedButtons(text: string): HTMLButtonElement[] {
  return Array.from(
    document.body.querySelectorAll<HTMLButtonElement>("button[aria-pressed]"),
  ).filter((b) => b.textContent?.trim() === text);
}

/* ── D1 — toggle z-order ───────────────────────────────────────────────── */

describe("M5G D1 — mobile mode toggle never floats over modals", () => {
  it("renders at z-40 (below z-50 modals), still md:hidden and above content", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    const editToggle = pressedButtons("Edit")[0];
    expect(editToggle, "mobile Edit toggle").toBeTruthy();
    const bar = editToggle.parentElement as HTMLElement;

    // Below TemplateGallery/Export/History/Tailor (z-50) …
    expect(bar.className).toContain("z-40");
    expect(bar.className).not.toContain("z-[60]");
    // … above the main scroll area and the z-30 mobile overlays, still
    // hidden from desktop — this is the exact wrapper the m5e E2 test
    // locates via `md:hidden`.
    expect(bar.className).toContain("md:hidden");
    expect(bar.className).toContain("relative");
    expect(
      Array.from(bar.querySelectorAll("button[aria-pressed]")),
      "still hosts the 3 mode buttons",
    ).toHaveLength(3);

    unmount();
  });
});

/* ── D2 — preview scale clamps to the container ────────────────────────── */

describe("M5G D2 — MobilePreview fits the sheet inside its scroller", () => {
  it("sheet width never exceeds the measured container width", () => {
    // The audit found the scroller at 374px client width at a 390px
    // viewport; the window-based scale produced a 390px sheet that was
    // clipped left and horizontally scrollable.
    const DESC = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "clientWidth",
    );
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get: () => 374,
    });
    try {
      const { container, unmount } = renderToContainer(<MobilePreview />);

      const scroller = container.querySelector(
        '[data-testid="mobile-preview"] .overflow-auto',
      );
      expect(scroller, "preview scroller").not.toBeNull();
      const sheet = scroller!.firstElementChild as HTMLElement;
      expect(sheet.style.width, "sheet width from A4 × scale").toBeTruthy();

      const width = parseFloat(sheet.style.width);
      expect(width).toBeLessThanOrEqual(374 + 0.001);
      expect(width).toBeGreaterThan(300); // still usefully large
      // Sanity: scale stayed within the documented 0.35–0.65 band.
      expect(width / A4.widthPx).toBeGreaterThanOrEqual(0.35);
      expect(width / A4.widthPx).toBeLessThanOrEqual(0.65);

      expect(container.textContent).toContain("A4 Preview");
      unmount();
    } finally {
      if (DESC) {
        Object.defineProperty(HTMLElement.prototype, "clientWidth", DESC);
      }
    }
  });
});

/* ── D3 — gallery category rail ────────────────────────────────────────── */

describe("M5G D3 — TemplateGallery category rail on small screens", () => {
  it("wraps the rail as a chip row below md while keeping the desktop rail", () => {
    const { container, unmount } = renderToContainer(
      <TemplateGallery open onClose={() => {}} />,
    );

    const browse = Array.from(container.querySelectorAll("p")).find(
      (p) => p.textContent === "Browse",
    );
    expect(browse, "rail heading").toBeTruthy();
    const rail = browse!.parentElement as HTMLElement;

    // Mobile: full-width wrapping chip row (no fixed w-44 column eating the grid).
    expect(rail.className).toContain("flex-wrap");
    expect(rail.className).toContain("w-full");
    // Desktop: the original 176px vertical rail, unchanged.
    expect(rail.className).toContain("md:w-44");
    expect(rail.className).toContain("md:block");
    expect(rail.className).toContain("md:border-r");
    // The "Browse" label only shows in the desktop rail.
    expect(browse!.className).toContain("hidden md:block");
    // Main area stacks below md, rows at md+.
    const main = rail.parentElement as HTMLElement;
    expect(main.className).toContain("flex-col md:flex-row");

    // Categories remain present and functional in the DOM at every width.
    const cats = Array.from(
      rail.querySelectorAll<HTMLButtonElement>('button[aria-pressed]'),
    );
    expect(cats.length).toBeGreaterThan(3);
    expect(cats[0].getAttribute("aria-pressed")).toBe("true");
    click(cats[2]);
    expect(cats[2].getAttribute("aria-pressed")).toBe("true");
    expect(cats[0].getAttribute("aria-pressed")).toBe("false");

    unmount();
  });
});

/* ── D5 — tap targets ──────────────────────────────────────────────────── */

describe("M5G D5 — touch targets carry padding-only hit area", () => {
  it("profile links, Edit summary, and Improve summary reach comfortable heights", () => {
    const { container, unmount } = renderToContainer(<PersonalSection />);

    const link = container.querySelector('a[href*="linkedin"]');
    expect(link, "profile social link").not.toBeNull();
    expect(link!.className).toContain("py-1");

    const edit = container.querySelector('button[aria-label="Edit summary"]');
    expect(edit, "summary edit affordance").not.toBeNull();
    expect(edit!.className).toContain("py-1.5");

    const improve = Array.from(container.querySelectorAll("button")).find(
      (b) => (b.textContent || "").includes("Improve summary"),
    );
    expect(improve, "AI summary action").toBeTruthy();
    expect(improve!.className).toContain("py-1.5");

    // Padding only — the M5A discoverability contract is untouched.
    expect(edit!.textContent).toContain("Edit");
    expect(improve).not.toBe(edit);

    unmount();
  });

  it("section collapse heading grows its hit area without moving layout", () => {
    const { container, unmount } = renderToContainer(
      <SectionCard id="sec-m5g" title="Profile" description="" icon="">
        body
      </SectionCard>,
    );
    const btn = container.querySelector('button[aria-label="Collapse Profile"]');
    expect(btn, "collapse toggle").not.toBeNull();
    expect(btn!.className).toContain("py-1");
    // Negative margin keeps the row metrics identical (py-3 absorbs it).
    expect(btn!.className).toContain("-my-1");
    unmount();
  });
});

/* ── D7 — active chip scrolled into view ───────────────────────────────── */

describe("M5G D7 — section strip keeps the active chip visible", () => {
  it("centers the active chip in the scroller when the strip overflows", () => {
    const { container, unmount } = renderToContainer(<MobileSectionNav />);
    const nav = container.querySelector("nav") as HTMLElement;
    expect(nav.className).toContain("overflow-x-auto");
    expect(nav.getAttribute("aria-label")).toBe("Resume sections");

    // jsdom has no layout — replay the geometry measured in the audit at
    // 768px: the strip is 768 wide and the Portfolio chip sits at left=818
    // (i.e. fully off-screen until the fix).
    Object.defineProperty(nav, "clientWidth", {
      value: 768,
      configurable: true,
    });
    Object.defineProperty(nav, "scrollLeft", {
      value: 0,
      writable: true,
      configurable: true,
    });
    nav.getBoundingClientRect = () =>
      ({ left: 0, right: 768, width: 768, top: 0, bottom: 43, height: 43, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    const portfolio = Array.from(nav.querySelectorAll("button")).find((b) =>
      (b.textContent || "").includes("Portfolio"),
    );
    expect(portfolio, "Portfolio chip").toBeTruthy();
    Object.defineProperty(portfolio!, "offsetWidth", {
      value: 90,
      configurable: true,
    });
    portfolio!.getBoundingClientRect = () =>
      ({ left: 818, right: 908, width: 90, top: 0, bottom: 43, height: 43, x: 818, y: 0, toJSON: () => ({}) }) as DOMRect;

    click(portfolio!);
    expect(useResumeBuilder.getState().activeSection).toBe("portfolio");
    expect(portfolio!.getAttribute("aria-current")).toBe("step");

    // Centered: scrollLeft = 818 − (768 − 90) / 2 = 479, clamped ≥ 0.
    expect(nav.scrollLeft).toBe(479);
    // …which puts the chip fully inside the visible window.
    expect(nav.scrollLeft).toBeLessThanOrEqual(818);
    expect(nav.scrollLeft + 768).toBeGreaterThanOrEqual(908);

    unmount();
    useResumeBuilder.setState({ activeSection: "personal" });
  });
});
