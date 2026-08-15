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

/** Templates the task requires to be verified (8) + representative legacy users of the shared SocialLinks component. */
const TEMPLATES_UNDER_TEST = [
  "patorbit-modern",
  "minimal-ats",
  "executive-pro",
  "engineering-clean",
  "consulting-elite",
  "product-manager",
  "academic-cv",
  "creative-professional",
  "modern-clean", // SocialLinks component user
  "tech-mono",    // legacy SocialLinks user
  "dark-elegance",// legacy SocialLinks user
];

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

describe("LinkedIn/GitHub hyperlinks across all template families", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders real, normalized hyperlinks in every template family", () => {
    for (const id of TEMPLATES_UNDER_TEST) {
      const { unmount } = renderToContainer(
        <ResumePreview resume={SOCIAL_RESUME} template={templateOf(id)} />,
      );

      const linkedin = socialAnchor("https://linkedin.com/in/jordanrivera");
      expect(linkedin, `${id}: linkedin anchor`).toBeTruthy();
      expect(linkedin?.getAttribute("target"), `${id}: linkedin target`).toBe("_blank");
      expect(linkedin?.getAttribute("rel"), `${id}: linkedin rel`).toBe("noopener noreferrer");
      // ATS-safe: the visible text is the real profile URL as plain DOM text.
      expect(linkedin?.textContent, `${id}: linkedin text`).toBe("linkedin.com/in/jordanrivera");
      // No SVG icons inside the LinkedIn/GitHub anchors.
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

  it("never double-prefixes an already-absolute LinkedIn/GitHub URL", () => {
    const withProtocol = {
      ...SOCIAL_RESUME,
      social: {
        ...SOCIAL_RESUME.social,
        linkedin: "https://linkedin.com/in/jordanrivera",
        github: "https://github.com/jordanrivera",
      },
    };
    const { unmount } = renderToContainer(
      <ResumePreview resume={withProtocol} template={templateOf("minimal-ats")} />,
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
    const { unmount } = renderToContainer(
      <ResumePreview resume={noSocial} template={templateOf("minimal-ats")} />,
    );
    expect(document.querySelector('a[href*="linkedin"]')).toBeNull();
    expect(document.querySelector('a[href*="github"]')).toBeNull();
    unmount();
  });
});
