/**
 * Type scale — the ONE place template font sizes meet the typography controls.
 *
 * Templates declare their intended size in document px (14px ≈ 10.5pt on the
 * 794×1123px A4 sheet) wrapped in `rs()`, which emits a calc() driven by the
 * `--rs-type` custom property on the StyleScope root. `--rs-type` carries the
 * resolved `fontScale` (Small 0.9 / Comfortable 1 / Large 1.1).
 *
 * Why a var and not CSS `zoom` (the previous mechanism):
 *   - PaginatedResumeSheet serializes pre-paginated A4 pages and deliberately
 *     strips the zoom rule + `--rs-font-scale` (zoom inside a fixed-height
 *     page would clip), so `zoom` never reached the preview the user sees nor
 *     the printed/PDF output — only the DOCX (which scales numerically).
 *   - `--rs-type` is a plain custom property: it flows through serializePage
 *     with the rest of the vars, so Customization → live preview → print/PDF
 *     → DOCX all apply the SAME factor, and the paginator measures the real
 *     scaled layout (bigger type → more pages, never clipped).
 *
 * Usage:  fontSize: rs(14)   // body text, 10.5pt at Comfortable
 */

/** Scale-aware px value for a template inline style. */
export function rs(px: number): string {
  return `calc(var(--rs-type, 1) * ${px}px)`;
}

/** The `--rs-type` custom property value for a resolved font scale. */
export function typeScaleVar(fontScale: number): string {
  return String(fontScale);
}
