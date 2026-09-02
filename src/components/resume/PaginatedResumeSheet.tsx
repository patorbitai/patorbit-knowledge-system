"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ResumePreview } from "@/components/resume/ResumePreview";
import type { ResumeTemplate } from "@/app/resume-builder/templates";
import type { Resume } from "@/types/resume";
import type { ResumeStyleConfig } from "@/lib/resume-design-system/style-config";
import { PAGE_FRAME, PAGE_FRAME_CLASS } from "@/lib/resume-design-system/page-frame";

/* ════════════════════════════════════════════════════════════════════════════
 * PaginatedResumeSheet — the ONE canonical A4 page-frame renderer.
 *
 * Pipeline:  A4 geometry → page frame → template content → this component
 *            → Template Gallery / Professional Preview / PDF-print.
 *
 * The template is rendered ONCE as continuous flow (ResumePreview) inside a
 * hidden measurement container laid out at exactly A4 width. The paginator
 * then splits the flow's blocks into discrete A4 pages (794×1123px on screen
 * ⇔ 210×297mm in print):
 *
 *   • every page is a real A4 sheet — page 1 AND pages 2+,
 *   • every page carries the template's designed safe top/bottom space
 *     (derived from the template root's computed padding; full-bleed
 *     banner/sidebar templates intentionally keep a 0 page margin and get
 *     the canonical safe space on continuation pages instead),
 *   • content that crosses 1123px flows onto the next page instead of being
 *     clipped, honoring the templates' break-inside-avoid articles,
 *   • columnar layouts (grid/flex two-columns, sidebars) are paginated
 *     column-by-column so the columns survive page breaks,
 *   • the same serialized pages feed the Gallery, the Professional Preview,
 *     and #pdf-export-target, so the exported PDF matches the preview by
 *     construction (the browser prints one A4 sheet per page div).
 *
 * The measurement container stays mounted and hidden; the paginator re-runs
 * whenever resume/template/style config changes, when fonts finish loading,
 * or when the measured layout resizes.
 * ════════════════════════════════════════════════════════════════════════════ */

const PAGE_W = PAGE_FRAME.width;
const PAGE_H = PAGE_FRAME.height;
const SAFE_TOP = PAGE_FRAME.safe.top;
const SAFE_BOTTOM = PAGE_FRAME.safe.bottom;
/** Safety margin so splitter estimation drift can never clip content. */
const SLACK = 6;
/** Styles for the off-screen holders used to measure detached clones. */
const HOLDER_CSS =
  "position:fixed;left:-99999px;top:0;width:794px;visibility:hidden;pointer-events:none";

/* ── Debug mode ────────────────────────────────────────────────────────────── */

export interface PaginationDecision {
  pageIndex: number;
  blockLabel: string;
  blockHeight: number;
  remaining: number;
  decision: "FIT" | "KEEPS_WITH_NEXT" | "MOVE_TO_NEXT_PAGE" | "SPLIT";
}

export interface PaginationDebugLog {
  pages: { pageIndex: number; available: number; used: number }[];
  decisions: PaginationDecision[];
  totalPages: number;
}

let _debugLog: PaginationDebugLog | null = null;
let _debugEnabled = false;

/** Enable pagination debug logging. Call `getPaginationDebugLog()` after
 *  paginateRoot() to retrieve the log. Development-only — never active
 *  in production builds. */
export function enablePaginationDebug(): void {
  _debugEnabled = true;
  _debugLog = { pages: [], decisions: [], totalPages: 0 };
}

export function disablePaginationDebug(): void {
  _debugEnabled = false;
  _debugLog = null;
}

export function getPaginationDebugLog(): PaginationDebugLog | null {
  return _debugLog;
}

function debugLogDecision(d: PaginationDecision): void {
  if (_debugEnabled && _debugLog) _debugLog.decisions.push(d);
}

function debugLogPage(pageIndex: number, available: number, used: number): void {
  if (_debugEnabled && _debugLog) _debugLog.pages.push({ pageIndex, available, used });
}

function debugLabel(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const key = el.getAttribute("key") || el.getAttribute("data-key") || "";
  const cls = el.className?.toString().slice(0, 30) || "";
  return key || cls || tag;
}

/* ── Geometry helpers ──────────────────────────────────────────────────────── */

function px(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function elementChildren(el: Element): HTMLElement[] {
  return Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
}

function isAbsolute(el: HTMLElement): boolean {
  const p = getComputedStyle(el).position;
  return p === "absolute" || p === "fixed";
}

/**
 * A container is columnar only when at least two of its children are laid out
 * SIDE BY SIDE (they share a vertical band). A `flex-col` container or a grid
 * whose children are all full-width rows stacks vertically and must NOT be
 * paginated as independent columns — its children are one flow.
 */
function isColumnar(el: HTMLElement): boolean {
  const kids = elementChildren(el);
  if (kids.length < 2) return false;
  const rects = kids.map((k) => k.getBoundingClientRect());
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      if (a.bottom > b.top + 1 && b.bottom > a.top + 1) return true;
    }
  }
  return false;
}

interface ColumnarParts {
  /** Children laid out side-by-side (the columns). */
  cols: HTMLElement[];
  /** Full-width rows ABOVE the columns (e.g. a col-span-3 header band). */
  topRows: HTMLElement[];
  /** Full-width rows BELOW the columns (e.g. a footer band). */
  bottomRows: HTMLElement[];
  /** Vertical space consumed above the columns on the first page (measured). */
  chromeTop: number;
}

/**
 * Classify a columnar container's children into side-by-side columns and
 * full-width rows (headers above / footers below). The chrome height above
 * the columns is MEASURED from the real layout so the columns' first-page
 * budget matches reality — a full-width header must not be charged only to
 * itself while the columns silently get the full page height (which made
 * every grid-with-header template overfill page 1 and dump its content).
 */
function classifyColumns(container: HTMLElement, zoom = 1): ColumnarParts {
  const kids = elementChildren(container);
  const rects = kids.map((k) => k.getBoundingClientRect());
  const overlaps = (i: number) =>
    rects.some((r, j) => j !== i && r.bottom > rects[i].top + 1 && rects[i].bottom > r.top + 1);
  const cols = kids.filter((_, i) => overlaps(i));
  const rows = kids.filter((_, i) => !overlaps(i));
  const firstColTop = cols.length
    ? Math.min(...cols.map((c) => c.getBoundingClientRect().top))
    : Infinity;
  const topRows = rows.filter((r) => r.getBoundingClientRect().top < firstColTop - 0.5);
  const bottomRows = rows.filter((r) => r.getBoundingClientRect().top >= firstColTop - 0.5);
  const cs = getComputedStyle(container);
  const contentTop =
    container.getBoundingClientRect().top + px(cs.borderTopWidth) + px(cs.paddingTop);
  // `firstColTop`/`contentTop` are rect measurements — divide by the render
  // scale (the live sheet is transform-scaled; holder clones are not).
  const chromeTop = cols.length ? Math.max(0, firstColTop - contentTop) / zoom : 0;
  return { cols, topRows, bottomRows, chromeTop };
}

/** Keep-together blocks (templates mark articles/sections break-inside-avoid). */
function isAtomic(el: HTMLElement): boolean {
  if (el.classList.contains("break-inside-avoid")) return true;
  const cs = getComputedStyle(el);
  return cs.breakInside === "avoid" || cs.pageBreakInside === "avoid";
}

function hasAtomicDescendant(el: HTMLElement): boolean {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
  let n: Node | null = walker.nextNode();
  while (n) {
    if ((n as HTMLElement).classList.contains("break-inside-avoid")) return true;
    n = walker.nextNode();
  }
  return false;
}

/**
 * True for ATOMIC LEAVES — break-inside-avoid blocks that contain no further
 * atomic blocks (a single experience article, education entry, …). A section
 * that WRAPS atomic children is a splittable container: the paginator must be
 * able to split BETWEEN those children so a long section that barely misses
 * the page doesn't leave a large blank gap (and never becomes effectively
 * `break-inside: avoid` for the whole resume).
 */
function isAtomicLeaf(el: HTMLElement): boolean {
  return isAtomic(el) && !hasAtomicDescendant(el);
}

/** Headings should not be orphaned at the bottom of a page. */
function keepsWithNext(el: HTMLElement): boolean {
  if (/^H[1-6]$/.test(el.tagName)) return true;
  if (el.classList.contains("break-after-avoid")) return true;
  return getComputedStyle(el).breakAfter === "avoid";
}

interface Metrics {
  mt: number;
  mb: number;
  h: number;
}

function metrics(el: HTMLElement, zoom: number): Metrics {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    // Computed-style lengths are already layout px — CSS transforms scale the
    // RENDERED box but never computed values, so only rect measurements need
    // dividing back to layout coordinates.
    mt: px(cs.marginTop),
    mb: px(cs.marginBottom),
    // getBoundingClientRect is zoom-scaled; divide back to layout coordinates.
    h: r.height / zoom,
  };
}

/**
 * Metrics of the next SEMANTIC unit after a heading: if the next block is a
 * splittable container (its children are themselves blocks), the heading only
 * needs to keep together with the container's FIRST child — not the whole
 * container — so wrappers like `space-y-5 > article×4` never force their
 * heading onto the next page.
 */
function nextUnitMetrics(el: HTMLElement, zoom: number): Metrics {
  let cur = el;
  for (let i = 0; i < 8; i++) {
    const kids = elementChildren(cur);
    if (kids.length === 0) return metrics(cur, zoom);
    if (isAtomicLeaf(cur)) return metrics(cur, zoom);
    if (kids.length >= 2) return metrics(kids[0], zoom);
    cur = kids[0];
  }
  return metrics(cur, zoom);
}

/* ── Distribution state ────────────────────────────────────────────────────── */

interface Ctx {
  pageHeight: number;
  safeTop1: number;
  safeTopN: number;
  safeBottom: number;
  safeLeft: number;
  safeRight: number;
  zoom: number;
  /** Safety slack subtracted from usable space (guards against clipping). */
  slack: number;
}

interface DistState {
  /** Current page index (0-based). */
  page: number;
  /** Content consumed on the current page, from the content-area top. */
  used: number;
  /** Margin-bottom of the last placed block (for margin collapsing). */
  lastMB: number;
}

function usableFor(
  page: number,
  chromeT: number,
  chromeB: number,
  ctx: Ctx,
  firstTopExtra = 0,
): number {
  const top = page === 0 ? ctx.safeTop1 : ctx.safeTopN;
  return (
    ctx.pageHeight -
    top -
    ctx.safeBottom -
    chromeT -
    chromeB -
    ctx.slack -
    (page === 0 ? firstTopExtra : 0)
  );
}

function nextPage(state: DistState): void {
  state.page++;
  state.used = 0;
  state.lastMB = 0;
}

function place(
  state: DistState,
  out: HTMLElement[][],
  el: HTMLElement,
  mt: number,
  mb: number,
  h: number,
): void {
  const first = state.used === 0;
  const gap = first ? mt : Math.max(state.lastMB, mt);
  state.used += gap + h;
  state.lastMB = mb;
  while (out.length <= state.page) out.push([]);
  out[state.page].push(el);
}

/* ── Leaf line-splitting (pathological: a single block taller than a page) ── */

/** Split `el` (must be attached) at the line closest to maxHeight. Mutates el. */
function splitLeafAtHeight(el: HTMLElement, maxHeight: number): [HTMLElement, HTMLElement] {
  const texts: Text[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n: Node | null = walker.nextNode();
  while (n) {
    if (n.nodeValue && n.nodeValue.length > 0) texts.push(n as Text);
    n = walker.nextNode();
  }
  const total = texts.reduce((s, t) => s + t.data.length, 0);

  const empty = () => document.createElement(el.tagName) as HTMLElement;

  if (total === 0 || texts.length === 0) {
    return [el.cloneNode(true) as HTMLElement, empty()];
  }

  const locate = (target: number): { node: Text; index: number } => {
    let remaining = Math.max(0, Math.min(target, total));
    for (const t of texts) {
      if (remaining <= t.data.length) return { node: t, index: remaining };
      remaining -= t.data.length;
    }
    const last = texts[texts.length - 1];
    return { node: last, index: last.data.length };
  };

  const measure = (offset: number): number => {
    if (offset <= 0) return 0;
    const { node, index } = locate(offset);
    const range = document.createRange();
    range.selectNodeContents(el);
    range.setStart(el, 0);
    range.setEnd(node, index);
    // `el` is always measured inside an unscaled off-screen holder.
    return range.getBoundingClientRect().height;
  };

  // Binary search the largest text offset whose height fits maxHeight.
  let lo = 0;
  let hi = total;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(mid) <= maxHeight) lo = mid;
    else hi = mid - 1;
  }
  if (lo >= total) return [el.cloneNode(true) as HTMLElement, empty()];
  if (lo <= 0) return [empty(), el.cloneNode(true) as HTMLElement];

  const { node, index } = locate(lo);
  const tail = node.splitText(index);

  // Split the inline ancestry so the tail becomes its own subtree.
  let cur: Node = tail;
  while (cur.parentNode && cur.parentNode !== el) {
    const parent = cur.parentNode as HTMLElement;
    const rest = parent.cloneNode(false);
    let sib: Node | null = cur;
    while (sib) {
      const next: Node | null = sib.nextSibling;
      rest.appendChild(sib);
      sib = next;
    }
    parent.parentNode!.insertBefore(rest, parent.nextSibling);
    cur = rest;
  }

  // Move everything from the split point onward into a sibling clone of el.
  const clone = el.cloneNode(false) as HTMLElement;
  let sib: Node | null = cur;
  while (sib) {
    const next: Node | null = sib.nextSibling;
    clone.appendChild(sib);
    sib = next;
  }
  el.parentNode!.insertBefore(clone, el.nextSibling);
  return [el, clone];
}

/** Distribute a split leaf's tail across pages (may span several pages). */
function distributeLeafTail(
  b: HTMLElement,
  state: DistState,
  out: HTMLElement[][],
  chromeT: number,
  chromeB: number,
  ctx: Ctx,
): void {
  const holder = document.createElement("div");
  holder.style.cssText = HOLDER_CSS;
  document.body.appendChild(holder);
  holder.appendChild(b);
  let guard = 0;
  while (guard++ < 100) {
    // `b` lives in the unscaled off-screen holder.
    const h = b.getBoundingClientRect().height;
    const remaining = usableFor(state.page, chromeT, chromeB, ctx) - state.used;
    if (h <= remaining || h <= 0) {
      place(state, out, b, 0, 0, h);
      break;
    }
    const [a, rest] = splitLeafAtHeight(b, remaining);
    if (!a.hasChildNodes() || !rest.hasChildNodes()) {
      place(state, out, b, 0, 0, h);
      break;
    }
    place(state, out, a, 0, 0, remaining);
    b = rest;
    nextPage(state);
  }
  holder.remove();
}

/* ── Over-tall block handling ──────────────────────────────────────────────── */

function splitColumnar(
  container: HTMLElement,
  state: DistState,
  out: HTMLElement[][],
  chromeT: number,
  chromeB: number,
  ctx: Ctx,
): void {
  // A side-by-side grid/flex box: paginate each column independently so the
  // column layout survives page breaks (sidebars, two-column bodies).
  // Full-width rows (headers above / footers below the columns) are placed
  // on the first / last page respectively, and the columns' FIRST-page
  // budget is reduced by the measured chrome above them — so a col-span-3
  // header band doesn't silently give the columns a full page of headroom
  // and then spill everything onto page 2.
  const { cols, topRows, bottomRows, chromeTop } = classifyColumns(container, ctx.zoom);
  const kids = elementChildren(container);
  const ccs = getComputedStyle(container);
  const cPadT = px(ccs.paddingTop);
  const cPadB = px(ccs.paddingBottom);
  // The container's own margins render on every page (each page carries a
  // container clone), so reserve them in the per-page chrome on every page.
  const cMt = px(ccs.marginTop);
  const cMb = px(ccs.marginBottom);
  const startPage = state.page;

  const rowPages: HTMLElement[][] = [];
  if (topRows.length) {
    const rowState: DistState = { page: 0, used: 0, lastMB: 0 };
    distribute(topRows, rowState, rowPages, chromeT + cPadT + cMt, chromeB + cPadB + cMb, ctx);
  }

  const colPages: HTMLElement[][][] = cols.map((col) => {
    const colCs = getComputedStyle(col);
    const collected: HTMLElement[][] = [];
    // Inherit the content already placed on the current page (e.g. a full-width
    // header ABOVE the grid, which is a flow sibling, not a grid row): the
    // columns' first page must share the page with it. Chrome above the columns
    // INSIDE the container is charged separately via `chromeTop`.
    const subState: DistState = { page: state.page, used: state.used, lastMB: state.lastMB };
    distribute(
      elementChildren(col),
      subState,
      collected,
      chromeT + cPadT + cMt + px(colCs.paddingTop),
      chromeB + cPadB + cMb + px(colCs.paddingBottom),
      ctx,
      chromeTop,
    );
    return collected;
  });

  let numPages = Math.max(rowPages.length, ...colPages.map((c) => c.length));
  const bottomRowPages: HTMLElement[][] = [];
  if (bottomRows.length) {
    // Footers sit below the columns on the last column page; the grid
    // auto-places them on a fresh row under the column slices.
    const lastColPage = Math.max(0, numPages - 1);
    const bs: DistState = { page: lastColPage, used: 0, lastMB: 0 };
    distribute(bottomRows, bs, bottomRowPages, chromeT + cPadT + cMt, chromeB + cPadB + cMb, ctx);
    numPages = Math.max(numPages, bs.page + 1);
  }

  const isRow = (kid: HTMLElement) => topRows.includes(kid) || bottomRows.includes(kid);
  const colSlot = new Map(cols.map((c, i) => [c, i]));
  const lastColPage = Math.max(0, ...colPages.map((c) => c.length)) - 1;
  for (let k = 0; k < numPages; k++) {
    const clone = container.cloneNode(false) as HTMLElement;
    // Top rows sit above the columns; bottom rows sit below them; the grid
    // auto-places everything on its own row in DOM order.
    for (const b of rowPages[k] ?? []) clone.appendChild(b.cloneNode(true));
    for (const kid of kids) {
      if (isRow(kid)) continue;
      const ci = colSlot.get(kid)!;
      const colClone = kid.cloneNode(false) as HTMLElement;
      for (const b of colPages[ci]?.[k] ?? []) colClone.appendChild(b.cloneNode(true));
      clone.appendChild(colClone);
    }
    for (const b of bottomRowPages[k - lastColPage] ?? []) clone.appendChild(b.cloneNode(true));
    while (out.length <= startPage + k) out.push([]);
    out[startPage + k].push(clone);
  }

  state.page = startPage + Math.max(0, numPages - 1);
  // Conservative: content after the columnar block starts on a fresh page.
  state.used = usableFor(state.page, chromeT, chromeB, ctx);
  state.lastMB = cMb;
}

function splitOverTall(
  item: HTMLElement,
  state: DistState,
  out: HTMLElement[][],
  chromeT: number,
  chromeB: number,
  ctx: Ctx,
): void {
  const sub = elementChildren(item);
  if (sub.length > 0) {
    if (isColumnar(item)) {
      splitColumnar(item, state, out, chromeT, chromeB, ctx);
      return;
    }
    // Chrome-split: every page gets a shallow clone of `item` carrying its
    // padding/background, with that page's slice of children inside.
    //
    // IMPORTANT: only add the container's PADDING to chrome, not its margins.
    // Margins are already accounted for by the parent distribute() call —
    // adding them again here double-counts them, shrinking the available
    // space for children and pushing content to the next page unnecessarily.
    // This was the root cause of large blank gaps at the bottom of pages.
    const cs = getComputedStyle(item);
    const bPadT = px(cs.paddingTop);
    const bPadB = px(cs.paddingBottom);
    const startPage = state.page;
    const collected: HTMLElement[][] = [];
    const subState: DistState = { page: startPage, used: state.used, lastMB: state.lastMB };
    distribute(sub, subState, collected, chromeT + bPadT, chromeB + bPadB, ctx, 0, true, true);
    for (let k = startPage; k <= subState.page; k++) {
      const clone = item.cloneNode(false) as HTMLElement;
      for (const b of collected[k] ?? []) clone.appendChild(b.cloneNode(true));
      while (out.length <= k) out.push([]);
      out[k].push(clone);
    }
    state.page = subState.page;
    state.used = subState.used + bPadB;
    state.lastMB = 0;
    return;
  }

  // Leaf (no element children): split by line height so nothing is clipped.
  const remaining = usableFor(state.page, chromeT, chromeB, ctx) - state.used;
  if (remaining > 8) {
    try {
      const work = item.cloneNode(true) as HTMLElement;
      const holder = document.createElement("div");
      holder.style.cssText = HOLDER_CSS;
      document.body.appendChild(holder);
      holder.appendChild(work);
      const [a, b] = splitLeafAtHeight(work, remaining);
      if (a.hasChildNodes() && b.hasChildNodes()) {
        // `a`/`b` live in the unscaled off-screen holder.
        const ha = a.getBoundingClientRect().height;
        place(state, out, a, 0, 0, Math.min(ha, remaining));
        holder.removeChild(a);
        holder.removeChild(b);
        holder.remove();
        distributeLeafTail(b, state, out, chromeT, chromeB, ctx);
        return;
      }
      holder.remove();
    } catch {
      /* fall through to the keep-whole fallback */
    }
  }
  // Pathological last resort: keep the whole block on its own page.
  nextPage(state);
  const m = metrics(item, ctx.zoom);
  place(state, out, item, 0, 0, m.h);
}

/* ── Main distribution ─────────────────────────────────────────────────────── */

function distribute(
  items: HTMLElement[],
  state: DistState,
  out: HTMLElement[][],
  chromeT: number,
  chromeB: number,
  ctx: Ctx,
  firstTopExtra = 0,
  /** When true, headings are placed independently (no keepsWithNext). 
   *  Used inside splitOverTall so section titles don't force their entire 
   *  section to the next page, leaving blank gaps. */
  independentHeadings = false,
  /** When true, every item is treated as a semantic pagination unit.
   *  Items that don't fit are moved WHOLE to the next page, never split.
   *  Only an item taller than the ENTIRE page may be split (single-item
   *  exception). Used inside splitOverTall so Experience/Education/Project
   *  entries are never fragmented across pages. */
  atomicItems = false,
): void {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const m = metrics(item, ctx.zoom);
    const usable = usableFor(state.page, chromeT, chromeB, ctx, firstTopExtra);
    const first = state.used === 0;
    const gap = first ? m.mt : Math.max(state.lastMB, m.mt);
    const fits = state.used + gap + m.h + m.mb <= usable;

    const blockLabel = debugLabel(item);
    const remaining = usable - state.used;

    if (!independentHeadings && fits && i + 1 < items.length && keepsWithNext(item)) {
      const n = nextUnitMetrics(items[i + 1], ctx.zoom);
      const gap2 = Math.max(m.mb, n.mt);
      const bothNeed = gap + m.h + m.mb + gap2 + n.h + n.mb;
      if (state.used + bothNeed > usable) {
        debugLogDecision({ pageIndex: state.page, blockLabel, blockHeight: m.h, remaining, decision: "KEEPS_WITH_NEXT" });
        nextPage(state);
        place(state, out, item, m.mt, m.mb, m.h);
        continue;
      }
    }

    if (fits) {
      debugLogDecision({ pageIndex: state.page, blockLabel, blockHeight: m.h, remaining, decision: "FIT" });
      place(state, out, item, m.mt, m.mb, m.h);
      continue;
    }

    // Does not fit on the current page.
    const nextUsable = usableFor(state.page + 1, chromeT, chromeB, ctx, firstTopExtra);

    // ── ATOMIC ITEMS MODE ──────────────────────────────────────────────
    // When atomicItems is true (called from splitOverTall distributing a
    // section's children), every child is a semantic pagination unit
    // (e.g. one Experience entry). Move it WHOLE to the next page.
    // Only split if the item itself is taller than the entire page.
    if (atomicItems) {
      if (m.mt + m.h + m.mb <= nextUsable) {
        debugLogDecision({ pageIndex: state.page, blockLabel, blockHeight: m.h, remaining, decision: "MOVE_TO_NEXT_PAGE" });
        nextPage(state);
        place(state, out, item, m.mt, m.mb, m.h);
        continue;
      }
      // Item is taller than the entire page — single-item exception.
      // Allow splitOverTall to break it, but this is ONLY for items
      // that physically cannot fit on any single page.
      debugLogDecision({ pageIndex: state.page, blockLabel, blockHeight: m.h, remaining, decision: "SPLIT" });
      splitOverTall(item, state, out, chromeT, chromeB, ctx);
      continue;
    }

    // ── NORMAL MODE ────────────────────────────────────────────────────
    if (m.mt + m.h + m.mb <= nextUsable && isAtomicLeaf(item)) {
      debugLogDecision({ pageIndex: state.page, blockLabel, blockHeight: m.h, remaining, decision: "MOVE_TO_NEXT_PAGE" });
      nextPage(state);
      place(state, out, item, m.mt, m.mb, m.h);
      continue;
    }

    const childCount = elementChildren(item).length;
    if (m.mt + m.h + m.mb <= nextUsable && m.h <= nextUsable / 2 && childCount <= 1) {
      debugLogDecision({ pageIndex: state.page, blockLabel, blockHeight: m.h, remaining, decision: "MOVE_TO_NEXT_PAGE" });
      nextPage(state);
      place(state, out, item, m.mt, m.mb, m.h);
      continue;
    }

    debugLogDecision({ pageIndex: state.page, blockLabel, blockHeight: m.h, remaining, decision: "SPLIT" });
    splitOverTall(item, state, out, chromeT, chromeB, ctx);
  }
}

/* ── Page assembly ─────────────────────────────────────────────────────────── */

function applyPageFrame(pageRoot: HTMLElement, ctx: Ctx, pageIndex: number, constantTop: boolean): void {
  // All pages get at least the safe area as padding (header/footer space).
  // safeTopN = Math.max(template, safeArea) so every page has consistent spacing.
  const top = Math.max(constantTop ? ctx.safeTop1 : ctx.safeTopN, SAFE_TOP);
  pageRoot.style.paddingTop = `${top}px`;
  pageRoot.style.paddingBottom = `${Math.max(ctx.safeBottom, SAFE_BOTTOM)}px`;
  pageRoot.style.paddingLeft = `${Math.max(ctx.safeLeft, PAGE_FRAME.safe.left)}px`;
  pageRoot.style.paddingRight = `${Math.max(ctx.safeRight, PAGE_FRAME.safe.right)}px`;
  pageRoot.style.boxSizing = "border-box";
  pageRoot.style.minHeight = `${ctx.pageHeight}px`;
  pageRoot.style.overflow = "hidden";
}

/** Wrap a page's root clone in its own style scope (vars + override rules). */
function serializePage(scope: HTMLElement, pageRoot: HTMLElement): string {
  const wrapper = document.createElement("div");
  wrapper.className = PAGE_FRAME_CLASS.scope;
  // The attribute selector [data-rs-page-scope] is how the re-scoped override
  // rules (builtStyleRules rewritten from [data-rs-scope]) find their target.
  // Without this attribute the rules silently fail — fonts, colors, and
  // spacing customizations vanish in the exported PDF / gallery pages.
  wrapper.setAttribute("data-rs-page-scope", "");
  // Carry the resolved ResumeStyleConfig CSS custom properties.
  const vars = scope.getAttribute("style");
  if (vars) wrapper.setAttribute("style", vars);
  // Carry the override rules, re-scoped to this page so they never leak.
  const styleTag = scope.querySelector("style");
  if (styleTag?.textContent) {
    const s = document.createElement("style");
    s.textContent = styleTag.textContent.replaceAll("[data-rs-scope]", "[data-rs-page-scope]");
    wrapper.appendChild(s);
  }
  wrapper.appendChild(pageRoot);
  return wrapper.outerHTML;
}

/**
 * True rendered scale of the measurement subtree. The gallery and live
 * preview zoom the sheet with CSS `transform: scale()` on an ancestor;
 * transforms scale getBoundingClientRect() but NOT computed-style values,
 * so reading the CSS `zoom` property (always 1 here) makes every rect
 * measurement ~0.72× too small — the estimate then "fits" far more than one
 * page of content and the reflow has to rescue it with a coarse split.
 * Probe a fixed-size element instead: its rendered box IS the real scale,
 * regardless of whether the zoom comes from a transform or CSS `zoom`.
 */
function detectScale(scope: HTMLElement): number {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;left:0;top:0;width:100px;height:100px";
  scope.appendChild(probe);
  const w = probe.getBoundingClientRect().width;
  scope.removeChild(probe);
  const s = w > 0 ? w / 100 : 1;
  return Number.isFinite(s) && s > 0 ? s : 1;
}

function paginateRoot(root: HTMLElement, scope: HTMLElement): string[] {
  const zoom = detectScale(scope);
  const cs = getComputedStyle(root);
  // Use the template's own padding as the safe area — this matches what
  // applyPageFrame will actually set on the rendered page clone. The PAGE_FRAME
  // safe values act as minimums so templates with tiny padding still get
  // adequate space.
  const safeTop1 = Math.max(px(cs.paddingTop), SAFE_TOP);
  const safeRight = Math.max(px(cs.paddingRight), PAGE_FRAME.safe.right);
  const safeBottom = Math.max(px(cs.paddingBottom), SAFE_BOTTOM);
  const safeLeft = Math.max(px(cs.paddingLeft), PAGE_FRAME.safe.left);
  const ctx: Ctx = {
    pageHeight: PAGE_H,
    safeTop1,
    safeTopN: safeTop1,
    safeBottom,
    safeLeft,
    safeRight,
    zoom,
    slack: SLACK,
  };

  const children = elementChildren(root);
  const flow = children.filter((c) => !isAbsolute(c));
  const decor = children.filter((c) => isAbsolute(c));
  const columnarRoot = flow.length > 1 && isColumnar(root);

  const out: HTMLElement[][] = [[]];
  const state: DistState = { page: 0, used: 0, lastMB: 0 };
  if (flow.length > 0) {
    if (columnarRoot) {
      // The root IS the two-column layout (e.g. executive-pro): paginate the
      // columns and use the container clones directly as the pages.
      splitColumnar(root, state, out, 0, 0, ctx);
    } else {
      distribute(flow, state, out, 0, 0, ctx);
    }
  }

  // Assemble page clones, measure them off-screen, and reflow any page that
  // still overflows its A4 height (estimation drift — e.g. responsive grids
  // that stack in narrow viewports). Content must never be clipped.
  const holder = document.createElement("div");
  holder.style.cssText = HOLDER_CSS;
  document.body.appendChild(holder);

  const pageRoots = reflowPages(out, root, decor, ctx, columnarRoot, holder);
  const html = pageRoots.map((p) => serializePage(scope, p));
  holder.remove();

  // Debug: log final page summary
  if (_debugEnabled && _debugLog) {
    _debugLog.totalPages = html.length;
    for (let i = 0; i < html.length; i++) {
      const available = usableFor(i, 0, 0, ctx);
      debugLogPage(i, available, 0);
    }
  }

  return html;
}

/**
 * Build one A4 page root from its slice of blocks (clone of the template root
 * carrying that page's blocks; columnar roots ARE their own page container).
 */
function buildPageRoot(
  root: HTMLElement,
  decor: HTMLElement[],
  blocks: HTMLElement[],
  ctx: Ctx,
  pageIndex: number,
  columnarRoot: boolean,
): HTMLElement {
  let pageRoot: HTMLElement;
  if (columnarRoot) {
    pageRoot = blocks[0];
  } else {
    pageRoot = root.cloneNode(false) as HTMLElement;
    for (const item of blocks) pageRoot.appendChild(item.cloneNode(true));
  }
  for (const d of decor) pageRoot.appendChild(d.cloneNode(true));
  applyPageFrame(pageRoot, ctx, pageIndex, columnarRoot);
  return pageRoot;
}

/**
 * Measure-and-reflow: build every page clone in the holder, then carry or
 * split blocks until no page exceeds the A4 height. The estimate pass cannot
 * predict every layout interaction (collapsed margins across grid items,
 * responsive grids stacking into one column), so the REAL rendered heights
 * are the source of truth here.
 */
function reflowPages(
  out: HTMLElement[][],
  root: HTMLElement,
  decor: HTMLElement[],
  ctx: Ctx,
  columnarRoot: boolean,
  holder: HTMLElement,
): HTMLElement[] {
  let pageRoots: HTMLElement[] = [];
  let guard = 0;
  while (guard++ < 80) {
    holder.replaceChildren();
    pageRoots = out.map((blocks, k) => {
      const pageRoot = buildPageRoot(root, decor, blocks, ctx, k, columnarRoot);
      holder.appendChild(pageRoot);
      return pageRoot;
    });

    // Find the first page taller than A4.
    let k = 0;
    while (k < pageRoots.length && pageRoots[k].scrollHeight <= PAGE_H + 1) k++;
    if (k >= pageRoots.length) break; // every page fits

    const pageRoot = pageRoots[k];
    // The LAST block on the page is what crosses the A4 boundary (the estimate
    // places blocks sequentially with per-block fit checks). Pop it: atomic
    // keep-together units move to the next page whole, but splittable
    // containers (a two-column body grid, a section wrapping articles) are
    // split at the MEASURED boundary so the current page keeps filling — never
    // dump a whole container onto the next page and leave it blank.
    const block = out[k].pop()!;
    const liveBlock = columnarRoot
      ? pageRoot
      : Array.from(pageRoot.children).filter((c) => !isAbsolute(c as HTMLElement)).pop() as HTMLElement | undefined;
    if (!liveBlock) {
      out[k].push(block);
      break;
    }

    if (isAtomicLeaf(block)) {
      // Small keep-together unit — carry it whole onto the next page.
      if (!out[k + 1]) out.push([]);
      out[k + 1].unshift(block);
      continue;
    }

    // Split the block's children at the measured page boundary, keeping as
    // much as fits and carrying the rest. When the block is a chain of
    // single-child containers (main → section wrapper), descend to the deepest
    // level with 2+ children before splitting, and rebuild the chain so each
    // page keeps its wrapper chrome (padding etc.). Progress is strict — at
    // least one child must be carried — so the loop always terminates and
    // never emits empty clones.

    // Descend the single-child chain (live ↔ original in lockstep).
    const chain: Array<{ live: HTMLElement; orig: HTMLElement }> = [{ live: liveBlock, orig: block }];
    while (elementChildren(chain[chain.length - 1].live).length === 1) {
      const top = chain[chain.length - 1];
      const liveKid = elementChildren(top.live)[0];
      const origKid = elementChildren(top.orig)[0];
      if (!liveKid || !origKid) break;
      chain.push({ live: liveKid, orig: origKid });
    }
    const deepest = chain[chain.length - 1];
    const liveKids = elementChildren(deepest.live);
    const origKids = elementChildren(deepest.orig);
    if (liveKids.length < 2 || origKids.length < 2) {
      // Leaf — cannot split further; carry the whole block.
      if (!out[k + 1]) out.push([]);
      out[k + 1].unshift(block);
      continue;
    }

    // Rebuild the chain above the deepest container so each page's block
    // keeps its wrappers (padding/background/margins).
    const rebuildChain = (leaf: HTMLElement): HTMLElement => {
      let el = leaf;
      for (let i = chain.length - 2; i >= 0; i--) {
        const parent = chain[i].orig.cloneNode(false) as HTMLElement;
        parent.appendChild(el);
        el = parent;
      }
      return el;
    };

    const pageBottom = pageRoot.getBoundingClientRect().top + PAGE_H;

    // Columnar block: slice EACH column at the measured page boundary instead
    // of dumping whole columns — a full-width header row above the columns
    // must not leave the rest of page 1 blank.
    if (isColumnar(deepest.live)) {
      // `deepest.orig` is the estimate's DETACHED slice — measuring it yields
      // zero-size rects (so classifyColumns finds no columns). Classify the
      // ATTACHED live clone instead (same child order — it is a clone of the
      // orig) and map rows/columns back to the orig children by index.
      const liveKids = elementChildren(deepest.live);
      const liveParts = classifyColumns(deepest.live);
      const rowIdx = new Set(
        [...liveParts.topRows, ...liveParts.bottomRows].map((r) => liveKids.indexOf(r)),
      );
      const colIdxOf = new Map(liveParts.cols.map((c, ci) => [liveKids.indexOf(c), ci]));
      const fits = liveParts.cols.map((col) => {
        let n = 0;
        for (const kid of elementChildren(col)) {
          const kidBottom =
            kid.getBoundingClientRect().bottom + px(getComputedStyle(kid).marginBottom);
          if (kidBottom <= pageBottom + 1) n++;
          else break;
        }
        return n;
      });
      const totalFit = fits.reduce((s, n) => s + n, 0);
      const totalKids = liveParts.cols.reduce((s, c) => s + elementChildren(c).length, 0);
      if (totalFit <= 0) {
        out[k].push(block); // no strict progress — give up
        break;
      }
      if (totalFit >= totalKids) {
        // Every column child fits, but the container's own chrome (margins /
        // padding) still overflows the page — carry the whole container.
        if (!out[k + 1]) out.push([]);
        out[k + 1].unshift(block);
        continue;
      }

      const hasTopRows = liveParts.topRows.length > 0;
      const hasBottomRows = liveParts.bottomRows.length > 0;
      // `from`/`count` are per-column: the leaf takes children [from, from+count)
      // so the fit leaf takes [0, fits) and the tail takes [fits, total).
      const build = (
        from: number[],
        count: number[],
        withTopRows: boolean,
        withBottomRows: boolean,
      ): HTMLElement => {
        const el = deepest.orig.cloneNode(false) as HTMLElement;
        const origKids = elementChildren(deepest.orig);
        const liveColKids = liveParts.cols.map((c) => elementChildren(c));
        let colIdx = 0;
        for (let i = 0; i < origKids.length; i++) {
          const kid = origKids[i];
          if (rowIdx.has(i)) {
            const isTop = liveParts.topRows.includes(liveKids[i]);
            const keep = (withTopRows && isTop) || (withBottomRows && !isTop);
            if (keep) el.appendChild(kid.cloneNode(true));
          } else {
            const ci = colIdxOf.get(i) ?? colIdx;
            const total = liveColKids[ci]?.length ?? 0;
            const start = Math.max(0, Math.min(from[ci] ?? 0, total));
            const n = Math.min(count[ci] ?? 0, Math.max(0, total - start));
            const colClone = kid.cloneNode(false) as HTMLElement;
            const colKids = elementChildren(kid);
            for (let j = start; j < start + n; j++) colClone.appendChild(colKids[j].cloneNode(true));
            el.appendChild(colClone);
            colIdx++;
          }
        }
        return el;
      };

      const takeFit = fits.map((n, ci) =>
        Math.min(n, elementChildren(liveParts.cols[ci]).length),
      );
      // Keep any blocks that fit on this page; only the crossing container is
      // replaced by its measured fit slice, and its tail leads the next page.
      out[k].push(rebuildChain(build(fits.map(() => 0), takeFit, hasTopRows, false)));
      if (!out[k + 1]) out.push([]);
      out[k + 1].unshift(
        rebuildChain(build(takeFit, fits.map((n, ci) => elementChildren(liveParts.cols[ci]).length - takeFit[ci]), false, hasBottomRows)),
      );
      continue;
    }

    let fit = 0;
    for (const kid of liveKids) {
      // A child fits only if its whole footprint (border box + margin-bottom)
      // stays within the page; otherwise the split makes no progress.
      const kidBottom = kid.getBoundingClientRect().bottom + px(getComputedStyle(kid).marginBottom);
      if (kidBottom <= pageBottom + 1) fit++;
      else break;
    }
    if (fit <= 0) {
      out[k].push(block); // no strict progress — give up
      break;
    }

    // Helper to build a slice of the deepest container's children.
    const makeLeaf = (from: number, to: number): HTMLElement => {
      const leaf = deepest.orig.cloneNode(false) as HTMLElement;
      for (let i = from; i < to; i++) leaf.appendChild(origKids[i].cloneNode(true));
      return leaf;
    };

    if (fit >= origKids.length) {
      // Every child's measured footprint fits within the page boundary, but the
      // block's own chrome (margins/padding) causes the page to overflow A4.
      // Instead of carrying the ENTIRE block to the next page (which creates
      // a massive blank gap on the current page), split off the last child to
      // reduce the block's height. This keeps all other content on the current
      // page and only moves the smallest necessary portion forward.
      const n = Math.max(1, origKids.length - 1);
      out[k].push(rebuildChain(makeLeaf(0, n)));
      if (!out[k + 1]) out.push([]);
      out[k + 1].unshift(rebuildChain(makeLeaf(n, origKids.length)));
      continue;
    }

    const n = Math.min(fit, origKids.length);
    // Keep any blocks that fit on this page; only the crossing block is
    // replaced by its measured fit slice, and its tail leads the next page.
    out[k].push(rebuildChain(makeLeaf(0, n)));
    if (!out[k + 1]) out.push([]);
    out[k + 1].unshift(rebuildChain(makeLeaf(n, origKids.length)));
  }
  return pageRoots;
}

/* ════════════════════════════════════════════════════════════════════════════
 * Component
 * ════════════════════════════════════════════════════════════════════════════ */

export interface PaginatedResumeSheetProps {
  resume: Resume;
  template: ResumeTemplate;
  styleConfig?: Partial<ResumeStyleConfig>;
}

export function PaginatedResumeSheet({ resume, template, styleConfig }: PaginatedResumeSheetProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pagesHtml, setPagesHtml] = useState<string[]>([]);

  const paginate = useCallback(() => {
    const holder = measureRef.current;
    if (!holder) return;
    const scope = holder.querySelector("[data-rs-scope]") as HTMLElement | null;
    // Skip non-content elements (e.g. <style> tags) to find the actual template root.
    const root = scope ? Array.from(scope.children).find(
      (c): c is HTMLElement => c instanceof HTMLElement && c.tagName !== "STYLE",
    ) ?? null : null;
    if (!scope || !root) return;
    let result: string[];
    try {
      result = paginateRoot(root, scope);
    } catch {
      // Never lose content: fall back to a single page with the sheet as-is.
      result = [serializePage(scope, root.cloneNode(true) as HTMLElement)];
    }
    setPagesHtml((prev) => {
      if (prev.length === result.length && prev.every((p, i) => p === result[i])) return prev;
      return result;
    });
  }, []);

  useLayoutEffect(() => {
    paginate();

    let disposed = false;
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    if (fonts && typeof fonts.ready?.then === "function") {
      fonts.ready
        .then(() => {
          if (!disposed) paginate();
        })
        .catch(() => {});
    }

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && measureRef.current) {
      ro = new ResizeObserver(() => paginate());
      ro.observe(measureRef.current);
    }
    return () => {
      disposed = true;
      ro?.disconnect();
    };
  }, [paginate, resume, template, styleConfig]);

  return (
    <>
      {/* Hidden measurement container — the template rendered at A4 width. */}
      <div
        ref={measureRef}
        className={PAGE_FRAME_CLASS.measure}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -99999,
          top: 0,
          width: PAGE_W,
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <ResumePreview resume={resume} template={template} styleConfig={styleConfig} />
      </div>

      {/* Built A4 pages — one sheet per page, stacked vertically. */}
      <div
        className={PAGE_FRAME_CLASS.pages}
        data-testid="paginated-pages"
        style={{ position: "relative", width: PAGE_W, height: pagesHtml.length * PAGE_H }}
      >
        {pagesHtml.map((html, i) => (
          <div
            key={i}
            className={PAGE_FRAME_CLASS.page}
            data-page={i + 1}
            style={{
              position: "absolute",
              top: i * PAGE_H,
              left: 0,
              width: PAGE_W,
              height: PAGE_H,
              overflow: "hidden",
              backgroundColor: "#ffffff",
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ))}
      </div>
    </>
  );
}
