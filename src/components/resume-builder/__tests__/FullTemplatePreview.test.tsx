"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { act } from "react";
import { FullTemplatePreview } from "../FullTemplatePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { GALLERY_SAMPLE_RESUME } from "../gallery-sample-resume";
import {
  installObserverStubs,
  setFakeScrollHeight,
  renderToContainer,
  click,
} from "./gallery-test-utils";

const FLAGSHIP_IDS = [
  "executive-pro",
  "minimal-ats",
  "engineering-clean",
  "patorbit-modern",
  "consulting-elite",
  "product-manager",
  "academic-cv",
  "creative-professional",
];

function templateOf(id: string) {
  const t = TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`template ${id} not found`);
  return t;
}

describe("FullTemplatePreview", () => {
  beforeEach(() => {
    installObserverStubs();
    setFakeScrollHeight(900);
    document.body.innerHTML = "";
  });

  it(
    "renders all 8 flagship templates with the sample resume without throwing",
    () => {
      for (const id of FLAGSHIP_IDS) {
        const template = templateOf(id);
        const { unmount } = renderToContainer(
          <FullTemplatePreview templateId={id} templates={[template]} onClose={() => {}} onUseTemplate={() => {}} />,
        );
        const text = document.body.textContent ?? "";
        expect(text).toContain(template.name);
        expect(text).toContain(GALLERY_SAMPLE_RESUME.name);
        expect(text).toContain("Northwind Labs");
        expect(text).toContain("Jordan Rivera");
        unmount();
      }
    },
    20000,
  );

  it("shows a single page with no page navigation when the resume fits one page", () => {
    setFakeScrollHeight(900);
    const { unmount } = renderToContainer(
      <FullTemplatePreview templateId="minimal-ats" templates={[templateOf("minimal-ats")]} onClose={() => {}} onUseTemplate={() => {}} />,
    );
    expect(document.body.querySelector('[data-testid="preview-page-nav"]')).toBeNull();
    expect(document.body.textContent).toContain("1 page");
    unmount();
  });

  it("shows page navigation for multi-page resumes and navigates between pages", () => {
    setFakeScrollHeight(2600); // ~2.3 pages -> 3 page buttons
    const { unmount } = renderToContainer(
      <FullTemplatePreview templateId="academic-cv" templates={[templateOf("academic-cv")]} onClose={() => {}} onUseTemplate={() => {}} />,
    );
    const nav = document.body.querySelector('[data-testid="preview-page-nav"]');
    expect(nav).not.toBeNull();
    expect(document.body.textContent).toContain("3 pages");

    const sheet = document.body.querySelector('[data-testid="preview-page-sheet"]') as HTMLElement;
    expect(sheet.style.transform).toContain("translateY(-0px)");

    // Jump to page 2 via the numbered button.
    click(document.body.querySelector('[aria-label="Page 2"]'));
    expect(sheet.style.transform).toContain("translateY(-1123px)");

    // Next page arrow -> page 3.
    click(document.body.querySelector('[aria-label="Next page"]'));
    expect(sheet.style.transform).toContain("translateY(-2246px)");

    // Previous page arrow -> page 2.
    click(document.body.querySelector('[aria-label="Previous page"]'));
    expect(sheet.style.transform).toContain("translateY(-1123px)");

    // Previous page is disabled on page 1.
    click(document.body.querySelector('[aria-label="Page 1"]'));
    const prevBtn = document.body.querySelector('[aria-label="Previous page"]') as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
    unmount();
  });

  it("closes via the close button, Escape key, and backdrop click", () => {
    let closed = 0;
    const { unmount } = renderToContainer(
      <FullTemplatePreview templateId="patorbit-modern" templates={[templateOf("patorbit-modern")]} onClose={() => closed++} onUseTemplate={() => {}} />,
    );

    click(document.body.querySelector('[data-testid="preview-close"]'));
    expect(closed).toBe(1);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(closed).toBe(2);

    const overlay = document.body.querySelector('[data-testid="full-template-preview"]') as HTMLElement;
    act(() => {
      // Bubbling is required so React's delegated listener at the root sees it.
      overlay.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(closed).toBe(3);
    unmount();
  });

  it("navigates between templates with buttons and arrow keys", () => {
    const templates = [templateOf("patorbit-modern"), templateOf("minimal-ats")];
    const { unmount } = renderToContainer(
      <FullTemplatePreview templateId="patorbit-modern" templates={templates} onClose={() => {}} onUseTemplate={() => {}} />,
    );
    expect(document.body.textContent).toContain("Patorbit Modern");

    click(document.body.querySelector('[aria-label="Next template"]'));
    expect(document.body.textContent).toContain("Patorbit ATS");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    });
    expect(document.body.textContent).toContain("Patorbit Modern");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });
    expect(document.body.textContent).toContain("Patorbit ATS");
    unmount();
  });

  it("calls onUseTemplate with the currently viewed template id", () => {
    const templates = [templateOf("patorbit-modern"), templateOf("minimal-ats")];
    const used: string[] = [];
    const { unmount } = renderToContainer(
      <FullTemplatePreview templateId="patorbit-modern" templates={templates} onClose={() => {}} onUseTemplate={(id) => used.push(id)} />,
    );

    click(document.body.querySelector('[data-testid="use-this-template"]'));
    expect(used).toEqual(["patorbit-modern"]);

    click(document.body.querySelector('[aria-label="Next template"]'));
    click(document.body.querySelector('[data-testid="use-this-template"]'));
    expect(used).toEqual(["patorbit-modern", "minimal-ats"]);
    unmount();
  });

  it("zooms in/out with buttons and clamps at 50% and 150%", () => {
    const { unmount } = renderToContainer(
      <FullTemplatePreview templateId="minimal-ats" templates={[templateOf("minimal-ats")]} onClose={() => {}} onUseTemplate={() => {}} />,
    );

    const percent = () => (document.body.querySelector('[data-testid="zoom-percent"]') as HTMLElement).textContent;
    const sheet = document.body.querySelector('[data-testid="preview-page-sheet"]') as HTMLElement;

    // Default fit zoom in jsdom is 100%.
    expect(percent()).toContain("100%");
    expect(sheet.style.transform).toContain("scale(1)");

    // Zoom in twice: 100 -> 110 -> 120.
    click(document.body.querySelector('[aria-label="Zoom in"]'));
    click(document.body.querySelector('[aria-label="Zoom in"]'));
    expect(percent()).toContain("120%");
    expect(sheet.style.transform).toContain("scale(1.2)");

    // Zoom out: 120 -> 110.
    click(document.body.querySelector('[aria-label="Zoom out"]'));
    expect(percent()).toContain("110%");

    // Zoom in up to the 150% cap, then the button disables.
    for (let i = 0; i < 10; i++) click(document.body.querySelector('[aria-label="Zoom in"]'));
    expect(percent()).toContain("150%");
    expect((document.body.querySelector('[aria-label="Zoom in"]') as HTMLButtonElement).disabled).toBe(true);

    // Zoom out down to the 50% floor, then the button disables.
    for (let i = 0; i < 20; i++) click(document.body.querySelector('[aria-label="Zoom out"]'));
    expect(percent()).toContain("50%");
    expect((document.body.querySelector('[aria-label="Zoom out"]') as HTMLButtonElement).disabled).toBe(true);
    unmount();
  });

  it("reset zoom returns to the fit default", () => {
    const { unmount } = renderToContainer(
      <FullTemplatePreview templateId="minimal-ats" templates={[templateOf("minimal-ats")]} onClose={() => {}} onUseTemplate={() => {}} />,
    );

    click(document.body.querySelector('[aria-label="Zoom in"]'));
    click(document.body.querySelector('[aria-label="Zoom in"]'));
    expect(document.body.querySelector('[data-testid="zoom-percent"]')?.textContent).toContain("120%");

    click(document.body.querySelector('[aria-label="Reset zoom"]'));
    expect(document.body.querySelector('[data-testid="zoom-percent"]')?.textContent).toContain("100%");
    unmount();
  });

  it("zooms via keyboard (+/=, -, 0) without interfering with inputs", () => {
    const { unmount } = renderToContainer(
      <FullTemplatePreview templateId="minimal-ats" templates={[templateOf("minimal-ats")]} onClose={() => {}} onUseTemplate={() => {}} />,
    );
    const percent = () => document.body.querySelector('[data-testid="zoom-percent"]')?.textContent;

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "+" }));
    });
    expect(percent()).toContain("110%");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "=" }));
    });
    expect(percent()).toContain("120%");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "-" }));
    });
    expect(percent()).toContain("110%");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "0" }));
    });
    expect(percent()).toContain("100%");

    // Typing shortcuts must not fire while an input is focused.
    const input = document.createElement("input");
    document.body.appendChild(input);
    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "+", bubbles: true }));
    });
    expect(percent()).toContain("100%");
    input.remove();
    unmount();
  });

  it("page navigation keeps working at any zoom level", () => {
    setFakeScrollHeight(2400); // two pages
    const { unmount } = renderToContainer(
      <FullTemplatePreview templateId="academic-cv" templates={[templateOf("academic-cv")]} onClose={() => {}} onUseTemplate={() => {}} />,
    );

    // Zoom to 150%.
    for (let i = 0; i < 10; i++) click(document.body.querySelector('[aria-label="Zoom in"]'));
    const sheet = document.body.querySelector('[data-testid="preview-page-sheet"]') as HTMLElement;

    click(document.body.querySelector('[aria-label="Page 2"]'));
    // The page translation is unaffected by zoom — only the scale changes.
    expect(sheet.style.transform).toContain("scale(1.5)");
    expect(sheet.style.transform).toContain("translateY(-1123px)");
    unmount();
  });

  it("renders a full-screen overlay on desktop and mobile viewports", () => {
    const { unmount } = renderToContainer(
      <FullTemplatePreview templateId="minimal-ats" templates={[templateOf("minimal-ats")]} onClose={() => {}} onUseTemplate={() => {}} />,
    );
    const overlay = document.body.querySelector('[data-testid="full-template-preview"]') as HTMLElement;
    expect(overlay.className).toContain("fixed");
    expect(overlay.className).toContain("inset-0");
    expect(overlay.getAttribute("role")).toBe("dialog");
    expect(overlay.getAttribute("aria-modal")).toBe("true");

    // Simulate a narrow (mobile) viewport; the overlay must stay full-screen.
    (window as unknown as { innerWidth: number }).innerWidth = 375;
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(overlay.className).toContain("fixed");
    expect(overlay.className).toContain("inset-0");
    unmount();
  });
});
