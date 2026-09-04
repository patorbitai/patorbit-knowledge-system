"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { normalizeSocialUrl, socialUrlLabel } from "../shared";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { GALLERY_SAMPLE_RESUME } from "@/components/resume-builder/gallery-sample-resume";
import { renderToContainer } from "@/components/resume-builder/__tests__/gallery-test-utils";

function templateOf(id: string) {
  const t = TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`template ${id} not found`);
  return t;
}

const SOCIAL_RESUME = {
  ...GALLERY_SAMPLE_RESUME,
  social: {
    ...GALLERY_SAMPLE_RESUME.social,
    linkedin: "linkedin.com/in/jordanrivera", // bare — must be normalized
    github: "github.com/jordanrivera",        // bare — must be normalized
  },
};

/**
 * Templates that render social links as clickable <a> elements (with href).
 * These require full anchor-attribute verification.
 */
const ANCHOR_TEMPLATES = [
  "patorbit-modern",
];

/**
 * Templates that render social links as plain <span> text (no <a> href).
 * These verify social text is visible but don't produce clickable anchors.
 */
const SPAN_TEMPLATES = [
  "minimal-ats",
  "executive-pro",
  "engineering-clean",
  "consulting-elite",
  "product-manager",
  "academic-cv",
  "creative-professional",
  "modern-clean",
  "tech-mono",
  "dark-elegance",
];

/** All templates under test. */
const ALL_TEMPLATES = [...ANCHOR_TEMPLATES, ...SPAN_TEMPLATES];

function socialAnchor(href: string): HTMLAnchorElement | null {
  return document.querySelector(`a[href="${href}"]`);
}

describe("normalizeSocialUrl / socialUrlLabel", () => {
  it("prefixes bare profile URLs with https://", () => {
    expect(normalizeSocialUrl("linkedin.com/in/jane")).toBe("https://linkedin.com/in/jane");
    expect(normalizeSocialUrl("github.com/jane")).toBe("https://github.com/jane");
  });

  it("never double-prefixes URLs that already carry a protocol", () => {
    expect(normalizeSocialUrl("https://linkedin.com/in/jane")).toBe("https://linkedin.com/in/jane");
    expect(normalizeSocialUrl("http://github.com/jane")).toBe("http://github.com/jane");
    expect(normalizeSocialUrl("HTTPS://EXAMPLE.com/x")).toBe("HTTPS://EXAMPLE.com/x");
    expect(normalizeSocialUrl("https://https://bad")).toBe("https://https://bad"); // input is preserved as-is
  });

  it("handles empty, null, and whitespace-only values", () => {
    expect(normalizeSocialUrl("")).toBe("");
    expect(normalizeSocialUrl(undefined)).toBe("");
    expect(normalizeSocialUrl(null)).toBe("");
    expect(normalizeSocialUrl("   ")).toBe("");
  });

  it("socialUrlLabel strips the protocol and trailing slashes for clean visible text", () => {
    expect(socialUrlLabel("linkedin.com/in/jane")).toBe("linkedin.com/in/jane");
    expect(socialUrlLabel("https://github.com/jane/")).toBe("github.com/jane");
    expect(socialUrlLabel(undefined)).toBe("");
  });
});

describe("social links rendering across template families", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("templates with <a> social links render proper anchors with correct attributes", () => {
    for (const id of ANCHOR_TEMPLATES) {
      const { unmount } = renderToContainer(
        <ResumePreview resume={SOCIAL_RESUME} template={templateOf(id)} />,
      );

      const linkedin = socialAnchor("https://linkedin.com/in/jordanrivera");
      expect(linkedin, `${id}: linkedin anchor`).toBeTruthy();
      expect(linkedin?.getAttribute("target"), `${id}: linkedin target`).toBe("_blank");
      expect(linkedin?.getAttribute("rel"), `${id}: linkedin rel`).toBe("noopener noreferrer");
      expect(linkedin?.textContent, `${id}: linkedin text`).toBe("linkedin.com/in/jordanrivera");
      expect(linkedin?.querySelector("svg"), `${id}: linkedin svg`).toBeNull();

      const github = socialAnchor("https://github.com/jordanrivera");
      expect(github, `${id}: github anchor`).toBeTruthy();
      expect(github?.getAttribute("target"), `${id}: github target`).toBe("_blank");
      expect(github?.getAttribute("rel"), `${id}: github rel`).toBe("noopener noreferrer");
      expect(github?.textContent, `${id}: github text`).toBe("github.com/jordanrivera");
      expect(github?.querySelector("svg"), `${id}: github svg`).toBeNull();

      unmount();
      document.body.innerHTML = "";
    }
  });

  it("templates with <span> social links render the profile URL text", { timeout: 30000 }, () => {
    for (const id of SPAN_TEMPLATES) {
      const { unmount } = renderToContainer(
        <ResumePreview resume={SOCIAL_RESUME} template={templateOf(id)} />,
      );

      // These templates render social links as <span> text, not <a> anchors.
      // Verify the LinkedIn/GitHub text is present in the DOM.
      const text = document.body.textContent ?? "";
      expect(text, `${id}: linkedin text`).toContain("linkedin.com/in/jordanrivera");
      expect(text, `${id}: github text`).toContain("github.com/jordanrivera");

      unmount();
      document.body.innerHTML = "";
    }
  });

  it("never double-prefixes an already-absolute LinkedIn/GitHub URL", () => {
    const withProtocol = {
      ...SOCIAL_RESUME,
      social: {
        ...SOCIAL_RESUME.social,
        linkedin: "https://linkedin.com/in/jordanrivera",
        github: "https://github.com/jordanrivera",
      },
    };
    // Use an anchor template that renders <a> elements
    const { unmount } = renderToContainer(
      <ResumePreview resume={withProtocol} template={templateOf("patorbit-modern")} />,
    );
    expect(socialAnchor("https://linkedin.com/in/jordanrivera")).toBeTruthy();
    expect(socialAnchor("https://github.com/jordanrivera")).toBeTruthy();
    expect(document.querySelector('a[href*="https://https://"]')).toBeNull();
    unmount();
  });

  it("omits the LinkedIn/GitHub link entirely when the value is missing", () => {
    const noSocial = {
      ...SOCIAL_RESUME,
      social: { linkedin: "", github: "", website: "", portfolio: "", twitter: "", stackoverflow: "" },
    };
    // Use an anchor template that renders <a> elements
    const { unmount } = renderToContainer(
      <ResumePreview resume={noSocial} template={templateOf("patorbit-modern")} />,
    );
    expect(document.querySelector('a[href*="linkedin"]')).toBeNull();
    expect(document.querySelector('a[href*="github"]')).toBeNull();
    unmount();
  });
});
