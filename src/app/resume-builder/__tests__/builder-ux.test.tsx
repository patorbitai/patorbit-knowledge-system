"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";

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

  it("main Builder header is simplified — no Templates/Customize controls", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    const buttons = Array.from(document.body.querySelectorAll("button"));
    expect(buttons.some((b) => b.textContent?.includes("Templates"))).toBe(false);
    expect(buttons.some((b) => b.textContent?.includes("Customize"))).toBe(false);
    expect(buttons.some((b) => b.textContent?.includes("Choose a template"))).toBe(false);

    // Primary actions kept: Preview link + Profile menu. The dead Settings
    // gear is gone (no implemented feature behind it).
    const previewLink = document.body.querySelector('a[href="/resume-builder/preview"]');
    expect(previewLink).toBeTruthy();
    expect(previewLink?.textContent).toContain("Preview");
    expect(findButton("Settings")).toBeFalsy();
    expect(findButton("Account menu")).toBeTruthy();
    unmount();
  });

  it("Preview workspace is the finalization surface: Resume + Templates + Customize + Export", () => {
    const { unmount } = renderToContainer(<PreviewPage />);

    const text = document.body.textContent ?? "";
    expect(text).toContain("Professional Preview");
    // User's real resume renders in the preview.
    expect(text).toContain("Ada Lovelace");
    expect(text).not.toContain("Jordan Rivera"); // gallery sample never used

    expect(findButtonContaining("Templates")).toBeTruthy();
    expect(findButtonContaining("Customize")).toBeTruthy();
    expect(findButtonContaining("Export")).toBeTruthy();
    unmount();
  });

  it("renders a single-row header with the resume as a contained hero preview", () => {
    seedUser();
    const { unmount } = renderToContainer(<PreviewPage />);

    // Single-row header: back + title + actions.
    const back = document.body.querySelector('a[aria-label="Back to Resume Builder"]');
    expect(back).toBeTruthy();
    expect(document.body.textContent).toContain("Professional Preview");

    // Templates button communicates the current template.
    const templatesBtn = findButtonContaining("Templates");
    expect(templatesBtn?.textContent).toContain("Current:");
    expect(templatesBtn?.textContent).toContain("Modern Clean");

    // Secondary actions + the single primary export action.
    expect(findButtonContaining("Export")).toBeTruthy();
    expect(findButtonContaining("Customize")).toBeTruthy();

    // Subtle save status text (one of the known labels).
    const statusKnown = ["Saved", "Saving…", "Unsaved changes", "Offline", "Save failed"];
    expect(statusKnown.some((t) => document.body.textContent?.includes(t))).toBe(true);

    // Compact secondary navigation, Resume active.
    const nav = document.body.querySelector('nav[aria-label="Preview sections"]');
    expect(nav).toBeTruthy();
    expect(nav?.textContent).toContain("Resume");

    // The resume is the hero: the live contained preview fills the canvas.
    expect(document.querySelector('[data-testid="live-style-preview"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="live-stage"]')).toBeTruthy();
    expect(document.body.textContent).toContain("Ada Lovelace");
    unmount();
  });

  it("Templates button inside Preview opens the visual Template Gallery", () => {
    const { unmount } = renderToContainer(<PreviewPage />);
    expect(document.body.textContent).not.toContain("Choose a Resume Template");

    click(findButtonContaining("Templates"));
    expect(document.body.textContent).toContain("Choose a Resume Template");
    unmount();
  });

  it("Customize button inside Preview opens the live customization workspace with the user's resume", () => {
    const { unmount } = renderToContainer(<PreviewPage />);
    expect(document.querySelector('[data-testid="customize-live-column"]')).toBeNull();

    click(findButtonContaining("Customize"));
    const liveColumn = document.querySelector('[data-testid="customize-live-column"]');
    expect(liveColumn).toBeTruthy();
    expect(liveColumn?.querySelector('[data-testid="live-style-preview"]')).toBeTruthy();
    expect(liveColumn?.textContent).toContain("Ada Lovelace");
    expect(liveColumn?.textContent).not.toContain("Jordan Rivera");
    unmount();
  });

  it("applying a template in the gallery updates the preview immediately and preserves content", () => {
    const { unmount } = renderToContainer(<PreviewPage />);
    click(findButtonContaining("Templates"));

    // The active template's card shows "Current Template", so the first
    // "Use This Template" button belongs to another template.
    click(findButtonContaining("Use This Template"));
    click(findButtonContaining("Apply Template")); // overwrite-confirm dialog

    const id = useResumeBuilder.getState().resume.templateId;
    expect(id).not.toBe("modern-clean");
    // Resume content is preserved; the preview still renders the user's data.
    expect(useResumeBuilder.getState().resume.name).toBe("Ada Lovelace");
    expect(document.body.textContent).toContain("Ada Lovelace");
    unmount();
  });
});
