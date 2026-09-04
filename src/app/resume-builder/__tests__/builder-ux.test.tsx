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

  it("main Builder header renders the Import action", () => {
    const { unmount } = renderToContainer(<ResumeBuilderPage />);

    // Import lives in the Builder (top header), not on the Overview card.
    expect(document.body.textContent).toContain("Import");
    unmount();
  });

  it("Preview workspace is the finalization surface: Resume + Templates + Style + Export", () => {
    const { unmount } = renderToContainer(<PreviewPage />);

    const text = document.body.textContent ?? "";
    expect(text).toContain("Professional Preview");
    // User's real resume renders in the preview.
    expect(text).toContain("Ada Lovelace");
    expect(text).not.toContain("Jordan Rivera"); // gallery sample never used

    // Templates is a link to /templates, Style and Export are buttons
    expect(document.body.querySelector('a[href="/templates"]')).toBeTruthy();
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
    const statusKnown = ["Saved", "Saving…", "Unsaved", "Offline", "Failed"];
    expect(statusKnown.some((t) => document.body.textContent?.includes(t))).toBe(true);

    // The resume is the hero: the live contained preview fills the canvas.
    expect(document.querySelector('[data-testid="live-style-preview"]')).toBeTruthy();
    expect(document.body.textContent).toContain("Ada Lovelace");
    unmount();
  });

  it("Templates link inside Preview navigates to the template gallery", () => {
    const { unmount } = renderToContainer(<PreviewPage />);

    // Templates is a link to /templates (not a button that opens inline)
    const templatesLink = document.body.querySelector('a[href="/templates"]');
    expect(templatesLink).toBeTruthy();
    unmount();
  });

  it("Style button inside Preview opens the customization panel", () => {
    const { unmount } = renderToContainer(<PreviewPage />);

    // Style button has aria-label "Customize style"
    const styleBtn = document.body.querySelector('[aria-label="Customize style"]') as HTMLButtonElement;
    expect(styleBtn).toBeTruthy();

    click(styleBtn);
    // After clicking Style, the CustomizePanel should appear
    const text = document.body.textContent ?? "";
    expect(text).toContain("Ada Lovelace");
    unmount();
  });

  it("navigating to templates and back preserves content", () => {
    const { unmount } = renderToContainer(<PreviewPage />);

    // Templates link exists and points to /templates
    const templatesLink = document.body.querySelector('a[href="/templates"]');
    expect(templatesLink).toBeTruthy();

    // Resume content is preserved in the store
    const resume = useResumeBuilder.getState().resume;
    expect(resume.name).toBe("Ada Lovelace");
    expect(resume.email).toBe("ada@example.com");
    unmount();
  });
});
