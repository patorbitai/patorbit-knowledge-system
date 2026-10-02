"use strict";

/**
 * M7B/M7C — Job discovery service: deterministic, AI-free search across the
 * four M7A-approved sources (Greenhouse, Lever, Ashby, Arbeitnow).
 *
 * Pipeline (in order):
 *   1. parseJobSearchQuery — strict, bounded query validation (pure).
 *   2. planProviders       — which OFFICIAL feeds to call; a client never
 *                            supplies a URL, only a plain board identifier.
 *   3. searchJobs          — rate-limit → fetch via the M7A boundary →
 *                            normalize → persist idempotently WITH per-feed
 *                            provenance → record source observations →
 *                            feed-scoped absence (complete checks only) →
 *                            freshness from evidence → assemble, filter,
 *                            order, paginate.
 *
 * Guarantees encoded here:
 *   - Zero AI: no model calls, no usage-service calls. Discovery consumes
 *     zero ai_generations / ai_tailoring / job_analysis credits.
 *   - Zero user data upstream: fetchSourceJson only ever receives a
 *     registry-built URL. No resume, profile, session, or query text can
 *     reach a source host — the request init carries fixed headers only.
 *   - Rate limit BEFORE every upstream call (checkJobSourceRateLimit by
 *     default). A denial before the first call fails the whole search with
 *     JobSearchRateLimitedError; a denial mid-search marks the remaining
 *     providers "rate_limited" and returns partial (still usable) results.
 *     A rate-limited or failed provider records NO observation and NEVER
 *     counts as an absence (M7C §8).
 *   - One failing provider never fails the whole search: each provider is
 *     fetched inside its own try/catch and reported in `providers`.
 *   - Persistence is idempotent on (sourceKind, sourceFeedKey, externalId)
 *     and preserves sourceUrl / applyUrl / attribution exactly as supplied,
 *     per source (M7C §2).
 *   - Dedupe uses M7A's conservative ladder: merge only on feed-scoped
 *     source identity, canonical URL, or content fingerprint; soft-key hits
 *     stay separate jobs (under-merge); different companies NEVER merge
 *     (M7A hard guard).
 *   - Freshness is evidence-based (M7A state machine fed by M7C
 *     observations): a database row alone never yields "active"; unconfirmed
 *     rows stay "unknown"; absence is claimed only from a COMPLETE
 *     observation of the EXACT feed the posting belongs to.
 *   - Deterministic: stable provider order, stable ingest order, stable
 *     result ordering (postedAt desc with nulls last, jobId ascending),
 *     stable pagination. No embeddings, no LLM ranking, no AI relevance.
 */

import { prisma } from "@/lib/prisma";
import { checkJobSourceRateLimit } from "@/lib/rate-limit";
import {
  JOB_SOURCES,
  SOURCE_KINDS,
  SOURCE_FEED_BOARD_PATTERN as BOARD_PATTERN,
  BOARD_REQUIRED_SOURCES,
  SourceAdapterError,
  SourceFetchError,
  buildSourceFeedKey,
  evaluateFeedObservation,
  evaluateFreshness,
  fetchSourceJson,
  isSourceKind,
  jobFreshnessEvidence,
  normalizeEmploymentType,
  type FeedObservationAssessment,
  type FetchLike,
  type FreshnessEvaluation,
  type FreshnessState,
  type SourceKind,
  type StoredPosting,
} from "@/lib/job-sources";
import {
  applyFeedAbsence,
  applyObservationEffects,
  canonicalDatesByJob,
  compareStrings,
  persistPostings,
  postingDates,
  recordFeedObservation,
  type JobSnapshot,
  type PersistedObservation,
  type SourcedPosting,
} from "@/services/job-source-revalidation.service";

/* ── Limits & validation ─────────────────────────────────────────────────── */

/** Central bounds for client-supplied query values. */
export const JOB_SEARCH_LIMITS = Object.freeze({
  maxQueryChars: 200,
  maxLocationChars: 100,
  maxCompanyChars: 100,
  maxEmploymentTypeChars: 50,
  maxBoardChars: 64,
  defaultPage: 1,
  maxPage: 100,
  defaultPageSize: 10,
  maxPageSize: 25,
});

/**
 * Fixed upstream page for the Arbeitnow global feed. Our own pagination is
 * applied over the assembled result set, so the upstream corpus must stay
 * identical across page 1/2/3 requests — otherwise results would shift
 * between pages (non-deterministic pagination).
 *
 * M7C: because search fetches only ONE page of a paginated feed, the search
 * observation for arbeitnow is recorded as INCOMPLETE (partial_feed) —
 * presence still counts, absence NEVER does. Complete enumeration for
 * absence lives in revalidateJobSourceFeed (bounded pagination).
 */
const ARBEITNOW_FEED_PAGE = 1;

/* ── Errors ──────────────────────────────────────────────────────────────── */

/** Client query failed validation. `code` is stable and machine-readable. */
export class JobSearchValidationError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "JobSearchValidationError";
    this.code = code;
  }
}

/** Rate limit hit BEFORE any upstream call — routes map this to 429. */
export class JobSearchRateLimitedError extends Error {
  readonly retryAfter: number;
  constructor(retryAfter: number) {
    super("Too many job source requests. Please try again shortly.");
    this.name = "JobSearchRateLimitedError";
    this.retryAfter = retryAfter;
  }
}

/* ── Query parsing (pure) ────────────────────────────────────────────────── */

export interface JobSearchInput {
  q: string | null;
  sources: SourceKind[];
  board: string | null;
  company: string | null;
  location: string | null;
  remote: boolean | null;
  employmentType: string | null;
  page: number;
  pageSize: number;
}

function parseBoundedInt(
  raw: string | null,
  fallback: number,
  max: number,
  code: string,
  label: string,
): number {
  if (raw === null || raw === "") return fallback;
  if (!/^\d{1,6}$/.test(raw)) {
    throw new JobSearchValidationError(
      code,
      `${label} must be an integer between 1 and ${max}.`,
    );
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new JobSearchValidationError(
      code,
      `${label} must be an integer between 1 and ${max}.`,
    );
  }
  return value;
}

/**
 * Validate and normalize a discovery query. Pure and deterministic: same
 * params → same input object or the same validation error. Every field is
 * bounded; unknown sources, unsafe boards, and malformed values are rejected
 * with stable machine-readable codes.
 *
 * Defaults: sources=arbeitnow (the only source that supports open search
 * without a board), page=1, pageSize=10.
 */
export function parseJobSearchQuery(params: URLSearchParams): JobSearchInput {
  const q = (params.get("q") ?? "").trim();
  if (q.length > JOB_SEARCH_LIMITS.maxQueryChars) {
    throw new JobSearchValidationError(
      "QUERY_TOO_LONG",
      `Search query must be at most ${JOB_SEARCH_LIMITS.maxQueryChars} characters.`,
    );
  }

  // Sources — comma list, each entry must be one of the four approved kinds.
  const rawSources = (params.get("sources") ?? "").trim();
  let sources: SourceKind[];
  if (!rawSources) {
    sources = ["arbeitnow"];
  } else {
    const requested = new Set<SourceKind>();
    for (const part of rawSources.split(",")) {
      const value = part.trim();
      if (!value) continue;
      if (!isSourceKind(value)) {
        throw new JobSearchValidationError(
          "INVALID_SOURCES",
          `Unknown job source. Approved sources: ${SOURCE_KINDS.join(", ")}.`,
        );
      }
      requested.add(value);
    }
    if (requested.size === 0) {
      throw new JobSearchValidationError(
        "INVALID_SOURCES",
        `sources must list at least one approved source: ${SOURCE_KINDS.join(", ")}.`,
      );
    }
    sources = SOURCE_KINDS.filter((kind) => requested.has(kind));
  }

  // Board — plain slug only; required for per-company ATS feeds.
  const boardRaw = (params.get("board") ?? "").trim();
  let board: string | null = null;
  if (boardRaw) {
    if (
      boardRaw.length > JOB_SEARCH_LIMITS.maxBoardChars ||
      !BOARD_PATTERN.test(boardRaw)
    ) {
      throw new JobSearchValidationError(
        "INVALID_BOARD",
        "board must be a plain identifier: letters, digits, dot, dash, or underscore.",
      );
    }
    board = boardRaw;
  }
  if (
    !board &&
    sources.some((kind) => BOARD_REQUIRED_SOURCES.includes(kind))
  ) {
    throw new JobSearchValidationError(
      "BOARD_REQUIRED",
      "A board identifier is required for Greenhouse, Lever, and Ashby searches.",
    );
  }

  const companyRaw = (params.get("company") ?? "").trim();
  if (companyRaw.length > JOB_SEARCH_LIMITS.maxCompanyChars) {
    throw new JobSearchValidationError(
      "INVALID_COMPANY",
      `company must be at most ${JOB_SEARCH_LIMITS.maxCompanyChars} characters.`,
    );
  }

  const locationRaw = (params.get("location") ?? "").trim();
  if (locationRaw.length > JOB_SEARCH_LIMITS.maxLocationChars) {
    throw new JobSearchValidationError(
      "LOCATION_TOO_LONG",
      `location must be at most ${JOB_SEARCH_LIMITS.maxLocationChars} characters.`,
    );
  }

  const remoteRaw = (params.get("remote") ?? "").trim();
  let remote: boolean | null = null;
  if (remoteRaw === "true") remote = true;
  else if (remoteRaw === "false") remote = false;
  else if (remoteRaw.length > 0) {
    throw new JobSearchValidationError(
      "INVALID_REMOTE",
      "remote must be true or false.",
    );
  }

  const employmentRaw = (params.get("employmentType") ?? "").trim();
  let employmentType: string | null = null;
  if (employmentRaw) {
    if (employmentRaw.length > JOB_SEARCH_LIMITS.maxEmploymentTypeChars) {
      throw new JobSearchValidationError(
        "INVALID_EMPLOYMENT_TYPE",
        `employmentType must be at most ${JOB_SEARCH_LIMITS.maxEmploymentTypeChars} characters.`,
      );
    }
    employmentType = normalizeEmploymentType(employmentRaw);
    if (!employmentType) {
      throw new JobSearchValidationError(
        "INVALID_EMPLOYMENT_TYPE",
        "employmentType is not a recognized employment type (e.g. full_time, part_time, contract, internship).",
      );
    }
  }

  const page = parseBoundedInt(
    params.get("page"),
    JOB_SEARCH_LIMITS.defaultPage,
    JOB_SEARCH_LIMITS.maxPage,
    "INVALID_PAGE",
    "page",
  );
  const pageSize = parseBoundedInt(
    params.get("pageSize"),
    JOB_SEARCH_LIMITS.defaultPageSize,
    JOB_SEARCH_LIMITS.maxPageSize,
    "INVALID_PAGE_SIZE",
    "pageSize",
  );

  return {
    q: q.length > 0 ? q : null,
    sources,
    board,
    company: companyRaw.length > 0 ? companyRaw : null,
    location: locationRaw.length > 0 ? locationRaw : null,
    remote,
    employmentType,
    page,
    pageSize,
  };
}

/* ── Provider planning ───────────────────────────────────────────────────── */

export interface ProviderPlanEntry {
  kind: SourceKind;
  /** Board/organization slug for per-company ATS feeds. */
  board?: string;
  /** Company display context for feeds whose payload carries no company. */
  companyName?: string;
}

/**
 * Which official feeds this search will call, in stable SOURCE_KINDS order.
 * A client can only pick sources and a plain board slug — never a URL.
 * Arbeitnow takes no board; per-company feeds always require one.
 */
export function planProviders(input: JobSearchInput): ProviderPlanEntry[] {
  if (input.sources.length === 0) {
    throw new JobSearchValidationError(
      "INVALID_SOURCES",
      "At least one source must be selected.",
    );
  }
  const needsBoard = input.sources.some((kind) =>
    BOARD_REQUIRED_SOURCES.includes(kind),
  );
  if (needsBoard && !input.board) {
    throw new JobSearchValidationError(
      "BOARD_REQUIRED",
      "A board identifier is required for Greenhouse, Lever, and Ashby searches.",
    );
  }

  return SOURCE_KINDS.filter((kind) => input.sources.includes(kind)).map(
    (kind) => {
      if (kind === "arbeitnow") return { kind };
      const board = input.board as string;
      return { kind, board, companyName: input.company ?? board };
    },
  );
}

/* ── Freshness (M7A state machine fed by M7C evidence) ──────────────────── */

/**
 * Evaluate a stored Job's freshness from evidence — never from existence.
 *
 * With `postings` (M7C): evidence derives from the job's PER-FEED posting
 * rows — presence/absence/confirmation counts all come from recorded
 * observations, scoped to each posting's own feed:
 *  - any feed still confirming → presentInSource true;
 *  - all known feeds missing ≥1 complete check → presentInSource false with
 *    the minimum miss count (expired only when every feed reached the
 *    two-miss threshold);
 *  - never confirmed anywhere → unknown (a DB row alone is NOT evidence).
 *
 * Without `postings` (legacy 3-arg form): presence is derived from the
 * job's own confirmation stamp only and `absentConsecutiveChecks` stays 0 —
 * a claim of absence REQUIRES a complete per-feed observation, so this
 * fallback can never invent one.
 */
export function freshnessForStoredJob(
  job: { lastConfirmedAt: Date | null },
  canonical: { postedAt: Date | null; validThrough: Date | null } | null,
  now: Date,
  postings?: readonly StoredPosting[] | null,
): FreshnessEvaluation {
  if (postings && postings.length > 0) {
    const evidence = jobFreshnessEvidence({
      jobLastConfirmedAt: job.lastConfirmedAt,
      postings,
    });
    return evaluateFreshness(
      {
        ...evidence,
        validThrough: canonical?.validThrough ?? null,
        postedAt: canonical?.postedAt ?? null,
      },
      now,
    );
  }

  return evaluateFreshness(
    {
      explicitClosure: false,
      validThrough: canonical?.validThrough ?? null,
      presentInSource: job.lastConfirmedAt ? true : null,
      lastConfirmedAt: job.lastConfirmedAt,
      absentConsecutiveChecks: 0,
      postedAt: canonical?.postedAt ?? null,
    },
    now,
  );
}

/* ── Result assembly ─────────────────────────────────────────────────────── */

export interface JobResultItem {
  /** Stable job identifier (normalized Job, may hold several source rows). */
  jobId: string;
  title: string;
  companyName: string;
  location: string | null;
  remote: boolean;
  employmentType: string | null;
  /** Source-provided posting date; null when the source supplied none. */
  postedAt: string | null;
  /** Evidence-based freshness (M7A state machine) — never "exists ⇒ live". */
  freshness: { state: FreshnessState; reasons: string[] };
  source: {
    kind: SourceKind;
    displayName: string;
    attributionText: string;
    attributionUrl: string;
  };
  /** Exact feed the canonical posting was observed in (M7C provenance). */
  feedKey: string;
  sourceUrl: string;
  /** Canonical posting's OWN application destination (source-specific, verbatim). */
  applyUrl: string;
  /**
   * ISO-8601 of the last confirmed presence of this job in an official
   * feed; null when never confirmed. Never derived from updatedAt/lastSeenAt.
   */
  lastConfirmedAt: string | null;
  /** Every source that contributed a row to this job in this search. */
  sources: SourceKind[];
}

export interface ProviderStatus {
  source: SourceKind;
  status: "ok" | "failed" | "rate_limited";
  fetched?: number;
  skipped?: number;
  /** Stable machine code for failed providers (SourceFetchError codes). */
  code?: string;
  retryAfter?: number;
}

export interface JobSearchResult {
  results: JobResultItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  providers: ProviderStatus[];
  fetchedAt: string;
}

export interface JobSearchDeps {
  /** Injectable fetch for tests — production uses the global fetch. */
  fetchImpl?: FetchLike;
  /** Injectable source rate-limit gate (defaults to checkJobSourceRateLimit). */
  rateLimitCheck?: (userId: string) => { allowed: boolean; retryAfter: number };
  /** Injectable clock for deterministic tests. */
  now?: () => Date;
}

function matchesQuery(tokens: string[], job: JobSnapshot): boolean {
  const haystack =
    `${job.title}\u0000${job.companyName}\u0000${job.locationNorm ?? ""}\u0000${job.descriptionText}`.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

/**
 * Load the FULL posting evidence (every feed) for the jobs that will appear
 * in this search's results — freshness must consider cross-feed absences,
 * not just what this search observed.
 */
async function loadPostingsByJob(
  jobIds: readonly string[],
): Promise<Map<string, StoredPosting[]>> {
  const map = new Map<string, StoredPosting[]>();
  if (jobIds.length === 0) return map;
  const rows = await prisma.jobPosting.findMany({
    where: { jobId: { in: [...jobIds] } },
    select: {
      jobId: true,
      sourceKind: true,
      sourceFeedKey: true,
      externalId: true,
      lastConfirmedAt: true,
      absentConsecutiveChecks: true,
      postedAt: true,
      validThrough: true,
    },
  });
  for (const row of rows) {
    if (!row.jobId) continue;
    const stored: StoredPosting = {
      sourceKind: row.sourceKind,
      sourceFeedKey: row.sourceFeedKey,
      externalId: row.externalId,
      lastConfirmedAt: row.lastConfirmedAt,
      absentConsecutiveChecks: row.absentConsecutiveChecks,
      postedAt: row.postedAt,
      validThrough: row.validThrough,
    };
    const list = map.get(row.jobId);
    if (list) list.push(stored);
    else map.set(row.jobId, [stored]);
  }
  return map;
}

function assembleEntries(
  observations: PersistedObservation[],
  jobs: Map<string, JobSnapshot>,
  input: JobSearchInput,
  now: Date,
  postingsByJob: Map<string, StoredPosting[]>,
): Array<{ item: JobResultItem; postedAtMs: number | null }> {
  const byJob = new Map<string, SourcedPosting[]>();
  for (const observation of observations) {
    const list = byJob.get(observation.jobId);
    if (list) list.push(observation.posting);
    else byJob.set(observation.jobId, [observation.posting]);
  }

  const tokens = input.q
    ? input.q.toLowerCase().split(/\s+/).filter(Boolean)
    : [];
  const locationNeedle = input.location ? input.location.toLowerCase() : null;

  const entries: Array<{ item: JobResultItem; postedAtMs: number | null }> = [];

  for (const [jobId, jobPostings] of byJob) {
    const job = jobs.get(jobId);
    if (!job) continue;
    // Canonical posting: first in the deterministic ingest order.
    const canonical = jobPostings[0];

    if (
      locationNeedle !== null &&
      !(job.locationNorm ?? "").toLowerCase().includes(locationNeedle)
    ) {
      continue;
    }
    if (input.remote !== null && job.remote !== input.remote) continue;
    if (
      input.employmentType !== null &&
      job.employmentType !== input.employmentType
    ) {
      continue;
    }
    if (tokens.length > 0 && !matchesQuery(tokens, job)) continue;

    const evaluation = freshnessForStoredJob(
      job,
      postingDates(canonical),
      now,
      postingsByJob.get(jobId) ?? [],
    );
    const definition = JOB_SOURCES[canonical.sourceKind];
    const kinds = [...new Set(jobPostings.map((p) => p.sourceKind))].sort(
      compareStrings,
    );

    entries.push({
      item: {
        jobId,
        title: job.title,
        companyName: job.companyName,
        location: job.locationNorm,
        remote: job.remote,
        employmentType: job.employmentType,
        postedAt: canonical.postedAt,
        freshness: { state: evaluation.state, reasons: evaluation.reasons },
        source: {
          kind: canonical.sourceKind,
          displayName: definition.displayName,
          attributionText: definition.attributionText,
          attributionUrl: definition.attributionUrl,
        },
        feedKey: canonical.sourceFeedKey,
        sourceUrl: canonical.sourceUrl,
        // The canonical SOURCE's own destinations (never another source's).
        applyUrl: canonical.applyUrl,
        lastConfirmedAt: job.lastConfirmedAt
          ? job.lastConfirmedAt.toISOString()
          : null,
        sources: kinds,
      },
      postedAtMs: canonical.postedAt ? Date.parse(canonical.postedAt) : null,
    });
  }

  // Stable ordering: newest source-provided posting first, unknown dates
  // last, jobId ascending as the deterministic tiebreaker.
  entries.sort((a, b) => {
    if (a.postedAtMs !== null && b.postedAtMs !== null) {
      if (a.postedAtMs !== b.postedAtMs) return b.postedAtMs - a.postedAtMs;
    } else if (a.postedAtMs === null && b.postedAtMs !== null) {
      return 1;
    } else if (a.postedAtMs !== null && b.postedAtMs === null) {
      return -1;
    }
    return compareStrings(a.item.jobId, b.item.jobId);
  });

  return entries;
}

function providerErrorCode(err: unknown): string {
  if (err instanceof SourceFetchError) return err.code;
  if (err instanceof SourceAdapterError) return "adapter_error";
  return "unknown_error";
}

/* ── Search (the orchestration entry point) ──────────────────────────────── */

interface ProviderOutcome {
  kind: SourceKind;
  feedKey: string;
  fetched: number;
  skipped: number;
  postings: SourcedPosting[];
  assessment: FeedObservationAssessment;
  presentIds: string[];
}

/**
 * Run one discovery search for an authenticated user.
 *
 * Flow: plan providers → rate-limit → fetch each provider through the M7A
 * boundary → parse → derive feed identity → persist idempotently → record
 * observations → apply absence ONLY from complete observations → refresh
 * freshness from evidence → filter/order/paginate → return.
 *
 * Throws:
 *  - JobSearchRateLimitedError when the source rate limit denies the very
 *    first upstream call (routes translate it to the shared 429 shape);
 *  - JobSearchValidationError for invalid hand-built input.
 * Provider-level failures never throw — they are reported in `providers`,
 * and a failed/rate-limited provider records no observation at all.
 */
export async function searchJobs(
  userId: string,
  input: JobSearchInput,
  deps: JobSearchDeps = {},
): Promise<JobSearchResult> {
  const now = deps.now ?? (() => new Date());
  const observedAt = now();
  const rateLimitCheck = deps.rateLimitCheck ?? checkJobSourceRateLimit;
  const plan = planProviders(input);

  const providers: ProviderStatus[] = [];
  const outcomes: ProviderOutcome[] = [];
  const fetched: SourcedPosting[] = [];
  let attempted = 0;
  let blocked = false;

  for (const entry of plan) {
    if (blocked) {
      providers.push({ source: entry.kind, status: "rate_limited" });
      continue;
    }

    // Rate limit BEFORE every upstream source call — a denied request never
    // reaches the network (and therefore can never record an absence).
    const gate = rateLimitCheck(userId);
    if (!gate.allowed) {
      if (attempted === 0) {
        throw new JobSearchRateLimitedError(gate.retryAfter);
      }
      blocked = true;
      providers.push({
        source: entry.kind,
        status: "rate_limited",
        retryAfter: gate.retryAfter,
      });
      continue;
    }
    attempted += 1;

    try {
      const definition = JOB_SOURCES[entry.kind];
      const request = definition.adapter.buildListRequest(
        entry.kind === "arbeitnow"
          ? { page: ARBEITNOW_FEED_PAGE }
          : { board: entry.board },
      );
      const payload = await fetchSourceJson<unknown>(entry.kind, request, {
        fetchImpl: deps.fetchImpl,
      });
      const parsed = definition.adapter.parseList(
        payload,
        entry.companyName ? { companyName: entry.companyName } : undefined,
      );
      // M7C feed identity: derived from the registry AFTER a validated
      // response — never fabricated, never inferred from company names.
      // An invalid hand-built board fails the provider here (it still went
      // through the M7A allowlist first — provenance is never guessed).
      const feedKey = buildSourceFeedKey(entry.kind, entry.board);
      const postings = parsed.postings.map((posting) => ({
        ...posting,
        sourceFeedKey: feedKey,
      }));
      fetched.push(...postings);

      const assessment = evaluateFeedObservation({
        feedPolicy: definition.feedPolicy,
        skippedCount: parsed.skipped.length,
        payloadLevelSkip: parsed.skipped.some((skip) => skip.index === -1),
        // A single-response feed's one parse IS the whole board; for a
        // paginated feed, one search page is exhaustive only when that page
        // came back explicitly empty (end of feed). Otherwise: presence yes,
        // absence never (M7C §12 — never treat a partial page as complete).
        exhausted:
          definition.feedPolicy === "single_response" ||
          postings.length === 0,
      });
      outcomes.push({
        kind: entry.kind,
        feedKey,
        fetched: parsed.postings.length,
        skipped: parsed.skipped.length,
        postings,
        assessment,
        presentIds: [
          ...new Set(postings.map((posting) => posting.externalId)),
        ].sort(compareStrings),
      });
      providers.push({
        source: entry.kind,
        status: "ok",
        fetched: parsed.postings.length,
        skipped: parsed.skipped.length,
      });
    } catch (err) {
      // Isolation: one failing provider never fails the search — and a
      // failure records NO observation (failures are not evidence, §8).
      providers.push({
        source: entry.kind,
        status: "failed",
        code: providerErrorCode(err),
      });
    }
  }

  // ── M7C persistence: provenance upsert → observation → absence → freshness
  const { observations, jobs } = await persistPostings(fetched, observedAt);
  const observedJobIds = new Set(observations.map((obs) => obs.jobId));
  const canonicalByJob = canonicalDatesByJob(observations);
  const absentJobIds = new Set<string>();

  for (const outcome of outcomes) {
    await recordFeedObservation({
      kind: outcome.kind,
      feedKey: outcome.feedKey,
      observedAt,
      assessment: outcome.assessment,
      presentIds: outcome.presentIds,
      skippedCount: outcome.skipped,
    });
    if (outcome.assessment.complete) {
      // Feed-scoped two-miss policy: only a COMPLETE observation of this
      // exact feed may increment absentConsecutiveChecks (§9).
      const absence = await applyFeedAbsence(
        outcome.kind,
        outcome.feedKey,
        new Set(outcome.presentIds),
      );
      for (const jobId of absence.affectedJobIds) absentJobIds.add(jobId);
    }
  }

  await applyObservationEffects({
    observedJobIds,
    absentJobIds,
    canonicalByJob,
    observedAt,
  });
  // Read model: observed jobs are confirmed present as of this check.
  for (const jobId of observedJobIds) {
    const snapshot = jobs.get(jobId);
    if (snapshot) snapshot.lastConfirmedAt = observedAt;
  }

  const resultJobIds = [...observedJobIds];
  const postingsByJob = await loadPostingsByJob(resultJobIds);

  const entries = assembleEntries(
    observations,
    jobs,
    input,
    observedAt,
    postingsByJob,
  );

  const total = entries.length;
  const start = (input.page - 1) * input.pageSize;
  const results = entries.slice(start, start + input.pageSize).map((e) => e.item);

  return {
    results,
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages: Math.ceil(total / input.pageSize),
    providers,
    fetchedAt: observedAt.toISOString(),
  };
}
