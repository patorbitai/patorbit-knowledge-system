"use strict";

/**
 * M7B — Job discovery service: deterministic, AI-free search across the four
 * M7A-approved sources (Greenhouse, Lever, Ashby, Arbeitnow).
 *
 * Pipeline (in order):
 *   1. parseJobSearchQuery — strict, bounded query validation (pure).
 *   2. planProviders       — which OFFICIAL feeds to call; a client never
 *                            supplies a URL, only a plain board identifier.
 *   3. searchJobs          — rate-limit → fetch via the M7A boundary →
 *                            normalize → persist idempotently → assemble,
 *                            filter, order, paginate.
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
 *   - One failing provider never fails the whole search: each provider is
 *     fetched inside its own try/catch and reported in `providers`.
 *   - Persistence is idempotent on (sourceKind, externalId) and preserves
 *     sourceUrl / applyUrl / attribution exactly as supplied.
 *   - Dedupe uses M7A's conservative ladder: merge only on source identity,
 *     canonical URL, or content fingerprint; soft-key hits stay separate
 *     jobs (under-merge); different companies NEVER merge (M7A hard guard).
 *   - Freshness is evidence-based (M7A state machine): a database row alone
 *     never yields "active"; unconfirmed rows stay "unknown".
 *   - Deterministic: stable provider order, stable ingest order, stable
 *     result ordering (postedAt desc with nulls last, jobId ascending),
 *     stable pagination. No embeddings, no LLM ranking, no AI relevance.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkJobSourceRateLimit } from "@/lib/rate-limit";
import {
  JOB_SOURCES,
  SOURCE_KINDS,
  SourceAdapterError,
  SourceFetchError,
  canonicalUrlKey,
  companyKey,
  contentHash,
  decideDedupe,
  evaluateFreshness,
  fetchSourceJson,
  fingerprintPosting,
  isSourceKind,
  locationKey,
  normalizeDescriptionText,
  normalizeEmploymentType,
  titleKey,
  type ExistingJob,
  type FetchLike,
  type FreshnessEvaluation,
  type FreshnessState,
  type NormalizedPosting,
  type SourceKind,
} from "@/lib/job-sources";

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
 * Board identifiers are PATH-SAFE slugs only: no slashes, no percent
 * encoding, no whitespace, no traversal. The adapter still runs it through
 * encodeURIComponent, and fetchSourceJson re-validates the final URL against
 * the M7A registry allowlist before any I/O — defense in depth, never instead
 * of it.
 */
const BOARD_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

/** Sources whose official API is per-company and requires a board id. */
const BOARD_REQUIRED_SOURCES: readonly SourceKind[] = [
  "greenhouse",
  "lever",
  "ashby",
];

/**
 * Fixed upstream page for the Arbeitnow global feed. Our own pagination is
 * applied over the assembled result set, so the upstream corpus must stay
 * identical across page 1/2/3 requests — otherwise results would shift
 * between pages (non-deterministic pagination).
 */
const ARBEITNOW_FEED_PAGE = 1;

/** Stable, locale-independent string order (determinism across machines). */
function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

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

/* ── Persistence row shapes ──────────────────────────────────────────────── */

interface PostingRow {
  id: string;
  sourceKind: string;
  externalId: string;
  sourceUrl: string;
  jobId: string | null;
}

interface JobRow {
  id: string;
  title: string;
  companyName: string;
  companyKey: string;
  locationNorm: string | null;
  remote: boolean;
  employmentType: string | null;
  descriptionText: string;
  applyUrl: string;
  fingerprintHash: string;
  lastConfirmedAt: Date | null;
  status: string;
}

type JobCandidateRow = JobRow & {
  postings: Array<{ sourceKind: string; externalId: string; sourceUrl: string }>;
};

/** The read-model fields a result needs from a Job. */
interface JobSnapshot {
  id: string;
  title: string;
  companyName: string;
  locationNorm: string | null;
  remote: boolean;
  employmentType: string | null;
  descriptionText: string;
  applyUrl: string;
  lastConfirmedAt: Date | null;
}

interface PersistedObservation {
  posting: NormalizedPosting;
  jobId: string;
}

function toSnapshot(row: JobRow): JobSnapshot {
  return {
    id: row.id,
    title: row.title,
    companyName: row.companyName,
    locationNorm: row.locationNorm,
    remote: row.remote,
    employmentType: row.employmentType,
    descriptionText: row.descriptionText,
    applyUrl: row.applyUrl,
    lastConfirmedAt: row.lastConfirmedAt,
  };
}

function toExistingJob(row: JobCandidateRow): ExistingJob {
  return {
    jobId: row.id,
    companyKey: row.companyKey,
    titleKey: titleKey(row.title),
    locationKey: row.locationNorm ? locationKey(row.locationNorm) : null,
    fingerprintHash: row.fingerprintHash,
    descriptionLength: normalizeDescriptionText(row.descriptionText).length,
    postings: row.postings.map((posting) => ({
      sourceKind: posting.sourceKind,
      externalId: posting.externalId,
      canonicalUrlKey: canonicalUrlKey(posting.sourceUrl),
    })),
  };
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === "P2002"
  );
}

function comparePostings(a: NormalizedPosting, b: NormalizedPosting): number {
  return (
    compareStrings(a.sourceKind, b.sourceKind) ||
    compareStrings(a.externalId, b.externalId)
  );
}

function toDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function postingDates(posting: NormalizedPosting): {
  postedAt: Date | null;
  validThrough: Date | null;
} {
  return {
    postedAt: toDate(posting.postedAt),
    validThrough: toDate(posting.validThrough),
  };
}

/* ── Freshness (M7A primitives, evidence-only) ───────────────────────────── */

/**
 * Evaluate a stored Job's freshness from evidence — never from existence.
 *
 * Evidence rules:
 *  - `lastConfirmedAt === null` ⇒ we have never seen this job in an official
 *    feed response ⇒ "unknown" (a DB row alone is NOT evidence).
 *  - `lastConfirmedAt` set ⇒ presence was confirmed at that timestamp;
 *    the M7A SLA then decides active / probably_stale (72h confirmation,
 *    30d posting aging).
 *  - `absentConsecutiveChecks` is 0 because M7B never claims an absence:
 *    absence requires re-fetching the same corpus (M7C scope). Expiration
 *    here can only come from a source-provided `validThrough` in the past.
 */
export function freshnessForStoredJob(
  job: { lastConfirmedAt: Date | null },
  canonical: { postedAt: Date | null; validThrough: Date | null } | null,
  now: Date,
): FreshnessEvaluation {
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

/* ── Persistence ─────────────────────────────────────────────────────────── */

/**
 * Resolve the Job a posting belongs to, using ONLY M7A's dedupe ladder:
 *  - "merge" (source identity / canonical URL / fingerprint) → link into the
 *    existing job;
 *  - "possible_duplicate" (soft key) and "new" → create a SEPARATE job.
 *    Soft-key hits are deliberately never merged: conservative under-merging
 *    beats a false merge, and M7A's company hard guard inside decideDedupe
 *    already forbids cross-company merges regardless of signal strength.
 */
async function resolveJob(
  posting: NormalizedPosting,
): Promise<JobRow | JobCandidateRow> {
  const candidateCompanyKey = companyKey(posting.companyName);
  const candidateFingerprint = fingerprintPosting(posting);

  const candidates: JobCandidateRow[] = await prisma.job.findMany({
    where: {
      OR: [
        { companyKey: candidateCompanyKey },
        { fingerprintHash: candidateFingerprint },
      ],
    },
    include: {
      postings: { select: { sourceKind: true, externalId: true, sourceUrl: true } },
    },
  });

  const decision = decideDedupe(posting, candidates.map(toExistingJob));
  if (decision.action === "merge") {
    const hit = candidates.find((candidate) => candidate.id === decision.jobId);
    if (hit) return hit;
    const loaded = await prisma.job.findUnique({ where: { id: decision.jobId } });
    if (loaded) return loaded;
    // The job disappeared between queries — fall through and create anew.
  }

  return prisma.job.create({
    data: {
      title: posting.title,
      companyName: posting.companyName,
      companyKey: candidateCompanyKey,
      locationNorm: posting.locationRaw,
      remote: posting.remote,
      employmentType: posting.employmentType,
      descriptionText: posting.descriptionText,
      // Original source-provided destination — never rewritten afterwards.
      applyUrl: posting.applyUrl,
      fingerprintHash: candidateFingerprint,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      lastConfirmedAt: new Date(),
      // Computed by the confirmation pass below once the canonical posting
      // of this job is known.
      freshness: "unknown",
      status: "open",
    },
  });
}

function postingWriteFields(posting: NormalizedPosting, observedAt: Date) {
  return {
    sourceUrl: posting.sourceUrl,
    title: posting.title,
    companyName: posting.companyName,
    locationRaw: posting.locationRaw,
    salaryRaw: posting.salaryRaw,
    descriptionText: posting.descriptionText,
    postedAt: toDate(posting.postedAt),
    validThrough: toDate(posting.validThrough),
    // Original unmodified source payload (untrusted) — stored as-is.
    raw: posting.raw as unknown as Prisma.InputJsonValue,
    contentHash: contentHash(posting.descriptionText),
    lastSeenAt: observedAt,
  };
}

/**
 * Persist fetched postings idempotently:
 *  - (sourceKind, externalId) is the unique source identity: an existing row
 *    is updated deterministically in place (firstSeenAt preserved, jobId
 *    untouched); a new row is created exactly once even under races.
 *  - Every posting is associated with a Job through the M7A dedupe ladder.
 *  - A confirmation pass stamps each observed job (lastConfirmedAt, and a
 *    freshness value computed from M7A primitives with the job's canonical
 *    posting as source-provided evidence).
 */
async function persistPostings(
  postings: NormalizedPosting[],
  observedAt: Date,
): Promise<{
  observations: PersistedObservation[];
  jobs: Map<string, JobSnapshot>;
}> {
  // Deterministic ingest order so identical feeds produce identical state.
  const sorted = [...postings].sort(comparePostings);
  const observations: PersistedObservation[] = [];
  const jobs = new Map<string, JobSnapshot>();
  const observedJobIds: string[] = [];

  const cacheJob = (row: JobRow) => {
    if (!jobs.has(row.id)) jobs.set(row.id, toSnapshot(row));
  };
  const markObserved = (jobId: string) => {
    if (!observedJobIds.includes(jobId)) observedJobIds.push(jobId);
  };

  for (const posting of sorted) {
    const identity = {
      sourceKind: posting.sourceKind,
      externalId: posting.externalId,
    };
    const fields = postingWriteFields(posting, observedAt);

    let row: PostingRow | null = await prisma.jobPosting.findUnique({
      where: { sourceKind_externalId: identity },
    });

    if (row) {
      // Existing source record → deterministic in-place update. `jobId` is
      // NOT part of the update: an existing association is stable.
      row = (await prisma.jobPosting.update({
        where: { id: row.id },
        data: fields,
      })) as PostingRow;
      if (!row.jobId) {
        // Recovery: a previously unlinked row now gets its dedupe decision.
        const job = await resolveJob(posting);
        cacheJob(job);
        row = (await prisma.jobPosting.update({
          where: { id: row.id },
          data: { jobId: job.id },
        })) as PostingRow;
      }
    } else {
      const job = await resolveJob(posting);
      cacheJob(job);
      try {
        row = (await prisma.jobPosting.create({
          data: { ...identity, ...fields, jobId: job.id },
        })) as PostingRow;
      } catch (err) {
        if (!isUniqueConstraintError(err)) throw err;
        // A concurrent search persisted the same source row first — stay
        // idempotent: adopt that row instead of failing or duplicating.
        const existing = await prisma.jobPosting.findUnique({
          where: { sourceKind_externalId: identity },
        });
        if (!existing) throw err;
        if (existing.jobId) {
          row = existing;
        } else {
          row = (await prisma.jobPosting.update({
            where: { id: existing.id },
            data: { jobId: job.id },
          })) as PostingRow;
        }
      }
    }

    const jobId = row.jobId;
    if (!jobId) {
      throw new Error("Persisted posting has no job association.");
    }
    if (!jobs.has(jobId)) {
      const loaded = await prisma.job.findUnique({ where: { id: jobId } });
      if (loaded) cacheJob(loaded);
    }
    markObserved(jobId);
    observations.push({ posting, jobId });
  }

  // Confirmation pass — one update per observed job. Freshness is computed
  // from evidence (just-confirmed presence + source-provided postedAt and
  // validThrough of the job's canonical posting), never from existence.
  for (const jobId of observedJobIds) {
    const snapshot = jobs.get(jobId);
    if (!snapshot) continue;
    const canonical = observations.find((obs) => obs.jobId === jobId);
    const evaluation = freshnessForStoredJob(
      { lastConfirmedAt: observedAt },
      canonical ? postingDates(canonical.posting) : null,
      observedAt,
    );
    await prisma.job.update({
      where: { id: jobId },
      data: {
        lastSeenAt: observedAt,
        lastConfirmedAt: observedAt,
        freshness: evaluation.state,
      },
    });
    snapshot.lastConfirmedAt = observedAt;
  }

  return { observations, jobs };
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
  sourceUrl: string;
  applyUrl: string;
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

function assembleEntries(
  observations: PersistedObservation[],
  jobs: Map<string, JobSnapshot>,
  input: JobSearchInput,
  now: Date,
): Array<{ item: JobResultItem; postedAtMs: number | null }> {
  const byJob = new Map<string, NormalizedPosting[]>();
  for (const obs of observations) {
    const list = byJob.get(obs.jobId);
    if (list) list.push(obs.posting);
    else byJob.set(obs.jobId, [obs.posting]);
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

    const evaluation = freshnessForStoredJob(job, postingDates(canonical), now);
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
        sourceUrl: canonical.sourceUrl,
        applyUrl: job.applyUrl,
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

/**
 * Run one discovery search for an authenticated user.
 *
 * Flow: plan providers → rate-limit → fetch each provider through the M7A
 * boundary → parse → persist idempotently → filter/order/paginate → return.
 *
 * Throws:
 *  - JobSearchRateLimitedError when the source rate limit denies the very
 *    first upstream call (routes translate it to the shared 429 shape);
 *  - JobSearchValidationError for invalid hand-built input.
 * Provider-level failures never throw — they are reported in `providers`.
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
  const fetched: NormalizedPosting[] = [];
  let attempted = 0;
  let blocked = false;

  for (const entry of plan) {
    if (blocked) {
      providers.push({ source: entry.kind, status: "rate_limited" });
      continue;
    }

    // Rate limit BEFORE every upstream source call — a denied request never
    // reaches the network.
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
      fetched.push(...parsed.postings);
      providers.push({
        source: entry.kind,
        status: "ok",
        fetched: parsed.postings.length,
        skipped: parsed.skipped.length,
      });
    } catch (err) {
      // Isolation: one failing provider never fails the search.
      providers.push({
        source: entry.kind,
        status: "failed",
        code: providerErrorCode(err),
      });
    }
  }

  const { observations, jobs } = await persistPostings(fetched, observedAt);
  const entries = assembleEntries(observations, jobs, input, observedAt);

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
