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
 * M4: EVERY template renders social links as clickable <a> elements (with
 * href). This list deliberately includes templates that used to render
 * plain <span> text — the regression guard against falling back.
 */
const ANCHOR_TEMPLATES = [
  "patorbit-modern",
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

  it(
    "every template renders LinkedIn + GitHub as real anchors with correct attributes",
    { timeout: 60000 },
    () => {
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
    },
  );

  it(
    "every template renders Website + Portfolio as real anchors",
    { timeout: 60000 },
    () => {
      for (const id of ANCHOR_TEMPLATES) {
        const { unmount } = renderToContainer(
          <ResumePreview resume={SOCIAL_RESUME} template={templateOf(id)} />,
        );

        const website = socialAnchor("https://jordanrivera.dev");
        expect(website, `${id}: website anchor`).toBeTruthy();
        const portfolio = socialAnchor("https://jordanrivera.dev/work");
        expect(portfolio, `${id}: portfolio anchor`).toBeTruthy();

        unmount();
        document.body.innerHTML = "";
      }
    },
  );

  it(
    "every template renders email as a mailto: link and phone as a tel: link",
    { timeout: 60000 },
    () => {
      for (const id of ANCHOR_TEMPLATES) {
        const { unmount } = renderToContainer(
          <ResumePreview resume={SOCIAL_RESUME} template={templateOf(id)} />,
        );

        const mail = socialAnchor("mailto:jordan.rivera@example.com");
        expect(mail, `${id}: mailto anchor`).toBeTruthy();

        // "+1 (415) 555-0184" → tel:+14155550184
        const tel = socialAnchor("tel:+14155550184");
        expect(tel, `${id}: tel anchor`).toBeTruthy();

        unmount();
        document.body.innerHTML = "";
      }
    },
  );

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

  it(
    "unsafe schemes (javascript:, data:) are NEVER rendered as anchors — text stays visible",
    { timeout: 60000 },
    () => {
      const unsafe = {
        ...SOCIAL_RESUME,
        social: {
          ...SOCIAL_RESUME.social,
          linkedin: "javascript:alert(1)",
          github: "data:text/html,<script>x</script>",
        },
      };
      for (const id of ANCHOR_TEMPLATES) {
        const { unmount } = renderToContainer(
          <ResumePreview resume={unsafe} template={templateOf(id)} />,
        );

        expect(document.querySelector('a[href^="javascript:"]'), `${id}: js href`).toBeNull();
        expect(document.querySelector('a[href^="data:"]'), `${id}: data href`).toBeNull();
        // The user's text is still visible (as plain text) — never silently dropped.
        const text = document.body.textContent ?? "";
        expect(text, `${id}: visible text`).toContain("javascript:alert(1)");

        unmount();
        document.body.innerHTML = "";
      }
    },
  );

  it(
    "non-clickable fallback text uses the muted metadata token — never the accent/link colour",
    { timeout: 60000 },
    () => {
      // "sophiachen_mktg" has no dot → toSafeHref rejects it (ok: false), so it
      // renders as a plain <span> inside the accent-coloured social row.
      const fallback = {
        ...SOCIAL_RESUME,
        social: {
          ...SOCIAL_RESUME.social,
          website: "sophiachen_mktg",
        },
      };
      for (const id of ["modern-clean", "patorbit-modern", "engineering-clean", "minimal-ats"]) {
        const { unmount } = renderToContainer(
          <ResumePreview resume={fallback} template={templateOf(id)} />,
        );

        const spans = [...document.querySelectorAll("span")].filter(
          (s) =>
            s.children.length === 0 &&
            (s.textContent ?? "").includes("sophiachen_mktg"),
        );
        expect(spans.length, `${id}: fallback span visible`).toBeGreaterThan(0);
        for (const span of spans) {
          expect(span.closest("a"), `${id}: not clickable`).toBeNull();
          // Declared colour follows the metadata token (never inherits accent blue).
          expect(span.style.color, `${id}: muted token`).toContain("--resume-muted");
        }

        unmount();
        document.body.innerHTML = "";
      }
    },
  );
});
