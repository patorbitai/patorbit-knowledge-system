"use strict";

/**
 * M7A — Job Source Foundation: shared types for the source-adapter layer.
 *
 * M7A is foundation only: adapters turn OFFICIAL source responses into one
 * normalized posting shape. Nothing here fetches user URLs, renders HTML, or
 * calls AI. All source content is untrusted data.
 *
 * Rules encoded in these types:
 *  - Never invent fields the source does not provide → nullable fields are
 *    `null` when absent, never synthesized.
 *  - Timestamps are ISO-8601 strings when supplied by the source, `null`
 *    otherwise. Patorbit observation timestamps live elsewhere (dedupe/
 *    freshness), never in `postedAt`/`validThrough`.
 */

/* ── Source kinds ────────────────────────────────────────────────────────── */

/** The ONLY sources supported for M7 v1 (product decision). */
export const SOURCE_KINDS = [
  "greenhouse",
  "lever",
  "ashby",
  "arbeitnow",
] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];

export function isSourceKind(value: unknown): value is SourceKind {
  return (
    typeof value === "string" && (SOURCE_KINDS as readonly string[]).includes(value)
  );
}

/* ── Normalized posting (common shape across all sources) ────────────────── */

/**
 * A single job posting normalized from one official source response.
 *
 * `raw` retains the original source object untouched (source-of-truth for
 * whatever the source sent). Everything else is derived deterministically.
 */
export interface NormalizedPosting {
  /** Stable source kind that produced this posting. */
  sourceKind: SourceKind;
  /** Source-provided identifier, stringified. Never synthesized. */
  externalId: string;
  /** HTTPS URL of the source's own page for this posting. */
  sourceUrl: string;
  /** HTTPS URL where a candidate applies (equals sourceUrl when the source supplies no separate apply URL). */
  applyUrl: string;
  title: string;
  companyName: string;
  /** Location exactly as the source stated it, or null when absent. */
  locationRaw: string | null;
  /** True ONLY when the source explicitly indicates remote (flag or "remote" location text). */
  remote: boolean;
  /**
   * Employment type normalized to snake_case (e.g. "Full-time" → "full_time"),
   * or null when the source does not supply one.
   */
  employmentType: string | null;
  /** Salary exactly as the source stated it, or null when absent. Never estimated. */
  salaryRaw: string | null;
  /**
   * Deterministic plain-text description: HTML stripped + whitespace
   * normalized. May be an empty string if the source supplied no description.
   */
  descriptionText: string;
  /** Source-provided posted/created/updated timestamp (ISO-8601), null when absent. */
  postedAt: string | null;
  /** Source-provided expiration (ISO-8601), null — no M7A source supplies one. */
  validThrough: string | null;
  /** The original, unmodified source object (untrusted). */
  raw: Record<string, unknown>;
}

/* ── Adapter contract ────────────────────────────────────────────────────── */

/**
 * Parameters for building a source list/search request.
 *
 * Greenhouse/Lever/Ashby are per-company board APIs and require `board`
 * (the official board identifier). Arbeitnow is a global feed and uses
 * `page` only.
 */
export interface SourceListParams {
  /** Board/organization identifier for per-company ATS feeds. */
  board?: string;
  /** 1-based page number where the source supports pagination. */
  page?: number;
}

/** A row the adapter could not safely parse (malformed upstream data). */
export interface SkippedRow {
  index: number;
  reason: string;
}

export interface SourceParseResult {
  postings: NormalizedPosting[];
  /** Rows skipped due to malformed/missing required fields — never silently dropped. */
  skipped: SkippedRow[];
}

/**
 * Optional parse context. Per-company ATS feeds (Greenhouse, Lever, Ashby)
 * do NOT embed a company name in their payloads — the board identity is the
 * company. Callers that know the board's display name pass it here; without
 * it, `companyName` stays empty rather than being guessed from the payload.
 */
export interface SourceParseContext {
  companyName?: string;
}

/**
 * A source adapter: builds official request URLs and parses official
 * responses into the normalized shape. Pure except for URL construction —
 * network I/O lives in `fetch.ts` (registry-validated).
 */
export interface SourceAdapter {
  readonly kind: SourceKind;
  readonly displayName: string;
  /**
   * Build the official list/search request URL for this source.
   * Throws SourceAdapterError when required parameters are missing.
   * The URL is validated against the registry before any fetch occurs.
   */
  buildListRequest(params: SourceListParams): URL;
  /**
   * Parse an official list response into normalized postings.
   * Never throws on row-level malformation: bad rows are reported in
   * `skipped`. A structurally-wrong payload yields zero postings + one
   * payload-level skip entry. `context` supplies company identity for
   * sources whose payloads do not carry it.
   */
  parseList(payload: unknown, context?: SourceParseContext): SourceParseResult;
}

/** Thrown when a request URL cannot be built from the supplied params. */
export class SourceAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceAdapterError";
  }
}

/* ── Registry shape ──────────────────────────────────────────────────────── */

/** URL rules every source must obey (kept explicit for future audits). */
export interface SourceUrlRules {
  /** All source URLs must be HTTPS. Non-HTTPS is rejected, never upgraded. */
  requireHttps: true;
  /** Paths that may be requested on the allowed hosts (informational). */
  readonly note: string;
}

export interface SourceDefinition {
  /** Stable source kind (DB persistence key). */
  kind: SourceKind;
  /** Human-readable display name. */
  displayName: string;
  /** Attribution/link text shown when source terms require credit. */
  attributionText: string;
  /** Canonical homepage used for attribution links. */
  attributionUrl: string;
  /**
   * Exact HTTPS hostnames that may be fetched for this source.
   * This list — not per-adapter code — is the SSRF allowlist source of truth.
   * Exact-match only: no wildcards, no suffix matching.
   */
  allowedHosts: readonly string[];
  urlRules: SourceUrlRules;
  adapter: SourceAdapter;
}

/** Result of validating a URL against a source's allowlist. */
export type SourceUrlDecision =
  | { ok: true; url: URL }
  | { ok: false; reason: string };
