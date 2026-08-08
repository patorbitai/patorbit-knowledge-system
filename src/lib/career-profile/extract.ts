"use strict";

/**
 * Deterministic extractors for the Career Profile (M1).
 *
 * These functions extract ONLY what is literally present in the source text.
 * They never synthesize, infer intent, or invent metrics. Anything not matched
 * by a rule is simply absent from the output.
 */

/* ── ID normalization ────────────────────────────────────────────────────── */

/**
 * Normalize a raw source id into a stable, prefix-scoped profile id.
 *
 * Handles both store ids (`id_<ts>_<rand>`) and import ids (numeric strings):
 * the raw id is preserved verbatim inside the generated id so that the result
 * is deterministic for the same source item and never collides across sections.
 */
export function profileItemId(prefix: string, sourceId: string): string {
  const safe = sourceId.replace(/[^A-Za-z0-9_-]/g, "_");
  return `cp_${prefix}_${safe}`;
}

/* ── Text utilities ─────────────────────────────────────────────────────── */

/** Split a comma/pipe separated technology string into trimmed names. */
export function splitTechnologies(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;|]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Collapse whitespace and trim a single free-text value. */
export function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/* ── Industries ──────────────────────────────────────────────────────────── */

export interface IndustryCandidate {
  name: string;
  sourceRef: string;
}

/**
 * Collect the industries explicitly stated on each experience.
 * Empty/blank industry values are ignored — nothing is guessed.
 */
export function extractIndustries(
  experiences: { id: string; industry?: string | null }[],
): IndustryCandidate[] {
  const out: IndustryCandidate[] = [];
  for (const exp of experiences) {
    const name = clean(exp.industry);
    if (!name) continue;
    out.push({ name, sourceRef: exp.id });
  }
  return out;
}

/* ── Leadership ──────────────────────────────────────────────────────────── */

const LEADERSHIP_VERBS = [
  "led", "lead", "leads", "leading",
  "managed", "manage", "manages", "managing",
  "supervised", "supervising",
  "mentored", "mentoring",
  "coached", "coaching",
  "directed", "heading",
  "headed",
];

const LEADERSHIP_RE = new RegExp(
  `\\b(${LEADERSHIP_VERBS.join("|")})\\b`,
  "i",
);

const TEAM_SIZE_RES = [
  /\bteam of (\d+)(?:\s*\+)?\b/i,
  /\b(\d+)\s*[-–]person team\b/i,
  /\b(\d+)(?:\s*\+)?\s*(?:person|member|engineer|developer)s?\s+team\b/i,
  /\bleading a team of (\d+)\b/i,
];

export interface LeadershipCandidate {
  /** The exact source line carrying the leadership signal. */
  context: string;
  /** Optional noun phrase following the leadership verb. */
  role?: string;
  /** Optional team size stated in the source line. */
  teamSize?: string;
}

/**
 * Extract leadership signals from free text. Only lines containing an explicit
 * leadership verb are returned; the verb's object is preserved verbatim as the
 * role, never paraphrased.
 */
export function extractLeadershipFromText(text: string): LeadershipCandidate[] {
  const candidates: LeadershipCandidate[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = clean(rawLine);
    if (!line) continue;
    const match = line.match(LEADERSHIP_RE);
    if (!match) continue;

    let teamSize: string | undefined;
    for (const re of TEAM_SIZE_RES) {
      const t = line.match(re);
      if (t) {
        teamSize = t[1];
        break;
      }
    }

    // Capture the object of the leadership verb: e.g. "Led engineering" →
    // "engineering". Fall back to the whole line if no object is capturable.
    let role: string | undefined;
    const idx = line.search(LEADERSHIP_RE);
    if (idx >= 0) {
      const after = line.slice(idx + match[0].length).trim();
      const obj = after.split(/[,.!;]| and /i)[0].trim();
      if (obj && obj.length <= 80) role = clean(obj);
    }

    candidates.push({ context: line, role, teamSize });
  }
  return candidates;
}

/* ── Measurable outcomes ─────────────────────────────────────────────────── */

const PERCENT_RE = /(\d+(?:\.\d+)?)\s*%/;
const CURRENCY_RE = /\$\s?(\d+(?:[.,]\d+)?)\s*([kKmMbB]?)/;
const COUNT_RE = new RegExp(
  "\\b(\\d+(?:\\.\\d+)?)\\s+(users|customers|clients|requests|downloads|installs|revenue|sales|leads|conversions|hours|days|weeks|months|records|files|items|projects|repos|commits|interviews|hires|members|signups|pageviews|seats)\\b",
  "i",
);

export interface OutcomeCandidate {
  /** The exact source line containing the metric. */
  description: string;
  /** The matched numeric value. */
  metric?: string;
  /** The unit: "%", currency symbol, or the counted noun. */
  unit?: string;
}

/**
 * Extract measurable outcomes from free text. A line is only kept when it
 * literally contains a percentage, a currency amount, or a number followed by
 * a countable noun. Values are copied verbatim — never rounded or computed.
 */
export function extractOutcomesFromText(text: string): OutcomeCandidate[] {
  const candidates: OutcomeCandidate[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = clean(rawLine);
    if (!line) continue;

    const pct = line.match(PERCENT_RE);
    if (pct) {
      candidates.push({ description: line, metric: pct[1], unit: "%" });
      continue;
    }
    const cur = line.match(CURRENCY_RE);
    if (cur) {
      const magnitude = (cur[2] ?? "").toUpperCase();
      candidates.push({
        description: line,
        metric: cur[1],
        unit: magnitude ? `$${magnitude}` : "$",
      });
      continue;
    }
    const cnt = line.match(COUNT_RE);
    if (cnt) {
      candidates.push({ description: line, metric: cnt[1], unit: cnt[2].toLowerCase() });
      continue;
    }
  }
  return candidates;
}
