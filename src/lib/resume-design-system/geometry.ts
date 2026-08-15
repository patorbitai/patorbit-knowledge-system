/**
 * A4 page geometry — the SINGLE source of truth for the resume page.
 *
 * The Professional Preview and the browser print/export must use the same
 * underlying page dimensions, so they can never drift:
 *
 *   - px values are what the on-screen sheet is laid out at (96 CSS px per
 *     inch, so 210mm ≈ 793.7px → rounded to 794px, and 297mm ≈ 1122.5px →
 *     rounded to 1123px — the template design-system pageWidth token).
 *   - mm values are what the print CSS applies to #pdf-export-target
 *     (@page { size: A4; margin: 0 } + width/min-height 210mm/297mm).
 *
 * The ~0.3–0.5px difference between the rounded px and the exact mm
 * conversion is subpixel and cannot shift wraps, section positions, or page
 * breaks in any observable way.
 */
export const A4 = {
  widthPx: 794,
  heightPx: 1123,
  widthMm: 210,
  heightMm: 297,
} as const;

/** CSS length strings for the print target (kept in sync with A4 above). */
export const A4_CSS = {
  width: `${A4.widthMm}mm`,
  minHeight: `${A4.heightMm}mm`,
} as const;
