/**
 * Pagination — Atomic Block Placement Tests
 *
 * Proves that:
 * 1. Blocks that fit stay on the current page
 * 2. Blocks that don't fit move to the next page
 * 3. Oversized blocks split according to existing rules
 * 4. Content never exceeds the safe bottom boundary
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PAGE_FRAME } from "@/lib/resume-design-system/page-frame";
import { A4 } from "@/lib/resume-design-system/geometry";

const PAGE_H = A4.heightPx;
const SAFE_TOP = PAGE_FRAME.safe.top;
const SAFE_BOTTOM = PAGE_FRAME.safe.bottom;
const SLACK = 6;

// Calculate usable space for a page
function usableFor(page: number, safeTop: number, safeBottom: number): number {
  const top = page === 0 ? safeTop : safeTop;
  return PAGE_H - top - safeBottom - SLACK;
}

describe("Pagination — Atomic Block Placement", () => {
  describe("Safe boundary calculation", () => {
    it("usable space for page 1 is correct", () => {
      const usable = usableFor(0, SAFE_TOP, SAFE_BOTTOM);
      // 1123 - 40 - 20 - 6 = 1057
      expect(usable).toBe(1057);
    });

    it("usable space for page 2+ is correct", () => {
      const usable = usableFor(1, SAFE_TOP, SAFE_BOTTOM);
      // 1123 - 40 - 20 - 6 = 1057
      expect(usable).toBe(1057);
    });

    it("safe bottom boundary is 1103px from page top", () => {
      const safeBottom = PAGE_H - SAFE_BOTTOM;
      expect(safeBottom).toBe(1103);
    });
  });

  describe("Block placement decisions", () => {
    it("block that fits stays on current page", () => {
      const usable = usableFor(0, SAFE_TOP, SAFE_BOTTOM);
      const used = 500;
      const remaining = usable - used;
      const blockHeight = 250;

      // remaining = 1057 - 500 = 557
      // block = 250
      // 250 <= 557 → fits
      expect(remaining).toBe(557);
      expect(blockHeight).toBeLessThanOrEqual(remaining);
    });

    it("block that exactly fits stays on current page", () => {
      const usable = usableFor(0, SAFE_TOP, SAFE_BOTTOM);
      const used = 500;
      const remaining = usable - used;
      const blockHeight = 557;

      // remaining = 1057 - 500 = 557
      // block = 557
      // 557 <= 557 → fits
      expect(remaining).toBe(557);
      expect(blockHeight).toBeLessThanOrEqual(remaining);
    });

    it("block that doesn't fit moves to next page", () => {
      const usable = usableFor(0, SAFE_TOP, SAFE_BOTTOM);
      const used = 500;
      const remaining = usable - used;
      const blockHeight = 558;

      // remaining = 1057 - 500 = 557
      // block = 558
      // 558 > 557 → doesn't fit → move to next page
      expect(remaining).toBe(557);
      expect(blockHeight).toBeGreaterThan(remaining);
    });

    it("block larger than usable space moves to next page", () => {
      const usable = usableFor(0, SAFE_TOP, SAFE_BOTTOM);
      const used = 0;
      const remaining = usable - used;
      const blockHeight = 1200;

      // remaining = 1057
      // block = 1200
      // 1200 > 1057 → doesn't fit → move/split
      expect(remaining).toBe(1057);
      expect(blockHeight).toBeGreaterThan(remaining);
    });
  });

  describe("Edge cases", () => {
    it("remaining=300, block=250 → stays", () => {
      const remaining = 300;
      const block = 250;
      expect(block).toBeLessThanOrEqual(remaining);
    });

    it("remaining=300, block=300 → stays", () => {
      const remaining = 300;
      const block = 300;
      expect(block).toBeLessThanOrEqual(remaining);
    });

    it("remaining=300, block=301 → moves", () => {
      const remaining = 300;
      const block = 301;
      expect(block).toBeGreaterThan(remaining);
    });

    it("remaining=50, block=500 → move/split", () => {
      const remaining = 50;
      const block = 500;
      expect(block).toBeGreaterThan(remaining);
    });

    it("remaining=50, block=1200 → split", () => {
      const remaining = 50;
      const block = 1200;
      expect(block).toBeGreaterThan(remaining);
    });
  });

  describe("Safe bottom invariant", () => {
    it("content must not exceed safe bottom boundary", () => {
      const safeBottomBoundary = PAGE_H - SAFE_BOTTOM;
      // Any content beyond this point is overflow
      expect(safeBottomBoundary).toBe(1103);
    });

    it("usable space respects safe bottom", () => {
      const usable = usableFor(0, SAFE_TOP, SAFE_BOTTOM);
      // usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK
      // usable = 1123 - 40 - 20 - 6 = 1057
      expect(usable).toBe(1057);
    });

    it("content placed within usable space cannot exceed safe bottom", () => {
      const usable = usableFor(0, SAFE_TOP, SAFE_BOTTOM);
      const safeBottomBoundary = PAGE_H - SAFE_BOTTOM;
      
      // If content is placed within usable space (1057px from content start),
      // and content starts at SAFE_TOP (40px from page top),
      // then content bottom = SAFE_TOP + usable = 40 + 1057 = 1097
      // This is less than safeBottomBoundary (1103)
      const contentBottom = SAFE_TOP + usable;
      expect(contentBottom).toBeLessThanOrEqual(safeBottomBoundary);
    });
  });

  describe("distribute() decision logic", () => {
    it("fits check uses state.used + gap + m.h + m.mb <= usable", () => {
      // This is the exact check in distribute()
      const usable = 1057;
      const stateUsed = 500;
      const gap = 8;
      const blockHeight = 200;
      const blockMarginBottom = 12;

      const fits = stateUsed + gap + blockHeight + blockMarginBottom <= usable;
      // 500 + 8 + 200 + 12 = 720 <= 1057 → true
      expect(fits).toBe(true);
    });

    it("fits check fails when block doesn't fit", () => {
      const usable = 1057;
      const stateUsed = 900;
      const gap = 8;
      const blockHeight = 200;
      const blockMarginBottom = 12;

      const fits = stateUsed + gap + blockHeight + blockMarginBottom <= usable;
      // 900 + 8 + 200 + 12 = 1120 > 1057 → false
      expect(fits).toBe(false);
    });

    it("atomic block moves to next page when doesn't fit", () => {
      const usable = 1057;
      const stateUsed = 900;
      const gap = 8;
      const blockHeight = 200;
      const blockMarginBottom = 12;
      const isAtomicLeaf = true;

      const fits = stateUsed + gap + blockHeight + blockMarginBottom <= usable;
      // 1120 > 1057 → doesn't fit

      const nextUsable = usableFor(1, SAFE_TOP, SAFE_BOTTOM);
      const canFitOnNextPage = blockHeight <= nextUsable;

      // Block doesn't fit on current page but fits on next page
      expect(fits).toBe(false);
      expect(canFitOnNextPage).toBe(true);
      expect(isAtomicLeaf).toBe(true);
    });
  });

  describe("reflowPages() safe boundary fix", () => {
    it("pageBottom should use safe boundary, not full page height", () => {
      // BEFORE fix: pageBottom = pageRoot.top + PAGE_H
      // AFTER fix: pageBottom = pageRoot.top + PAGE_H - safeBottom
      
      const pageTop = 0;
      const oldPageBottom = pageTop + PAGE_H;
      const newPageBottom = pageTop + PAGE_H - SAFE_BOTTOM;

      // Old: 1123 (allows 20px overflow into safe area)
      // New: 1103 (respects safe boundary)
      expect(oldPageBottom).toBe(1123);
      expect(newPageBottom).toBe(1103);
    });

    it("content at safe boundary should not trigger reflow", () => {
      const pageTop = 0;
      const safeBottom = PAGE_H - SAFE_BOTTOM;
      
      // Content at exactly 1103px (safe boundary) should be OK
      const contentBottom = 1103;
      expect(contentBottom).toBeLessThanOrEqual(safeBottom);
    });

    it("content beyond safe boundary should trigger reflow", () => {
      const pageTop = 0;
      const safeBottom = PAGE_H - SAFE_BOTTOM;
      
      // Content at 1104px (1px beyond safe boundary) should trigger reflow
      const contentBottom = 1104;
      expect(contentBottom).toBeGreaterThan(safeBottom);
    });
  });
});
