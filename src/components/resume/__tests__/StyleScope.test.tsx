"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { ResumePreview } from "../ResumePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { GALLERY_SAMPLE_RESUME } from "@/components/resume-builder/gallery-sample-resume";
import { renderToContainer } from "@/components/resume-builder/__tests__/gallery-test-utils";

function templateOf(id: string) {
  const t = TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`template ${id} not found`);
  return t;
}

describe("StyleScope integration (ResumePreview)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("wraps the sheet in a data-rs-scope element", () => {
    const { unmount } = renderToContainer(
      <ResumePreview resume={GALLERY_SAMPLE_RESUME} template={templateOf("modern-clean")} />,
    );
    expect(document.querySelector("[data-rs-scope]")).toBeTruthy();
    expect(document.body.textContent).toContain(GALLERY_SAMPLE_RESUME.name);
    unmount();
  });

  it("injects NO override stylesheet at the default config — native rendering", () => {
    const { unmount } = renderToContainer(
      <ResumePreview resume={GALLERY_SAMPLE_RESUME} template={templateOf("modern-clean")} />,
    );
    const scope = document.querySelector("[data-rs-scope]");
    expect(scope?.querySelector("style")).toBeNull();
    unmount();
  });

  it("injects override rules only when the config diverges from defaults", () => {
    const { unmount } = renderToContainer(
      <ResumePreview
        resume={GALLERY_SAMPLE_RESUME}
        template={templateOf("modern-clean")}
        styleConfig={{ fontFamily: "playfair", accentColor: "#dc2626" }}
      />,
    );
    const scope = document.querySelector("[data-rs-scope]");
    const style = scope?.querySelector("style");
    expect(style).toBeTruthy();
    expect(style?.textContent).toContain("font-family: var(--rs-font) !important");
    expect(style?.textContent).toContain("--rs-accent");
    // Unchanged options emit no rules.
    expect(style?.textContent).not.toContain("--rs-page-margin");
    // CSS custom properties are present on the scope element.
    const vars = (scope as HTMLElement).style;
    expect(vars.getPropertyValue("--rs-font")).toContain("var(--font-playfair)");
    unmount();
  });

  it("applies spacing rules to all four flagship templates, gating page margins by layout", () => {
    const FLAGSHIPS = ["patorbit-modern", "minimal-ats", "executive-pro", "engineering-clean"];
    // Two-column / sidebar templates own their inner padding.
    const noMargin = new Set(["patorbit-modern"]);
    const spacingConfig = { sectionSpacing: 32, entrySpacing: 8, pageMargin: 48 };

    for (const id of FLAGSHIPS) {
      const { unmount } = renderToContainer(
        <ResumePreview resume={GALLERY_SAMPLE_RESUME} template={templateOf(id)} styleConfig={spacingConfig} />,
      );
      const style = document.querySelector("[data-rs-scope] style");
      expect(style?.textContent, id).toContain("margin-bottom: var(--rs-section-spacing) !important");
      expect(style?.textContent, id).toContain("margin-top: var(--rs-entry-spacing) !important");
      if (noMargin.has(id)) {
        expect(style?.textContent, id).not.toContain("--rs-page-margin");
      } else {
        expect(style?.textContent, id).toContain("padding: var(--rs-page-margin) !important");
      }
      unmount();
    }
  });

  it("print/PDF target receives the selected font and colors", () => {
    // Mirrors ExportModal's #pdf-export-target structure used for Print/PDF.
    const { unmount } = renderToContainer(
      <div id="pdf-export-target" aria-hidden="true">
        <ResumePreview
          resume={GALLERY_SAMPLE_RESUME}
          template={templateOf("modern-clean")}
          styleConfig={{ fontFamily: "playfair", accentColor: "#1e3a8a", headingColor: "accent", bodyColor: "#4b5563" }}
        />
      </div>,
    );
    const scope = document.querySelector("[data-rs-scope]");
    const style = scope?.querySelector("style");
    expect(style?.textContent).toContain("font-family: var(--rs-font) !important");
    expect(style?.textContent).toContain("color: var(--rs-body) !important");
    expect(style?.textContent).toContain("color: var(--rs-heading) !important");
    expect(style?.textContent).toContain("--rs-accent");
    // "Same as accent" heading resolves to the accent color.
    const vars = (scope as HTMLElement).style;
    expect(vars.getPropertyValue("--rs-heading")).toBe("#1e3a8a");
    unmount();
  });

  it("honors per-template support even when a config diverges (sidebar → no page margin rule)", () => {
    const { unmount } = renderToContainer(
      <ResumePreview
        resume={GALLERY_SAMPLE_RESUME}
        template={templateOf("sidebar-elegance")}
        styleConfig={{ pageMargin: 48 }}
      />,
    );
    // pageMargin is the only divergent option and it is unsupported for this
    // template, so no override stylesheet is injected at all.
    const style = document.querySelector("[data-rs-scope] style");
    expect(style).toBeNull();
    unmount();
  });
});
