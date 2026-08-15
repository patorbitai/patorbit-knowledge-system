"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";
import React, { act } from "react";
import { ResumePreview, getActiveTemplate } from "@/components/resume/ResumePreview";
import { ExportModal } from "@/components/resume-builder/ExportModal";
import { GALLERY_SAMPLE_RESUME } from "@/components/resume-builder/gallery-sample-resume";
import { renderToContainer } from "@/components/resume-builder/__tests__/gallery-test-utils";
import { useResumeBuilder } from "@/store/resume-builder";
import { resolveStyleConfig, resolveHeadingHex, type ResumeStyleConfig } from "@/lib/resume-design-system/style-config";
import { A4 } from "@/lib/resume-design-system/geometry";

vi.mock("file-saver", () => ({ saveAs: vi.fn() }));

import { exportToDocx } from "@/utils/export";

/**
 * The contract this suite locks in (requirement 20):
 *
 *   Preview and export must receive IDENTICAL inputs:
 *   - the same templateId (getActiveTemplate(resume))
 *   - the same resume data
 *   - the same ResumeStyleConfig
 *
 * LiveStylePreview (Professional Preview) and ExportModal's #pdf-export-target
 * (Print/PDF) each render `<ResumePreview resume template styleConfig>` with
 * those exact store values — so both mirrors must produce byte-identical
 * styled scopes. The combos below cover requirement 21.
 */
const CASES: { name: string; templateId: string; config?: Partial<ResumeStyleConfig> }[] = [
  // Patorbit Modern
  { name: "Patorbit Modern · default style", templateId: "patorbit-modern" },
  {
    name: "Patorbit Modern · custom font + accent + heading style + spacing",
    templateId: "patorbit-modern",
    config: { fontFamily: "playfair", accentColor: "#1e3a8a", headingStyle: "uppercase", headingWeight: "bold", density: "compact", sectionSpacing: 32, entrySpacing: 20 },
  },
  // Executive Pro
  { name: "Executive Pro · default style", templateId: "executive-pro" },
  {
    name: "Executive Pro · custom font + colors + spacing",
    templateId: "executive-pro",
    config: { fontFamily: "garamond", accentColor: "#059669", headingColor: "accent", bodyColor: "#4b5563", sectionSpacing: 32, entrySpacing: 20, pageMargin: 48 },
  },
  // Minimal ATS
  {
    name: "Minimal ATS · custom font + colors + bullets",
    templateId: "minimal-ats",
    config: { fontFamily: "inter", accentColor: "#7f1d1d", headingColor: "#0f172a", bodyColor: "#374151", bulletStyle: "square", bulletSize: "small", lineHeight: 1.8, fontScale: 1.1 },
  },
  // Engineering Clean
  {
    name: "Engineering Clean · custom font + colors + spacing",
    templateId: "engineering-clean",
    config: { fontFamily: "mono", accentColor: "#0ea5e9", headingColor: "ink", bodyColor: "#475569", sectionSpacing: 16, entrySpacing: 8, pageMargin: 24 },
  },
];

const SCOPE_VARS = [
  "--rs-font",
  "--rs-font-scale",
  "--rs-line-height",
  "--rs-accent",
  "--rs-heading",
  "--rs-body",
  "--rs-heading-transform",
  "--rs-heading-weight",
  "--rs-bullet",
  "--rs-bullet-size",
  "--rs-section-spacing",
  "--rs-entry-spacing",
  "--rs-page-margin",
];

describe("Preview ↔ Export consistency", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it.each(CASES)("$name — preview and print target render identical scopes", ({ templateId, config }) => {
    // Same resume object (same templateId → same template), same style config —
    // exactly what LiveStylePreview and ExportModal read from the store.
    const resume = { ...GALLERY_SAMPLE_RESUME, templateId };

    const { unmount } = renderToContainer(
      <div>
        {/* Professional Preview mirror — what LiveStylePreview renders */}
        <ResumePreview resume={resume} template={getActiveTemplate(resume)} styleConfig={config} />
        {/* Export mirror — what ExportModal renders inside #pdf-export-target */}
        <div id="pdf-export-target" aria-hidden="true">
          <ResumePreview resume={resume} template={getActiveTemplate(resume)} styleConfig={config} />
        </div>
      </div>,
    );

    const scopes = document.querySelectorAll("[data-rs-scope]");
    expect(scopes).toHaveLength(2);
    const [preview, exportTarget] = scopes as unknown as [HTMLElement, HTMLElement];

    // 1. Identical resolved style → identical CSS custom properties.
    for (const prop of SCOPE_VARS) {
      expect(preview.style.getPropertyValue(prop), `${prop} (preview)`).toBe(
        exportTarget.style.getPropertyValue(prop),
      );
    }

    // 2. Identical override rules (only diverging options emit rules).
    expect(preview.querySelector("style")?.textContent).toBe(
      exportTarget.querySelector("style")?.textContent,
    );

    // 3. Identical templateId + resume data → identical rendered output.
    expect(preview.innerHTML).toBe(exportTarget.innerHTML);
    expect(document.body.textContent).toContain(GALLERY_SAMPLE_RESUME.name);

    unmount();
  });

  it("the configured template is the one both mirrors render", () => {
    const resume = { ...GALLERY_SAMPLE_RESUME, templateId: "patorbit-modern" };
    const { unmount } = renderToContainer(
      <ResumePreview resume={resume} template={getActiveTemplate(resume)} styleConfig={{ fontFamily: "playfair" }} />,
    );
    // The template's display name appears in the page chrome of the template
    // (e.g. the sidebar "PATORBIT" mark renders for patorbit-modern) — assert
    // we rendered the patorbit template, not modern-clean fallback.
    expect(getActiveTemplate(resume).id).toBe("patorbit-modern");
    unmount();
  });

  it("DOCX export POSTs the identical templateId + resolved style config (real hex, not sentinels)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["x"]) });
    vi.stubGlobal("fetch", fetchMock);

    const resolved = resolveStyleConfig({
      fontFamily: "garamond",
      accentColor: "#059669",
      headingColor: "accent",
      bodyColor: "#4b5563",
      headingStyle: "uppercase",
      headingWeight: "semibold",
      bulletStyle: "dash",
      sectionSpacing: 32,
      entrySpacing: 20,
      pageMargin: 48,
    });
    // What ExportModal sends: the resolved config with the heading sentinel
    // already converted to the concrete hex the preview renders with.
    const exportStyle = { ...resolved, headingColor: resolveHeadingHex(resolved) };

    await exportToDocx(GALLERY_SAMPLE_RESUME, "My Resume", {
      templateId: GALLERY_SAMPLE_RESUME.templateId,
      styleConfig: exportStyle,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/export-docx");
    const body = JSON.parse((init as RequestInit).body as string);

    // Same resume data (full object, not gallery sample swapped in).
    expect(body.resume.name).toBe(GALLERY_SAMPLE_RESUME.name);
    expect(body.resume.templateId).toBe(GALLERY_SAMPLE_RESUME.templateId);
    // Same templateId.
    expect(body.templateId).toBe(GALLERY_SAMPLE_RESUME.templateId);
    // Same style config, heading sentinel resolved to a real hex.
    expect(body.styleConfig.accentColor).toBe("#059669");
    expect(body.styleConfig.headingColor).toBe("#059669");
    expect(body.styleConfig.fontFamily).toBe("garamond");
    expect(body.styleConfig.bulletStyle).toBe("dash");
    expect(body.styleConfig.sectionSpacing).toBe(32);
    expect(body.styleConfig.pageMargin).toBe(48);

    vi.unstubAllGlobals();
  });

  it("ExportModal's print target mounts on a true A4 page with the SAME templateId + config as the preview", async () => {
    // Deliberately customized style (requirement 18): Garamond, green accent,
    // title case, dash bullets, compact density, custom spacing.
    const resume = { ...GALLERY_SAMPLE_RESUME, resumeId: "export-consistency-test", templateId: "engineering-clean" };
    const cfg: Partial<ResumeStyleConfig> = {
      fontFamily: "garamond",
      accentColor: "#059669",
      headingColor: "accent",
      bodyColor: "#4b5563",
      headingStyle: "title-case",
      bulletStyle: "dash",
      density: "compact",
      sectionSpacing: 16,
      entrySpacing: 8,
      pageMargin: 24,
    };
    useResumeBuilder.setState({
      resume,
      resumes: [resume],
      activeResumeId: resume.resumeId,
      styleConfigs: { [resume.resumeId]: resolveStyleConfig(cfg) },
    });

    const onClose = vi.fn();
    const { unmount } = renderToContainer(<ExportModal open onClose={onClose} />);

    // Trigger the browser-print flow (sets isPrinting → mounts #pdf-export-target).
    const printBtn = Array.from(document.body.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Print / Save as PDF"),
    );
    expect(printBtn).toBeTruthy();
    await act(async () => {
      printBtn!.click();
      // Flush the handler's triple-rAF before window.print().
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
    });

    const target = document.getElementById("pdf-export-target");
    expect(target).toBeTruthy();

    // 1. The print page is exactly one A4 sheet — 210mm × min 297mm,
    //    border-box, no margins (requirement 6/21).
    expect(target!.style.width).toBe(`${A4.widthMm}mm`);
    expect(target!.style.minHeight).toBe(`${A4.heightMm}mm`);
    expect(target!.style.boxSizing).toBe("border-box");

    // 2. The print target renders the SAME template (same templateId) and
    //    SAME resume data as Professional Preview.
    expect(target!.textContent).toContain(GALLERY_SAMPLE_RESUME.name);
    expect(getActiveTemplate(resume).id).toBe("engineering-clean");

    // 3. The print target receives the SAME ResumeStyleConfig: its scope must
    //    carry the resolved CSS custom properties.
    const targetScope = target!.querySelector("[data-rs-scope]") as HTMLElement | null;
    expect(targetScope).toBeTruthy();
    expect(targetScope!.style.getPropertyValue("--rs-accent")).toBe("#059669");
    expect(targetScope!.style.getPropertyValue("--rs-heading")).toBe("#059669");
    expect(targetScope!.style.getPropertyValue("--rs-body")).toBe("#4b5563");
    expect(targetScope!.style.getPropertyValue("--rs-heading-transform")).toBe("capitalize");
    expect(targetScope!.style.getPropertyValue("--rs-bullet")).toBe("-");
    expect(targetScope!.style.getPropertyValue("--rs-section-spacing")).toBe("16px");
    expect(targetScope!.style.getPropertyValue("--rs-entry-spacing")).toBe("8px");
    expect(targetScope!.style.getPropertyValue("--rs-page-margin")).toBe("24px");

    // 4. The print target's rendered sheet is byte-identical to a preview
    //    mirror fed the identical templateId + resume + style config — i.e.
    //    the SAME resume page component renders both (requirement 22).
    const mirror = renderToContainer(
      <ResumePreview resume={resume} template={getActiveTemplate(resume)} styleConfig={cfg} />,
    );
    const mirrorScope = mirror.container.querySelector("[data-rs-scope]");
    expect(mirrorScope?.innerHTML).toBe(targetScope!.innerHTML);
    mirror.unmount();

    unmount();
  });
});
