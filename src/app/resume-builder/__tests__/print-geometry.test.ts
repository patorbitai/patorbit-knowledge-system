import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { A4 } from "@/lib/resume-design-system/geometry";

/** Read the source CSS directly (Vite's CSS pipeline swallows `?raw`). */
const globalsCss = readFileSync(path.resolve(process.cwd(), "src/app/globals.css"), "utf8");

/** Extract a top-level CSS block (`selector { ... }`) handling nested braces. */
function extractBlock(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return "";
  const open = css.indexOf("{", start);
  if (open < 0) return "";
  let depth = 0;
  let i = open;
  for (; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  return css.slice(start, i + 1);
}

const pageRule = extractBlock(globalsCss, "@page");
const printRule = extractBlock(globalsCss, "@media print");
const targetRule = extractBlock(printRule, "#pdf-export-target");

describe("print A4 geometry parity with Professional Preview", () => {
  it("declares a true A4 page with zero browser-added margins", () => {
    expect(pageRule).toContain("size: A4");
    expect(pageRule).toContain("margin: 0");
  });

  it("sizes the printable page exactly 210mm × min 297mm, box-sizing border-box, no margins", () => {
    expect(targetRule).toContain("width: 210mm");
    expect(targetRule).toContain("min-height: 297mm");
    expect(targetRule).toContain("box-sizing: border-box");
    expect(targetRule).toContain("margin: 0");
    expect(targetRule).toContain("padding: 0");
  });

  it("keeps the TS geometry constants in sync with the print CSS (mm)", () => {
    // A4 (794×1123px at 96dpi) must equal the CSS 210×297mm.
    expect(targetRule).toContain(`width: ${A4.widthMm}mm`);
    expect(targetRule).toContain(`min-height: ${A4.heightMm}mm`);
  });

  it("never scales, reflows, or re-sizes the printable page", () => {
    // Requirement 10: no transform: scale() for the printable page.
    expect(printRule).not.toMatch(/transform:\s*scale/i);
    // Requirement 9: no width/height/font/line-height overrides beyond the
    // A4 geometry — the sheet renders at its natural size and typography.
    expect(printRule).not.toMatch(/max-width|min-width/);
    expect(printRule).not.toMatch(/font-size|line-height/);
  });

  it("paginates at the same locations as the preview's fixed A4 windows", () => {
    // The Professional Preview clips content at 1123px page windows; any
    // break-inside: avoid would push whole articles to the next page and
    // shift section positions versus the preview. Requirement 12.
    // Match actual rule declarations only (comments may mention the term).
    expect(printRule).not.toMatch(/^\s*break-inside\s*:\s*avoid\s*;/m);
    expect(printRule).not.toMatch(/^\s*page-break-inside/m);
  });

  it("contains only the resume sheet — app chrome hidden", () => {
    expect(printRule).toContain("body * {");
    expect(printRule).toContain("visibility: hidden");
    expect(printRule).toContain("#pdf-export-target");
    expect(printRule).toContain("visibility: visible");
  });
});
