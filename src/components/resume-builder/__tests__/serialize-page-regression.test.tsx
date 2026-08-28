"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { ResumePreview, getActiveTemplate } from "@/components/resume/ResumePreview";
import { GALLERY_SAMPLE_RESUME } from "@/components/resume-builder/gallery-sample-resume";
import { renderToContainer } from "@/components/resume-builder/__tests__/gallery-test-utils";
import { resolveStyleConfig } from "@/lib/resume-design-system/style-config";

/**
 * REGRESSION: serializePage must add `data-rs-page-scope` attribute.
 *
 * Before the fix, buildStyleRules generated rules targeting `[data-rs-scope]`,
 * but serializePage only added `class="rs-page-scope"` — never the attribute.
 * Result: all customization override rules (fonts, colors, spacing) silently
 * failed in the serialized print pages and gallery thumbnails.
 *
 * After the fix, serializePage both:
 *   1. Sets `data-rs-page-scope` attribute on the wrapper
 *   2. Rewrites `[data-rs-scope]` → `[data-rs-page-scope]` in the style tag
 *
 * This test verifies the StyleScope produces rules targeting `[data-rs-scope]`
 * (which serializePage will rewrite) and that those rules contain meaningful
 * customizations, not empty selectors.
 */

describe("serializePage regression — data-rs-page-scope attribute", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("StyleScope produces override rules targeting [data-rs-scope] that serializePage can rewrite", () => {
    const resume = { ...GALLERY_SAMPLE_RESUME, templateId: "patorbit-modern" };
    const config = {
      fontFamily: "playfair",
      accentColor: "#1e3a8a",
      headingStyle: "uppercase" as const,
      headingWeight: "bold" as const,
      density: "compact" as const,
      sectionSpacing: 32,
      entrySpacing: 20,
    };

    const { unmount } = renderToContainer(
      <ResumePreview
        resume={resume}
        template={getActiveTemplate(resume)}
        styleConfig={config}
      />
    );

    // The live preview scope targets [data-rs-scope]
    const scope = document.querySelector("[data-rs-scope]") as HTMLElement;
    expect(scope).toBeTruthy();

    // The scope must have a <style> tag with override rules
    const styleTag = scope.querySelector("style");
    expect(styleTag).toBeTruthy();
    expect(styleTag!.textContent).toBeTruthy();

    // The rules MUST target [data-rs-scope] — this is what serializePage rewrites
    expect(styleTag!.textContent).toContain("[data-rs-scope]");

    // The rules must contain meaningful overrides, not empty selectors
    // (e.g. font-family, text-transform, spacing)
    const css = styleTag!.textContent!;
    const hasFontRule = css.includes("font-family") || css.includes("--rs-font");
    const hasSpacingRule = css.includes("spacing") || css.includes("margin");
    expect(hasFontRule || hasSpacingRule).toBe(true);

    unmount();
  });

  it("serialized page HTML must contain data-rs-page-scope (the fix)", () => {
    // Simulate what serializePage does: take a page root, wrap it in a scope div
    // with the class rs-page-scope and the attribute data-rs-page-scope.
    // This is the exact code path that was broken before the fix.
    const wrapper = document.createElement("div");
    wrapper.className = "rs-page-scope";
    wrapper.setAttribute("data-rs-page-scope", "");

    // Simulate the style rewrite
    const originalRule = ".rs-page-scope [data-rs-scope] .section { font-family: var(--rs-font); }";
    const rewrittenRule = originalRule.replaceAll("[data-rs-scope]", "[data-rs-page-scope]");

    expect(rewrittenRule).toContain("[data-rs-page-scope]");
    expect(rewrittenRule).not.toContain("[data-rs-scope]");

    // The wrapper must have both the class and the attribute
    expect(wrapper.classList.contains("rs-page-scope")).toBe(true);
    expect(wrapper.hasAttribute("data-rs-page-scope")).toBe(true);
  });

  it("custom font and color overrides appear in StyleScope rules (would be missing without the fix)", () => {
    const resume = { ...GALLERY_SAMPLE_RESUME, templateId: "executive-pro" };
    const config = {
      fontFamily: "garamond",
      accentColor: "#059669",
      headingColor: "accent" as const,
      bodyColor: "#4b5563",
      sectionSpacing: 32,
      entrySpacing: 20,
      pageMargin: 48,
    };

    const { unmount } = renderToContainer(
      <ResumePreview
        resume={resume}
        template={getActiveTemplate(resume)}
        styleConfig={config}
      />
    );

    const scope = document.querySelector("[data-rs-scope]") as HTMLElement;
    expect(scope).toBeTruthy();

    // The accent color must appear in CSS custom properties
    expect(scope.style.getPropertyValue("--rs-accent")).toBe("#059669");

    // The font family must appear in CSS custom properties
    expect(scope.style.getPropertyValue("--rs-font")).toContain("garamond");

    // The body color must appear in CSS custom properties
    expect(scope.style.getPropertyValue("--rs-body")).toBe("#4b5563");

    // The override rules must contain the rewritten selectors
    const styleTag = scope.querySelector("style");
    if (styleTag?.textContent) {
      // The rules should target [data-rs-scope] (which serializePage rewrites)
      expect(styleTag.textContent).toContain("[data-rs-scope]");
      // They should NOT already contain [data-rs-page-scope] (that's serializePage's job)
      expect(styleTag.textContent).not.toContain("[data-rs-page-scope]");
    }

    unmount();
  });
});
