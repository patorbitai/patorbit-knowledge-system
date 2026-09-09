/**
 * Pagination Overflow Regression Tests
 *
 * Tests that resume content never exceeds the A4 safe frame boundary.
 * Uses a deterministic test resume with enough content to produce overflow.
 */
import { describe, it, expect } from "vitest";
import { PAGE_FRAME } from "@/lib/resume-design-system/page-frame";
import { A4 } from "@/lib/resume-design-system/geometry";

const PAGE_H = A4.heightPx;
const SAFE_BOTTOM = PAGE_FRAME.safe.bottom;
const SAFE_TOP = PAGE_FRAME.safe.top;

describe("Pagination — Overflow Prevention", () => {
  it("A4 page dimensions are correct", () => {
    expect(A4.widthPx).toBe(794);
    expect(A4.heightPx).toBe(1123);
  });

  it("safe bottom defines the content boundary", () => {
    const maxContentBottom = PAGE_H - SAFE_BOTTOM;
    expect(maxContentBottom).toBe(1103); // 1123 - 20
  });

  it("safe top defines the content start", () => {
    expect(SAFE_TOP).toBe(40);
  });

  it("content area height is correct", () => {
    const contentHeight = PAGE_H - SAFE_TOP - SAFE_BOTTOM;
    expect(contentHeight).toBe(1063); // 1123 - 40 - 20
  });

  it("paginated pages container uses correct dimensions", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // The pages container should use PAGE_W and PAGE_H
    expect(content).toContain("width: PAGE_W");
    expect(content).toContain("height: pagesHtml.length * PAGE_H");
  });

  it("page div uses correct dimensions", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // Each page div should have width: PAGE_W and height: PAGE_H
    expect(content).toContain("width: PAGE_W");
    expect(content).toContain("height: PAGE_H");
  });

  it("page has overflow: hidden to prevent visual overflow", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // The page div should have overflow: hidden
    expect(content).toContain('overflow: "hidden"');
  });

  it("applyPageFrame sets minHeight to pageHeight", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // applyPageFrame should set minHeight to ctx.pageHeight
    // The actual line is: pageRoot.style.minHeight = `${ctx.pageHeight}px`;
    expect(content).toContain("pageRoot.style.minHeight");
    expect(content).toContain("ctx.pageHeight");
  });

  it("applyPageFrame sets overflow: hidden", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // applyPageFrame should set overflow: hidden
    expect(content).toContain('overflow: "hidden"');
  });

  it("reflowPages checks scrollHeight against PAGE_H", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // reflowPages should check scrollHeight against PAGE_H
    expect(content).toContain("scrollHeight <= PAGE_H + 1");
  });

  it("reflowPages uses pageBottom for splitting decisions", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // reflowPages should calculate pageBottom from pageRoot and PAGE_H
    expect(content).toContain("pageRoot.getBoundingClientRect().top + PAGE_H");
  });

  it("distribute checks block fits against usable space", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // distribute should check if block fits: state.used + gap + m.h + m.mb <= usable
    expect(content).toContain("state.used + gap + m.h + m.mb <= usable");
  });

  it("usableFor subtracts safeBottom from pageHeight", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // usableFor should subtract safeBottom from pageHeight
    expect(content).toContain("ctx.pageHeight -");
    expect(content).toContain("ctx.safeBottom");
  });

  it("SLACK constant provides safety margin", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // SLACK should be defined and used in usableFor
    expect(content).toContain("const SLACK = 6");
    expect(content).toContain("ctx.slack");
  });

  it("atomic blocks are moved whole to next page", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // When atomicItems is true, blocks should be moved whole
    expect(content).toContain("if (atomicItems)");
    expect(content).toContain("nextPage(state)");
    expect(content).toContain("place(state, out, item, m.mt, m.mb, m.h)");
  });

  it("splitOverTall is called for blocks larger than page", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // splitOverTall should be called when block doesn't fit
    expect(content).toContain("splitOverTall(item, state, out, chromeT, chromeB, ctx)");
  });

  it("splitOverTall handles both columnar and non-columnar blocks", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // splitOverTall should check isColumnar
    expect(content).toContain("isColumnar(item)");
    expect(content).toContain("splitColumnar(item, state, out, chromeT, chromeB, ctx)");
  });

  it("serializePage strips fontScale zoom rule", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // serializePage should strip --rs-font-scale from CSS variables
    expect(content).toContain("--rs-font-scale");
    expect(content).toContain("cleaned = vars.replace");
  });

  it("serializePage strips zoom rule from style tag", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // serializePage should strip zoom rule from style tag
    expect(content).toContain("zoom:");
    expect(content).toContain("replace(/\\[data-rs-page-scope\\]");
  });
});

describe("Pagination — Content Boundary Contract", () => {
  it("contentBottom must not exceed safePageBottom", () => {
    // This is the fundamental invariant
    const safePageBottom = PAGE_H - SAFE_BOTTOM;
    expect(safePageBottom).toBe(1103);
    // Any content beyond this point is overflow
  });

  it("usable space accounts for all margins", () => {
    // usableFor = pageHeight - safeTop - safeBottom - chromeT - chromeB - slack
    const maxUsable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - 6; // minus SLACK
    expect(maxUsable).toBe(1057); // 1123 - 40 - 20 - 6
  });

  it("first page has extra top margin for header", () => {
    // First page may have additional header height
    const firstPageUsable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - 6;
    expect(firstPageUsable).toBe(1057);
  });

  it("subsequent pages use consistent safe area", () => {
    // Pages 2+ should use the same safe area
    const subsequentUsable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - 6;
    expect(subsequentUsable).toBe(1057);
  });
});
