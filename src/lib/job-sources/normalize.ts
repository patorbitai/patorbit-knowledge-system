"use strict";

/**
 * M7A — deterministic normalization utilities.
 *
 * Everything in this module is a pure function: same input ⇒ same output,
 * no locale dependence, no clock dependence, no randomness.
 *
 * Two hard rules:
 *  1. DESTINATION URLs are never rewritten. `canonicalUrlKey` produces a
 *     comparison KEY only; the URL stored and handed to the user is the
 *     source's own URL, untouched (after HTTPS validation).
 *  2. HTML is stripped only for the normalized text/fingerprint
 *     representation. The raw source payload is retained separately by the
 *     adapters (`NormalizedPosting.raw`).
 */

/* ── Basic text ──────────────────────────────────────────────────────────── */

/**
 * Deterministic whitespace collapse: NBSP → space, horizontal runs → one
 * space, newline runs (with surrounding blanks) → one newline, trimmed.
 * The same rules apply to every source so cross-source text compares equal.
 */
export function collapseWhitespace(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  copy: "©",
  reg: "®",
  trade: "™",
};

/** Decode a fixed, deterministic set of HTML entities (named + numeric). */
export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith("#")) {
      const isHex = body[1] === "x" || body[1] === "X";
      const code = isHex
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      // Surrogate halves are not valid scalar values.
      if (code >= 0xd800 && code <= 0xdfff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named !== undefined ? named : match;
  });
}

/** Detect markup in a string (tags or comments). Deterministic heuristic. */
export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-zA-Z][^>]*>|<!--/g.test(value);
}

/**
 * Neutralize residual `<...>` sequences so the stored "plain text"
 * description can never carry live-looking markup — including markup
 * reintroduced by entity decoding (`&lt;script&gt;` → `<script>` → stripped).
 * A lone `<` without a closing `>` is kept as text.
 */
function neutralizeTags(text: string): string {
  return text.replace(/<[^>]*>/g, " ");
}

/**
 * Deterministically strip HTML to plain text for storage/fingerprinting:
 *  1. remove <script>/<style> blocks INCLUDING their content (hostile text),
 *  2. remove comments,
 *  3. turn block-ish tags into line breaks,
 *  4. remove any remaining tags,
 *  5. decode the fixed entity set,
 *  6. collapse whitespace.
 * The result is inert text — never markup that could be rendered.
 */
export function stripHtml(html: string): string {
  let out = html;
  out = out.replace(/<script\b[\s\S]*?<\/script\s*>/gi, " ");
  out = out.replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ");
  out = out.replace(/<!--[\s\S]*?-->/g, " ");
  out = out.replace(
    /<\s*(?:br\s*\/?|\/\s*(?:p|div|li|ul|ol|h[1-6]|tr|section|article|header|footer))\s*>/gi,
    "\n",
  );
  out = out.replace(/<[^>]*>/g, " ");
  return collapseWhitespace(neutralizeTags(decodeEntities(out)));
}

/**
 * Normalize a source description into plain text. HTML is stripped only when
 * markup is present; plain text is only entity-decoded + whitespace-collapsed.
 * Deterministic for both inputs.
 */
export function normalizeDescriptionText(input: string): string {
  if (looksLikeHtml(input)) return stripHtml(input);
  return collapseWhitespace(neutralizeTags(decodeEntities(input)));
}

/* ── Company ─────────────────────────────────────────────────────────────── */

/** Display cleanup only: collapse whitespace, drop trailing separators. */
export function normalizeCompanyName(name: string): string {
  return collapseWhitespace(name).replace(/[,;|·]+$/g, "").trim();
}

/**
 * Locale-independent diacritic folding (NFD + combining-mark removal) so
 * "Prüfwerk" and "Prufwerk" produce the same comparison key. Deterministic:
 * pure ECMA-262 normalization, no locale tables.
 */
function foldDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Legal-suffix tokens stripped when forming a company KEY (never display). */
const COMPANY_SUFFIXES = new Set([
  "inc",
  "incorporated",
  "llc",
  "llp",
  "ltd",
  "limited",
  "corp",
  "corporation",
  "co",
  "company",
  "gmbh",
  "plc",
  "ag",
  "sa",
  "bv",
  "nv",
  "ab",
  "oy",
  "as",
  "pte",
  "pty",
  "pvt",
  "private",
  "holdings",
  "group",
]);

/**
 * Deterministic company KEY: lowercase, `&` → "and", strip punctuation,
 * strip trailing legal suffixes. Conservative: only obvious legal tokens.
 */
export function companyKey(name: string): string {
  let out = foldDiacritics(
    collapseWhitespace(normalizeCompanyName(name)).toLowerCase(),
  )
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ");
  out = out.replace(/\s+/g, " ").trim();
  // Strip up to two trailing legal-suffix tokens ("Acme Holdings Ltd").
  for (let i = 0; i < 2; i++) {
    const parts = out.split(" ");
    if (parts.length > 1 && COMPANY_SUFFIXES.has(parts[parts.length - 1])) {
      out = parts.slice(0, -1).join(" ");
    } else {
      break;
    }
  }
  return out;
}

/* ── Title / location ────────────────────────────────────────────────────── */

/** Deterministic title KEY: lowercase, punctuation-free, whitespace-collapsed. */
export function titleKey(title: string): string {
  return foldDiacritics(collapseWhitespace(title).toLowerCase())
    .replace(/[^a-z0-9+#.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Display cleanup for a location string. */
export function normalizeLocation(location: string): string {
  return collapseWhitespace(location).replace(/[,;|]+$/g, "").trim();
}

/** Deterministic location KEY (lowercase, punctuation-free). */
export function locationKey(location: string): string {
  return foldDiacritics(collapseWhitespace(normalizeLocation(location)).toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when source location text explicitly indicates a remote position. */
export function indicatesRemote(location: string | null | undefined): boolean {
  if (!location) return false;
  return /(^|[^a-z])remote([^a-z]|$)/i.test(collapseWhitespace(location));
}

/* ── Employment type ─────────────────────────────────────────────────────── */

/**
 * Normalize a source-provided employment type to snake_case.
 * "Full-time" / "FullTime" / "FULL_TIME" → "full_time". Unrecognizable
 * input → lowercased snake form (never a guess about meaning). Empty → null.
 */
export function normalizeEmploymentType(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = collapseWhitespace(value);
  if (!trimmed) return null;
  const snake = trimmed
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return snake || null;
}

/* ── Timestamps (source-provided only) ───────────────────────────────────── */

/** Earliest plausible posting date; anything older is treated as garbage. */
export const MIN_SOURCE_DATE_MS = Date.UTC(2000, 0, 1);
/** Latest plausible posting date; anything later is treated as garbage. */
export const MAX_SOURCE_DATE_MS = Date.UTC(2100, 0, 1);

/**
 * Parse a source-provided timestamp into ISO-8601 or null.
 * Accepts epoch seconds/milliseconds (heuristic: < 1e12 ⇒ seconds) and
 * Date-parseable strings. Out-of-range or malformed → null (never invented).
 */
export function parseSourceTimestamp(value: unknown): string | null {
  let ms: number | null = null;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    ms = value < 1e12 ? value * 1000 : value;
  } else if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      ms = num > 0 ? (num < 1e12 ? num * 1000 : num) : null;
    } else {
      const parsed = Date.parse(trimmed);
      ms = Number.isFinite(parsed) ? parsed : null;
    }
  }
  if (ms === null) return null;
  if (ms < MIN_SOURCE_DATE_MS || ms > MAX_SOURCE_DATE_MS) return null;
  return new Date(ms).toISOString();
}

/* ── URL handling ────────────────────────────────────────────────────────── */

/** Query parameters stripped when building a canonical comparison KEY. */
const TRACKING_PARAMS = new Set([
  "gclid",
  "gbraid",
  "wbraid",
  "dclid",
  "fbclid",
  "msclkid",
  "yclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "mkt_tok",
  "vero_id",
  "otc",
  "oly_anon_id",
  "oly_enc_id",
  "_hsenc",
  "_hsmi",
  "ref",
  "ref_",
  "referrer",
  "referrer_id",
  "trk",
  "trkcampaign",
  "campaign_id",
  "cmpid",
  "gh_src",
  "source",
  "spm",
  "scm",
]);

function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.startsWith("utm_") || TRACKING_PARAMS.has(lower);
}

/**
 * Canonical comparison KEY for a URL — for dedupe equality only, NEVER used
 * as a destination. Non-HTTPS or unparseable input → null (no key).
 *
 * Transformations (key-only): lowercase scheme/host, drop default port and
 * fragment, strip tracking parameters, sort remaining query parameters,
 * drop one trailing slash. Path CASE is preserved (paths may be case
 * sensitive — a case difference simply won't merge: under-merge bias).
 */
export function canonicalUrlKey(input: string | URL): string | null {
  let url: URL;
  try {
    url = typeof input === "string" ? new URL(input) : new URL(input.toString());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase().replace(/:443$/, "");
  let path = url.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  const params = [...url.searchParams.entries()].filter(
    ([name]) => !isTrackingParam(name),
  );
  params.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])));
  const query = params.length
    ? `?${params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")}`
    : "";

  return `${host}${path}${query}`;
}

/** Strict HTTPS check (scheme only; host validation lives in the registry). */
export function isHttpsUrl(input: string | URL): boolean {
  try {
    const url = typeof input === "string" ? new URL(input) : new URL(input.toString());
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

/* ── Shared adapter parse helpers ────────────────────────────────────────── */
/* Used by all four adapters so row parsing stays consistent. */

/** Non-empty trimmed string value, or null. */
export function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = collapseWhitespace(value);
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * An HTTPS URL string suitable for sourceUrl/applyUrl, or null.
 * Non-HTTPS or unparseable → null (callers skip the row when required).
 */
export function asHttpsUrl(value: unknown): string | null {
  const raw = asNonEmptyString(value);
  if (!raw) return null;
  return isHttpsUrl(raw) ? raw : null;
}
