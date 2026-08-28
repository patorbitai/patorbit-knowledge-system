"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";
import React, { act } from "react";
import { ResumePreview, getActiveTemplate } from "@/components/resume/ResumePreview";
import { ExportModal } from "@/components/resume-builder/ExportModal";
import { GALLERY_SAMPLE_RESUME } from "@/components/resume-builder/gallery-sample-resume";
import { renderToContainer } from "@/components/resume-builder/__tests__/gallery-test-utils";
import { useResumeBuilder } from "@/store/resume-builder";
import { resolveStyleConfig, resolveHeadingHex } from "@/lib/resume-design-system/style-config";
import { A4 } from "@/lib/resume-design-system/geometry";
import { TEMPLATES } from "@/app/resume-builder/templates";

vi.mock("file-saver", () => ({ saveAs: vi.fn() }));

/**
 * FINAL 29-TEMPLATE PDF EXPORT VALIDATION
 *
 * This test validates that:
 * 1. All 29 templates render correctly in ResumePreview
 * 2. ExportModal produces correct DOM with data-rs-page-scope
 * 3. Style configurations are preserved in the export target
 * 4. A4 dimensions are correct
 * 5. Template ID flows correctly through the pipeline
 * 6. Customization overrides are applied
 */

const ALL_TEMPLATE_IDS = TEMPLATES.map(t => t.id);

const CUSTOM_FONT_CONFIG = {
  fontFamily: "garamond" as const,
  accentColor: "#059669",
  headingStyle: "uppercase" as const,
  headingWeight: "bold" as const,
  bodyColor: "#4b5563",
  sectionSpacing: 32,
  entrySpacing: 20,
  pageMargin: 48,
};

describe("FINAL 29-TEMPLATE PDF EXPORT VALIDATION", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("Phase 1: All 29 templates render correctly", () => {
    it.each(ALL_TEMPLATE_IDS)("template '%s' renders without error", (templateId: string) => {
      const resume = { ...GALLERY_SAMPLE_RESUME, templateId };
      const template = getActiveTemplate(resume);
      expect(template.id).toBe(templateId);

      const { unmount } = renderToContainer(
        <ResumePreview resume={resume} template={template} styleConfig={{}} />
      );

      // The scope must exist with data-rs-scope attribute
      const scope = document.querySelector("[data-rs-scope]");
      expect(scope).toBeTruthy();

      // Must contain the resume name
      expect(document.body.textContent).toContain(GALLERY_SAMPLE_RESUME.name);

      unmount();
    });
  });

  describe("Phase 2: Export target produces correct DOM for all templates", () => {
    it.each(ALL_TEMPLATE_IDS)(
      "template '%s' export target has data-rs-page-scope and correct A4 dimensions",
      async (templateId: string) => {
        const resume = { ...GALLERY_SAMPLE_RESUME, templateId };
        useResumeBuilder.setState({
          resume,
          resumes: [resume],
          activeResumeId: resume.resumeId,
          styleConfigs: { [resume.resumeId as string]: resolveStyleConfig({}) },
        });

        const { unmount } = renderToContainer(<ExportModal open onClose={vi.fn()} />);

        const printBtn = Array.from(document.body.querySelectorAll("button")).find((b) =>
          b.textContent?.includes("Print / Save as PDF")
        );
        expect(printBtn).toBeTruthy();

        await act(async () => {
          printBtn!.click();
          await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))
          );
        });

        const target = document.getElementById("pdf-export-target");
        expect(target).toBeTruthy();

        // A4 dimensions
        expect(target!.style.width).toBe(`${A4.widthMm}mm`);
        expect(target!.style.minHeight).toBe(`${A4.heightMm}mm`);
        expect(target!.style.boxSizing).toBe("border-box");

        // data-rs-page-scope must exist on serialized pages
        const pageScopes = target!.querySelectorAll("[data-rs-page-scope]");
        expect(pageScopes.length).toBeGreaterThan(0);

        // Must contain resume content
        expect(target!.textContent).toContain(GALLERY_SAMPLE_RESUME.name);

        unmount();
      }
    );
  });

  describe("Phase 3: Customization overrides are preserved in export", () => {
    const CUSTOMIZATION_TEMPLATES = [
      "patorbit-modern",
      "executive-pro",
      "minimal-ats",
      "engineering-clean",
      "creative-professional",
      "sidebar-elegance",
      "swiss-design",
      "dark-elegance",
    ] as string[];

    it.each(CUSTOMIZATION_TEMPLATES)(
      "template '%s' preserves custom font, colors, and spacing in export target",
      async (templateId: string) => {
        const resume = { ...GALLERY_SAMPLE_RESUME, templateId };
        useResumeBuilder.setState({
          resume,
          resumes: [resume],
          activeResumeId: resume.resumeId,
          styleConfigs: { [resume.resumeId as string]: resolveStyleConfig(CUSTOM_FONT_CONFIG) },
        });

        const { unmount } = renderToContainer(<ExportModal open onClose={vi.fn()} />);

        const printBtn = Array.from(document.body.querySelectorAll("button")).find((b) =>
          b.textContent?.includes("Print / Save as PDF")
        );
        await act(async () => {
          printBtn!.click();
          await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))
          );
        });

        const target = document.getElementById("pdf-export-target");
        expect(target).toBeTruthy();

        // The serialized page wrappers have [data-rs-page-scope] (the fix).
        // The original measurement scope still has [data-rs-scope].
        const pageScopes = target!.querySelectorAll("[data-rs-page-scope]");
        expect(pageScopes.length).toBeGreaterThan(0);
        const firstPage = pageScopes[0] as HTMLElement;
        expect(firstPage).toBeTruthy();

        // Custom accent color must be in CSS vars on the serialized page
        expect(firstPage.style.getPropertyValue("--rs-accent")).toBe("#059669");

        // Custom body color must be in CSS vars
        expect(firstPage.style.getPropertyValue("--rs-body")).toBe("#4b5563");

        // Custom spacing must be in CSS vars
        expect(firstPage.style.getPropertyValue("--rs-section-spacing")).toBe("32px");
        expect(firstPage.style.getPropertyValue("--rs-entry-spacing")).toBe("20px");

        // Custom margin must be in CSS vars
        expect(firstPage.style.getPropertyValue("--rs-page-margin")).toBe("48px");

        // Override rules in serialized pages must target [data-rs-page-scope] (after rewrite)
        const styleTag = firstPage.querySelector("style");
        if (styleTag?.textContent) {
          expect(styleTag.textContent).toContain("[data-rs-page-scope]");
          // Must not contain the original [data-rs-scope] in the serialized version
          expect(styleTag.textContent).not.toContain("[data-rs-scope]");
        }

        unmount();
      }
    );
  });

  describe("Phase 4: Gallery/Preview/PDF consistency", () => {
    it.each([
      "patorbit-modern",
      "executive-pro",
      "sidebar-elegance",
      "swiss-design",
    ] as string[])(
      "template '%s' produces identical scopes in Preview and Export mirrors",
      (templateId: string) => {
        const resume = { ...GALLERY_SAMPLE_RESUME, templateId };
        const config = { fontFamily: "garamond" as const, accentColor: "#059669" };

        const { unmount } = renderToContainer(
          <div>
            <ResumePreview
              resume={resume}
              template={getActiveTemplate(resume)}
              styleConfig={config}
            />
            <div id="pdf-export-target">
              <ResumePreview
                resume={resume}
                template={getActiveTemplate(resume)}
                styleConfig={config}
              />
            </div>
          </div>
        );

        const scopes = document.querySelectorAll("[data-rs-scope]");
        expect(scopes).toHaveLength(2);
        const [preview, exportTarget] = scopes as unknown as [HTMLElement, HTMLElement];

        // Identical CSS vars
        expect(preview.style.getPropertyValue("--rs-accent")).toBe(
          exportTarget.style.getPropertyValue("--rs-accent")
        );
        expect(preview.style.getPropertyValue("--rs-font")).toBe(
          exportTarget.style.getPropertyValue("--rs-font")
        );

        // Identical override rules
        expect(preview.querySelector("style")?.textContent).toBe(
          exportTarget.querySelector("style")?.textContent
        );

        // Identical innerHTML
        expect(preview.innerHTML).toBe(exportTarget.innerHTML);

        unmount();
      }
    );
  });

  describe("Phase 5: Template switching does not leak stale data", () => {
    it("switching template A → B → A produces correct templates at each step", async () => {
      const resume = { ...GALLERY_SAMPLE_RESUME, templateId: "patorbit-modern" };

      // Start with patorbit-modern
      const { unmount: unmount1 } = renderToContainer(
        <ResumePreview
          resume={{ ...resume, templateId: "patorbit-modern" }}
          template={getActiveTemplate({ ...resume, templateId: "patorbit-modern" })}
          styleConfig={{}}
        />
      );
      expect(getActiveTemplate({ ...resume, templateId: "patorbit-modern" }).id).toBe("patorbit-modern");
      unmount1();

      // Switch to executive-pro
      const { unmount: unmount2 } = renderToContainer(
        <ResumePreview
          resume={{ ...resume, templateId: "executive-pro" }}
          template={getActiveTemplate({ ...resume, templateId: "executive-pro" })}
          styleConfig={{}}
        />
      );
      expect(getActiveTemplate({ ...resume, templateId: "executive-pro" }).id).toBe("executive-pro");
      unmount2();

      // Switch back to patorbit-modern
      const { unmount: unmount3 } = renderToContainer(
        <ResumePreview
          resume={{ ...resume, templateId: "patorbit-modern" }}
          template={getActiveTemplate({ ...resume, templateId: "patorbit-modern" })}
          styleConfig={{}}
        />
      );
      expect(getActiveTemplate({ ...resume, templateId: "patorbit-modern" }).id).toBe("patorbit-modern");
      unmount3();
    });
  });

  describe("Phase 6: Data integrity after export", () => {
    it("export does not modify resume state", async () => {
      const resume = { ...GALLERY_SAMPLE_RESUME, templateId: "patorbit-modern" };
      const originalName = resume.name;
      const originalTemplateId = resume.templateId;

      useResumeBuilder.setState({
        resume,
        resumes: [resume],
        activeResumeId: resume.resumeId,         styleConfigs: { [resume.resumeId as string]: resolveStyleConfig({}) },
      });

      const { unmount } = renderToContainer(<ExportModal open onClose={vi.fn()} />);

      const printBtn = Array.from(document.body.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Print / Save as PDF")
      );
      await act(async () => {
        printBtn!.click();
        await new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))
        );
      });

      // Verify state is unchanged
      const state = useResumeBuilder.getState();
      expect(state.resume.name).toBe(originalName);
      expect(state.resume.templateId).toBe(originalTemplateId);
      expect(state.activeResumeId).toBe(resume.resumeId);

      unmount();
    });
  });
});
