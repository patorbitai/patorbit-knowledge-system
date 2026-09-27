"use strict";

/**
 * M4B — template visual-system consistency.
 *
 * Renders representative templates from different families and asserts the
 * one-design-system rules from the M4B brief:
 *   - professional headings are dark neutral (accent is reserved for links)
 *   - creative families keep their expressive accent on purpose
 *   - experience hierarchy: bold company, secondary400-weight dates,
 *     neutral bullet glyphs, readable body text
 *   - education collapses into two rows (no orphan lines / gaps)
 *   - default skill rendering is a list, not UI chips (creative keeps chips)
 *   - section spacing flows through the --resume-* tokens
 *   - contact links keep real anchor semantics (M4 regression)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { renderToContainer } from "@/components/resume-builder/__tests__/gallery-test-utils";
import { makeResume, MID_CAREER } from "@/lib/resume-planner/__tests__/fixtures";

vi.setConfig({ testTimeout: 20000, hookTimeout: 20000 });

function templateOf(id: string) {
  const t = TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`template ${id} not found`);
  return t;
}

function renderResume(templateId: string, resume = MID_CAREER) {
  const { unmount } = renderToContainer(
    <ResumePreview resume={resume} template={templateOf(templateId)} />,
  );
  const scope = document.querySelector("[data-rs-scope]") as HTMLElement;
  return { scope, unmount };
}

/** jsdom cannot evaluate calc()/var() — read the token FALLBACK px that the
 *  inline style carries (e.g. `calc(var(--rs-type,1) * var(--resume-name,30px))` →30). */
function fallbackPx(el: Element): number | null {
  const fs =
    getComputedStyle(el).fontSize ||
    (el as HTMLElement).style?.fontSize ||
    "";
  const matches = [...fs.matchAll(/(\d+(?:\.\d+)?)px/g)];
  return matches.length ? parseFloat(matches[matches.length - 1][1]) : null;
}

/** The declared font-size string (raw calc() in jsdom). */
function declaredFontSize(el: Element): string {
  return getComputedStyle(el).fontSize || (el as HTMLElement).style?.fontSize || "";
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("professional families use dark-neutral headings (accent = links only)", () => {
  it("modern-clean section headings render near-black, not accent blue", () => {
    const { scope, unmount } = renderResume("modern-clean");
    const h2s = [...scope.querySelectorAll("h2")];
    expect(h2s.length).toBeGreaterThan(0);
    for (const h2 of h2s) {
      const color = getComputedStyle(h2).color;
      // #0f172a family — never the #2563eb accent
      expect(color).not.toBe("rgb(37, 99, 235)");
      const [, , b] = color.match(/\d+/g)!.map(Number);
      expect(b).toBeLessThanOrEqual(60);
    }
    // Job title under the name is neutral too.
    const title = [...scope.querySelectorAll("p")].find(
      (p) => p.textContent === MID_CAREER.title,
    );
    if (title) expect(getComputedStyle(title).color).not.toBe("rgb(37, 99, 235)");
    unmount();
  });

  it("minimal-ats (classic ATS) headings are neutral with a hairline rule", () => {
    const { scope, unmount } = renderResume("minimal-ats");
    const h2 = scope.querySelector("h2")!;
    const [, , b] = getComputedStyle(h2).color.match(/\d+/g)!.map(Number);
    expect(b).toBeLessThanOrEqual(60);
    expect(declaredFontSize(h2)).toContain("--resume-section");
    expect(fallbackPx(h2)).toBeGreaterThanOrEqual(14);
    expect(fallbackPx(h2)).toBeLessThanOrEqual(16);
    unmount();
  });

  it("creative families keep their expressive accent on purpose", () => {
    const { scope, unmount } = renderResume("creative-professional");
    const h2 = scope.querySelector("h2")!;
    // #8b5cf6 violet — expressive identity, deliberately NOT neutral
    expect(getComputedStyle(h2).color).toBe("rgb(139, 92, 246)");
    unmount();
  });
});

describe("experience hierarchy (company > role > body; dates secondary)", () => {
  it("renders bold company,400-weight muted dates, readable body", () => {
    const { scope, unmount } = renderResume("modern-clean");
    const company = [...scope.querySelectorAll("span")].find(
      (s) => s.textContent === "Northwind Data" || s.textContent === MID_CAREER.experience[0].company,
    )!;
    expect(company).toBeTruthy();
    expect(getComputedStyle(company).fontWeight).toBe("700");
    expect(declaredFontSize(company)).toContain("--resume-company");
    expect(fallbackPx(company)).toBeGreaterThanOrEqual(14);
    expect(fallbackPx(company)).toBeLessThanOrEqual(15);

    // The date sits in the same row, right-aligned, secondary.
    const row = company.parentElement!;
    const date = [...row.querySelectorAll("span")].find((s) => s !== company && /\d{4}|Present|yr/i.test(s.textContent));
    expect(date).toBeTruthy();
    expect(getComputedStyle(date!).fontWeight).toBe("400");

    // Body bullets are readable and neutral.
    const li = scope.querySelector("li")!;
    expect(fallbackPx(li)).toBeGreaterThanOrEqual(12.5);
    const [, , lb] = getComputedStyle(li).color.match(/\d+/g)!.map(Number);
    expect(lb).toBeLessThanOrEqual(120); // never blue body

    // Glyph is decorative and muted (not accent-colored) in professional families.
    const glyph = [...li.querySelectorAll("span")].find((s) => s.textContent.trim().length <= 3);
    if (glyph) {
      expect(fallbackPx(glyph)).toBeGreaterThanOrEqual(11.5);
      const [gr, , gb] = getComputedStyle(glyph).color.match(/\d+/g)!.map(Number);
      expect(gb - gr).toBeLessThanOrEqual(40); // not blue
    }
    unmount();
  });

  it("no readable text falls below the11.5px floor", () => {
    const { scope, unmount } = renderResume("modern-clean");
    for (const el of scope.querySelectorAll("p, span, li, h1, h2")) {
      if (el.children.length === 0 && el.textContent.trim().length > 2) {
        const size = fallbackPx(el);
        if (size !== null) expect(size).toBeGreaterThanOrEqual(11.5);
      }
    }
    unmount();
  });
});

describe("education renders two tight rows (no unexplained gaps)", () => {
  it("collapses honors/location into the degree row", () => {
    const resume = makeResume({
      ...MID_CAREER,
      education: [
        {
          id: "ed1",
          school: "State University",
          degree: "B.S.",
          field: "Computer Science",
          year: "2014 – 2018",
          gpa: "3.8",
          minor: "",
          honors: "magna cum laude",
          activities: "",
          location: "Berkeley, CA",
        },
      ],
    });
    const { scope, unmount } = renderResume("modern-clean", resume);
    const school = [...scope.querySelectorAll("span")].find(
      (s) => s.textContent === "State University",
    )!;
    expect(school).toBeTruthy();
    const entry = school.closest("div")!.parentElement!;
    // Exactly two rows: [school + year] and [degree + meta] — no orphan lines.
    expect(entry.children.length).toBe(2);
    const detailRow = entry.children[1];
    expect(detailRow.textContent).toContain("B.S. in Computer Science");
    expect(detailRow.textContent).toContain("magna cum laude");
    expect(detailRow.textContent).toContain("Berkeley, CA");
    // Row one carries the date right-aligned as secondary meta.
    const year = [...entry.children[0].querySelectorAll("span")].find((s) => /\d{4}/.test(s.textContent));
    expect(year).toBeTruthy();
    expect(getComputedStyle(year!).fontWeight).toBe("400");
    unmount();
  });
});

describe("skills default to a list, not UI chips", () => {
  it("professional templates render no boxed chips by default", () => {
    for (const id of ["modern-clean", "minimal-ats", "premium-slate"]) {
      const { scope, unmount } = renderResume(id);
      expect(document.body.innerHTML).not.toContain("data-rs-skills");
      // Skill names still render as readable text.
      expect(scope.textContent).toContain(MID_CAREER.skills[0].name);
      unmount();
      document.body.innerHTML = "";
    }
  });

  it("creative families keep controlled chips (template identity)", () => {
    const { scope, unmount } = renderResume("creative-professional");
    expect(scope.querySelector("[data-rs-skills]")).toBeTruthy();
    unmount();
  });
});

describe("section rhythm flows through --resume-* tokens", () => {
  it("sections use the section-gap token and headings the heading-gap token", () => {
    const { scope, unmount } = renderResume("modern-clean");
    expect(scope.innerHTML).toContain("--resume-section-gap");
    expect(scope.innerHTML).toContain("--resume-heading-gap");
    expect(scope.innerHTML).toContain("--resume-item-gap");
    expect(scope.innerHTML).toContain("--resume-bullet-gap");
    // The scope root carries the full variable contract for serializePage.
    expect(scope.style.getPropertyValue("--resume-name")).toBe("30px");
    expect(scope.style.getPropertyValue("--resume-section-gap")).toBe("20px");
    expect(scope.style.getPropertyValue("--resume-heading")).toBe("#0f172a");
    unmount();
  });
});

describe("user style config: accent customizes accent elements only", () => {
  const ACCENT = "#7c3aed";
  const ACCENT_RGB = "rgb(124, 58, 237)";

  function renderStyled(styleConfig: Record<string, unknown>) {
    const { unmount } = renderToContainer(
      <ResumePreview
        resume={MID_CAREER}
        template={templateOf("modern-clean")}
        styleConfig={styleConfig as never}
      />,
    );
    const scope = document.querySelector("[data-rs-scope]") as HTMLElement;
    return { scope, unmount };
  }

  it("a passive accent choice does not recolor body, headings, dates or companies", () => {
    const { scope, unmount } = renderStyled({ accentColor: ACCENT });
    // The accent token reaches the scope (links/accents can use it)…
    expect(scope.style.getPropertyValue("--rs-accent")).toBe(ACCENT);
    // …but without an explicit heading-color choice, headings stay ink.
    const h2 = scope.querySelector("h2")!;
    expect(getComputedStyle(h2).color).not.toBe(ACCENT_RGB);
    // Body, dates and companies are untouched.
    const li = scope.querySelector("li")!;
    expect(getComputedStyle(li).color).not.toBe(ACCENT_RGB);
    expect(getComputedStyle(li).color).not.toContain("37, 99, 235"); // never blue
    const company = [...scope.querySelectorAll("span")].find(
      (s) => s.textContent === MID_CAREER.experience[0].company,
    )!;
    expect(getComputedStyle(company).color).not.toBe(ACCENT_RGB);
    const row = company.parentElement!;
    const date = [...row.querySelectorAll("span")].find(
      (s) => s !== company && /\d{4}|Present/.test(s.textContent),
    )!;
    expect(getComputedStyle(date).color).not.toBe(ACCENT_RGB);
    unmount();
  });

  it("an explicit headingColor:'accent' uses the user accent on headings — and only headings", () => {
    const { scope, unmount } = renderStyled({ accentColor: ACCENT, headingColor: "accent" });
    const h2 = scope.querySelector("h2")!;
    expect(getComputedStyle(h2).color).toBe(ACCENT_RGB);
    // Body + metadata keep their own colors even while headings take the accent.
    const li = scope.querySelector("li")!;
    expect(getComputedStyle(li).color).not.toBe(ACCENT_RGB);
    const company = [...scope.querySelectorAll("span")].find(
      (s) => s.textContent === MID_CAREER.experience[0].company,
    )!;
    expect(getComputedStyle(company).color).not.toBe(ACCENT_RGB);
    unmount();
  });

  it("an explicit bodyColor choice drives body text — accent does not leak in", () => {
    const { scope, unmount } = renderStyled({ accentColor: ACCENT, bodyColor: "#4b5563" });
    const li = scope.querySelector("li")!;
    expect(getComputedStyle(li).color).toBe("rgb(75, 85, 99)");
    expect(getComputedStyle(li).color).not.toBe(ACCENT_RGB);
    unmount();
  });
});

describe("M4 links keep anchor semantics in the redesigned templates", () => {
  it("email renders as a real mailto anchor", () => {
    const { scope, unmount } = renderResume("modern-clean");
    const mailto = scope.querySelector('a[href^="mailto:"]');
    expect(mailto).toBeTruthy();
    expect(mailto!.getAttribute("href")).toContain("@");
    unmount();
  });
});

describe("section ordering still works", () => {
  it("default order renders summary before experience before education", () => {
    const { scope, unmount } = renderResume("modern-clean");
    const heads = [...scope.querySelectorAll("h2")].map((h) => h.textContent);
    const idx = (needle: string) => heads.findIndex((h) => h!.toLowerCase().includes(needle));
    expect(idx("summary")).toBeGreaterThanOrEqual(0);
    expect(idx("experience")).toBeGreaterThan(idx("summary"));
    expect(idx("education")).toBeGreaterThan(idx("experience"));
    unmount();
  });
});
