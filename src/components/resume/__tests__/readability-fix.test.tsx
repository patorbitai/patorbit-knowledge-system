"use strict";

/**
 * Readability-fix regressions (resume readability + bullet completeness):
 *
 *   A. An experience entry with 4 bullets renders ALL 4.
 *   B. An experience entry with 6+ bullets renders ALL of them — the default
 *      content plan must never silently truncate to a one-page budget.
 *   D. Typography changes (Text size tier, Heading size tier) reach the live
 *      preview through the style config: --rs-type carries the factor and the
 *      heading rules are injected when the tier diverges from Standard.
 *
 * Multi-page flow (C) is covered by the pagination suite + manual visual QA
 * (jsdom has no layout); DOCX parity (E) lives in export-docx-typography.test.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { ResumePreview } from "../ResumePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { renderToContainer } from "@/components/resume-builder/__tests__/gallery-test-utils";
import { EARLY_CAREER, makeResume } from "@/lib/resume-planner/__tests__/fixtures";

// Rendering four flagship templates can exceed the 5s default under
// full-suite worker load — timeouts, not assertions.
vi.setConfig({ testTimeout: 20000, hookTimeout: 20000 });

function templateOf(id: string) {
  const t = TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`template ${id} not found`);
  return t;
}

function resumeWithBullets(count: number) {
  const bullets = Array.from({ length: count }, (_, i) => `Achievement number ${i + 1} with enough words`);
  return makeResume({
    name: "Jordan Lee",
    title: "Senior Software Engineer",
    email: "jordan@example.com",
    summary: "Engineer with a decade of experience building reliable systems and leading teams.",
    experience: [
      { ...EARLY_CAREER.experience[0], id: "x1", company: "Acme Corp", position: "Senior Engineer", bulletPoints: bullets },
    ],
  });
}

function renderedText(resume: ReturnType<typeof resumeWithBullets>, templateId: string) {
  const { unmount } = renderToContainer(
    <ResumePreview resume={resume} template={templateOf(templateId)} />,
  );
  const text = document.body.textContent ?? "";
  unmount();
  return text;
}

describe("A/B — bullet completeness in the preview (no silent truncation)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders all 4 bullets of a four-bullet experience entry", () => {
    const resume = resumeWithBullets(4);
    for (const id of ["modern-clean", "minimal-ats"]) {
      const text = renderedText(resume, id);
      for (let i = 1; i <= 4; i++) {
        expect(text, `${id} bullet ${i}`).toContain(`Achievement number ${i}`);
      }
    }
  });

  it("renders all 6+ bullets — the default plan never trims to a page budget", () => {
    const resume = resumeWithBullets(7);
    for (const id of ["modern-clean", "minimal-ats"]) {
      const text = renderedText(resume, id);
      for (let i = 1; i <= 7; i++) {
        expect(text, `${id} bullet ${i}`).toContain(`Achievement number ${i}`);
      }
    }
  });
});

describe("D — typography controls reach the live preview", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("templates declare sizes via rs() so the Text size tier scales them", () => {
    const { unmount } = renderToContainer(
      <ResumePreview
        resume={resumeWithBullets(3)}
        template={templateOf("modern-clean")}
        styleConfig={{ fontScale: 1.1 }}
      />,
    );
    const scope = document.querySelector("[data-rs-scope]") as HTMLElement;
    expect(scope.style.getPropertyValue("--rs-type")).toBe("1.1");
    // At least one element declares a calc() size driven by --rs-type.
    expect(scope.innerHTML).toContain("calc(var(--rs-type, 1) *");
    // Body/bullet text is in the readable range (14px ≈ 10.5pt at 96dpi A4).
    expect(scope.innerHTML).toContain("* 14px)");
    unmount();
  });

  it("emits heading-size rules when the Heading size tier diverges", () => {
    const { unmount } = renderToContainer(
      <ResumePreview
        resume={resumeWithBullets(3)}
        template={templateOf("modern-clean")}
        styleConfig={{ headingScale: "prominent" }}
      />,
    );
    const style = document.querySelector("[data-rs-scope] style");
    expect(style?.textContent).toContain("[data-rs-scope] h1 { font-size: calc(var(--rs-type, 1) * 37px) !important; }");
    expect(style?.textContent).toContain("[data-rs-scope] h2 { font-size: calc(var(--rs-type, 1) * 17.5px) !important; }");
    unmount();

    document.body.innerHTML = "";
    const { unmount: unmount2 } = renderToContainer(
      <ResumePreview resume={resumeWithBullets(3)} template={templateOf("modern-clean")} />,
    );
    // Standard (default) → native template headings, zero overrides.
    expect(document.querySelector("[data-rs-scope] style")).toBeNull();
    unmount2();
  });
});
