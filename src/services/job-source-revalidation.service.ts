"use strict";

/**
 * M7C — source-feed ingest & revalidation: turns M7A primitives into an
 * actual data lifecycle with trustworthy provenance:
 *
 *   successful feed check → normalize → idempotent upsert (per-feed
 *   provenance) → observation record → FEED-SCOPED absence (complete
 *   checks only) → evidence-based freshness → deterministic summary.
 *
 * Exports used by M7B discovery (search path) and by future workflows:
 *   - persistPostings          idempotent, race-tolerant persistence;
 *   - recordFeedObservation    the evidence trail (JobSourceObservation);
 *   - applyFeedAbsence         two-miss policy, scoped to ONE feed;
 *   - applyObservationEffects  job-level freshness from posting evidence;
 *   - revalidateJobSourceFeed  the explicit §10 workflow (no cron/workers).
 *
 * CORRECTNESS RULES ENCODEED HERE (M7C §8–§13):
 *   - A failed / timed-out / rate-limited / malformed / partial response
 *     NEVER records a `complete` observation and NEVER increments absence —
 *     `evaluateFeedObservation` is the only gate, and absence only ever
 *     looks at postings of the exact (sourceKind, sourceFeedKey) checked.
 *   - Absence requires a COMPLETE enumeration: single-response feeds need
 *     one structurally-valid response with zero skipped rows; paginated
 *     feeds (Arbeitnow) need bounded pagination to an explicit end page.
 *   - Presence never requires completeness — seeing a posting in a valid
 *     response is presence evidence for that posting alone.
 *   - Source/apply destinations are stored VERBATIM per posting; only
 *     comparison keys are canonicalized elsewhere (normalize.ts).
 *   - No AI, no embeddings, no user/resume/profile data — this layer only
 *     ever receives registry-built source URLs (fetch.ts is the sole I/O).
 *
 * CONCURRENCY (§13): posting rows are race-safe — (sourceKind,
 * sourceFeedKey, externalId) is unique and a P2002 race adopts the existing
 * row instead of duplicating it. Absence increments use atomic
 * `increment: 1`. REMAINING LIMITATION (documented, no distributed lock by
 * design): job resolution is still read → decide → write, so two concurrent
 * first-sightings of the same role could create two canonical Jobs; they
 * converge on a later observation (or stay under-merged, which is the
 * preferred failure mode). No cross-process lock is introduced (§13).
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  JOB_SOURCES,
  SourceAdapterError,
  SourceFetchError,
  buildSourceFeedKey,
  canonicalUrlKey,
  companyKey,
  computeAbsentPostings,
  contentHash,
  decideDedupe,
  evaluateFeedObservation,
  evaluateFreshness,
  fetchSourceJson,
  fingerprintPosting,
  jobFreshnessEvidence,
  canonicalPostingForEvidence,
  locationKey,
  normalizeDescriptionText,
  titleKey,
  type ExistingJob,
  type FeedObservationAssessment,
  type FetchLike,
  type NormalizedPosting,
  type SourceKind,
  type SourceParseResult,
  type StoredPosting,
} from "@/lib/job-sources";

/* ── Shared row/DTO shapes ──────────────────────────────────────────────── */

/** A normalized posting carrying its REQUIRED M7C feed provenance. */
export type SourcedPosting = NormalizedPosting & { sourceFeedKey: string };

export interface PostingRow {
  id: string;
  sourceKind: string;
  sourceFeedKey: string;
  externalId: string;
  sourceUrl: string;
  jobId: string | null;
}

export interface JobRow {
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

export type JobCandidateRow = JobRow & {
  postings: Array<{
    sourceKind: string;
    sourceFeedKey: string;
    externalId: string;
    sourceUrl: string;
  }>;
};

/** The read-model fields a result needs from a Job. */
export interface JobSnapshot {
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

export interface PersistedObservation {
  posting: SourcedPosting;
  jobId: string;
}

/* ── Small helpers ──────────────────────────────────────────────────────── */

/** Stable, locale-independent string order (determinism across machines). */
export function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function toDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Source-provided dates of a normalized posting (never synthesized). */
export function postingDates(posting: NormalizedPosting): {
  postedAt: Date | null;
  validThrough: Date | null;
} {
  return {
    postedAt: toDate(posting.postedAt),
    validThrough: toDate(posting.validThrough),
  };
}

function comparePostings(a: SourcedPosting, b: SourcedPosting): number {
  return (
    compareStrings(a.sourceKind, b.sourceKind) ||
    compareStrings(a.sourceFeedKey, b.sourceFeedKey) ||
    compareStrings(a.externalId, b.externalId)
  );
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
      sourceFeedKey: posting.sourceFeedKey ?? null,
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

/* ── Job resolution (M7A conservative dedupe ladder) ────────────────────── */

/**
 * Resolve the Job a posting belongs to, using ONLY M7A's dedupe ladder:
 *  - "merge" (feed-scoped source identity / canonical URL / fingerprint)
 *    → link into the existing job;
 *  - "possible_duplicate" (soft key) and "new" → create a SEPARATE job.
 *    Soft-key hits are deliberately never merged; different companies can
 *    never merge (hard guard inside decideDedupe).
 *
 * `observedAt` is the injected observation clock — creation timestamps are
 * deterministic under test and never wall-clock guesses.
 */
async function resolveJob(
  posting: SourcedPosting,
  observedAt: Date,
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
      postings: {
        select: {
          sourceKind: true,
          sourceFeedKey: true,
          externalId: true,
          sourceUrl: true,
        },
      },
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
      // First-seen source destination — convenient primary for the Job, but
      // the per-source truth lives on each JobPosting.applyUrl (never
      // overwritten by another source's URL).
      applyUrl: posting.applyUrl,
      fingerprintHash: candidateFingerprint,
      firstSeenAt: observedAt,
      lastSeenAt: observedAt,
      lastConfirmedAt: observedAt, // creation happens DURING an observation
      freshness: "unknown", // recomputed from evidence after persistence
      status: "open",
    },
  });
}

function postingWriteFields(posting: SourcedPosting, observedAt: Date) {
  return {
    sourceUrl: posting.sourceUrl,
    applyUrl: posting.applyUrl, // THIS source's destination, verbatim
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
    // Presence confirmed by THIS valid response (never inferred)…
    lastConfirmedAt: observedAt,
    // …and any prior miss streak for this feed resets on presence.
    absentConsecutiveChecks: 0,
  };
}

/**
 * Persist fetched postings idempotently with per-feed provenance:
 *  - (sourceKind, sourceFeedKey, externalId) is the unique source identity:
 *    an existing row is updated deterministically in place (firstSeenAt
 *    preserved, jobId untouched); a new row is created exactly once even
 *    under races (P2002 → adopt the existing row).
 *  - Every posting is associated with a Job through the M7A dedupe ladder.
 *  - No freshness/absence claims are made here — callers apply
 *    recordFeedObservation / applyFeedAbsence / applyObservationEffects.
 */
export async function persistPostings(
  postings: readonly SourcedPosting[],
  observedAt: Date,
): Promise<{
  observations: PersistedObservation[];
  jobs: Map<string, JobSnapshot>;
}> {
  // Deterministic ingest order so identical feeds produce identical state.
  const sorted = [...postings].sort(comparePostings);
  const observations: PersistedObservation[] = [];
  const jobs = new Map<string, JobSnapshot>();

  const cacheJob = (row: JobRow) => {
    if (!jobs.has(row.id)) jobs.set(row.id, toSnapshot(row));
  };

  for (const posting of sorted) {
    const identity = {
      sourceKind: posting.sourceKind,
      sourceFeedKey: posting.sourceFeedKey,
      externalId: posting.externalId,
    };
    const fields = postingWriteFields(posting, observedAt);

    let row: PostingRow | null = await prisma.jobPosting.findUnique({
      where: { sourceKind_sourceFeedKey_externalId: identity },
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
        const job = await resolveJob(posting, observedAt);
        cacheJob(job);
        row = (await prisma.jobPosting.update({
          where: { id: row.id },
          data: { jobId: job.id },
        })) as PostingRow;
      }
    } else {
      const job = await resolveJob(posting, observedAt);
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
          where: { sourceKind_sourceFeedKey_externalId: identity },
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
    observations.push({ posting, jobId });
  }

  return { observations, jobs };
}

/* ── Observation recording (§8 evidence trail) ──────────────────────────── */

export interface FeedObservationRecord {
  kind: SourceKind;
  feedKey: string;
  observedAt: Date;
  assessment: FeedObservationAssessment;
  /** Distinct external IDs present in this check (stable order). */
  presentIds: readonly string[];
  skippedCount: number;
}

/**
 * Record one successfully fetched feed check. ONLY called after at least
 * one page returned HTTP 200 + JSON; transport failures record nothing.
 * `complete` stays false (with a stable reason) unless the response was
 * structurally valid AND fully enumerable — absence logic reads this row
 * and must refuse to run on anything else.
 */
export async function recordFeedObservation(
  record: FeedObservationRecord,
): Promise<void> {
  await prisma.jobSourceObservation.create({
    data: {
      sourceKind: record.kind,
      sourceFeedKey: record.feedKey,
      observedAt: record.observedAt,
      complete: record.assessment.complete,
      completeReason: record.assessment.reason,
      presentExternalIds: [...record.presentIds],
      skippedCount: record.skippedCount,
    },
  });
}

/* ── Feed-scoped absence (§9 two-miss policy) ───────────────────────────── */

export interface FeedAbsenceResult {
  /** Jobs owning at least one posting that just recorded a confirmed miss. */
  affectedJobIds: Set<string>;
  /** How many postings recorded a miss. */
  absentCount: number;
}

/**
 * Increment `absentConsecutiveChecks` for postings of THE CHECKED FEED that
 * were not present in a COMPLETE observation. Presence resets already
 * happened during persistPostings (lastConfirmedAt + checks = 0).
 *
 * Feed scoping is absolute: postings of every other feed are never read or
 * written here, so "another board's absence" can never count against this
 * feed's postings. Increments are atomic (`increment: 1`).
 */
export async function applyFeedAbsence(
  kind: SourceKind | string,
  feedKey: string,
  presentExternalIds: ReadonlySet<string>,
): Promise<FeedAbsenceResult> {
  const known = await prisma.jobPosting.findMany({
    where: { sourceKind: kind, sourceFeedKey: feedKey },
    select: {
      id: true,
      externalId: true,
      jobId: true,
      absentConsecutiveChecks: true,
    },
  });
  const increments = computeAbsentPostings(known, presentExternalIds);
  const jobById = new Map(known.map((row) => [row.id, row.jobId]));

  const affectedJobIds = new Set<string>();
  for (const increment of increments) {
    await prisma.jobPosting.update({
      where: { id: increment.id },
      data: { absentConsecutiveChecks: { increment: 1 } },
    });
    const jobId = jobById.get(increment.id);
    if (jobId) affectedJobIds.add(jobId);
  }
  return { affectedJobIds, absentCount: increments.length };
}

/* ── Job-level freshness refresh (§7/§9) ────────────────────────────────── */

export interface ObservationEffectsInput {
  /** Jobs with presence confirmed by this check (stamps lastConfirmedAt). */
  observedJobIds: ReadonlySet<string>;
  /** Jobs whose postings recorded a miss this check. */
  absentJobIds: ReadonlySet<string>;
  /**
   * Ingest-order canonical posting dates per observed job (matches what the
   * result assembly will display). Jobs absent from this map fall back to
   * `canonicalPostingForEvidence` over their stored rows.
   */
  canonicalByJob: ReadonlyMap<
    string,
    { postedAt: Date | null; validThrough: Date | null }
  >;
  observedAt: Date;
}

/** First observed posting per job, in the deterministic ingest order. */
export function canonicalDatesByJob(
  observations: readonly PersistedObservation[],
): Map<string, { postedAt: Date | null; validThrough: Date | null }> {
  const map = new Map<string, { postedAt: Date | null; validThrough: Date | null }>();
  for (const observation of observations) {
    if (!map.has(observation.jobId)) {
      map.set(observation.jobId, postingDates(observation.posting));
    }
  }
  return map;
}

/**
 * Recompute `freshness` for every job touched by this check (observed
 * and/or absence-affected) from POSTING evidence — never from existence.
 * Stamps lastConfirmedAt only for jobs actually observed present.
 * Expired jobs are preserved (no deletion, §15); Job.status is untouched.
 */
export async function applyObservationEffects(
  input: ObservationEffectsInput,
): Promise<void> {
  const jobIds = [
    ...new Set([...input.observedJobIds, ...input.absentJobIds]),
  ];
  if (jobIds.length === 0) return;

  const rows = await prisma.job.findMany({
    where: { id: { in: jobIds } },
    include: { postings: true },
  });

  for (const row of rows) {
    const observed = input.observedJobIds.has(row.id);
    const postings: StoredPosting[] = row.postings.map((posting) => ({
      sourceKind: posting.sourceKind,
      sourceFeedKey: posting.sourceFeedKey,
      externalId: posting.externalId,
      lastConfirmedAt: posting.lastConfirmedAt,
      absentConsecutiveChecks: posting.absentConsecutiveChecks,
      postedAt: posting.postedAt,
      validThrough: posting.validThrough,
    }));

    let canonical = input.canonicalByJob.get(row.id) ?? null;
    if (!canonical) {
      const fallback = canonicalPostingForEvidence(postings);
      canonical = fallback
        ? { postedAt: fallback.postedAt, validThrough: fallback.validThrough }
        : null;
    }

    const evidence = jobFreshnessEvidence({
      jobLastConfirmedAt: observed ? input.observedAt : row.lastConfirmedAt,
      postings,
    });
    const evaluation = evaluateFreshness(
      {
        ...evidence,
        validThrough: canonical?.validThrough ?? null,
        postedAt: canonical?.postedAt ?? null,
      },
      input.observedAt,
    );

    await prisma.job.update({
      where: { id: row.id },
      data: {
        ...(observed ? { lastConfirmedAt: input.observedAt } : {}),
        lastSeenAt: input.observedAt,
        freshness: evaluation.state,
      },
    });
  }
}

/* ── Feed corpus fetching (§12 bounded pagination) ──────────────────────── */

export const FEED_REVALIDATION_LIMITS = Object.freeze({
  /**
   * Hard bound on upstream page requests per revalidation (runaway guard).
   * Arbeitnow's feed is enumerated to an explicit empty end page within
   * this bound; hitting the bound WITHOUT an end marker leaves the
   * observation `partial_feed` (incomplete → no absence).
   */
  maxPages: 5,
});

export interface SourceFeedRef {
  kind: SourceKind;
  /** Board/organization slug for per-company feeds; ignored for arbeitnow. */
  board?: string | null;
  /** Company display context for payloads that carry no company field. */
  companyName?: string | null;
}

export interface FeedCorpus {
  postings: SourcedPosting[];
  skippedCount: number;
  payloadLevelSkip: boolean;
  pagesFetched: number;
  /** Enumeration reached an explicit end (or a single-response feed parsed). */
  exhausted: boolean;
}

/** A later page failed after earlier pages succeeded (partial corpus kept). */
export class PartialFeedError extends Error {
  readonly partial: FeedCorpus;
  readonly code: string;
  constructor(partial: FeedCorpus, code: string) {
    super(`Feed pagination stopped early (${code}).`);
    this.name = "PartialFeedError";
    this.partial = partial;
    this.code = code;
  }
}

export interface RevalidationDeps {
  /** Injectable fetch for tests — production uses the global fetch. */
  fetchImpl?: FetchLike;
  /** Injectable clock for deterministic tests. */
  now?: () => Date;
  /** Page bound override for tests (defaults to FEED_REVALIDATION_LIMITS). */
  maxPages?: number;
}

function fetchErrorCode(err: unknown): string {
  if (err instanceof SourceFetchError) return err.code;
  if (err instanceof SourceAdapterError) return "adapter_error";
  return "unknown_error";
}

function attachFeedKey(
  postings: readonly NormalizedPosting[],
  feedKey: string,
): SourcedPosting[] {
  return postings.map((posting) => ({ ...posting, sourceFeedKey: feedKey }));
}

/**
 * Fetch + parse a feed into its corpus:
 *  - single-response feeds (Greenhouse/Lever/Ashby): ONE official response
 *    IS the whole board → `exhausted: true`;
 *  - paginated feeds (Arbeitnow): pages 1..maxPages until an EXPLICIT empty
 *    end page (`exhausted: true`), a structural/row skip (stops — the
 *    enumeration is no longer trustworthy), or the bound (stays false).
 *
 * Throws the original SourceFetchError/SourceAdapterError when the FIRST
 * page fails (nothing usable was fetched), or PartialFeedError when a later
 * page fails (earlier pages' data is preserved for presence-only use).
 */
async function fetchFeedCorpus(
  ref: SourceFeedRef,
  feedKey: string,
  definition: (typeof JOB_SOURCES)[SourceKind],
  deps: RevalidationDeps,
): Promise<FeedCorpus> {
  const context = ref.companyName ? { companyName: ref.companyName } : undefined;
  const corpus: FeedCorpus = {
    postings: [],
    skippedCount: 0,
    payloadLevelSkip: false,
    pagesFetched: 0,
    exhausted: false,
  };

  if (definition.feedPolicy === "single_response") {
    const request = definition.adapter.buildListRequest({
      board: ref.board ?? undefined,
    });
    const payload = await fetchSourceJson<unknown>(ref.kind, request, {
      fetchImpl: deps.fetchImpl,
    });
    const parsed = definition.adapter.parseList(payload, context);
    return {
      postings: attachFeedKey(parsed.postings, feedKey),
      skippedCount: parsed.skipped.length,
      payloadLevelSkip: parsed.skipped.some((skip) => skip.index === -1),
      pagesFetched: 1,
      // The official board API returns the entire board in one response —
      // documented per-source in the registry (feedPolicy).
      exhausted: true,
    };
  }

  // Paginated feed: bounded pagination to an explicit end-of-feed marker.
  const maxPages = deps.maxPages ?? FEED_REVALIDATION_LIMITS.maxPages;
  for (let page = 1; page <= maxPages; page += 1) {
    let parsed: SourceParseResult;
    try {
      const request = definition.adapter.buildListRequest({ page });
      const payload = await fetchSourceJson<unknown>(ref.kind, request, {
        fetchImpl: deps.fetchImpl,
      });
      parsed = definition.adapter.parseList(payload, context);
    } catch (err) {
      if (corpus.pagesFetched === 0) throw err; // nothing usable → total failure
      throw new PartialFeedError(corpus, fetchErrorCode(err));
    }
    corpus.pagesFetched += 1;
    corpus.skippedCount += parsed.skipped.length;
    const payloadLevelSkip = parsed.skipped.some((skip) => skip.index === -1);
    if (payloadLevelSkip) corpus.payloadLevelSkip = true;
    // Rows that parsed cleanly are valid presence evidence even when other
    // rows were malformed (the observation still becomes incomplete).
    corpus.postings.push(...attachFeedKey(parsed.postings, feedKey));
    if (payloadLevelSkip || parsed.skipped.length > 0) {
      return corpus; // enumeration untrustworthy → incomplete, stop paginating
    }
    if (parsed.postings.length === 0) {
      corpus.exhausted = true; // explicit end of feed
      return corpus;
    }
  }
  return corpus; // bound reached without an end marker → exhausted stays false
}

/* ── Revalidation workflow (§10) ────────────────────────────────────────── */

export interface FeedRevalidationSummary {
  sourceKind: SourceKind;
  sourceFeedKey: string;
  /** ISO-8601 observation timestamp (injected clock — deterministic). */
  observedAt: string;
  status: "ok" | "incomplete" | "failed";
  /** Stable machine code when status !== "ok"; null when ok. */
  code: string | null;
  complete: boolean;
  pagesFetched: number;
  /** Postings parsed from valid rows this check. */
  fetched: number;
  /** Rows the adapter could not parse this check. */
  skipped: number;
  /** Distinct external IDs observed present. */
  present: number;
  /** Previously known postings of THIS feed that recorded a confirmed miss. */
  absent: number;
  /** Jobs whose freshness was recomputed from this check's evidence. */
  jobsRefreshed: number;
}

function failedSummary(
  ref: SourceFeedRef,
  feedKey: string,
  observedAt: Date,
  code: string,
): FeedRevalidationSummary {
  return {
    sourceKind: ref.kind,
    sourceFeedKey: feedKey,
    observedAt: observedAt.toISOString(),
    status: "failed",
    code,
    complete: false,
    pagesFetched: 0,
    fetched: 0,
    skipped: 0,
    present: 0,
    absent: 0,
    jobsRefreshed: 0,
  };
}

/**
 * Explicitly revalidate ONE known source feed (M7C §10 — no scheduling).
 *
 * Workflow: fetch the approved feed (registry allowlist + fetch.ts boundary)
 * → structural validation → normalize → idempotent upsert of source
 * postings (presence) → record the observation →, ONLY when complete,
 * compute confirmed absences scoped to this exact feed → recompute
 * freshness from evidence → deterministic summary.
 *
 * Failure semantics (§11):
 *  - First-page failure (timeout / HTTP error / invalid JSON / network):
 *    status "failed", NO observation, NO writes, NO absences.
 *  - Later-page failure or non-enumerable response: status "incomplete"
 *    with a stable reason code; presence from valid rows is still recorded,
 *    previous posting state is otherwise preserved, NOTHING is expired.
 *
 * Throws (before any I/O) for invalid feed identity — unknown source kind
 * or a board-scoped source without a valid board slug. Identity is never
 * fabricated. This function performs no user rate limiting: callers (routes,
 * future workflows) gate it; M7C exposes no API endpoint for it.
 */
export async function revalidateJobSourceFeed(
  ref: SourceFeedRef,
  deps: RevalidationDeps = {},
): Promise<FeedRevalidationSummary> {
  const now = deps.now ?? (() => new Date());
  const observedAt = now();
  // Deterministic feed identity — throws BEFORE any I/O on invalid input.
  const feedKey = buildSourceFeedKey(ref.kind, ref.board);
  const definition = JOB_SOURCES[ref.kind];

  let corpus: FeedCorpus;
  let paginationFailed = false;
  let paginationCode: string | null = null;
  try {
    corpus = await fetchFeedCorpus(ref, feedKey, definition, deps);
  } catch (err) {
    if (!(err instanceof PartialFeedError)) {
      return failedSummary(ref, feedKey, observedAt, fetchErrorCode(err));
    }
    corpus = err.partial;
    paginationFailed = true;
    paginationCode = err.code;
  }

  const assessment: FeedObservationAssessment = paginationFailed
    ? { complete: false, reason: "pagination_failed" }
    : evaluateFeedObservation({
        feedPolicy: definition.feedPolicy,
        skippedCount: corpus.skippedCount,
        payloadLevelSkip: corpus.payloadLevelSkip,
        exhausted: corpus.exhausted,
      });

  // Presence: upsert valid rows (idempotent, provenance-preserving).
  const { observations } = await persistPostings(corpus.postings, observedAt);
  const observedJobIds = new Set(observations.map((obs) => obs.jobId));
  const canonicalByJob = canonicalDatesByJob(observations);

  // Evidence trail: only reachable after ≥1 page returned HTTP 200 + JSON.
  const presentIds = [
    ...new Set(corpus.postings.map((posting) => posting.externalId)),
  ].sort(compareStrings);
  await recordFeedObservation({
    kind: ref.kind,
    feedKey,
    observedAt,
    assessment,
    presentIds,
    skippedCount: corpus.skippedCount,
  });

  // Absence (§9): ONLY from a complete observation of THIS feed.
  let absentCount = 0;
  const absentJobIds = new Set<string>();
  if (assessment.complete) {
    const absence = await applyFeedAbsence(
      ref.kind,
      feedKey,
      new Set(presentIds),
    );
    absentCount = absence.absentCount;
    for (const jobId of absence.affectedJobIds) absentJobIds.add(jobId);
  }

  await applyObservationEffects({
    observedJobIds,
    absentJobIds,
    canonicalByJob,
    observedAt,
  });

  return {
    sourceKind: ref.kind,
    sourceFeedKey: feedKey,
    observedAt: observedAt.toISOString(),
    status: assessment.complete ? "ok" : "incomplete",
    code: assessment.complete
      ? null
      : paginationFailed && paginationCode
        ? `${assessment.reason}:${paginationCode}`
        : assessment.reason,
    complete: assessment.complete,
    pagesFetched: corpus.pagesFetched,
    fetched: corpus.postings.length,
    skipped: corpus.skippedCount,
    present: presentIds.length,
    absent: absentCount,
    jobsRefreshed: new Set([...observedJobIds, ...absentJobIds]).size,
  };
}
