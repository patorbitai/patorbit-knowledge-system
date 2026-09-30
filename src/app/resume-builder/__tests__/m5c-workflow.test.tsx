"use strict";

/**
 * M5C — Customize / Preview workflow integration (focused tests).
 *
 * F — context preservation (milestone scenarios):
 *   F1  edit → Customize → return → edit state preserved
 *   F2  Edit → Customize → Preview → return → same resume/version/job
 *   F3  Customize → typography/color/layout → Preview reflects it
 *   F6  Template change → Customize → Preview → content preserved
 *   F7  tailored job version stays isolated from the Master Profile
 *   F8  Mobile Edit → Customize → Preview → Edit preserves context
 *   F9  browser back/forward never resets the active resume
 *   F4  Customize → persisted state → refresh → customization persists
 *   (F5 — failed save keeps changes + Retry — lives with the save pipeline
 *    in src/lib/__tests__/m5c-style-save.test.ts)
 *
 * G — accessibility: accessible names, focus management, Escape, keyboard
 *    focus trap, no duplicate accessible names on workflow surfaces.
 *
 * H — analytics: only the four missing milestone events, fired once per
 *    action via the existing typed `track` pipeline.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import React, { act } from "react";

// Same headroom as builder-ux: readable-type pagination builds real sheets.
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

// Same host mocks as builder-ux.test.tsx (builder page render requirements).
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

const RID = "m5c1";

function seed(overrides: Partial<Record<string, unknown>> = {}): void {
  const resume = {
    ...structuredClone(defaultResume),
    resumeId: RID,
    resumeName: "M5C Resume",
    templateId: "modern-clean",
    name: "Ada Lovelace",
    title: "Analytical Engineer",
    email: "ada@example.com",
    summary: "Mathematician and computing pioneer.",
  } as Resume;
  useResumeBuilder.setState({
    resumes: [resume],
    resume, // same reference — the self-healing subscription stays quiet
    activeResumeId: RID,
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
    ...overrides,
  } as never);
}

beforeEach(() => {
  installObserverStubs();
  setFakeScrollHeight(900);
  seed();
  document.body.innerHTML = "";
  trackMock.mockClear();
});

function state() {
  return useResumeBuilder.getState();
}

function exactButtons(text: string): HTMLButtonElement[] {
  return Array.from(document.body.querySelectorAll("button")).filter(
    (b) => b.textContent?.trim() === text,
  ) as HTMLButtonElement[];
}

function openDialog(): Element | null {
  return document.querySelector('[role="dialog"][aria-labelledby="customize-panel-title"]');
}

function pressKey(key: string, init: KeyboardEventInit = {}): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
  });
}

function accessibleName(el: Element): string {
  return (el.getAttribute("aria-label") || el.textContent || "").trim();
}

/* ── F — context preservation ─────────────────────────────────────────── */

describe("F — context preservation", () => {
  it("F1: edit → Customize → return → edit state preserved (in place, no history)", () => {
    const pushSpy = vi.spyOn(window.history, "pushState");
    const replaceSpy = vi.spyOn(window.history, "replaceState");
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    // an in-progress, unsaved edit in the active section
    const edited = { ...state().resume, summary: "UNSAVED M5C EDIT MARKER" };
    useResumeBuilder.setState({ resume: edited, resumes: [edited] });
    const sectionBefore = state().activeSection;

    const opener = findButton("Customize") as HTMLButtonElement;
    expect(opener).toBeTruthy();
    opener.focus();
    click(opener);
    expect(openDialog()).toBeTruthy();

    pressKey("Escape");
    expect(openDialog()).toBeNull();

    const after = state();
    expect(after.resume.summary).toBe("UNSAVED M5C EDIT MARKER");
    expect(after.activeSection).toBe(sectionBefore);
    expect(after.resume.resumeId).toBe(RID);
    // editor chrome still mounted — nothing navigated away
    expect(document.body.textContent).toContain("Profile");
    expect(findButton("Templates")).toBeTruthy();
    expect(pushSpy).not.toHaveBeenCalled();
    expect(replaceSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
    replaceSpy.mockRestore();
    unmount();
  });

  it("F2: Edit → Customize → Preview → return → same resume/version/job context", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    useResumeBuilder.setState({ activeJobApplicationId: "job-9" });

    const edited = { ...state().resume, summary: "M5C F2 MARKER" };
    useResumeBuilder.setState({ resume: edited, resumes: [edited] });

    // Customize in place
    click(findButton("Customize"));
    expect(openDialog()).toBeTruthy();
    pressKey("Escape");
    expect(openDialog()).toBeNull();

    // the single nav entry into the standalone preview is present
    expect(document.body.querySelector('a[aria-label="Open full preview"]')).toBeTruthy();

    // "navigate" to the standalone preview — the store is the shared context
    unmount();
    const preview = renderToContainer(<PreviewPage />);
    expect(document.body.textContent).toContain("Professional Preview");
    expect(document.body.textContent).toContain("Ada Lovelace");
    expect(document.body.textContent).toContain("M5C F2 MARKER");
    preview.unmount();

    // "return" — same resume, version and job context, edit still present
    const back = renderToContainer(<ResumeBuilderPage />);
    const st = state();
    expect(st.resume.summary).toBe("M5C F2 MARKER");
    expect(st.resume.resumeId).toBe(RID);
    expect(st.activeJobApplicationId).toBe("job-9");
    expect(st.versions).toEqual({});
    expect(findButton("Templates")).toBeTruthy();
    back.unmount();
  });

  it("F3: Customize → typography/color/layout → Preview reflects them", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    click(findButton("Customize"));
    expect(openDialog()).toBeTruthy();
    click(findButton("Playfair Display")); // typography
    click(findButton("Emerald")); // color
    click(findButton("Spacious")); // layout/spacing (first tier = section spacing)

    expect(state().styleConfigs[RID]).toMatchObject({
      fontFamily: "playfair",
      accentColor: "#059669",
      sectionSpacing: 32,
    });
    pressKey("Escape");
    unmount();

    const preview = renderToContainer(<PreviewPage />);
    const style = document.querySelector("[data-rs-scope] style");
    expect(style, "customized preview injects its style scope").toBeTruthy();
    expect(style?.textContent).toContain("--rs-accent");
    expect(style?.textContent).toContain("var(--rs-font)");
    preview.unmount();
  });

  it("F6: template change → Customize → Preview → content preserved", () => {
    // template choice via the same store choke point the gallery uses
    state().applyTemplate("sidebar-elegance");
    expect(state().resume.templateId).toBe("sidebar-elegance");

    // the Customize surface over the newly templated resume
    const panel = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    click(findButton("Playfair Display"));
    expect(state().styleConfigs[RID]).toMatchObject({ fontFamily: "playfair" });
    panel.unmount();

    const preview = renderToContainer(<PreviewPage />);
    const st = state();
    // content untouched — only template + style changed
    expect(st.resume.name).toBe("Ada Lovelace");
    expect(st.resume.email).toBe("ada@example.com");
    expect(st.resume.summary).toBe("Mathematician and computing pioneer.");
    expect(st.resume.templateId).toBe("sidebar-elegance");
    expect(document.body.textContent).toContain("Ada Lovelace");
    preview.unmount();
  });

  it("F7: a tailored job version stays isolated from the Master Profile", () => {
    const master = {
      ...structuredClone(defaultResume),
      resumeId: "m_master",
      resumeName: "Master Resume",
      name: "Ada Lovelace",
      summary: "Master summary",
      templateId: "modern-clean",
    } as Resume;
    const tailored = {
      ...master,
      resumeId: "m_tailored",
      resumeName: "Master Resume — Tailored",
      summary: "Tailored summary",
    } as Resume;
    seed({
      resumes: [master, tailored],
      resume: tailored,
      activeResumeId: "m_tailored",
      lineage: {
        m_tailored: {
          sourceResumeId: "m_master",
          sourceResumeName: "Master Resume",
          tailoredAt: 1,
        },
      },
      styleConfigs: { m_master: { fontFamily: "jakarta" } },
    });

    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    // context bar shows the job-version lineage, not the master badge
    expect(document.body.textContent).toContain("derived from");
    expect(document.body.textContent).toContain("Master Resume");

    click(findButton("Customize"));
    click(findButton("Playfair Display"));
    pressKey("Escape");

    const st = state();
    // the tailored version got its own customization…
    expect(st.styleConfigs.m_tailored).toMatchObject({ fontFamily: "playfair" });
    // …while the master's style, document and lineage stay untouched
    expect(st.styleConfigs.m_master).toEqual({ fontFamily: "jakarta" });
    const masterDoc = st.resumes.find((r) => r.resumeId === "m_master") as Resume;
    expect(masterDoc.summary).toBe("Master summary");
    expect(st.lineage).toEqual({
      m_tailored: {
        sourceResumeId: "m_master",
        sourceResumeName: "Master Resume",
        tailoredAt: 1,
      },
    });
    expect(st.versions).toEqual({});
    expect(document.body.textContent).toContain("derived from");
    unmount();
  });

  it("F8: mobile Edit → Customize → Preview → Edit preserves context", () => {
    const pushSpy = vi.spyOn(window.history, "pushState");
    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    const sectionBefore = state().activeSection;

    // Customize reachable from the mobile workflow (same header action)
    const opener = findButton("Customize") as HTMLButtonElement;
    opener.focus();
    click(opener);
    const dialog = openDialog() as HTMLElement;
    expect(dialog).toBeTruthy();
    // full-screen, width-bounded — no horizontal overflow surface
    expect(dialog.className).toContain("w-full");
    expect(dialog.className).toContain("overflow-hidden");
    pressKey("Escape");
    expect(openDialog()).toBeNull();
    expect(document.activeElement).toBe(opener);

    // mobile Preview mode (the LAST exact-"Preview" button is the mobile toggle)
    const previewBtns = exactButtons("Preview");
    expect(previewBtns.length).toBeGreaterThanOrEqual(2);
    click(previewBtns[previewBtns.length - 1]);
    expect(
      document.querySelector('div[class*="md:hidden"][class*="fixed"]'),
      "mobile preview overlay mounted",
    ).toBeTruthy();

    // back to Edit (the LAST exact-"Edit" button is the mobile toggle —
    // earlier matches belong to section affordances like "Edit summary")
    const editBtns = exactButtons("Edit");
    expect(editBtns.length).toBeGreaterThanOrEqual(1);
    click(editBtns[editBtns.length - 1]);
    expect(document.querySelector('div[class*="md:hidden"][class*="fixed"]')).toBeNull();

    const st = state();
    expect(st.resume.resumeId).toBe(RID);
    expect(st.activeSection).toBe(sectionBefore);
    expect(st.resume.summary).toBe("Mathematician and computing pioneer.");
    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
    unmount();
  });

  it("F9: opening Customize/Templates never touches history or the active resume", () => {
    const pushSpy = vi.spyOn(window.history, "pushState");
    const replaceSpy = vi.spyOn(window.history, "replaceState");
    const pathBefore = window.location.pathname;

    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    const before = state();
    const resumeRef = before.resume;

    // Customize opens and closes in place
    click(findButton("Customize"));
    expect(openDialog()).toBeTruthy();
    pressKey("Escape");
    expect(openDialog()).toBeNull();

    // Templates opens in place from the context bar
    click(findButton("Templates"));
    expect(document.body.textContent).toContain("Choose a Resume Template");
    const closeGallery = document.body.querySelector(
      '[aria-label="Close"]',
    ) as HTMLButtonElement;
    expect(closeGallery).toBeTruthy();
    click(closeGallery);

    // no history mutation → browser Back cannot reset the builder
    expect(pushSpy).not.toHaveBeenCalled();
    expect(replaceSpy).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe(pathBefore);

    const after = state();
    expect(after.activeResumeId).toBe(before.activeResumeId);
    expect(after.resume).toBe(resumeRef);
    expect(after.activeSection).toBe(before.activeSection);
    pushSpy.mockRestore();
    replaceSpy.mockRestore();
    unmount();
  });

  it("F4: customization → persisted state → refresh → customization restored", async () => {
    state().setStyleConfig(RID, { fontFamily: "playfair" });
    await new Promise((r) => setTimeout(r, 0)); // let persist settle

    const raw = localStorage.getItem("patorbit-resume-v2");
    expect(raw, "persist key receives the style config").toBeTruthy();
    const persisted = JSON.parse(raw as string);
    expect(persisted.state.styleConfigs[RID]).toMatchObject({ fontFamily: "playfair" });
    expect(persisted.state.activeResumeId).toBe(RID);

    // simulate a refresh: wipe the live map (which also rewrites storage),
    // restore the saved copy a real refresh would read, then rehydrate
    useResumeBuilder.setState({ styleConfigs: {} });
    localStorage.setItem("patorbit-resume-v2", raw as string);
    await useResumeBuilder.persist.rehydrate();
    expect(state().styleConfigs[RID]).toMatchObject({ fontFamily: "playfair" });
    expect(state().resume.name).toBe("Ada Lovelace");
  });
});

/* ── G — accessibility ────────────────────────────────────────────────── */

describe("G — accessibility", () => {
  it("G1: focus moves into the dialog on open; Escape closes and restores focus", async () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    const opener = findButton("Customize") as HTMLButtonElement;
    opener.focus();
    click(opener);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const closeBtn = document.body.querySelector(
      '[aria-label="Close customize panel"]',
    ) as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    expect(document.activeElement).toBe(closeBtn);

    pressKey("Escape");
    expect(openDialog()).toBeNull();
    expect(document.activeElement).toBe(opener);
    unmount();
  });

  it("G2: Tab focus is trapped inside the dialog (wraps both ways)", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    click(findButton("Customize"));
    const dialog = openDialog() as HTMLElement;
    expect(dialog).toBeTruthy();

    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    expect(focusables.length).toBeGreaterThan(1);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    last.focus();
    pressKey("Tab");
    expect(document.activeElement).toBe(first);

    first.focus();
    pressKey("Tab", { shiftKey: true });
    expect(document.activeElement).toBe(last);
    unmount();
  });

  it("G3: no duplicate accessible names on the workflow surfaces", () => {
    const b = renderToContainer(<ResumeBuilderPage />);
    const header = document.body.querySelector("header") as HTMLElement;
    expect(header).toBeTruthy();
    const headerNames = Array.from(header.querySelectorAll("button, a"))
      .map(accessibleName)
      .filter(Boolean);
    expect(new Set(headerNames).size).toBe(headerNames.length);

    // exactly ONE control across the builder is named "Customize"
    const customizeNamed = Array.from(document.body.querySelectorAll("button, a"))
      .map(accessibleName)
      .filter((n) => n === "Customize");
    expect(customizeNamed).toHaveLength(1);
    b.unmount();

    const p = renderToContainer(<PreviewPage />);
    // workflow chrome only — the resume sheet itself may legitimately render
    // the same contact value in multiple places (pre-existing content).
    const previewNames = Array.from(
      document.body.querySelectorAll("button, a"),
    )
      .filter((el) => !el.closest("[data-rs-scope]"))
      .map(accessibleName)
      .filter(Boolean);
    expect(new Set(previewNames).size).toBe(previewNames.length);
    expect(previewNames.filter((n) => n === "Customize")).toHaveLength(1);
    p.unmount();
  });

  it("G4: preview/customize controls expose meaningful labels; Escape closes", () => {
    const p = renderToContainer(<PreviewPage />);
    expect(document.body.querySelector('[aria-label="Back to Builder"]')).toBeTruthy();
    expect(document.body.querySelector('[aria-label="Browse templates"]')).toBeTruthy();
    expect(document.body.querySelector('[aria-label="Customize"]')).toBeTruthy();
    expect(document.body.querySelector('[aria-label="Export resume"]')).toBeTruthy();

    const sidebarOpener = document.body.querySelector(
      '[aria-label="Customize"]',
    ) as HTMLButtonElement;
    sidebarOpener.focus();
    click(sidebarOpener);
    expect(openDialog()).toBeTruthy();
    pressKey("Escape");
    expect(openDialog()).toBeNull();
    expect(document.activeElement).toBe(sidebarOpener);
    p.unmount();

    const b = renderToContainer(<ResumeBuilderPage />);
    expect(document.body.querySelector('a[aria-label="Open full preview"]')).toBeTruthy();
    expect(document.body.querySelector('header [aria-label="Customize"]')).toBeTruthy();
    b.unmount();
  });
});

/* ── H — analytics ────────────────────────────────────────────────────── */

/* Preview-event counting by surface: payload now carries M5F `tailored`
   context, so exact-args assertions alone can no longer prove absence. */
function previewEvents(surface?: string) {
  return trackMock.mock.calls.filter(
    (c) =>
      c[0] === "builder_preview_opened" &&
      (!surface || (c[1] as { surface?: string } | undefined)?.surface === surface),
  );
}

describe("H — analytics (only the four missing events)", () => {
  it("H1: standalone preview reports builder_preview_opened (page)", () => {
    const p = renderToContainer(<PreviewPage />);
    expect(trackMock).toHaveBeenCalledWith("builder_preview_opened", {
      surface: "page",
      tailored: false,
    });
    p.unmount();
  });

  it("H2: right-panel Preview reports once per real surface switch", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    // already in preview mode → clicking the tab again must not re-report
    click(findButton("Preview") as HTMLButtonElement);
    expect(previewEvents("panel")).toHaveLength(0);

    click(findButton("Match") as HTMLButtonElement); // switch away
    const previewBtns = exactButtons("Preview");
    click(previewBtns[0]); // right-panel tab (DOM order: panel before mobile)
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(previewEvents("panel")).toHaveLength(1);
    expect(trackMock).toHaveBeenCalledWith("builder_preview_opened", {
      surface: "panel",
      tailored: false,
    });
    unmount();
  });

  it("H3: mobile Preview toggle reports builder_preview_opened (mobile)", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    const previewBtns = exactButtons("Preview");
    click(previewBtns[previewBtns.length - 1]);
    expect(trackMock).toHaveBeenCalledWith("builder_preview_opened", {
      surface: "mobile",
      tailored: false,
    });
    // One click on the mobile variant must not also fire the panel variant.
    expect(previewEvents("panel")).toHaveLength(0);
    unmount();
  });

  it("H4: opening Customize reports builder_customize_opened exactly once", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);
    click(findButton("Customize"));
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("builder_customize_opened", {
      tailored: false,
    });
    pressKey("Escape"); // closing must not re-report
    expect(trackMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("H5: applying and resetting a customization reports customization_changed", () => {
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    trackMock.mockClear(); // mount already reported builder_customize_opened

    click(findButton("Playfair Display"));
    expect(trackMock).toHaveBeenCalledWith("customization_changed", {
      tailored: false,
    });
    expect(trackMock).toHaveBeenCalledTimes(1);

    trackMock.mockClear();
    click(findButton("Reset to Template Defaults"));
    expect(trackMock).toHaveBeenCalledWith("customization_changed", {
      reset: true,
      tailored: false,
    });
    unmount();
  });

  it("H6: applyTemplate reports builder_template_changed with the template id", () => {
    state().applyTemplate("tech-mono");
    expect(trackMock).toHaveBeenCalledWith("builder_template_changed", {
      templateId: "tech-mono",
      tailored: false,
    });
  });
});
