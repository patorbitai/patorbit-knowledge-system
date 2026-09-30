"use strict";

/**
 * M5F — analytics audit & hardening (focused regression tests).
 *
 * The four M5 milestone events (M5C §H) are audited end-to-end. Defects
 * found and fixed in M5F:
 *   D1 applyTemplate reported builder_template_changed when re-applying the
 *      ALREADY-ACTIVE template (reachable: hub gallery "Use This Template"
 *      renders on the current card too) — "changed" must mean a change.
 *   D2 the standalone preview page emitted builder_preview_opened twice per
 *      navigation (React StrictMode dev double-effect; dev writes into the
 *      same analytics store as production, so the rows really doubled).
 *   D3 no event carried resume context — master and tailored resumes
 *      collapsed into one lineage/context. Every event now carries a
 *      minimal `tailored` discriminator (lineage first, legacy name
 *      heuristic as fallback). No raw ids: the analytics architecture stays
 *      session-scoped and PII-free.
 *   D4 customization_changed reported no-op re-selections and resets with
 *      nothing stored (false "changed").
 *
 * Coverage (8 areas):
 *   1  template change emits exactly once with the intended context
 *   2  customize open emits exactly once per real open
 *   3  customization change emits appropriately without duplicate or
 *      false emissions
 *   4  preview open emits exactly once for panel / mobile / page paths
 *      (incl. React.StrictMode single-emission)
 *   5  passive render / hydration / programmatic restoration emits nothing
 *   6  tailored vs master resume context is preserved
 *   7  analytics never imply save success and never gate on the network
 *   8  remounts and responsive variants do not duplicate events
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
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

// Same host mocks as builder-ux/m5c (builder page render requirements).
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
import PreviewPage from "../preview/page";
import { CustomizePanel } from "@/components/resume-builder/CustomizePanel";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import {
  renderToContainer,
  click,
  findButton,
  installObserverStubs,
  setFakeScrollHeight,
} from "@/components/resume-builder/__tests__/gallery-test-utils";
import type { Resume } from "@/types/resume";

const MASTER = "m5f-master";
const TAILORED = "m5f-tailored";
const LEGACY = "m5f-legacy";

function makeResume(
  id: string,
  resumeName: string,
  overrides: Partial<Record<string, unknown>> = {},
): Resume {
  return {
    ...structuredClone(defaultResume),
    resumeId: id,
    resumeName,
    templateId: "modern-clean",
    name: "Marcus Green",
    ...overrides,
  } as Resume;
}

type SeedOpts = {
  active?: string;
  resumes?: Resume[];
  lineage?: Record<string, unknown>;
};

function seed(opts: SeedOpts = {}): void {
  const master = opts.resumes?.find((r) => r.resumeId === MASTER) ?? makeResume(MASTER, "M5F Master");
  const resumes = opts.resumes ?? [master];
  const activeId = opts.active ?? MASTER;
  const active = resumes.find((r) => r.resumeId === activeId) ?? resumes[0];
  useResumeBuilder.setState({
    resumes,
    resume: active,
    activeResumeId: active.resumeId,
    saveStatus: "saved",
    versions: {},
    lineage: (opts.lineage ?? {}) as never,
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

/** All recorded calls for one of the four milestone events. */
function eventsOf(name: string): unknown[][] {
  return trackMock.mock.calls.filter((c) => c[0] === name);
}
function propsOf(name: string): unknown[] {
  return eventsOf(name).map((c) => c[1]);
}
function previewEvents(surface?: string): unknown[][] {
  return trackMock.mock.calls.filter(
    (c) =>
      c[0] === "builder_preview_opened" &&
      (!surface || (c[1] as { surface?: string } | undefined)?.surface === surface),
  );
}
function countAll(): number {
  return (
    eventsOf("builder_template_changed").length +
    eventsOf("builder_customize_opened").length +
    eventsOf("customization_changed").length +
    eventsOf("builder_preview_opened").length
  );
}

function exactButtons(text: string): HTMLButtonElement[] {
  return Array.from(document.body.querySelectorAll("button")).filter(
    (b) => b.textContent?.trim() === text,
  ) as HTMLButtonElement[];
}

function pressKey(key: string, init: KeyboardEventInit = {}): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
  });
}

beforeEach(() => {
  installObserverStubs();
  setFakeScrollHeight(900);
  seed();
  document.body.innerHTML = "";
  trackMock.mockClear();
});

/* ── 1 — template change ─────────────────────────────────────────────────── */

describe("T1 — builder_template_changed", () => {
  it("fires exactly once per real change with the intended context", () => {
    act(() => {
      useResumeBuilder.getState().applyTemplate("tech-mono");
    });
    expect(eventsOf("builder_template_changed")).toHaveLength(1);
    expect(propsOf("builder_template_changed")[0]).toEqual({
      templateId: "tech-mono",
      tailored: false,
    });

    // D1 regression — re-applying the ALREADY-ACTIVE template (reachable
    // from the hub gallery's "Use This Template" on the current card) is
    // not a change: no event, and the state write behavior is unchanged.
    act(() => {
      useResumeBuilder.getState().applyTemplate("tech-mono");
    });
    expect(eventsOf("builder_template_changed")).toHaveLength(1);
    expect(useResumeBuilder.getState().resume.templateId).toBe("tech-mono");
    expect(useResumeBuilder.getState().saveStatus).toBe("unsaved");

    // Invalid template id stays silent (M5C contract, unchanged).
    act(() => {
      useResumeBuilder.getState().applyTemplate("not-a-real-template");
    });
    expect(eventsOf("builder_template_changed")).toHaveLength(1);
    expect(useResumeBuilder.getState().resume.templateId).toBe("tech-mono");
  });
});

/* ── 2 — customize open ──────────────────────────────────────────────────── */

describe("T2 — builder_customize_opened", () => {
  it("fires exactly once per real open, never on close or while closed", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    expect(eventsOf("builder_customize_opened")).toHaveLength(0);

    click(findButton("Customize"));
    expect(eventsOf("builder_customize_opened")).toHaveLength(1);
    expect(propsOf("builder_customize_opened")[0]).toEqual({ tailored: false });

    pressKey("Escape"); // close must not re-report
    expect(eventsOf("builder_customize_opened")).toHaveLength(1);

    click(findButton("Customize")); // a real second open reports again — once
    expect(eventsOf("builder_customize_opened")).toHaveLength(2);
    unmount();
  });
});

/* ── 3 — customization change ────────────────────────────────────────────── */

describe("T3 — customization_changed", () => {
  it("fires per observed change; never for no-ops or an empty reset", () => {
    const { unmount } = renderToContainer(
      <CustomizePanel open onClose={() => {}} />,
    );
    // Mount reports exactly the open event and nothing else.
    expect(countAll()).toBe(1);
    expect(eventsOf("builder_customize_opened")).toHaveLength(1);
    trackMock.mockClear();

    // Reset with nothing stored → no state change → no event (D4).
    click(findButton("Reset to Template Defaults"));
    expect(eventsOf("customization_changed")).toHaveLength(0);

    // A real change reports exactly once.
    click(findButton("Playfair Display"));
    expect(eventsOf("customization_changed")).toHaveLength(1);
    expect(propsOf("customization_changed")[0]).toEqual({ tailored: false });

    // Re-picking the value the control already has → same config → no
    // false "changed" (D4).
    click(findButton("Playfair Display"));
    expect(eventsOf("customization_changed")).toHaveLength(1);

    // Now a config IS stored → reset is a real change and reports with
    // the reset discriminator.
    click(findButton("Reset to Template Defaults"));
    expect(eventsOf("customization_changed")).toHaveLength(2);
    expect(propsOf("customization_changed")[1]).toEqual({
      reset: true,
      tailored: false,
    });
    unmount();
  });
});

/* ── 4 — preview open, per path ──────────────────────────────────────────── */

describe("T4 — builder_preview_opened paths", () => {
  it("panel path: one event per real switch, none for a re-click", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    // Already in preview → re-click must not report.
    click(findButton("Preview") as HTMLButtonElement);
    expect(previewEvents("panel")).toHaveLength(0);

    click(findButton("Match") as HTMLButtonElement); // switch away
    const previewBtns = exactButtons("Preview");
    click(previewBtns[0]); // right-panel tab
    expect(previewEvents()).toHaveLength(1);
    expect(propsOf("builder_preview_opened")[0]).toEqual({
      surface: "panel",
      tailored: false,
    });
    unmount();
  });

  it("mobile path: one event, and the desktop variant stays silent", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    const previewBtns = exactButtons("Preview");
    click(previewBtns[previewBtns.length - 1]); // mobile toggle
    expect(previewEvents("mobile")).toHaveLength(1);
    expect(previewEvents("panel")).toHaveLength(0);
    expect(propsOf("builder_preview_opened")[0]).toEqual({
      surface: "mobile",
      tailored: false,
    });
    unmount();
  });

  it("page path: exactly one per navigation, even under React.StrictMode", () => {
    // D2 regression — StrictMode runs mount effects twice in dev; the
    // unguarded effect used to write 2 rows per navigation.
    const first = renderToContainer(
      <React.StrictMode>
        <PreviewPage />
      </React.StrictMode>,
    );
    expect(previewEvents()).toHaveLength(1);
    expect(propsOf("builder_preview_opened")[0]).toEqual({
      surface: "page",
      tailored: false,
    });
    first.unmount();

    // A REAL remount (user navigates away and back) still reports — once.
    const second = renderToContainer(
      <React.StrictMode>
        <PreviewPage />
      </React.StrictMode>,
    );
    expect(previewEvents()).toHaveLength(2);
    second.unmount();
  });
});

/* ── 5 — passive render / hydration / initialization ─────────────────────── */

describe("T5 — no events for passive work", () => {
  it("mounting the builder and the closed panel emits none of the four", async () => {
    const page = renderToContainer(<ResumeBuilderPage />);
    // Flush mount effects (hydration-adjacent work) a few times.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(countAll()).toBe(0);

    const panel = renderToContainer(<CustomizePanel open={false} onClose={() => {}} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(countAll()).toBe(0);
    panel.unmount();
    page.unmount();
  });

  it("programmatic state restoration (style-config copy) stays silent", () => {
    // Same call TailorResumeModal makes when deriving a tailored resume:
    // a programmatic config write is not a user customization action.
    act(() => {
      useResumeBuilder.getState().setStyleConfig(MASTER, { fontFamily: "jakarta" });
    });
    expect(eventsOf("customization_changed")).toHaveLength(0);
    expect(countAll()).toBe(0);
  });
});

/* ── 6 — tailored vs master context ──────────────────────────────────────── */

describe("T6 — tailored/master context preserved", () => {
  it("store-level: lineage wins, legacy name heuristic as fallback", () => {
    const master = makeResume(MASTER, "M5F Master");
    // Lineage present but a NON-tailored display name → still tailored.
    const byLineage = makeResume(TAILORED, "Job Version");
    // Legacy tailored resume pre-dating lineage records → name heuristic.
    const byName = makeResume(LEGACY, "Old Version — Tailored");
    seed({
      resumes: [master, byLineage, byName],
      active: MASTER,
      lineage: {
        [TAILORED]: {
          sourceResumeId: MASTER,
          sourceResumeName: "M5F Master",
          tailoredAt: 1,
        },
      },
    });

    act(() => useResumeBuilder.getState().applyTemplate("classic-serif"));
    expect(propsOf("builder_template_changed")[0]).toEqual({
      templateId: "classic-serif",
      tailored: false,
    });

    act(() => {
      useResumeBuilder.setState({
        activeResumeId: TAILORED,
        resume: byLineage,
      } as never);
    });
    act(() => useResumeBuilder.getState().applyTemplate("minimal-edge"));
    expect(propsOf("builder_template_changed")[1]).toEqual({
      templateId: "minimal-edge",
      tailored: true,
    });

    act(() => {
      useResumeBuilder.setState({
        activeResumeId: LEGACY,
        resume: byName,
      } as never);
    });
    act(() => useResumeBuilder.getState().applyTemplate("tech-mono"));
    expect(propsOf("builder_template_changed")[2]).toEqual({
      templateId: "tech-mono",
      tailored: true,
    });
  });

  it("UI-level: customize and preview events carry the active context", () => {
    const master = makeResume(MASTER, "M5F Master");
    const tailoredResume = makeResume(TAILORED, "Frontend Engineer — Tailored");
    seed({
      resumes: [master, tailoredResume],
      active: TAILORED,
      lineage: {
        [TAILORED]: {
          sourceResumeId: MASTER,
          sourceResumeName: "M5F Master",
          tailoredAt: 1,
        },
      },
    });

    // Customize open + change on the tailored resume.
    const panel = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    expect(propsOf("builder_customize_opened")[0]).toEqual({ tailored: true });
    click(findButton("Playfair Display"));
    expect(propsOf("customization_changed")[0]).toEqual({ tailored: true });
    panel.unmount();

    // Standalone preview page on the tailored resume.
    trackMock.mockClear();
    const preview = renderToContainer(<PreviewPage />);
    expect(propsOf("builder_preview_opened")[0]).toEqual({
      surface: "page",
      tailored: true,
    });
    preview.unmount();

    // Builder panel path on the tailored resume.
    trackMock.mockClear();
    const page = renderToContainer(<ResumeBuilderPage />);
    click(findButton("Match") as HTMLButtonElement);
    const previewBtns = exactButtons("Preview");
    click(previewBtns[0]);
    expect(propsOf("builder_preview_opened")[0]).toEqual({
      surface: "panel",
      tailored: true,
    });
    page.unmount();
  });
});

/* ── 7 — no persistence implication, network independence ────────────────── */

describe("T7 — analytics describe actions, not saves", () => {
  it("payloads never imply save success and emission ignores connectivity", () => {
    seed();
    // Truthful M5B state: the last save FAILED.
    act(() => {
      useResumeBuilder.setState({ saveStatus: "sync-failed" } as never);
    });
    const onLineDesc = Object.getOwnPropertyDescriptor(navigator, "onLine");
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    try {
      // Panel interactions happen while the template still exposes font
      // controls (tech-mono does not); the template change follows.
      const panel = renderToContainer(<CustomizePanel open onClose={() => {}} />);
      click(findButton("Playfair Display"));
      act(() => {
        useResumeBuilder.getState().applyTemplate("classic-serif");
      });

      // All three events emitted while offline and while the save state
      // is a FAILURE — emission never waits for, or implies, persistence.
      expect(eventsOf("builder_template_changed")).toHaveLength(1);
      expect(eventsOf("builder_customize_opened")).toHaveLength(1);
      expect(eventsOf("customization_changed")).toHaveLength(1);

      // Exact payload allow-list: context only, no save/persistence keys.
      const allowed = new Set(["templateId", "tailored", "surface", "reset"]);
      for (const [, props] of trackMock.mock.calls) {
        for (const key of Object.keys((props ?? {}) as Record<string, unknown>)) {
          expect(allowed.has(key), `unexpected payload key: ${key}`).toBe(true);
        }
      }
      // The store's save state is untouched by the events themselves and
      // can never be "saved" here: applyTemplate writes "unsaved" and the
      // failing save remains observable as-is (M5B truthfulness preserved).
      expect(useResumeBuilder.getState().saveStatus).not.toBe("saved");
      panel.unmount();
    } finally {
      if (onLineDesc) Object.defineProperty(navigator, "onLine", onLineDesc);
      else delete (navigator as unknown as Record<string, unknown>).onLine;
    }
  });
});

/* ── 8 — remount / responsive no-duplicates ──────────────────────────────── */

describe("T8 — remounts and responsive variants", () => {
  it("a fresh mount after unmount re-emits nothing passive", () => {
    const first = renderToContainer(<ResumeBuilderPage />);
    first.unmount();
    trackMock.mockClear();

    const second = renderToContainer(<ResumeBuilderPage />);
    expect(countAll()).toBe(0); // remount with a closed panel stays silent
    second.unmount();
  });

  it("StrictMode page: one customize open reports exactly once", () => {
    const { unmount } = renderToContainer(
      <React.StrictMode>
        <ResumeBuilderPage />
      </React.StrictMode>,
    );
    trackMock.mockClear();
    click(findButton("Customize"));
    expect(eventsOf("builder_customize_opened")).toHaveLength(1);
    pressKey("Escape");
    expect(eventsOf("builder_customize_opened")).toHaveLength(1);
    unmount();
  });

  it("both responsive Preview variants coexist; one action fires one handler", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    // Both variants are in the DOM at every viewport (responsive CSS decides
    // which is clickable) — a single click must produce a single event.
    const previewBtns = exactButtons("Preview");
    expect(previewBtns.length).toBeGreaterThanOrEqual(2);

    click(findButton("Match") as HTMLButtonElement);
    trackMock.mockClear();
    click(previewBtns[0]); // desktop panel variant
    expect(previewEvents()).toHaveLength(1);
    expect(previewEvents("mobile")).toHaveLength(0);

    // Switch the mobile variant too (fresh state below): still one event.
    const mobileBtns = exactButtons("Preview");
    click(mobileBtns[mobileBtns.length - 1]);
    expect(previewEvents()).toHaveLength(2);
    expect(previewEvents("mobile")).toHaveLength(1);
    unmount();
  });
});
