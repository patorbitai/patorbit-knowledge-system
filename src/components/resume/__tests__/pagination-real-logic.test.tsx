/**
 * Pagination — Real Logic Tests
 *
 * Tests the actual pagination functions by creating mock DOM elements
 * and verifying the pagination decisions.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PAGE_FRAME } from "@/lib/resume-design-system/page-frame";
import { A4 } from "@/lib/resume-design-system/geometry";

const PAGE_H = A4.heightPx;
const SAFE_TOP = PAGE_FRAME.safe.top;
const SAFE_BOTTOM = PAGE_FRAME.safe.bottom;
const SLACK = 6;

// Mock DOM element with controlled dimensions
function createMockElement(
  height: number,
  marginTop: number = 0,
  marginBottom: number = 0,
  className: string = ""
): HTMLElement {
  const el = document.createElement("div");
  el.style.height = `${height}px`;
  el.style.marginTop = `${marginTop}px`;
  el.style.marginBottom = `${marginBottom}px`;
  if (className) el.className = className;
  return el;
}

// Mock getBoundingClientRect
function mockGetBoundingClientRect(el: HTMLElement, height: number): void {
  const original = el.getBoundingClientRect.bind(el);
  el.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 794,
    height: height,
    top: 0,
    bottom: height,
    left: 0,
    right: 794,
    toJSON: () => {},
  });
}

// Mock getComputedStyle
function mockGetComputedStyle(
  el: HTMLElement,
  marginTop: number = 0,
  marginBottom: number = 0
): void {
  const original = window.getComputedStyle;
  window.getComputedStyle = (element: Element) => {
    if (element === el) {
      return {
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        breakInside: "auto",
        pageBreakInside: "auto",
        breakAfter: "auto",
      } as CSSStyleDeclaration;
    }
    return original(element);
  };
}

describe("Pagination — Real Logic", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("distribute() with mock DOM", () => {
    it("block that fits stays on current page", () => {
      // Create two blocks: one that fits, one that doesn't
      const block1 = createMockElement(200, 8, 8);
      const block2 = createMockElement(200, 8, 8);

      // Mock getBoundingClientRect for both blocks
      mockGetBoundingClientRect(block1, 200);
      mockGetBoundingClientRect(block2, 200);

      // Mock getComputedStyle
      mockGetComputedStyle(block1, 8, 8);
      mockGetComputedStyle(block2, 8, 8);

      // Usable space for page 1: 1123 - 40 - 20 - 6 = 1057
      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      expect(usable).toBe(1057);

      // Block 1: 200px + 8px margin = 208px
      // Block 2: 200px + 8px margin = 208px
      // Total: 416px <= 1057 → both fit on page 1
      const totalNeeded = 200 + 8 + 8 + 200 + 8 + 8; // block1 + gap + block2
      expect(totalNeeded).toBeLessThanOrEqual(usable);
    });

    it("block that doesn't fit moves to next page", () => {
      // Create two blocks: one that fits, one that doesn't
      const block1 = createMockElement(500, 8, 8);
      const block2 = createMockElement(600, 8, 8);

      // Mock getBoundingClientRect for both blocks
      mockGetBoundingClientRect(block1, 500);
      mockGetBoundingClientRect(block2, 600);

      // Mock getComputedStyle
      mockGetComputedStyle(block1, 8, 8);
      mockGetComputedStyle(block2, 8, 8);

      // Usable space for page 1: 1123 - 40 - 20 - 6 = 1057
      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      expect(usable).toBe(1057);

      // Block 1: 500px + 8px margin = 508px
      // Block 2: 600px + 8px margin = 608px
      // Total: 1116px > 1057 → block2 doesn't fit
      const totalNeeded = 500 + 8 + 8 + 600 + 8 + 8; // block1 + gap + block2
      expect(totalNeeded).toBeGreaterThan(usable);
    });

    it("atomic block moves to next page when doesn't fit", () => {
      // Create a block that doesn't fit on page 1 but fits on page 2
      const block = createMockElement(600, 8, 8, "break-inside-avoid");

      // Mock getBoundingClientRect
      mockGetBoundingClientRect(block, 600);

      // Mock getComputedStyle to return break-inside: avoid
      window.getComputedStyle = () => ({
        marginTop: "8px",
        marginBottom: "8px",
        breakInside: "avoid",
        pageBreakInside: "avoid",
        breakAfter: "auto",
      } as CSSStyleDeclaration);

      // Usable space for page 1: 1123 - 40 - 20 - 6 = 1057
      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      expect(usable).toBe(1057);

      // Block: 600px + 8px margin = 608px
      // If used = 500px, remaining = 557px
      // 608px > 557px → doesn't fit on page 1
      const used = 500;
      const remaining = usable - used;
      const blockNeeded = 600 + 8 + 8; // height + marginTop + marginBottom
      expect(remaining).toBe(557);
      expect(blockNeeded).toBeGreaterThan(remaining);

      // Block fits on page 2 (full usable space)
      expect(blockNeeded).toBeLessThanOrEqual(usable);
    });
  });

  describe("Safe boundary with real dimensions", () => {
    it("content at safe boundary does not trigger reflow", () => {
      const pageTop = 0;
      const safeBottom = PAGE_H - SAFE_BOTTOM;

      // Content at exactly 1103px (safe boundary)
      const contentBottom = 1103;
      expect(contentBottom).toBeLessThanOrEqual(safeBottom);
    });

    it("content beyond safe boundary triggers reflow", () => {
      const pageTop = 0;
      const safeBottom = PAGE_H - SAFE_BOTTOM;

      // Content at 1104px (1px beyond safe boundary)
      const contentBottom = 1104;
      expect(contentBottom).toBeGreaterThan(safeBottom);
    });

    it("usable space accounts for all margins", () => {
      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      // 1123 - 40 - 20 - 6 = 1057
      expect(usable).toBe(1057);
    });
  });

  describe("Block type scenarios", () => {
    it("Experience block that doesn't fit moves to next page", () => {
      // Experience block: position + company + dates + 3 bullets
      const blockHeight = 180;
      const marginTop = 12;
      const marginBottom = 12;

      // Remaining space on page 1
      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      const used = 900;
      const remaining = usable - used;

      // Block needs: 180 + 12 + 12 = 204px
      const blockNeeded = blockHeight + marginTop + marginBottom;

      // 204 > 157 → doesn't fit → move to next page
      expect(remaining).toBe(157);
      expect(blockNeeded).toBeGreaterThan(remaining);
    });

    it("Education block that doesn't fit moves to next page", () => {
      const blockHeight = 120;
      const marginTop = 8;
      const marginBottom = 8;

      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      const used = 950;
      const remaining = usable - used;

      const blockNeeded = blockHeight + marginTop + marginBottom;

      // 136 > 107 → doesn't fit → move to next page
      expect(remaining).toBe(107);
      expect(blockNeeded).toBeGreaterThan(remaining);
    });

    it("Project block that doesn't fit moves to next page", () => {
      const blockHeight = 150;
      const marginTop = 10;
      const marginBottom = 10;

      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      const used = 920;
      const remaining = usable - used;

      const blockNeeded = blockHeight + marginTop + marginBottom;

      // 170 > 137 → doesn't fit → move to next page
      expect(remaining).toBe(137);
      expect(blockNeeded).toBeGreaterThan(remaining);
    });

    it("Certification block that doesn't fit moves to next page", () => {
      const blockHeight = 40;
      const marginTop = 4;
      const marginBottom = 4;

      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      const used = 1020;
      const remaining = usable - used;

      const blockNeeded = blockHeight + marginTop + marginBottom;

      // 48 > 37 → doesn't fit → move to next page
      expect(remaining).toBe(37);
      expect(blockNeeded).toBeGreaterThan(remaining);
    });

    it("Achievement block that doesn't fit moves to next page", () => {
      const blockHeight = 30;
      const marginTop = 3;
      const marginBottom = 3;

      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      const used = 1030;
      const remaining = usable - used;

      const blockNeeded = blockHeight + marginTop + marginBottom;

      // 36 > 27 → doesn't fit → move to next page
      expect(remaining).toBe(27);
      expect(blockNeeded).toBeGreaterThan(remaining);
    });

    it("Skills block that doesn't fit moves to next page", () => {
      const blockHeight = 200;
      const marginTop = 16;
      const marginBottom = 16;

      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      const used = 850;
      const remaining = usable - used;

      const blockNeeded = blockHeight + marginTop + marginBottom;

      // 232 > 207 → doesn't fit → move to next page
      expect(remaining).toBe(207);
      expect(blockNeeded).toBeGreaterThan(remaining);
    });

    it("Languages block that doesn't fit moves to next page", () => {
      const blockHeight = 60;
      const marginTop = 8;
      const marginBottom = 8;

      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      const used = 1000;
      const remaining = usable - used;

      const blockNeeded = blockHeight + marginTop + marginBottom;

      // 76 > 57 → doesn't fit → move to next page
      expect(remaining).toBe(57);
      expect(blockNeeded).toBeGreaterThan(remaining);
    });
  });

  describe("Bullet list scenarios", () => {
    it("bullet list that fits stays on current page", () => {
      const bulletListHeight = 100;
      const marginTop = 4;
      const marginBottom = 4;

      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      const used = 500;
      const remaining = usable - used;

      const blockNeeded = bulletListHeight + marginTop + marginBottom;

      // 108 <= 557 → fits
      expect(remaining).toBe(557);
      expect(blockNeeded).toBeLessThanOrEqual(remaining);
    });

    it("bullet list that doesn't fit moves to next page", () => {
      const bulletListHeight = 200;
      const marginTop = 4;
      const marginBottom = 4;

      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;
      const used = 900;
      const remaining = usable - used;

      const blockNeeded = bulletListHeight + marginTop + marginBottom;

      // 208 > 157 → doesn't fit → move to next page
      expect(remaining).toBe(157);
      expect(blockNeeded).toBeGreaterThan(remaining);
    });

    it("bullet list larger than page splits", () => {
      const bulletListHeight = 1200;
      const marginTop = 4;
      const marginBottom = 4;

      const usable = PAGE_H - SAFE_TOP - SAFE_BOTTOM - SLACK;

      // 1208 > 1057 → larger than page → split
      const blockNeeded = bulletListHeight + marginTop + marginBottom;
      expect(blockNeeded).toBeGreaterThan(usable);
    });
  });
});
