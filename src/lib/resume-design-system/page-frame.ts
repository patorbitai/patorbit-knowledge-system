import { A4 } from "./geometry";

/**
 * Canonical A4 resume page frame — the SINGLE page model shared by the
 * Template Gallery, Professional Preview, and PDF/print export.
 *
 * The pipeline is:
 *
 *   A4 Geometry (geometry.ts)  →  Page Frame (this module)  →  Template content
 *   →  Template Gallery  →  Professional Preview  →  PDF / Print Export
 *
 * The page frame separates three concerns:
 *   1. the physical A4 page boundary (794×1123px screen ⇔ 210×297mm print),
 *   2. the safe content area (per-page top/bottom space so content never
 *      touches the page edge — even on pages 2+, which a one-shot template
 *      padding cannot provide),
 *   3. the template's own layout inside that safe area (each template keeps
 *      its native structure; the paginator derives each template's designed
 *      page insets from its root element's computed padding).
 *
 * These constants are the only source of page geometry for the paginator;
 * no template or preview defines its own A4 size.
 */
export const PAGE_FRAME = {
  /** Screen width of one A4 page (px). */
  width: A4.widthPx,
  /** Screen height of one A4 page (px). */
  height: A4.heightPx,
  /**
   * Canonical safe content area (px): 40px header, 30px footer, 32px sides.
   *
   * The paginator uses the template root's own computed padding as the page
   * insets — so every template keeps its designed look on page 1 — and falls
   * back to these values only where a template intentionally has no page
   * margin (full-bleed banners/sidebars): continuation pages always start
   * with SAFE.top of space and every page ends with SAFE.bottom of space.
   */
  safe: { top: 40, right: 32, bottom: 30, left: 32 },
} as const;

/**
 * CSS class names shared by the page-frame renderer (screen) and the
 * @media print block in globals.css. Keeping them here means the print CSS
 * and the React component can never drift apart.
 */
export const PAGE_FRAME_CLASS = {
  /** Hidden measurement container that lays the template out at A4 width. */
  measure: "rs-page-measure",
  /** The scrollable column of built A4 pages. */
  pages: "rs-pages",
  /** One discrete A4 page. */
  page: "rs-page",
  /** Per-page style scope (carries the ResumeStyleConfig vars + rules). */
  scope: "rs-page-scope",
} as const;
