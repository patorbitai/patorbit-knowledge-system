"use strict";

/**
 * Deterministic, geometry-based PDF text extraction.
 *
 * The previous extractor grouped text items by Y and searched for column
 * separators using the largest intra-row X gap. On real resumes that detects
 * the wrong gap (e.g. the date column versus the sidebar gutter) and falls
 * straight back to a single-column Y-sorted interleave. This module analyses
 * the page globally:
 *
 *  - every text item keeps its geometry (str, x, y, width, height, page)
 *  - columns are detected from a page-wide X-coverage map, NOT same-row gaps
 *  - a right-most band that is almost entirely date-like text (`Mar 2021 – Present`)
 *    is a date rail, not a second column; it folds into the main column
 *  - each column region is read top-to-bottom, and regions are emitted left-to-right
 *  - single-column pages keep linear top-to-bottom order
 *  - deterministic cleanup only: repeated headers emitted once, letter-spacing
 *    fragmentation joined without a space, whitespace collapsed, hyphen-wrapped
 *    continuations rejoined. No LLM, no semantic guessing.
 */

export interface PdfTextItem {
  str: string;
  transform: number[]; // [a, b, c, d, e, f] pdfjs text matrix
  width?: number;
  height?: number;
  hasEOL?: boolean;
}

export interface LayoutRun {
  str: string;
  x: number;
  y: number;
  width: number;
}

/** How close (in pt) two items must be on the X axis to be considered the same line. */
const Y_LINE_TOLERANCE = 3;

/** Minimum horizontal gap (pt) that creates a column boundary in the X-coverage map. */
const COLUMN_GAP_MIN = 14;

/** Minimum items in a candidate column region for it to count as real. */
const REGION_MIN_ITEMS = 3;

/** Items closer than this X gap are letter-spacing fragments (join with no space). */
const TIGHT_JOIN_GAP = 1.4;

/**
 * Minimum fraction of date-like items inside the right-most band for it to be
 * treated as a date rail (stub) that folds into the main column.
 */
const DATE_STUB_RATIO = 0.7;

/**
 * Text considered a "date stub": a month + optional year, a bare 4-digit year,
 * an ISO/date number, or date-range wording ("Present", "Current"). These are
 * the same shapes resumes print next to their companies.
 */
const DATE_STUB_RE =
  /\b(?:19|20)\d{2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:[a-z]*)?\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(?:Present|Current)\b/i;

function cleanStr(s: string): boolean {
  return !!s && s.trim().length > 0;
}

/** Normalise pdfjs text items into geometry runs. */
function toRuns(items: PdfTextItem[]): LayoutRun[] {
  const runs: LayoutRun[] = [];
  for (const it of items) {
    if (!cleanStr(it.str)) continue;
    runs.push({
      str: it.str,
      x: it.transform[4] ?? 0,
      y: it.transform[5] ?? 0,
      width: typeof it.width === "number" && it.width > 0 ? it.width : it.str.length * 4,
    });
  }
  return runs;
}

/** Detect column boundaries from the page-wide X-coverage of all runs. */
function detectColumnSeparators(runs: LayoutRun[]): number[] {
  if (runs.length < REGION_MIN_ITEMS) return [];

  // Merge run X extents into covered horizontal bands (touching bands below the
  // merge slop union together). Bands model the whole page, independent of Y.
  const intervals = runs
    .map((r) => ({ from: r.x, to: r.x + r.width }))
    .sort((a, b) => a.from - b.from || a.to - b.to);

  const bands: { from: number; to: number }[] = [];
  for (const it of intervals) {
    const last = bands[bands.length - 1];
    if (last && it.from <= last.to + 1) {
      if (it.to > last.to) last.to = it.to;
    } else {
      bands.push({ from: it.from, to: it.to });
    }
  }
  if (bands.length < 2) return [];

  const separators: number[] = [];
  for (let i = 0; i < bands.length - 1; i++) {
    const gap = bands[i + 1].from - bands[i].to;
    if (gap < COLUMN_GAP_MIN) continue;
    separators.push(bands[i].to + gap / 2);
  }

  // Fold a right-most date stub back into the main column: a thin band of
  // date-like items (e.g. "Mar 2021 – Present" aligned to the right margin of a
  // single-column resume) is not a real second column, so drop the last
  // separator entirely. The stub items then join the first column by Y line.
  if (bands.length >= 2 && isDateStub(bands[bands.length - 1], runs)) {
    separators.pop();
  }

  return separators;
}

/**
 * True when the given band is a date rail on the right of the page (a "date
 * stub"): it is the print-out of the same-day date labels that single-column
 * resumes align to the right margin. Requires at least two date-like items.
 * Deliberately tight so a genuine two-column page — whose right-hand column is
 * full of prose, not just dates — is never folded.
 */
function isDateStub(band: { from: number; to: number }, runs: LayoutRun[]): boolean {
  const inBand = runs.filter((r) => r.x + r.width / 2 >= band.from && r.x + r.width / 2 <= band.to);
  if (inBand.length < 2) return false;

  const dateLike = inBand.filter((r) => DATE_STUB_RE.test(r.str)).length;
  return dateLike / inBand.length >= DATE_STUB_RATIO;
}

function columnIndexOf(run: LayoutRun, separators: number[]): number {
  const mid = run.x + run.width / 2;
  let idx = 0;
  for (const sep of separators) {
    if (mid >= sep) idx++;
    else break;
  }
  return idx;
}

/**
 * Group runs into lines using greedy Y-proximity (not a fixed grid). Run A and
 * run B share a line when B's baseline is within Y_LINE_TOLERANCE of A's, so a
 * small baseline offset — e.g. a date label 0.7pt higher than its company — is
 * kept on the same visual line instead of straddling a bucket boundary.
 */
function buildColumnLines(runs: LayoutRun[]): { text: string; y: number }[] {
  if (!runs.length) return [];

  const byY = runs
    .slice()
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .reduce<{ anchor: number; row: LayoutRun[] }[]>((acc, run) => {
      const last = acc[acc.length - 1];
      if (last && Math.abs(last.anchor - run.y) <= Y_LINE_TOLERANCE) {
        last.row.push(run);
      } else {
        acc.push({ anchor: run.y, row: [run] });
      }
      return acc;
    }, []);

  const lines: { text: string; y: number }[] = [];
  for (const { anchor, row } of byY) {
    row.sort((a, b) => a.x - b.x);
    let text = "";
    let prevEnd = -Infinity;
    for (const run of row) {
      const gap = run.x - prevEnd;
      if (text === "") {
        text = run.str;
      } else if (gap <= TIGHT_JOIN_GAP) {
        text += run.str; // letter-spacing / fragment continuation
      } else {
        text += " " + run.str;
      }
      prevEnd = run.x + run.width;
    }
    const joined = text.replace(/\s+/g, " ").trim();
    if (joined) lines.push({ text: joined, y: anchor });
  }

  return collapseLetterSpacing(lines);
}

/**
 * Rejoin a sequence that the PDF wrapped mid-token. pdfjs persists the wrap as
 * two consecutive lines; the trailing hyphen belongs to the word and is kept
 * (e.g. "react-hooks-" + "form." -> "react-hooks-form.").
 */
function dehyphenate(lines: { text: string; y: number }[]): { text: string; y: number }[] {
  const out: { text: string; y: number }[] = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (prev && prev.text.endsWith("-")) {
      prev.text = prev.text + line.text.replace(/^[.\s]+/, "");
      continue;
    }
    out.push(line);
  }
  return out;
}

/**
 * Known section headers (lowercase) for validating collapsed results. */
const KNOWN_HEADERS = new Set([
  "summary", "professionalsummary", "executivesummary", "profile", "objective",
  "experience", "workexperience", "professionalexperience",
  "employmenthistory", "workhistory", "professionalbackground",
  "education", "academicbackground",
  "skills", "technicalskills", "coreskills", "competencies",
  "techstack", "technologies", "keyskills", "areasofexpertise",
  "projects", "selectedprojects", "technicalprojects",
  "certifications", "certificates", "licenses",
  "languages", "languageskills",
  "achievements", "awards", "honors",
  "interests", "hobbies",
  "references", "portfolio",
]);
/** Fallback: check if a collapsed string contains any known section keyword. */
const HEADER_KEYWORD_RE = /summary|experience|education|skills|projects|certifications|languages|interests|references|profile|objective|employment|academic|qualifications|portfolio/i;

/**
 * Deterministically undo letter-spacing artifacts in all-caps headers
 * (e.g. `L ANGUES` produced by a spaced-out `LANGUAGES` header). Only rewrites
 * lines that are entirely uppercase so ordinary names/locations are untouched.
 */
function collapseLetterSpacing(
  lines: { text: string; y: number }[],
): { text: string; y: number }[] {
  return lines.map((l) => {
    const line = l.text;
    if (!/^[A-Z][A-Z ]*$/.test(line)) return l;
    const tokens = line.split(" ").filter(Boolean);
    if (tokens.length < 2) return l;
    // Merge a single-capital token with the following all-caps token when the
    // line looks like one spaced word: `L ANGUES` -> `LANGUES`.
    if (tokens[0].length === 1) {
      tokens[1] = tokens[0] + tokens[1];
      tokens.shift();
      return { text: tokens.join(" "), y: l.y };
    }
    // Try collapsing all short tokens (1-3 chars) into one word.
    // `SK I L L S` -> `SKILLS`, `ED U C A T I O N` -> `EDUCATION`.
    // `EX E C U T I V E S U M M A R Y` -> `executivesummary`.
    if (tokens.every((t) => t.length <= 3)) {
      const collapsed = tokens.join("").toLowerCase();
      if (KNOWN_HEADERS.has(collapsed) || HEADER_KEYWORD_RE.test(collapsed)) {
        return { text: collapsed, y: l.y };
      }
    }
    return l;
  });
}

/**
 * Remove duplicated header rows: in a two-column resume the name/role block is
 * often repeated at the same baseline in every column. Keyed by (rounded Y,
 * text) so a genuine line like a repeated job title kept under two employers
 * (different baseline) is never removed.
 */
function dedupe(columns: { text: string; y: number }[][]): { text: string; y: number }[] {
  const seen = new Set<string>();
  const out: { text: string; y: number }[] = [];
  for (const col of columns) {
    for (const line of col) {
      const yKey = Math.round(line.y / Y_LINE_TOLERANCE);
      const key = `${yKey}|${line.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(line);
    }
  }
  return out;
}

/**
 * Reconstruct a readable ordered text dump for one page from pdfjs text items.
 * Returns text with each column region separated by a blank line.
 */
export function extractPageText(items: PdfTextItem[]): string {
  const runs = toRuns(items);
  if (!runs.length) return "";

  const separators = detectColumnSeparators(runs);
  if (separators.length === 0) {
    return dehyphenate(buildColumnLines(runs)).map((l) => l.text).join("\n") + "\n\n";
  }

  const colRuns: LayoutRun[][] = [];
  for (const r of runs) {
    const ci = columnIndexOf(r, separators);
    if (!colRuns[ci]) colRuns[ci] = [];
    colRuns[ci].push(r);
  }

  const columns: { text: string; y: number }[][] = [];
  for (const col of colRuns) {
    if (col.length >= REGION_MIN_ITEMS) columns.push(dehyphenate(buildColumnLines(col)));
  }

  return dedupe(columns).map((l) => l.text).join("\n") + "\n\n";
}