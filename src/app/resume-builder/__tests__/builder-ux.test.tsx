"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";

// Readable-type pagination builds real multi-page sheets in jsdom; under
// full-suite fork load this suite's 5s default intermittently trips (passes
// standalone). Same headroom as all-templates-export-validation.
vi.setConfig({ testTimeout: 20000, hookTimeout: 20000 });

// AccountMenu (now in the Builder header) needs next-auth's session hook
// and the ThemeProvider context.
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));
vi.mock("@/components/providers/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: "dark", setTheme: vi.fn(), toggleTheme: vi.fn() }),
}));
// The Builder header now renders ImportButton, which uses next/navigation's
// useRouter. Without an AppRouterContext in jsdom this throws, so mock it.
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

import ResumeBuilderPage from "../page";
import PreviewPage from "../preview/page";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import {
  renderToContainer,
  click,
  findButton,
  installObserverStubs,
  setFakeScrollHeight,
} from "@/components/resume-builder/__tests__/gallery-test-utils";

const USER_RESUME = {
  ...defaultResume,
  resumeId: "r1",
  resumeName: "My Resume",
  templateId: "modern-clean",
  name: "Ada Lovelace",
  title: "Analytical Engineer",
  email: "ada@example.com",
  phone: "555-0100",
  summary: "Mathematician and computing pioneer.",
};

function seedUser() {
  useResumeBuilder.setState({
    resumes: [USER_RESUME],
    activeResumeId: "r1",
    resume: USER_RESUME,
    styleConfigs: {},
  });
}

function findButtonContaining(text: string): HTMLButtonElement | null {
  return Array.from(document.body.querySelectorAll("button")).find(
    (b) => b.textContent?.includes(text),
  ) as HTMLButtonElement | null;
}

describe("Builder Preview UX refactor", () => {
  beforeEach(() => {
    installObserverStubs();
    setFakeScrollHeight(900);
    seedUser();
    document.body.innerHTML = "";
  });

  it("builder header: Customize is first-class; ONE Preview nav entry; no header Templates", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    const header = document.body.querySelector("header");
    expect(header).toBeTruthy();

    // M5C §A/§B — Customize is a first-class header action carrying the
    // canonical accessible name "Customize".
    const customizeBtn = header?.querySelector('[aria-label="Customize"]');
    expect(customizeBtn).toBeTruthy();
    expect(customizeBtn?.textContent).toContain("Customize");

    // The header itself never carries Templates or a duplicate Preview entry
    // (Templates lives in the editor context bar; Preview navigation lives
    // inside the preview surface).
    const headerButtons = Array.from(header?.querySelectorAll("button") ?? []);
    expect(headerButtons.some((b) => b.textContent?.includes("Templates"))).toBe(false);
    expect(headerButtons.some((b) => b.textContent?.includes("Choose a template"))).toBe(false);
    expect(header?.querySelector('a[href="/resume-builder/preview"]')).toBeNull();

    // M5C §C — exactly ONE navigation entry to the standalone preview page,
    // inside the right panel's preview surface with a distinct accessible
    // name (never confused with the Preview tab).
    const previewLinks = Array.from(document.body.querySelectorAll('a[href="/resume-builder/preview"]'));
    expect(previewLinks.length).toBe(1);
    expect(previewLinks[0].getAttribute("aria-label")).toBe("Open full preview");

    expect(findButton("Settings")).toBeFalsy();
    expect(findButton("Account menu")).toBeTruthy();
    unmount();
  });

  it("main Builder header renders the Import action", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    // Import lives in the Builder (top header), not on the Overview card.
    expect(document.body.textContent).toContain("Import");
    unmount();
  });

  it("Preview workspace is the finalization surface: Resume + Templates + Customize + Export", () => {
    const { unmount } = renderToContainer(<PreviewPage />);

    const text = document.body.textContent ?? "";
    expect(text).toContain("Professional Preview");
    // User's real resume renders in the preview.
    expect(text).toContain("Ada Lovelace");
    expect(text).not.toContain("Jordan Rivera"); // gallery sample never used

    // M5C §B/§D — Templates and Customize are in-place contextual buttons
    // (no navigation away from the preview), Export stays a button.
    expect(document.body.querySelector('a[href="/templates"]')).toBeNull();
    expect(document.body.querySelector('[aria-label="Browse templates"]')).toBeTruthy();
    expect(document.body.querySelector('[aria-label="Customize"]')).toBeTruthy();
    expect(findButtonContaining("Export")).toBeTruthy();
    unmount();
  });

  it("renders a header with the resume as a contained hero preview", () => {
    seedUser();
    const { unmount } = renderToContainer(<PreviewPage />);

    // Header: back + title + actions.
    const back = document.body.querySelector('a[aria-label="Back to Builder"]');
    expect(back).toBeTruthy();
    expect(document.body.textContent).toContain("Professional Preview");

    // Template name shown in the header.
    expect(document.body.textContent).toContain("Professional");

    // Export button is present.
    expect(findButtonContaining("Export")).toBeTruthy();

    // Subtle save status text (one of the known labels).
    const statusKnown = ["Saved", "Saving…", "Unsaved changes", "Offline", "Save failed"];
    expect(statusKnown.some((t) => document.body.textContent?.includes(t))).toBe(true);

    // The resume is the hero: the live contained preview fills the canvas.
    expect(document.querySelector('[data-testid="live-style-preview"]')).toBeTruthy();
    expect(document.body.textContent).toContain("Ada Lovelace");
    unmount();
  });

  it("Templates button inside Preview opens the gallery in place (no navigation)", () => {
    const { unmount } = renderToContainer(<PreviewPage />);

    // M5C §D — a button opening the existing in-builder TemplateGallery,
    // not a link that leaves the preview.
    expect(document.body.querySelector('a[href="/templates"]')).toBeNull();
    const templatesBtn = document.body.querySelector('[aria-label="Browse templates"]') as HTMLButtonElement;
    expect(templatesBtn).toBeTruthy();

    click(templatesBtn);
    expect(document.body.textContent).toContain("Choose a Resume Template");
    // Still on the preview surface — context intact.
    expect(document.body.textContent).toContain("Professional Preview");
    expect(document.body.textContent).toContain("Ada Lovelace");
    unmount();
  });

  it("Customize button inside Preview opens the customization panel", () => {
    const { unmount } = renderToContainer(<PreviewPage />);

    // M5C §B — canonical accessible name "Customize" (was "Customize style").
    const customizeBtn = document.body.querySelector('[aria-label="Customize"]') as HTMLButtonElement;
    expect(customizeBtn).toBeTruthy();
    expect(customizeBtn.textContent).toContain("Customize");

    click(customizeBtn);
    const dialog = document.querySelector('[role="dialog"][aria-labelledby="customize-panel-title"]');
    expect(dialog).toBeTruthy();
    // Live preview inside the panel still shows the user's resume — context
    // preserved (no navigation happened).
    expect(document.body.textContent).toContain("Ada Lovelace");
    unmount();
  });

  it("opening the gallery in Preview preserves stored content", () => {
    const { unmount } = renderToContainer(<PreviewPage />);

    // Templates opens in place (button, not a link away).
    expect(document.body.querySelector('[aria-label="Browse templates"]')).toBeTruthy();

    // Resume content is preserved in the store
    const resume = useResumeBuilder.getState().resume;
    expect(resume.name).toBe("Ada Lovelace");
    expect(resume.email).toBe("ada@example.com");
    unmount();
  });
});
