"use strict";

/**
 * M5E — dialog focus management (focused regression tests).
 *
 * D — every dialog on the Choose template → Edit → Customize → Preview →
 *     Review → Export workflow:
 *   D1  TemplateGallery — focus moves in, Tab trapped, the overwrite confirm
 *       owns focus while open, Escape unwinds one layer at a time, focus is
 *       restored to the opener when the gallery closes
 *   D2  FullTemplatePreview — focus in (close), Tab trapped, Escape closes,
 *       focus restored to the opener
 *   D3  SectionManager — focus in on the close button, hide/show is
 *       announced via the polite live region, Tab trapped, Escape closes,
 *       focus restored
 *   D4  VersionHistoryPanel — focus in, Tab trapped, Escape closes, focus
 *       restored; while the restore ConfirmationDialog is present it owns
 *       Escape/Tab (the panel stands down)
 *   D5  GapCorrectionModal — focus in, Tab trapped, Escape closes, restored
 *   D6  ShareResumeModal — focus in, Tab trapped, Escape closes, restored
 *   D7  TailorResumeModal — focus in, Tab trapped, Escape routes through
 *       handleClose (discard confirm still reachable), restored
 *   D8  ConfirmationDialog — confirm action focused after open, Escape
 *       cancels, Tab trapped, focus restored to the opener
 *   D9  ConflictResolutionModal — focus in, z-[9999] container (m5d
 *       contract), Tab trapped, Escape clears the conflict and restores
 *       focus to the opener
 *
 * Dispatching keys on document.body reaches BOTH document- and window-level
 * listeners (capture at window, then bubble document → window).
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

import { TemplateGallery } from "@/components/resume-builder/TemplateGallery";
import { FullTemplatePreview } from "@/components/resume-builder/FullTemplatePreview";
import { SectionManager } from "@/components/resume-builder/SectionManager";
import { VersionHistoryPanel } from "@/components/resume-builder/VersionHistoryPanel";
import { GapCorrectionModal } from "@/components/resume-builder/GapCorrectionModal";
import { ShareResumeModal } from "@/components/resume-builder/ShareResumeModal";
import { TailorResumeModal } from "@/components/resume-builder/TailorResumeModal";
import { ConflictResolutionModal } from "@/components/resume-builder/ConflictResolutionModal";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import {
  renderToContainer,
  click,
  installObserverStubs,
  setFakeScrollHeight,
} from "@/components/resume-builder/__tests__/gallery-test-utils";
import type { Resume } from "@/types/resume";

const RID = "m5e-d";

const FOCUSABLE_SEL =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function seed(): void {
  const resume = {
    ...structuredClone(defaultResume),
    resumeId: RID,
    resumeName: "M5E Resume",
    templateId: "modern-clean",
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+1 (555) 010-0001",
    title: "Analytical Engineer",
    summary: "Mathematician and computing pioneer.",
  } as Resume;
  // A second planner content section (experience) so SectionManager's
  // hide toggles are enabled (`canHide` requires > 1 visible section).
  resume.experience = [
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
  ];
  useResumeBuilder.setState({
    resumes: [resume],
    resume,
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
    writeConflict: null,
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

/** A focusable element outside any dialog, standing in for the real opener. */
function makeOpener(label: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = label;
  document.body.appendChild(btn);
  btn.focus();
  return btn;
}

/**
 * Tab from the last focusable wraps to the first, and Shift+Tab from the
 * first wraps to the last — scoped to the same root the implementation traps
 * (its dialogRef/panelRef, which sits on the role=dialog element).
 */
function expectTrapped(root: HTMLElement): void {
  const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SEL));
  expect(focusables.length, "dialog must expose focusable controls").toBeGreaterThan(1);
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  last.focus();
  pressKey("Tab");
  expect(document.activeElement, "Tab wraps from last → first").toBe(first);

  first.focus();
  pressKey("Tab", { shiftKey: true });
  expect(document.activeElement, "Shift+Tab wraps from first → last").toBe(last);
}

function templateOf(id: string) {
  const t = TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`template ${id} not found`);
  return t;
}

function firstUseButton(): HTMLButtonElement | null {
  for (const card of Array.from(document.body.querySelectorAll("[data-template-id]"))) {
    const b = Array.from(card.querySelectorAll("button")).find(
      (x) => x.textContent?.trim() === "Use This Template",
    );
    if (b) return b as HTMLButtonElement;
  }
  return null;
}

/* ── D1 — TemplateGallery ─────────────────────────────────────────────── */

describe("D1 — TemplateGallery focus management", () => {
  it("focus in, Tab trapped, confirm owns focus, Escape unwinds one layer at a time, opener restored", async () => {
    const onClose = vi.fn();
    const opener = makeOpener("Browse templates");
    const { unmount } = renderToContainer(<TemplateGallery open onClose={onClose} />);
    await flush(20);

    const panel = document.body.querySelector<HTMLElement>(
      '[role="dialog"][aria-labelledby="template-gallery-title"]',
    );
    expect(panel, "gallery dialog").toBeTruthy();
    expect(panel!.getAttribute("aria-modal")).toBe("true");
    const closeBtn = panel!.querySelector<HTMLButtonElement>('button[aria-label="Close"]');
    expect(closeBtn, "gallery close button").toBeTruthy();
    expect(document.activeElement, "focus moves into the gallery").toBe(closeBtn);

    expectTrapped(panel!);

    // Resume has data → selecting a card asks before overwriting.
    const useBtn = firstUseButton();
    expect(useBtn, "Use This Template button").toBeTruthy();
    click(useBtn);

    const confirm = document.body.querySelector<HTMLElement>(
      '[role="dialog"][aria-labelledby="template-gallery-confirm-title"]',
    );
    expect(confirm, "overwrite confirmation").toBeTruthy();
    expect(document.body.textContent).toContain("Switch Template?");
    expect(
      confirm!.contains(document.activeElement),
      "focus moves into the confirmation",
    ).toBe(true);
    expect((document.activeElement as HTMLElement).textContent?.trim()).toBe(
      "Cancel",
    );
    // Tab is trapped inside the confirmation, not the gallery behind it.
    expectTrapped(confirm!);

    // Escape #1 dismisses ONLY the confirmation; focus returns to the
    // gallery's close button instead of dropping to <body>.
    pressKey("Escape");
    expect(onClose, "first Escape must not close the gallery").not.toHaveBeenCalled();
    expect(document.activeElement, "focus back on the gallery close button").toBe(
      closeBtn,
    );

    // Escape #2 closes the gallery itself.
    pressKey("Escape");
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();
    expect(document.activeElement, "opener restored on close").toBe(opener);
  });
});

/* ── D2 — FullTemplatePreview ─────────────────────────────────────────── */

describe("D2 — FullTemplatePreview focus management", () => {
  it("focus in on the close button, Tab trapped, Escape closes, opener restored", async () => {
    const onClose = vi.fn();
    const opener = makeOpener("Open full preview");
    const { unmount } = renderToContainer(
      <FullTemplatePreview
        templateId="minimal-ats"
        templates={[templateOf("minimal-ats"), templateOf("patorbit-modern")]}
        onClose={onClose}
        onUseTemplate={vi.fn()}
      />,
    );
    await flush(20);

    const dialog = document.body.querySelector<HTMLElement>(
      '[data-testid="full-template-preview"]',
    );
    expect(dialog, "preview dialog").toBeTruthy();
    expect(dialog!.getAttribute("role")).toBe("dialog");
    expect(dialog!.getAttribute("aria-modal")).toBe("true");
    const closeBtn = dialog!.querySelector<HTMLButtonElement>('[data-testid="preview-close"]');
    expect(closeBtn, "preview close button").toBeTruthy();
    expect(document.activeElement, "focus moves into the preview").toBe(closeBtn);

    expectTrapped(dialog!);

    pressKey("Escape");
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();
    expect(document.activeElement, "opener restored on close").toBe(opener);
  });
});

/* ── D3 — SectionManager ──────────────────────────────────────────────── */

describe("D3 — SectionManager focus management", () => {
  it("focus in on close, hide/show announced politely, Tab trapped, Escape closes, opener restored", async () => {
    const onClose = vi.fn();
    const opener = makeOpener("Manage sections");
    const r = renderToContainer(<SectionManager open onClose={onClose} />);
    await flush(20);

    const dialog = document.body.querySelector<HTMLElement>(
      '[role="dialog"][aria-label="Section manager"]',
    );
    expect(dialog, "section manager dialog").toBeTruthy();
    expect(dialog!.getAttribute("aria-modal")).toBe("true");
    const closeBtn = dialog!.querySelector<HTMLButtonElement>(
      'button[aria-label="Close section manager"]',
    );
    expect(closeBtn, "close button").toBeTruthy();
    expect(document.activeElement, "focus moves into the dialog").toBe(closeBtn);

    // Hiding a section announces the change through the polite live region.
    const hideBtn = dialog!.querySelector<HTMLButtonElement>('button[aria-label^="Hide "]');
    expect(hideBtn, "hide toggle").toBeTruthy();
    click(hideBtn);
    const nowHidden = dialog!.querySelector<HTMLButtonElement>('button[aria-label^="Show "]');
    expect(nowHidden, "toggle flips to Show").toBeTruthy();
    expect(nowHidden!.getAttribute("aria-pressed")).toBe("true");
    const live = dialog!.querySelector<HTMLElement>('[aria-live="polite"]');
    expect(live, "aria-live announcement region").toBeTruthy();
    expect(live!.textContent).toMatch(/hidden\.$/);

    expectTrapped(dialog!);

    pressKey("Escape");
    expect(onClose).toHaveBeenCalledTimes(1);

    // Closing restores focus to the opener (the "Manage sections" button).
    act(() => {
      r.root.render(<SectionManager open={false} onClose={onClose} />);
    });
    expect(
      document.body.querySelector('[role="dialog"][aria-label="Section manager"]'),
    ).toBeNull();
    expect(document.activeElement, "opener restored on close").toBe(opener);
    r.unmount();
  });
});

/* ── D4 — VersionHistoryPanel ─────────────────────────────────────────── */

describe("D4 — VersionHistoryPanel focus management", () => {
  it("focus in, Tab trapped, restore confirmation owns keys, Escape closes, opener restored", async () => {
    // Two recorded versions → real focusable rows in the list.
    const st = useResumeBuilder.getState();
    act(() => {
      st.captureVersion(RID, "original", "Imported resume");
      st.captureVersion(RID, "edit", "Edited summary", { coalesce: true });
    });

    const onClose = vi.fn();
    const opener = makeOpener("Version history");
    const r = renderToContainer(<VersionHistoryPanel open onClose={onClose} />);
    await flush(20);

    const dialog = document.body.querySelector<HTMLElement>(
      '[role="dialog"][aria-label="Version history"]',
    );
    expect(dialog, "version history dialog").toBeTruthy();
    expect(dialog!.getAttribute("aria-modal")).toBe("true");
    expect(
      document.body.querySelector('[data-testid="version-history-panel"]'),
      "panel testid renders",
    ).toBe(dialog);
    const closeBtn = dialog!.querySelector<HTMLButtonElement>(
      'button[aria-label="Close version history"]',
    );
    expect(closeBtn, "close button").toBeTruthy();
    expect(document.activeElement, "focus moves into the panel").toBe(closeBtn);

    expectTrapped(dialog!);

    // While the restore ConfirmationDialog is on screen IT owns Escape/Tab;
    // the panel stands down so the confirmation can be answered first.
    const fakeConfirm = document.createElement("div");
    fakeConfirm.setAttribute("role", "dialog");
    fakeConfirm.setAttribute("aria-labelledby", "confirm-dialog-title");
    fakeConfirm.innerHTML = "<button>Confirm</button>";
    document.body.appendChild(fakeConfirm);

    pressKey("Escape");
    expect(onClose, "panel must not close under the confirmation").not.toHaveBeenCalled();
    const focusables = Array.from(dialog!.querySelectorAll<HTMLElement>(FOCUSABLE_SEL));
    const last = focusables[focusables.length - 1];
    last.focus();
    pressKey("Tab");
    expect(document.activeElement, "panel trap paused while confirm is open").toBe(last);

    fakeConfirm.remove();

    pressKey("Escape");
    expect(onClose, "Escape closes the panel once the confirm is gone").toHaveBeenCalledTimes(1);

    r.unmount();
    expect(document.activeElement, "opener restored on close").toBe(opener);
  });
});

/* ── D5 — GapCorrectionModal ──────────────────────────────────────────── */

describe("D5 — GapCorrectionModal focus management", () => {
  it("focus in, Tab trapped, Escape closes, opener restored", async () => {
    const onClose = vi.fn();
    const opener = makeOpener("Fix this gap");
    const { unmount } = renderToContainer(
      <GapCorrectionModal
        open
        requirement="Kubernetes"
        defaultKind="certification"
        experienceLabels={["Engineer — Acme"]}
        onClose={onClose}
        onSaved={vi.fn()}
      />,
    );
    await flush(20);

    const dialog = document.body.querySelector<HTMLElement>(
      '[role="dialog"][aria-label="Add this to your profile"]',
    );
    expect(dialog, "gap correction dialog").toBeTruthy();
    expect(dialog!.getAttribute("aria-modal")).toBe("true");
    expect(dialog!.contains(document.activeElement), "focus moves into the dialog").toBe(true);
    expect(document.activeElement!.tagName).toBe("BUTTON");

    expectTrapped(dialog!);

    pressKey("Escape");
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();
    expect(document.activeElement, "opener restored on close").toBe(opener);
  });
});

/* ── D6 — ShareResumeModal ────────────────────────────────────────────── */

describe("D6 — ShareResumeModal focus management", () => {
  it("focus in, Tab trapped, Escape closes, opener restored", async () => {
    const onClose = vi.fn();
    const opener = makeOpener("Share");
    const r = renderToContainer(
      <ShareResumeModal open onClose={onClose} resumeId={RID} resumeName="M5E Resume" />,
    );
    await flush(40); // focus-in timer + share status fetch

    const dialog = document.body.querySelector<HTMLElement>(
      '[role="dialog"][aria-labelledby="share-resume-title"]',
    );
    expect(dialog, "share dialog").toBeTruthy();
    expect(dialog!.getAttribute("aria-modal")).toBe("true");
    expect(dialog!.contains(document.activeElement), "focus moves into the dialog").toBe(true);

    expectTrapped(dialog!);

    pressKey("Escape");
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      r.root.render(
        <ShareResumeModal open={false} onClose={onClose} resumeId={RID} resumeName="M5E Resume" />,
      );
    });
    expect(document.activeElement, "opener restored on close").toBe(opener);
    r.unmount();
  });
});

/* ── D7 — TailorResumeModal ───────────────────────────────────────────── */

describe("D7 — TailorResumeModal focus management", () => {
  it("focus in, Tab trapped, Escape routes through handleClose, opener restored", async () => {
    const onClose = vi.fn();
    const opener = makeOpener("Tailor resume");
    const r = renderToContainer(
      <TailorResumeModal open onClose={onClose} initialJobDescription={undefined} />,
    );
    await flush(30);

    const dialog = document.body.querySelector<HTMLElement>(
      '[role="dialog"][aria-labelledby="tailor-modal-title"]',
    );
    expect(dialog, "tailor dialog").toBeTruthy();
    expect(dialog!.getAttribute("aria-modal")).toBe("true");
    expect(dialog!.contains(document.activeElement), "focus moves into the dialog").toBe(true);

    expectTrapped(dialog!);

    // Step "input", not dirty → handleClose closes directly (no discard prompt).
    pressKey("Escape");
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      r.root.render(
        <TailorResumeModal open={false} onClose={onClose} initialJobDescription={undefined} />,
      );
    });
    expect(document.activeElement, "opener restored on close").toBe(opener);
    r.unmount();
  });
});

/* ── D8 — ConfirmationDialog ──────────────────────────────────────────── */

describe("D8 — ConfirmationDialog focus management", () => {
  it("confirm action focused after open, Escape cancels, Tab trapped, opener restored", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const opener = makeOpener("Delete resume");
    const props = {
      title: "Delete resume?",
      message: "This cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm,
      onCancel,
    };
    const r = renderToContainer(<ConfirmationDialog open {...props} />);
    await flush(60); // confirm button focuses after its 50ms timer

    const dialog = document.body.querySelector<HTMLElement>(
      '[role="dialog"][aria-labelledby="confirm-dialog-title"]',
    );
    expect(dialog, "confirmation dialog").toBeTruthy();
    expect(dialog!.getAttribute("aria-modal")).toBe("true");
    const title = dialog!.querySelector<HTMLElement>("#confirm-dialog-title");
    expect(title?.textContent?.trim()).toBe("Delete resume?");

    const confirmBtn = Array.from(dialog!.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Delete",
    );
    expect(confirmBtn, "confirm action").toBeTruthy();
    expect(document.activeElement, "confirm action receives focus").toBe(confirmBtn);

    expectTrapped(dialog!);

    pressKey("Escape");
    expect(onCancel, "Escape cancels").toHaveBeenCalledTimes(1);
    expect(onConfirm, "Escape never confirms").not.toHaveBeenCalled();

    act(() => {
      r.root.render(<ConfirmationDialog open={false} {...props} />);
    });
    expect(document.activeElement, "opener restored on close").toBe(opener);
    r.unmount();
  });
});

/* ── D9 — ConflictResolutionModal ─────────────────────────────────────── */

describe("D9 — ConflictResolutionModal focus management", () => {
  it("focus in, m5d z-[9999] container present, Tab trapped, Escape clears the conflict and restores focus", async () => {
    const local = {
      ...structuredClone(defaultResume),
      resumeId: RID,
      resumeName: "M5E Resume",
      name: "Ada Lovelace",
      email: "ada@example.com",
      summary: "local edits",
    } as Resume;
    const server = { ...local, summary: "server version" } as Resume;
    act(() => {
      useResumeBuilder.setState({
        writeConflict: {
          resumeId: RID,
          localResume: local,
          serverResume: server,
          serverVersion: 2,
        },
      } as never);
    });

    const opener = makeOpener("Save");
    const { unmount } = renderToContainer(<ConflictResolutionModal />);
    await flush(20);

    // m5d contract: the conflict modal renders above everything.
    expect(document.querySelector('[class*="9999"]'), "z-[9999] container").toBeTruthy();

    const dialog = document.body.querySelector<HTMLElement>(
      '[role="dialog"][aria-labelledby="conflict-resolution-title"]',
    );
    expect(dialog, "conflict dialog").toBeTruthy();
    expect(dialog!.getAttribute("aria-modal")).toBe("true");
    const closeBtn = dialog!.querySelector<HTMLButtonElement>(
      'button[aria-label="Close conflict resolution"]',
    );
    expect(closeBtn, "close button").toBeTruthy();
    expect(document.activeElement, "focus moves into the dialog").toBe(closeBtn);

    expectTrapped(dialog!);

    pressKey("Escape");
    expect(useResumeBuilder.getState().writeConflict, "Escape dismisses the conflict").toBeNull();
    expect(document.activeElement, "opener restored on dismiss").toBe(opener);

    unmount();
  });
});
