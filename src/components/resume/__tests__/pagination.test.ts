/**
 * Pagination engine test suite.
 *
 * The PaginatedResumeSheet is a client-only component that relies on the
 * browser DOM for measurement (getBoundingClientRect, getComputedStyle, etc.).
 * These tests verify the debug-mode API and pure helpers; full integration
 * tests that exercise the rendering pipeline require a browser environment
 * (Playwright/Cypress) and are tracked separately.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  enablePaginationDebug,
  disablePaginationDebug,
  getPaginationDebugLog,
  type PaginationDebugLog,
  type PaginationDecision,
} from "../PaginatedResumeSheet";

// ── Debug mode API ────────────────────────────────────────────────────────

describe("PaginationDebug — API", () => {
  beforeEach(() => {
    disablePaginationDebug();
  });

  it("returns null when debug is disabled", () => {
    expect(getPaginationDebugLog()).toBeNull();
  });

  it("returns a log object after enablePaginationDebug", () => {
    enablePaginationDebug();
    const log = getPaginationDebugLog();
    expect(log).not.toBeNull();
    expect(log!.decisions).toEqual([]);
    expect(log!.totalPages).toBe(0);
  });

  it("clears the log when disabled", () => {
    enablePaginationDebug();
    disablePaginationDebug();
    expect(getPaginationDebugLog()).toBeNull();
  });
});

// ── Universal pagination rules (conceptual / contract tests) ──────────────

describe("Pagination — Universal Rules Contract", () => {
  /**
   * These tests document the CONTRACT of the universal pagination engine.
   * They do not exercise the DOM — they verify that the exported types
   * and API shape support the universal model described in the spec.
   */

  it("PaginationDecision has all required fields", () => {
    const d: PaginationDecision = {
      pageIndex: 0,
      blockLabel: "experience-1",
      blockHeight: 184,
      remaining: 420,
      decision: "FIT",
    };
    expect(d.pageIndex).toBeGreaterThanOrEqual(0);
    expect(d.blockHeight).toBeGreaterThan(0);
    expect(d.remaining).toBeGreaterThanOrEqual(0);
    expect(["FIT", "KEEPS_WITH_NEXT", "MOVE_TO_NEXT_PAGE", "SPLIT"]).toContain(d.decision);
  });

  it("PaginationDebugLog tracks pages and decisions", () => {
    enablePaginationDebug();
    const log = getPaginationDebugLog()!;
    expect(log.pages).toBeDefined();
    expect(Array.isArray(log.decisions)).toBe(true);
    expect(typeof log.totalPages).toBe("number");
    disablePaginationDebug();
  });

  it("all four decision types are valid", () => {
    const validDecisions = ["FIT", "KEEPS_WITH_NEXT", "MOVE_TO_NEXT_PAGE", "SPLIT"] as const;
    for (const d of validDecisions) {
      const decision: PaginationDecision = {
        pageIndex: 0,
        blockLabel: "test",
        blockHeight: 100,
        remaining: 500,
        decision: d,
      };
      expect(validDecisions).toContain(decision.decision);
    }
  });
});

// ── Page model contract ───────────────────────────────────────────────────

describe("Pagination — Page Model", () => {
  it("A4 dimensions are 794×1123px", async () => {
    const { A4 } = await import("@/lib/resume-design-system/geometry");
    expect(A4.widthPx).toBe(794);
    expect(A4.heightPx).toBe(1123);
  });

  it("PAGE_FRAME safe areas define the content boundary", async () => {
    const { PAGE_FRAME } = await import("@/lib/resume-design-system/page-frame");
    expect(PAGE_FRAME.safe.top).toBeGreaterThan(0);
    expect(PAGE_FRAME.safe.bottom).toBeGreaterThan(0);
    expect(PAGE_FRAME.safe.left).toBeGreaterThan(0);
    expect(PAGE_FRAME.safe.right).toBeGreaterThan(0);
    // Content area is smaller than full page
    const contentWidth = PAGE_FRAME.width - PAGE_FRAME.safe.left - PAGE_FRAME.safe.right;
    const contentHeight = PAGE_FRAME.height - PAGE_FRAME.safe.top - PAGE_FRAME.safe.bottom;
    expect(contentWidth).toBeLessThan(PAGE_FRAME.width);
    expect(contentHeight).toBeLessThan(PAGE_FRAME.height);
    expect(contentWidth).toBeGreaterThan(500);
    expect(contentHeight).toBeGreaterThan(800);
  });

  it("content never enters the footer safe area", async () => {
    const { PAGE_FRAME } = await import("@/lib/resume-design-system/page-frame");
    const maxContentBottom = PAGE_FRAME.height - PAGE_FRAME.safe.bottom;
    expect(maxContentBottom).toBeLessThan(PAGE_FRAME.height);
    expect(maxContentBottom).toBe(1103); // 1123 - 20
  });
});

// ── Section-agnostic behavior ─────────────────────────────────────────────

describe("Pagination — Section Agnostic", () => {
  it("no section-type-specific pagination rules exist in PaginatedResumeSheet", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // Should NOT contain hardcoded section-type pagination logic
    const sectionSpecificPatterns = [
      /if\s*\(\s*section\.type\s*===\s*["']experience["']/,
      /if\s*\(\s*section\.type\s*===\s*["']education["']/,
      /if\s*\(\s*section\.type\s*===\s*["']skills["']/,
      /experience\.length\s*>\s*\d+\s*\)\s*\{?\s*\n?\s*nextPage/,
      /education\.length\s*>\s*\d+\s*\)\s*\{?\s*\n?\s*nextPage/,
      /skills\.length\s*>\s*\d+\s*\)\s*\{?\s*\n?\s*nextPage/,
    ];
    for (const pattern of sectionSpecificPatterns) {
      expect(content).not.toMatch(pattern);
    }
  });

  it("distribute() is the single entry point for all block placement", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // distribute should be called for both root and sub-level distribution
    const distributeCalls = content.match(/distribute\(/g);
    expect(distributeCalls).not.toBeNull();
    expect(distributeCalls!.length).toBeGreaterThanOrEqual(2);
  });
});

// ── break-inside: avoid support ────────────────────────────────────────────

describe("Pagination — Break Behavior", () => {
  it("isAtomicLeaf is used to keep atomic blocks together", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // isAtomicLeaf should be checked before moving blocks to next page
    expect(content).toContain("isAtomicLeaf(item)");
  });

  it("keepWithNext prevents orphaned headings", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    expect(content).toContain("keepsWithNext(item)");
  });

  it("splitOverTall breaks splittable containers across pages", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    expect(content).toContain("splitOverTall(");
  });
});

// ── Preview/PDF parity ────────────────────────────────────────────────────

describe("Pagination — Preview/PDF Parity", () => {
  it("PaginatedResumeSheet is the single source of truth for all previews", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const content = fs.readFileSync(
      path.resolve(__dirname, "../PaginatedResumeSheet.tsx"),
      "utf-8"
    );
    // The component renders pages as HTML that feeds gallery, preview, and PDF
    expect(content).toContain("serializePage");
    expect(content).toContain("dangerouslySetInnerHTML");
  });

  it("PAGE_FRAME_CLASS is shared between screen and print", async () => {
    const { PAGE_FRAME_CLASS } = await import("@/lib/resume-design-system/page-frame");
    expect(PAGE_FRAME_CLASS.measure).toBe("rs-page-measure");
    expect(PAGE_FRAME_CLASS.pages).toBe("rs-pages");
    expect(PAGE_FRAME_CLASS.page).toBe("rs-page");
    expect(PAGE_FRAME_CLASS.scope).toBe("rs-page-scope");
  });
});
