"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { TemplateGallery } from "../TemplateGallery";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { GALLERY_SAMPLE_RESUME } from "../gallery-sample-resume";
import {
  installObserverStubs,
  setFakeScrollHeight,
  renderToContainer,
  click,
} from "./gallery-test-utils";

function useButtonFor(templateId: string): HTMLButtonElement | null {
  const card = document.body.querySelector(`[data-template-id="${templateId}"]`);
  if (!card) return null;
  return Array.from(card.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === "Use This Template",
  ) as HTMLButtonElement | null;
}

// These tests render full template previews with ResizeObserver stubs and
// measurement passes; under full-suite parallel load they can exceed the
// default 5s timeout even though each passes quickly in isolation.
describe("TemplateGallery", () => {
  beforeEach(() => {
    installObserverStubs();
    setFakeScrollHeight(900);
    document.body.innerHTML = "";
    useResumeBuilder.setState({
      resumes: [{ ...defaultResume, resumeId: "r1", resumeName: "My Resume" }],
      activeResumeId: "r1",
      resume: { ...defaultResume, resumeId: "r1", resumeName: "My Resume" },
    });
  });

  it(
    "opens the full resume preview from a template card",
    () => {
      const { unmount } = renderToContainer(<TemplateGallery open onClose={() => {}} />);

      const previewButton = document.body.querySelector('[aria-label^="Preview "]');
      expect(previewButton).not.toBeNull();
      click(previewButton);

      const preview = document.body.querySelector('[data-testid="full-template-preview"]');
      expect(preview).not.toBeNull();
      expect(document.body.textContent).toContain(GALLERY_SAMPLE_RESUME.name);
      expect(document.body.textContent).toContain("Northwind Labs");
      unmount();
    },
    15000,
  );

  it("closes the full preview via its close button", () => {
    const { unmount } = renderToContainer(<TemplateGallery open onClose={() => {}} />);
    click(document.body.querySelector('[aria-label^="Preview "]'));
    expect(document.body.querySelector('[data-testid="full-template-preview"]')).not.toBeNull();

    click(document.body.querySelector('[data-testid="preview-close"]'));
    expect(document.body.querySelector('[data-testid="full-template-preview"]')).toBeNull();
    unmount();
  });

  it("applies the selected template and preserves the user's existing resume data", () => {
    const resume = {
      ...defaultResume,
      resumeId: "r1",
      resumeName: "My Resume",
      name: "Jane Doe",
      title: "Data Engineer",
      experience: [
        {
          id: "e1",
          company: "Acme Corp",
          position: "Data Engineer",
          location: "",
          employmentType: "",
          industry: "",
          startDate: "",
          endDate: "",
          current: true,
          duration: "",
          description: "Built pipelines.",
          achievements: "",
          techUsed: "",
          bulletPoints: [],
        },
      ],
      skills: [{ id: "s1", name: "SQL", level: "Advanced" as const, category: "", years: "3" }],
    };
    useResumeBuilder.setState({
      resumes: [resume],
      activeResumeId: "r1",
      resume,
    });

    const { unmount } = renderToContainer(<TemplateGallery open onClose={() => {}} />);

    click(useButtonFor("patorbit-modern"));

    // Existing data -> confirm overwrite dialog appears.
    expect(document.body.textContent).toContain("Switch Template?");
    click(
      Array.from(document.body.querySelectorAll("button")).find((b) => b.textContent?.trim() === "Apply Template") as HTMLButtonElement,
    );

    const state = useResumeBuilder.getState();
    expect(state.resume.templateId).toBe("patorbit-modern");
    // Only the template changes — the user's font preference and other data
    // stay intact (the template's suggested font is NOT forced onto them).
    expect(state.resume.fontPreference).toBe(defaultResume.fontPreference);
    expect(state.resume.name).toBe("Jane Doe");
    expect(state.resume.title).toBe("Data Engineer");
    expect(state.resume.experience[0].company).toBe("Acme Corp");
    expect(state.resume.skills[0].name).toBe("SQL");
    expect(state.resume.name).not.toBe(GALLERY_SAMPLE_RESUME.name);
    unmount();
  });

  it("applies a template directly without a confirm dialog when the resume is empty", () => {
    let closed = 0;
    const { unmount } = renderToContainer(<TemplateGallery open onClose={() => closed++} />);

    click(useButtonFor("minimal-ats"));

    expect(document.body.textContent).not.toContain("Switch Template?");
    expect(useResumeBuilder.getState().resume.templateId).toBe("minimal-ats");
    expect(closed).toBe(1);
    unmount();
  });

  it("shows clear, always-visible card actions: Use This Template + Preview Full Resume", () => {
    const { unmount } = renderToContainer(<TemplateGallery open onClose={() => {}} />);

    const card = document.body.querySelector('[data-template-id="patorbit-modern"]');
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain("Use This Template");
    expect(card?.textContent).toContain("Preview Full Resume");
    expect(card?.textContent).toContain("Best for:");

    // Preview Full Resume opens the full-screen preview.
    click(
      Array.from(card!.querySelectorAll("button")).find((b) => b.textContent?.trim() === "Preview Full Resume") as HTMLButtonElement,
    );
    expect(document.body.querySelector('[data-testid="full-template-preview"]')).not.toBeNull();
    unmount();
  });

  it("shows 'Current Template' on the card for the selected template", () => {
    useResumeBuilder.setState({
      resume: { ...defaultResume, resumeId: "r1", resumeName: "My Resume", templateId: "patorbit-modern" },
    });
    const { unmount } = renderToContainer(<TemplateGallery open onClose={() => {}} />);

    const card = document.body.querySelector('[data-template-id="patorbit-modern"]');
    expect(card?.textContent).toContain("Current Template");
    expect(card?.textContent).not.toContain("Use This Template");
    unmount();
  });

  it("navigates pages inside the full preview opened from the gallery", () => {
    setFakeScrollHeight(2400); // two pages
    const { unmount } = renderToContainer(<TemplateGallery open onClose={() => {}} />);

    // Open the preview of the first recommended card (patorbit-modern).
    click(document.body.querySelector('[aria-label^="Preview "]'));
    const pageNav = document.body.querySelector('[data-testid="preview-page-nav"]');
    expect(pageNav).not.toBeNull();

    const sheet = document.body.querySelector('[data-testid="preview-page-sheet"]') as HTMLElement;
    click(document.body.querySelector('[aria-label="Page 2"]'));
    expect(sheet.style.transform).toContain("translateY(-1123px)");
    unmount();
  });
}, 30000);
