"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { CustomizePanel } from "../CustomizePanel";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { renderToContainer, click, findButton, installObserverStubs, setFakeScrollHeight } from "./gallery-test-utils";

function seedStore(templateId = "modern-clean") {
  useResumeBuilder.setState({
    resumes: [{ ...defaultResume, resumeId: "r1", resumeName: "My Resume", templateId }],
    activeResumeId: "r1",
    resume: { ...defaultResume, resumeId: "r1", resumeName: "My Resume", templateId },
    styleConfigs: {},
  });
}

function seedPopulated(templateId = "modern-clean") {
  const resume = {
    ...defaultResume,
    resumeId: "r1",
    resumeName: "My Resume",
    templateId,
    name: "Ada Lovelace",
    title: "Analytical Engineer",
    email: "ada@example.com",
    summary: "Mathematician and computing pioneer.",
  };
  useResumeBuilder.setState({ resumes: [resume], activeResumeId: "r1", resume, styleConfigs: {} });
}

function panelText(): string {
  return document.body.textContent ?? "";
}

describe("CustomizePanel", () => {
  beforeEach(() => {
    installObserverStubs();
    setFakeScrollHeight(900);
    seedStore();
    document.body.innerHTML = "";
  });

  it("renders all customization sections for a standard template", () => {
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    const text = panelText();
    expect(text).toContain("Font family");
    expect(text).toContain("Font size");
    expect(text).toContain("Line height");
    expect(text).toContain("Accent color");
    expect(text).toContain("Heading color");
    expect(text).toContain("Same as accent");
    expect(text).toContain("Dark/ink");
    expect(text).toContain("Body text color");
    // Accent presets render as aria-labelled swatches.
    for (const name of ["Patorbit Blue", "Navy", "Slate", "Emerald", "Burgundy", "Black"]) {
      expect(findButton(name)).toBeTruthy();
    }
    expect(text).toContain("Heading style");
    expect(text).toContain("Heading weight");
    expect(text).toContain("Semibold");
    expect(text).toContain("Bullet style");
    expect(text).toContain("Bullet size");
    expect(text).toContain("Density");
    expect(text).toContain("Page margin");
    unmount();
  });

  it("hides options the current template does not support", () => {
    seedStore("sidebar-elegance");
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    expect(panelText()).not.toContain("Page margin");
    unmount();

    seedStore("tech-mono");
    const mono = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    expect(panelText()).not.toContain("Font family");
    expect(panelText()).not.toContain("Accent color");
    expect(panelText()).not.toContain("Heading style");
    mono.unmount();

    seedStore("dark-elegance");
    const dark = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    expect(panelText()).not.toContain("Body text color");
    dark.unmount();
  });

  it("updates the store immediately when a font is chosen", () => {
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    click(findButton("Playfair Display"));
    const cfg = useResumeBuilder.getState().styleConfigs["r1"];
    expect(cfg?.fontFamily).toBe("playfair");
    unmount();
  });

  it("applies heading weight and bullet size immediately", () => {
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    click(findButton("Semibold"));
    expect(useResumeBuilder.getState().styleConfigs["r1"]?.headingWeight).toBe("semibold");
    click(findButton("Small"));
    expect(useResumeBuilder.getState().styleConfigs["r1"]?.bulletSize).toBe("small");
    unmount();
  });

  it("applies density presets to both section and entry spacing", () => {
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    click(findButton("Compact"));
    const cfg = useResumeBuilder.getState().styleConfigs["r1"];
    expect(cfg?.density).toBe("compact");
    expect(cfg?.sectionSpacing).toBe(16);
    expect(cfg?.entrySpacing).toBe(8);
    unmount();
  });

  it("exposes curated spacing tiers (Tight / Normal / Spacious, Narrow / Wide)", () => {
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    const text = panelText();
    expect(text).toContain("Section spacing");
    expect(text).toContain("Entry spacing");
    expect(text).toContain("Page margins");
    for (const label of ["Tight", "Normal", "Spacious", "Narrow", "Wide"]) {
      expect(findButton(label)).toBeTruthy();
    }
    unmount();
  });

  it("applies spacing tier selections to the store immediately", () => {
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    // First "Spacious" button is the Section spacing tier.
    click(findButton("Spacious"));
    expect(useResumeBuilder.getState().styleConfigs["r1"]?.sectionSpacing).toBe(32);
    // "Wide" is unique to the Page margins tier.
    click(findButton("Wide"));
    expect(useResumeBuilder.getState().styleConfigs["r1"]?.pageMargin).toBe(48);
    unmount();
  });

  it("applies accent color swatch selections", () => {
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    click(findButton("Emerald"));
    expect(useResumeBuilder.getState().styleConfigs["r1"]?.accentColor).toBe("#059669");
    unmount();
  });

  it("supports 'Same as accent' and 'Dark/ink' heading colors", () => {
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    // Default (native) heading color is the ink sentinel.
    expect(useResumeBuilder.getState().styleConfigs["r1"]).toBeUndefined();

    click(findButton("Same as accent"));
    expect(useResumeBuilder.getState().styleConfigs["r1"]?.headingColor).toBe("accent");

    click(findButton("Dark/ink"));
    expect(useResumeBuilder.getState().styleConfigs["r1"]?.headingColor).toBe("#0f172a");
    unmount();
  });

  it("Reset to Template Defaults clears the per-resume override", () => {
    useResumeBuilder.getState().setStyleConfig("r1", { fontFamily: "playfair", accentColor: "#7c3aed" });
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    click(findButton("Reset to Template Defaults"));
    expect(useResumeBuilder.getState().styleConfigs["r1"]).toBeUndefined();
    unmount();
  });

  it("is a true full-screen fixed modal constrained to 100dvh with no backdrop layer", () => {
    seedPopulated();
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);

    const dialog = document.querySelector('[role="dialog"][aria-labelledby="customize-panel-title"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.className).toContain("fixed");
    expect(dialog?.className).toContain("inset-0");
    expect(dialog?.className).toContain("h-[100dvh]");
    expect(dialog?.className).toContain("w-full");
    expect(dialog?.className).toContain("overflow-hidden");
    expect(dialog?.className).toContain("flex-col");
    unmount();
  });

  it("locks the document scroll while open and restores it on close", () => {
    seedPopulated();
    expect(document.body.style.overflow).not.toBe("hidden");

    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
    expect(document.documentElement.style.overflow).not.toBe("hidden");
  });

  it("uses a proper flex layout with independently scrollable controls and preview", () => {
    seedPopulated();
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);

    // Left: an aside (not a percentage-width div) with its own scroll region.
    const aside = document.querySelector('aside[aria-label="Customization controls"]');
    expect(aside).toBeTruthy();
    expect(aside?.className).toContain("md:w-[400px]");
    expect(aside?.className).toContain("min-h-0");

    const scroll = document.querySelector('[data-testid="customize-controls-scroll"]');
    expect(scroll).toBeTruthy();
    expect(scroll?.className).toContain("overflow-y-auto");
    expect(scroll?.className).toContain("flex-1");
    expect(scroll?.className).toContain("min-h-0");

    // Every section must live inside the controls scroll region.
    const scrollText = scroll?.textContent ?? "";
    for (const title of ["Typography", "Colors", "Headings", "Bullets", "Spacing & Layout"]) {
      expect(scrollText).toContain(title);
    }

    // Reset/Done footer is a pinned sibling of the scroll region — never clipped.
    const footer = document.querySelector('[data-testid="customize-controls-footer"]');
    expect(footer).toBeTruthy();
    expect(footer?.className).toContain("shrink-0");
    expect(scroll?.contains(footer)).toBe(false);
    expect(footer?.textContent).toContain("Reset to Template Defaults");
    expect(footer?.textContent).toContain("Done");

    // Right: the live preview is a sibling of the controls aside — independent scroll.
    const liveColumn = document.querySelector('[data-testid="customize-live-column"]');
    expect(liveColumn).toBeTruthy();
    expect(liveColumn?.className).toContain("flex-1");
    expect(liveColumn?.className).toContain("min-w-0");
    expect(aside?.contains(liveColumn)).toBe(false);
    expect(liveColumn?.querySelector('[data-testid="live-style-preview"]')).toBeTruthy();
    expect(liveColumn?.textContent).toContain("Ada Lovelace");

    // Desktop: the workspace row is a side-by-side flex (not a single scroll).
    const row = aside?.parentElement;
    expect(row?.className).toContain("md:flex-row");
    unmount();
  });

  it("renders a split workspace: controls left, live preview right", () => {
    seedPopulated();
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    // Left column: the existing controls.
    expect(panelText()).toContain("Font family");
    expect(panelText()).toContain("Accent color");
    expect(panelText()).toContain("Reset to Template Defaults");
    // Right column: live preview of the user's real resume.
    const liveColumn = document.querySelector('[data-testid="customize-live-column"]');
    expect(liveColumn).toBeTruthy();
    expect(liveColumn?.querySelector('[data-testid="live-style-preview"]')).toBeTruthy();
    expect(liveColumn?.textContent).toContain("Ada Lovelace");
    unmount();
  });

  it("updates the live preview immediately when a control changes", () => {
    seedPopulated();
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => {}} />);
    expect(document.querySelector("[data-rs-scope] style")).toBeNull();

    click(findButton("Playfair Display"));
    const style = document.querySelector("[data-rs-scope] style");
    expect(style?.textContent).toContain("font-family: var(--rs-font) !important");

    click(findButton("Emerald"));
    expect(document.querySelector("[data-rs-scope] style")?.textContent).toContain("--rs-accent");
    unmount();
  });

  it("closes on Escape", () => {
    let closed = false;
    const { unmount } = renderToContainer(<CustomizePanel open onClose={() => { closed = true; }} />);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(closed).toBe(true);
    unmount();
  });

  it("does not render any content when closed", () => {
    const { unmount } = renderToContainer(<CustomizePanel open={false} onClose={() => {}} />);
    expect(panelText().includes("Customize")).toBe(false);
    unmount();
  });
});
