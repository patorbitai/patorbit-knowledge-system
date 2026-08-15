"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { act } from "react";
import { LiveStylePreview } from "../LiveStylePreview";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { renderToContainer, click, findButton, installObserverStubs, setFakeScrollHeight } from "./gallery-test-utils";
import type { Resume } from "@/types/resume";

/** A populated USER resume — distinct from the gallery sample. */
const USER_RESUME: Resume = {
  ...defaultResume,
  resumeId: "u1",
  resumeName: "My Resume",
  name: "Ada Lovelace",
  title: "Analytical Engineer",
  email: "ada@example.com",
  phone: "555-0100",
  summary: "Mathematician and computing pioneer.",
  experience: [
    {
      id: "exp-1",
      company: "Analytical Engines Ltd",
      position: "Senior Engineer",
      location: "London",
      employmentType: "Full-time",
      industry: "Technology",
      startDate: "1843",
      endDate: "",
      current: true,
      duration: "",
      description: "",
      achievements: "",
      techUsed: "",
      bulletPoints: ["Designed the first published algorithm."],
    },
  ],
  templateId: "modern-clean",
};

function seedUserResume(templateId = "modern-clean") {
  useResumeBuilder.setState({
    resumes: [{ ...USER_RESUME, templateId }],
    activeResumeId: "u1",
    resume: { ...USER_RESUME, templateId },
    styleConfigs: {},
  });
}

describe("LiveStylePreview", () => {
  beforeEach(() => {
    installObserverStubs();
    setFakeScrollHeight(900);
    document.body.innerHTML = "";
  });

  it("renders the USER's actual resume, never the gallery sample", () => {
    seedUserResume();
    const { unmount } = renderToContainer(<LiveStylePreview />);
    const text = document.body.textContent ?? "";
    expect(text).toContain("Ada Lovelace");
    expect(text).toContain("Analytical Engineer");
    expect(text).not.toContain("Jordan Rivera"); // gallery sample must not appear
    unmount();
  });

  it("renders exactly one ResumePreview instance", () => {
    seedUserResume();
    const { unmount } = renderToContainer(<LiveStylePreview />);
    expect(document.querySelectorAll("[data-rs-scope]")).toHaveLength(1);
    unmount();
  });

  it("updates the preview immediately when the store style config changes", () => {
    seedUserResume();
    const { unmount } = renderToContainer(<LiveStylePreview />);
    // No override stylesheet at the default config.
    expect(document.querySelector("[data-rs-scope] style")).toBeNull();

    act(() => {
      useResumeBuilder.getState().setStyleConfig("u1", { fontFamily: "playfair", accentColor: "#059669", headingColor: "accent" });
    });
    const style = document.querySelector("[data-rs-scope] style");
    expect(style?.textContent).toContain("font-family: var(--rs-font) !important");
    expect(style?.textContent).toContain("--rs-accent");
    expect(style?.textContent).toContain("color: var(--rs-heading) !important");
    unmount();
  });

  it("shows page navigation for multi-page resumes and clips to the selected page", () => {
    seedUserResume();
    setFakeScrollHeight(2400); // ceil(2400 / 1123) = 3 pages
    const { unmount } = renderToContainer(<LiveStylePreview />);

    expect(findButton("Page 1")).toBeTruthy();
    expect(findButton("Page 2")).toBeTruthy();
    expect(findButton("Page 3")).toBeTruthy();

    click(findButton("Page 2"));
    const sheet = document.querySelector('[data-testid="live-page-sheet"]') as HTMLElement;
    expect(sheet.style.transform).toContain("translateY(-1123px)");

    click(findButton("Next page"));
    expect((document.querySelector('[data-testid="live-page-sheet"]') as HTMLElement).style.transform).toContain("translateY(-2246px)");
    unmount();
  });

  it("hides page navigation when the resume fits one page", () => {
    seedUserResume();
    setFakeScrollHeight(900);
    const { unmount } = renderToContainer(<LiveStylePreview />);
    expect(findButton("Page 1")).toBeFalsy();
    expect(document.querySelector('[data-testid="live-page-nav"]')).toBeNull();
    unmount();
  });

  it("zooms in/out within bounds and resets to the fit default", () => {
    seedUserResume();
    const { unmount } = renderToContainer(<LiveStylePreview />);

    const percent = () => (document.querySelector('[data-testid="live-zoom-percent"]') as HTMLElement).textContent;
    expect(percent()).toBe("100%");

    click(findButton("Zoom in"));
    expect(percent()).toBe("110%");
    click(findButton("Zoom in"));
    expect(percent()).toBe("120%");

    click(findButton("Zoom out"));
    expect(percent()).toBe("110%");

    click(findButton("Reset zoom"));
    expect(percent()).toBe("100%");
    unmount();
  });

  it("supports + / - / 0 keyboard shortcuts for zoom", () => {
    seedUserResume();
    const { unmount } = renderToContainer(<LiveStylePreview />);
    const percent = () => (document.querySelector('[data-testid="live-zoom-percent"]') as HTMLElement).textContent;

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "+" }));
    });
    expect(percent()).toBe("110%");
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "-" }));
    });
    expect(percent()).toBe("100%");
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "0" }));
    });
    expect(percent()).toBe("100%");
    unmount();
  });

  it("top-aligns the resume sheet with a small intentional gap below the toolbar", () => {
    seedUserResume();
    const { unmount } = renderToContainer(<LiveStylePreview />);

    const stage = document.querySelector('[data-testid="live-stage"]');
    expect(stage).toBeTruthy();
    // Top-aligned (items-start), horizontally centered — never vertically centered.
    expect(stage?.className).toContain("items-start");
    expect(stage?.className).toContain("justify-center");
    expect(stage?.className).not.toContain("items-center");
    // Small intentional top gap (~16px incl. toolbar padding); room to scroll past bottom.
    expect(stage?.className).toContain("pt-2");
    expect(stage?.className).toContain("pb-10");
    expect(stage?.className).not.toContain("py-5");

    // The toolbar is a shrink-0 sticky sibling above the stage — the sheet can
    // never start hidden behind it.
    const toolbar = stage?.previousElementSibling as HTMLElement | null;
    expect(toolbar?.className).toContain("shrink-0");
    expect(toolbar?.className).toContain("sticky");
    expect(toolbar?.className).toContain("py-2");

    // The sheet wrapper carries no top margin that could push it down.
    const sheet = document.querySelector('[data-testid="live-page-sheet"]') as HTMLElement;
    expect(sheet.style.marginTop).toBe("");
    unmount();
  });

  it("exposes an accessible region label for the preview", () => {
    seedUserResume();
    const { unmount } = renderToContainer(<LiveStylePreview />);
    const region = document.querySelector('[data-testid="live-style-preview"]');
    expect(region?.getAttribute("role")).toBe("region");
    expect(region?.getAttribute("aria-label")).toBe("Live resume preview");
    unmount();
  });
});
