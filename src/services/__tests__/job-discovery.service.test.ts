"use strict";

/**
 * M7B — job discovery service tests.
 *
 * ZERO live external API calls: every test injects a deterministic fetch
 * fake. Persistence runs against an in-memory Prisma fake that enforces the
 * (sourceKind, externalId) unique constraint and the Job relations, so the
 * REAL service logic (dedupe ladder, freshness, idempotency) is exercised
 * end-to-end without a database.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  JobSearchRateLimitedError,
  JobSearchValidationError,
  freshnessForStoredJob,
  parseJobSearchQuery,
  planProviders,
  searchJobs,
  type JobSearchInput,
  type JobSearchResult,
} from "@/services/job-discovery.service";
import { postingFingerprint, type FetchLike } from "@/lib/job-sources";

/* ─── In-memory Prisma fake ──────────────────────────────────────────────── */

const h = vi.hoisted(() => {
  type Row = Record<string, any>;

  const state = {
    postings: [] as Row[],
    jobs: [] as Row[],
    seq: 0,
  };

  const uid = (prefix: string) => `${prefix}_${String(++state.seq).padStart(4, "0")}`;

  const uniqueError = () => {
    const err = new Error("Unique constraint failed on (sourceKind, externalId)") as Error & {
      code: string;
    };
    err.code = "P2002";
    return err;
  };

  const findByIdentity = (where: Row): Row | null => {
    const key = where.sourceKind_externalId;
    if (!key) return null;
    return (
      state.postings.find(
        (p) => p.sourceKind === key.sourceKind && p.externalId === key.externalId,
      ) ?? null
    );
  };

  const prisma = {
    jobPosting: {
      findUnique: async ({ where }: Row) =>
        where.sourceKind_externalId
          ? findByIdentity(where)
          : (state.postings.find((p) => p.id === where.id) ?? null),
      update: async ({ where, data }: Row) => {
        const row = where.sourceKind_externalId
          ? findByIdentity(where)
          : (state.postings.find((p) => p.id === where.id) ?? null);
        if (!row) throw new Error("Record not found");
        Object.assign(row, data);
        return row;
      },
      create: async ({ data }: Row) => {
        if (
          findByIdentity({
            sourceKind_externalId: {
              sourceKind: data.sourceKind,
              externalId: data.externalId,
            },
          })
        ) {
          throw uniqueError();
        }
        const row: Row = {
          id: uid("posting"),
          jobId: null,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          ...data,
        };
        state.postings.push(row);
        return row;
      },
    },
    job: {
      create: async ({ data }: Row) => {
        const row: Row = {
          id: uid("job"),
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          lastConfirmedAt: null,
          freshness: "unknown",
          status: "open",
          ...data,
        };
        state.jobs.push(row);
        return row;
      },
      findUnique: async ({ where }: Row) =>
        state.jobs.find((j) => j.id === where.id) ?? null,
      findMany: async ({ where, include }: Row) => {
        const or: Row[] = where?.OR ?? [];
        const matched = state.jobs.filter((job) =>
          or.some((cond) =>
            Object.entries(cond).every(([key, value]) => job[key] === value),
          ),
        );
        if (!include?.postings) return matched;
        return matched.map((job) => ({
          ...job,
          postings: state.postings.filter((p) => p.jobId === job.id),
        }));
      },
      update: async ({ where, data }: Row) => {
        const row = state.jobs.find((j) => j.id === where.id);
        if (!row) throw new Error("Record not found");
        Object.assign(row, data);
        return row;
      },
    },
  };

  const reset = () => {
    state.postings = [];
    state.jobs = [];
    state.seq = 0;
  };

  return { prisma, state, reset };
});

vi.mock("@/lib/prisma", () => ({ prisma: h.prisma }));

/* ─── Fixtures & helpers ─────────────────────────────────────────────────── */

const DESC =
  "Own and operate reliable data pipelines across regions and clouds for the platform team.";

const NOW = new Date("2026-10-01T12:00:00.000Z");
const fixedNow = () => NOW;
const allowAll = () => ({ allowed: true, retryAfter: 0 });

function parse(
  params: Record<string, string | number | boolean>,
): JobSearchInput {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) search.set(key, String(value));
  return parseJobSearchQuery(search);
}

/** Assert a query fails validation with a specific machine-readable code. */
function expectValidationCode(params: Record<string, string>, code: string): void {
  let caught: unknown = null;
  try {
    parse(params);
  } catch (err) {
    caught = err;
  }
  expect(caught).toBeInstanceOf(JobSearchValidationError);
  expect((caught as JobSearchValidationError).code).toBe(code);
}

/** Assert planProviders rejects a hand-built input with a specific code. */
function expectPlanError(input: JobSearchInput, code: string): void {
  let caught: unknown = null;
  try {
    planProviders(input);
  } catch (err) {
    caught = err;
  }
  expect(caught).toBeInstanceOf(JobSearchValidationError);
  expect((caught as JobSearchValidationError).code).toBe(code);
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function ghRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 9001,
    title: "Data Engineer",
    absolute_url: "https://job-boards.greenhouse.io/acme/jobs/9001",
    location: { name: "New York" },
    content: `<p>${DESC}</p>`,
    first_published: "2026-09-25T00:00:00.000Z",
    ...over,
  };
}

function leverRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "lev-9001",
    text: "Data Engineer",
    hostedUrl: "https://jobs.lever.co/acme/lev-9001",
    applyUrl: "https://jobs.lever.co/acme/lev-9001/apply",
    createdAt: Date.UTC(2026, 8, 25),
    categories: { location: "New York", commitment: "Full-time" },
    descriptionPlain: DESC,
    ...over,
  };
}

function arbeitnowRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    slug: "data-engineer-acme-1",
    company_name: "Acme Corp",
    title: "Data Engineer",
    description: DESC,
    location: "New York",
    url: "https://www.arbeitnow.com/jobs/data-engineer-acme-1",
    posted_at: "2026-09-25T00:00:00Z",
    remote: false,
    job_type: "Full-time",
    ...over,
  };
}

const ALLOWED_HOSTS = new Set([
  "boards-api.greenhouse.io",
  "api.lever.co",
  "api.ashbyhq.com",
  "www.arbeitnow.com",
]);

type Handlers = Record<string, () => Response | Promise<Response>>;

function makeFetch(handlers: Handlers) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, init: init ?? {} });
    const handler = handlers[new URL(url).hostname];
    if (!handler) throw new Error(`Unexpected fetch to ${url}`);
    return handler();
  };
  return { fetchImpl, calls };
}

async function run(
  params: Record<string, string | number | boolean>,
  handlers: Handlers,
  overrides: {
    rateLimitCheck?: (userId: string) => { allowed: boolean; retryAfter: number };
    now?: () => Date;
  } = {},
): Promise<{ result: JobSearchResult; calls: Array<{ url: string; init: RequestInit }> }> {
  const { fetchImpl, calls } = makeFetch(handlers);
  const result = await searchJobs("user_test_1", parse(params), {
    fetchImpl,
    rateLimitCheck: overrides.rateLimitCheck ?? allowAll,
    now: overrides.now ?? fixedNow,
  });
  return { result, calls };
}

beforeEach(() => {
  h.reset();
});

/* ─── Query validation ───────────────────────────────────────────────────── */

describe("parseJobSearchQuery", () => {
  it("applies safe defaults: arbeitnow, page 1, pageSize 10", () => {
    const input = parse({});
    expect(input.sources).toEqual(["arbeitnow"]);
    expect(input.page).toBe(1);
    expect(input.pageSize).toBe(10);
    expect(input.q).toBeNull();
    expect(input.board).toBeNull();
    expect(input.remote).toBeNull();
    expect(input.employmentType).toBeNull();
  });

  it("rejects unknown sources with a stable code", () => {
    expectValidationCode({ sources: "linkedin" }, "INVALID_SOURCES");
    expectValidationCode({ sources: "indeed,linkedin" }, "INVALID_SOURCES");
  });

  it("requires a board for per-company sources", () => {
    expectValidationCode({ sources: "greenhouse" }, "BOARD_REQUIRED");
    expectValidationCode({ sources: "lever" }, "BOARD_REQUIRED");
    expectValidationCode({ sources: "ashby" }, "BOARD_REQUIRED");
    // Arbeitnow alone needs no board.
    expect(parse({ sources: "arbeitnow" }).board).toBeNull();
  });

  it.each(["https://evil.com/x", "../etc", "a/b", "a b", "%2e%2e", "a".repeat(65)])(
    "rejects unsafe board identifier %s before any fetch",
    (board) => {
      expectValidationCode({ sources: "lever", board }, "INVALID_BOARD");
    },
  );

  it("accepts a plain board slug", () => {
    expect(parse({ sources: "greenhouse", board: "acme-corp_1.0" }).board).toBe(
      "acme-corp_1.0",
    );
  });

  it("bounds the query and rejects oversized values", () => {
    expectValidationCode({ q: "x".repeat(201) }, "QUERY_TOO_LONG");
    expectValidationCode({ location: "x".repeat(101) }, "LOCATION_TOO_LONG");
    expectValidationCode({ company: "x".repeat(101) }, "INVALID_COMPANY");
  });

  it("validates remote, page, pageSize, employmentType", () => {
    expectValidationCode({ remote: "maybe" }, "INVALID_REMOTE");
    expectValidationCode({ page: "0" }, "INVALID_PAGE");
    expectValidationCode({ page: "abc" }, "INVALID_PAGE");
    expectValidationCode({ pageSize: "26" }, "INVALID_PAGE_SIZE");
    expectValidationCode({ employmentType: "???" }, "INVALID_EMPLOYMENT_TYPE");
    expect(parse({ employmentType: "Full-time" }).employmentType).toBe("full_time");
    expect(parse({ remote: "true" }).remote).toBe(true);
    expect(parse({ remote: "false" }).remote).toBe(false);
  });

  it("dedupes sources into stable SOURCE_KINDS order", () => {
    expect(parse({ sources: "lever,greenhouse,lever", board: "acme" }).sources).toEqual([
      "greenhouse",
      "lever",
    ]);
  });
});

/* ─── Provider planning ──────────────────────────────────────────────────── */

describe("planProviders", () => {
  it("defaults to the arbeitnow feed with no board", () => {
    const plan = planProviders(parse({}));
    expect(plan).toEqual([{ kind: "arbeitnow" }]);
  });

  it("plans all four approved sources in stable order with one board", () => {
    const plan = planProviders(
      parse({
        sources: "arbeitnow,ashby,lever,greenhouse",
        board: "acme",
        company: "Acme Corp",
      }),
    );
    expect(plan.map((p) => p.kind)).toEqual([
      "greenhouse",
      "lever",
      "ashby",
      "arbeitnow",
    ]);
    expect(plan[0]).toEqual({
      kind: "greenhouse",
      board: "acme",
      companyName: "Acme Corp",
    });
    // Arbeitnow never receives a board/company context.
    expect(plan[3]).toEqual({ kind: "arbeitnow" });
  });

  it("falls back to the board slug as company context when none is given", () => {
    const plan = planProviders(parse({ sources: "ashby", board: "acme" }));
    expect(plan[0].companyName).toBe("acme");
  });

  it("rejects hand-built input with no sources or a missing board", () => {
    const base = parse({ sources: "arbeitnow" });
    expectPlanError({ ...base, sources: [] }, "INVALID_SOURCES");
    expectPlanError(
      { ...base, sources: ["greenhouse"], board: null },
      "BOARD_REQUIRED",
    );
  });
});

/* ─── Source rate limiting ───────────────────────────────────────────────── */

describe("source rate limiting (before upstream calls)", () => {
  it("denies the first upstream call → JobSearchRateLimitedError, zero fetches", async () => {
    const { fetchImpl, calls } = makeFetch({
      "www.arbeitnow.com": () => jsonResponse({ data: [] }),
    });
    const gateCalls: string[] = [];
    let caught: unknown = null;
    try {
      await searchJobs("user_rate", parse({}), {
        fetchImpl,
        rateLimitCheck: (userId) => {
          gateCalls.push(userId);
          return { allowed: false, retryAfter: 42 };
        },
        now: fixedNow,
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(JobSearchRateLimitedError);
    expect((caught as JobSearchRateLimitedError).retryAfter).toBe(42);
    expect(gateCalls).toEqual(["user_rate"]);
    expect(calls).toHaveLength(0);
  });

  it("calls the rate-limit gate before EVERY upstream request, in order", async () => {
    const log: string[] = [];
    const handlers: Handlers = {
      "boards-api.greenhouse.io": () => jsonResponse({ jobs: [] }),
      "www.arbeitnow.com": () => jsonResponse({ data: [] }),
    };
    const trackedFetch: FetchLike = async (url, init) => {
      log.push(`fetch:${new URL(url).hostname}`);
      const handler = handlers[new URL(url).hostname];
      if (!handler) throw new Error(`Unexpected fetch to ${url}`);
      return handler();
    };
    await searchJobs(
      "user_order",
      parse({ sources: "greenhouse,arbeitnow", board: "acme" }),
      {
        fetchImpl: trackedFetch,
        rateLimitCheck: () => {
          log.push("gate");
          return { allowed: true, retryAfter: 0 };
        },
        now: fixedNow,
      },
    );
    expect(log).toEqual([
      "gate",
      "fetch:boards-api.greenhouse.io",
      "gate",
      "fetch:www.arbeitnow.com",
    ]);
  });

  it("denial AFTER the first call marks remaining providers rate_limited (partial results)", async () => {
    let gate = 0;
    const { result, calls } = await run(
      { sources: "greenhouse,arbeitnow", board: "acme", company: "Acme Corp" },
      {
        "boards-api.greenhouse.io": () => jsonResponse({ jobs: [ghRow()] }),
        "www.arbeitnow.com": () => jsonResponse({ data: [arbeitnowRow()] }),
      },
      {
        rateLimitCheck: () => {
          gate += 1;
          return gate === 1
            ? { allowed: true, retryAfter: 0 }
            : { allowed: false, retryAfter: 30 };
        },
      },
    );
    expect(result.providers).toEqual([
      { source: "greenhouse", status: "ok", fetched: 1, skipped: 0 },
      { source: "arbeitnow", status: "rate_limited", retryAfter: 30 },
    ]);
    // Usable results from the provider that ran before the denial.
    expect(result.results).toHaveLength(1);
    expect(result.results[0].source.kind).toBe("greenhouse");
    expect(calls).toHaveLength(1); // arbeitnow never reached the network
  });
});

/* ─── Provider behavior ──────────────────────────────────────────────────── */

describe("provider selection, isolation and failure modes", () => {
  it("fetches only registry-allowlisted HTTPS hosts (approved four only)", async () => {
    const { calls } = await run(
      { sources: "greenhouse,lever,ashby,arbeitnow", board: "acme" },
      {
        "boards-api.greenhouse.io": () => jsonResponse({ jobs: [] }),
        "api.lever.co": () => jsonResponse([]),
        "api.ashbyhq.com": () => jsonResponse({ jobs: [] }),
        "www.arbeitnow.com": () => jsonResponse({ data: [] }),
      },
    );
    expect(calls).toHaveLength(4);
    for (const call of calls) {
      const url = new URL(call.url);
      expect(url.protocol).toBe("https:");
      expect(ALLOWED_HOSTS.has(url.hostname)).toBe(true);
    }
  });

  it("isolates a failing provider — other providers still return results", async () => {
    const { result } = await run(
      { sources: "greenhouse,arbeitnow", board: "acme", company: "Acme Corp" },
      {
        "boards-api.greenhouse.io": () => {
          throw new Error("boom");
        },
        "www.arbeitnow.com": () =>
          jsonResponse({ data: [arbeitnowRow({ slug: "ok-1" })] }),
      },
    );
    expect(result.providers).toEqual([
      { source: "greenhouse", status: "failed", code: "network_error" },
      { source: "arbeitnow", status: "ok", fetched: 1, skipped: 0 },
    ]);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].source.kind).toBe("arbeitnow");
  });

  it("maps timeouts to a machine-readable provider failure", async () => {
    const { result } = await run(
      { sources: "greenhouse,arbeitnow", board: "acme" },
      {
        "boards-api.greenhouse.io": () =>
          Promise.reject(Object.assign(new Error("t"), { name: "TimeoutError" })),
        "www.arbeitnow.com": () => jsonResponse({ data: [] }),
      },
    );
    expect(result.providers[0]).toEqual({
      source: "greenhouse",
      status: "failed",
      code: "timeout",
    });
    expect(result.providers[1].status).toBe("ok");
  });

  it("maps HTTP 5xx to a machine-readable provider failure", async () => {
    const { result } = await run({ sources: "ashby", board: "acme" }, {
      "api.ashbyhq.com": () => new Response("nope", { status: 503 }),
    });
    expect(result.providers[0]).toEqual({
      source: "ashby",
      status: "failed",
      code: "http_error",
    });
    expect(result.results).toHaveLength(0);
  });

  it("rejects an oversized upstream response without crashing the search", async () => {
    const { result } = await run(
      { sources: "arbeitnow" },
      {
        "www.arbeitnow.com": () => new Response("x".repeat(2_000_001), { status: 200 }),
      },
    );
    expect(result.providers[0]).toEqual({
      source: "arbeitnow",
      status: "failed",
      code: "too_large",
    });
    expect(result.results).toHaveLength(0);
  });

  it("blocks redirects leaving the source allowlist (no fetch to the target)", async () => {
    const { result, calls } = await run({ sources: "greenhouse", board: "acme" }, {
      "boards-api.greenhouse.io": () =>
        new Response(null, {
          status: 302,
          headers: { location: "https://evil.example/steal" },
        }),
    });
    expect(result.providers[0]).toEqual({
      source: "greenhouse",
      status: "failed",
      code: "redirect_blocked",
    });
    expect(calls).toHaveLength(1);
    expect(calls.every((c) => new URL(c.url).hostname === "boards-api.greenhouse.io")).toBe(
      true,
    );
  });

  it("reports malformed payloads as skipped rows instead of failing", async () => {
    const { result } = await run({ sources: "greenhouse", board: "acme" }, {
      "boards-api.greenhouse.io": () =>
        jsonResponse({
          jobs: [
            { id: 1, title: "No URL role", location: { name: "X" }, content: DESC },
            ghRow(),
          ],
        }),
    });
    // Row with no URL is skipped; the valid row still lands.
    expect(result.providers[0]).toEqual({
      source: "greenhouse",
      status: "ok",
      fetched: 1,
      skipped: 1,
    });
    expect(result.results).toHaveLength(1);
  });

  it("handles a structurally wrong payload as a payload-level skip", async () => {
    const { result } = await run({ sources: "lever", board: "acme" }, {
      "api.lever.co": () => jsonResponse({ not: "an array" }),
    });
    expect(result.providers[0]).toEqual({
      source: "lever",
      status: "ok",
      fetched: 0,
      skipped: 1,
    });
    expect(result.total).toBe(0);
  });
});

/* ─── Persistence & idempotency ──────────────────────────────────────────── */

describe("persistence idempotency", () => {
  it("the same (sourceKind, externalId) never creates duplicate rows or jobs", async () => {
    const handlers: Handlers = {
      "boards-api.greenhouse.io": () => jsonResponse({ jobs: [ghRow()] }),
    };
    const first = await run(
      { sources: "greenhouse", board: "acme", company: "Acme Corp" },
      handlers,
    );
    expect(h.state.postings).toHaveLength(1);
    expect(h.state.jobs).toHaveLength(1);
    const firstPostingId = h.state.postings[0].id;
    const firstJobId = h.state.jobs[0].id;

    const second = await run(
      { sources: "greenhouse", board: "acme", company: "Acme Corp" },
      handlers,
      { now: () => new Date("2026-10-02T12:00:00.000Z") },
    );
    expect(h.state.postings).toHaveLength(1); // no multiplication
    expect(h.state.jobs).toHaveLength(1);
    expect(h.state.postings[0].id).toBe(firstPostingId);
    expect(h.state.jobs[0].id).toBe(firstJobId);
    // Re-ingest updates the observation deterministically.
    expect(h.state.jobs[0].lastConfirmedAt).toEqual(
      new Date("2026-10-02T12:00:00.000Z"),
    );
    expect(second.result.results[0].jobId).toBe(firstJobId);
  });

  it("preserves sourceUrl, applyUrl, attribution inputs and the raw payload exactly", async () => {
    const row = leverRow();
    const handlers: Handlers = { "api.lever.co": () => jsonResponse([row]) };
    const { result } = await run(
      { sources: "lever", board: "acme", company: "Acme Corp" },
      handlers,
    );
    expect(result.results[0].sourceUrl).toBe(
      "https://jobs.lever.co/acme/lev-9001",
    );
    expect(result.results[0].applyUrl).toBe(
      "https://jobs.lever.co/acme/lev-9001/apply",
    );
    expect(result.results[0].source).toEqual({
      kind: "lever",
      displayName: "Lever",
      attributionText: "Jobs via Lever",
      attributionUrl: "https://www.lever.co/",
    });
    expect(h.state.postings[0].raw).toEqual(row); // untouched original payload
    expect(h.state.postings[0].sourceUrl).toBe("https://jobs.lever.co/acme/lev-9001");
  });

  it("never fabricates missing values — absent fields stay null", async () => {
    const handlers: Handlers = {
      "www.arbeitnow.com": () =>
        jsonResponse({
          data: [
            arbeitnowRow({ posted_at: undefined, job_type: undefined, location: undefined }),
          ],
        }),
    };
    const { result } = await run({ sources: "arbeitnow" }, handlers);
    const job = result.results[0];
    expect(job.postedAt).toBeNull();
    expect(job.employmentType).toBeNull();
    expect(job.location).toBeNull();
  });
});

/* ─── Dedupe integration ─────────────────────────────────────────────────── */

describe("dedupe integration (M7A ladder)", () => {
  it("merges cross-source copies of the same job into ONE job, two postings", async () => {
    const { result } = await run(
      { sources: "greenhouse,lever", board: "acme", company: "Acme Corp" },
      {
        "boards-api.greenhouse.io": () => jsonResponse({ jobs: [ghRow()] }),
        "api.lever.co": () => jsonResponse([leverRow()]),
      },
    );
    expect(h.state.jobs).toHaveLength(1);
    expect(h.state.postings).toHaveLength(2);
    expect(new Set(h.state.postings.map((p) => p.jobId))).toEqual(
      new Set([h.state.jobs[0].id]),
    );
    expect(result.total).toBe(1);
    expect(result.results[0].sources).toEqual(["greenhouse", "lever"]);
  });

  it("NEVER merges different companies, even with an identical fingerprint", async () => {
    const fingerprint = postingFingerprint({
      companyName: "Acme Corp",
      title: "Data Engineer",
      location: "New York",
      description: DESC,
    });
    // A pre-existing job for a DIFFERENT company with the same fingerprint.
    h.state.jobs.push({
      id: "job_seed",
      title: "Data Engineer",
      companyName: "Globex",
      companyKey: "globex",
      locationNorm: "New York",
      remote: false,
      employmentType: null,
      descriptionText: DESC,
      applyUrl: "https://jobs.example/globex/1",
      fingerprintHash: fingerprint,
      lastConfirmedAt: new Date("2026-09-01T00:00:00.000Z"),
      status: "open",
    });

    const { result } = await run(
      { sources: "greenhouse", board: "acme", company: "Acme Corp" },
      { "boards-api.greenhouse.io": () => jsonResponse({ jobs: [ghRow()] }) },
    );
    expect(h.state.jobs).toHaveLength(2); // under-merge, never a false merge
    expect(result.results[0].jobId).not.toBe("job_seed");
    expect(h.state.postings[0].jobId).not.toBe("job_seed");
  });

  it("soft-key matches (same company/title/location, different text) stay separate", async () => {
    const handlers: Handlers = {
      "boards-api.greenhouse.io": () => jsonResponse({ jobs: [ghRow()] }),
    };
    await run({ sources: "greenhouse", board: "acme", company: "Acme Corp" }, handlers);

    const differentDesc = ghRow({
      id: 9002,
      absolute_url: "https://job-boards.greenhouse.io/acme/jobs/9002",
      content:
        "<p>A completely different description for the same nominal role listing with unique wording.</p>",
    });
    const second = await run(
      { sources: "greenhouse", board: "acme", company: "Acme Corp" },
      { "boards-api.greenhouse.io": () => jsonResponse({ jobs: [differentDesc] }) },
    );

    expect(h.state.jobs).toHaveLength(2); // possible_duplicate → separate job
    expect(h.state.postings).toHaveLength(2);
    // Results only include jobs confirmed by THIS fetch — the first job's
    // posting was not part of the second feed response.
    expect(second.result.total).toBe(1);
    expect(second.result.results[0].jobId).toBe(h.state.postings[1].jobId);
    expect(h.state.postings[0].jobId).not.toBe(h.state.postings[1].jobId);
  });

  it("different companies naturally produce different jobs", async () => {
    const { result } = await run({ sources: "arbeitnow" }, {
      "www.arbeitnow.com": () =>
        jsonResponse({
          data: [
            arbeitnowRow({ slug: "a-1", url: "https://www.arbeitnow.com/jobs/a-1", company_name: "Acme Corp" }),
            arbeitnowRow({ slug: "b-1", url: "https://www.arbeitnow.com/jobs/b-1", company_name: "Globex Inc" }),
          ],
        }),
    });
    expect(h.state.jobs).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});

/* ─── Freshness integration ──────────────────────────────────────────────── */

describe("freshness integration (M7A evidence-based)", () => {
  it("a just-confirmed recent posting is 'active' with an explainable reason", async () => {
    const { result } = await run({ sources: "arbeitnow" }, {
      "www.arbeitnow.com": () => jsonResponse({ data: [arbeitnowRow()] }),
    });
    expect(result.results[0].freshness).toEqual({
      state: "active",
      reasons: ["confirmed_present_within_sla"],
    });
  });

  it("an aging source-provided posting date yields 'probably_stale'", async () => {
    const { result } = await run({ sources: "arbeitnow" }, {
      "www.arbeitnow.com": () =>
        jsonResponse({
          data: [arbeitnowRow({ slug: "old-1", posted_at: "2026-08-15T00:00:00Z" })],
        }),
    });
    expect(result.results[0].freshness.state).toBe("probably_stale");
    expect(result.results[0].freshness.reasons).toContain(
      "source_posted_date_aging",
    );
  });

  it("a database row with no confirmation evidence is NEVER 'active'", () => {
    const evaluation = freshnessForStoredJob(
      { lastConfirmedAt: null },
      { postedAt: new Date("2026-09-25T00:00:00Z"), validThrough: null },
      NOW,
    );
    expect(evaluation.state).toBe("unknown");
    expect(evaluation.reasons).toContain("no_source_confirmation_evidence");
  });

  it("an old confirmation downgrades to 'probably_stale' at read time", () => {
    const evaluation = freshnessForStoredJob(
      { lastConfirmedAt: new Date("2026-09-21T12:00:00.000Z") }, // 10 days old
      { postedAt: new Date("2026-09-28T00:00:00Z"), validThrough: null },
      NOW,
    );
    expect(evaluation.state).toBe("probably_stale");
    expect(evaluation.reasons).toContain("source_confirmation_aging");
  });

  it("a passed source-provided validThrough yields 'expired'", () => {
    const evaluation = freshnessForStoredJob(
      { lastConfirmedAt: NOW },
      { postedAt: null, validThrough: new Date("2026-09-30T00:00:00.000Z") },
      NOW,
    );
    expect(evaluation.state).toBe("expired");
    expect(evaluation.reasons).toContain("source_valid_through_passed");
  });
});

/* ─── Filters, pagination, ordering ──────────────────────────────────────── */

// Every row gets its own slug AND url — distinct source URLs matter: the
// M7A dedupe ladder merges postings whose canonical URLs are identical.
const FEED = [
  arbeitnowRow({ slug: "j-newest", url: "https://www.arbeitnow.com/jobs/j-newest", title: "Alpha Engineer", posted_at: "2026-09-28T00:00:00Z" }),
  arbeitnowRow({ slug: "j-second", url: "https://www.arbeitnow.com/jobs/j-second", title: "Beta Engineer", posted_at: "2026-09-27T00:00:00Z", remote: true }),
  arbeitnowRow({ slug: "j-third", url: "https://www.arbeitnow.com/jobs/j-third", title: "Gamma Engineer", posted_at: "2026-09-26T00:00:00Z", job_type: "Part-time" }),
  arbeitnowRow({ slug: "j-fourth", url: "https://www.arbeitnow.com/jobs/j-fourth", title: "Backend Engineer", posted_at: "2026-09-20T00:00:00Z", location: "Berlin" }),
  arbeitnowRow({ slug: "j-nodate", url: "https://www.arbeitnow.com/jobs/j-nodate", title: "Epsilon Engineer", posted_at: undefined }),
];

const feedHandlers: Handlers = {
  "www.arbeitnow.com": () => jsonResponse({ data: FEED.map((row) => ({ ...row })) }),
};

function titles(result: JobSearchResult): string[] {
  return result.results.map((r) => r.title);
}

describe("filters", () => {
  it("keyword search matches title/company/location/description with AND semantics", async () => {
    const byTitle = await run({ sources: "arbeitnow", q: "backend" }, feedHandlers);
    expect(titles(byTitle.result)).toEqual(["Backend Engineer"]);

    const byCompany = await run({ sources: "arbeitnow", q: "acme" }, feedHandlers);
    expect(byCompany.result.total).toBe(5);

    const multi = await run(
      { sources: "arbeitnow", q: "backend berlin" },
      feedHandlers,
    );
    expect(titles(multi.result)).toEqual(["Backend Engineer"]);

    const noMatch = await run({ sources: "arbeitnow", q: "zzzz" }, feedHandlers);
    expect(noMatch.result.results).toEqual([]);
    expect(noMatch.result.total).toBe(0);
    expect(noMatch.result.totalPages).toBe(0);
    expect(noMatch.result.providers[0].status).toBe("ok"); // empty ≠ error
  });

  it("filters by location substring", async () => {
    const { result } = await run({ sources: "arbeitnow", location: "berlin" }, feedHandlers);
    expect(titles(result)).toEqual(["Backend Engineer"]);
  });

  it("filters by remote flag", async () => {
    const remoteOnly = await run({ sources: "arbeitnow", remote: true }, feedHandlers);
    expect(titles(remoteOnly.result)).toEqual(["Beta Engineer"]);

    const notRemote = await run({ sources: "arbeitnow", remote: false }, feedHandlers);
    expect(notRemote.result.total).toBe(4);
    expect(titles(notRemote.result)).not.toContain("Beta Engineer");
  });

  it("filters by employment type", async () => {
    const { result } = await run(
      { sources: "arbeitnow", employmentType: "part_time" },
      feedHandlers,
    );
    expect(titles(result)).toEqual(["Gamma Engineer"]);
  });

  it("combines filters deterministically", async () => {
    const { result } = await run(
      { sources: "arbeitnow", employmentType: "full_time", remote: false, location: "york" },
      feedHandlers,
    );
    expect(titles(result)).toEqual(["Alpha Engineer", "Epsilon Engineer"]);
  });
});

describe("ordering & pagination", () => {
  it("orders by postedAt desc with nulls last, and is stable across runs", async () => {
    const first = await run({ sources: "arbeitnow" }, feedHandlers);
    expect(titles(first.result)).toEqual([
      "Alpha Engineer",
      "Beta Engineer",
      "Gamma Engineer",
      "Backend Engineer",
      "Epsilon Engineer", // no source-provided date → last, never invented
    ]);

    const second = await run({ sources: "arbeitnow" }, feedHandlers);
    expect(titles(second.result)).toEqual(titles(first.result));
    expect(second.result.results.map((r) => r.jobId)).toEqual(
      first.result.results.map((r) => r.jobId),
    );
  });

  it("paginates deterministically with bounded page size", async () => {
    const page1 = await run({ sources: "arbeitnow", pageSize: "2" }, feedHandlers);
    expect(page1.result.total).toBe(5);
    expect(page1.result.totalPages).toBe(3);
    expect(titles(page1.result)).toEqual(["Alpha Engineer", "Beta Engineer"]);

    const page2 = await run(
      { sources: "arbeitnow", pageSize: "2", page: "2" },
      feedHandlers,
    );
    expect(titles(page2.result)).toEqual(["Gamma Engineer", "Backend Engineer"]);

    const page3 = await run(
      { sources: "arbeitnow", pageSize: "2", page: "3" },
      feedHandlers,
    );
    expect(titles(page3.result)).toEqual(["Epsilon Engineer"]);

    const beyond = await run(
      { sources: "arbeitnow", pageSize: "2", page: "4" },
      feedHandlers,
    );
    expect(beyond.result.results).toEqual([]);
    expect(beyond.result.total).toBe(5); // total reflects the whole set
  });
});

describe("mixed-provider results", () => {
  it("returns normalized results from several providers in one search", async () => {
    const { result } = await run(
      { sources: "greenhouse,ashby,arbeitnow", board: "acme", company: "Acme Corp" },
      {
        "boards-api.greenhouse.io": () => jsonResponse({ jobs: [ghRow()] }),
        "api.ashbyhq.com": () =>
          jsonResponse({
            jobs: [
              {
                id: "ash-1",
                title: "Platform Engineer",
                location: "Remote - US",
                isRemote: true,
                descriptionPlain: DESC,
                publishedAt: "2026-09-26T00:00:00Z",
                jobUrl: "https://jobs.ashbyhq.com/acme/ash-1",
                applyUrl: "https://jobs.ashbyhq.com/acme/ash-1/apply",
                employmentType: "Full-time",
              },
            ],
          }),
        "www.arbeitnow.com": () =>
          jsonResponse({
            data: [
              arbeitnowRow({
                slug: "ops-1",
                title: "Reliability Engineer",
                location: "Austin",
              }),
            ],
          }),
      },
    );
    expect(result.providers.map((p) => p.status)).toEqual(["ok", "ok", "ok"]);
    const kinds = result.results.map((r) => r.source.kind).sort();
    expect(kinds).toEqual(["arbeitnow", "ashby", "greenhouse"]);
    for (const item of result.results) {
      expect(item.jobId).toBeTruthy();
      expect(item.applyUrl).toMatch(/^https:\/\//);
      expect(item.source.displayName).toBeTruthy();
    }
  });
});

/* ─── Security posture (M7B-level; M7A covers the fetch boundary itself) ── */

describe("security", () => {
  it("sends no credentials, cookies, auth headers, bodies, or user data upstream", async () => {
    const { calls } = await run(
      {
        sources: "greenhouse,arbeitnow",
        board: "acme",
        q: "secret-user-keyword",
        location: "Private Location",
      },
      {
        "boards-api.greenhouse.io": () => jsonResponse({ jobs: [] }),
        "www.arbeitnow.com": () => jsonResponse({ data: [] }),
      },
    );
    expect(calls).toHaveLength(2);
    for (const call of calls) {
      const url = new URL(call.url);
      const init = call.init;
      expect(init.credentials).toBe("omit");
      expect(init.body ?? null).toBeNull();
      const headerNames = Object.keys((init.headers ?? {}) as Record<string, string>).map(
        (name) => name.toLowerCase(),
      );
      // Fixed headers only — nothing session-, cookie-, or profile-derived.
      expect(headerNames.sort()).toEqual(["accept", "user-agent"]);
      expect(headerNames).not.toContain("cookie");
      expect(headerNames).not.toContain("authorization");
      // Query text and filters never travel upstream.
      expect(call.url).not.toContain("secret-user-keyword");
      expect(call.url).not.toContain("Private");
      // The board identifier travels in the fixed path, never as free text.
      if (url.hostname === "boards-api.greenhouse.io") {
        expect(url.pathname).toContain("/boards/acme/");
      }
    }
  });

  it("an unsafe board that bypasses parsing still cannot escape the source allowlist", async () => {
    const { fetchImpl, calls } = makeFetch({
      "boards-api.greenhouse.io": () => jsonResponse({ jobs: [] }),
    });
    // Hand-built input deliberately skips parseJobSearchQuery — the registry
    // allowlist inside fetchSourceJson must still hold the line.
    const base = parse({ sources: "arbeitnow" });
    const input: JobSearchInput = {
      ...base,
      sources: ["greenhouse"],
      board: "../../etc/passwd",
    };
    await searchJobs("user_x", input, {
      fetchImpl,
      rateLimitCheck: allowAll,
      now: fixedNow,
    });
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(ALLOWED_HOSTS.has(new URL(call.url).hostname)).toBe(true);
    }
    // Traversal is percent-encoded into the path — never a raw path escape.
    expect(calls[0].url).not.toContain("../");
  });

  it("stores descriptions as inert text — markup never survives normalization", async () => {
    const handlers: Handlers = {
      "www.arbeitnow.com": () =>
        jsonResponse({
          data: [
            arbeitnowRow({
              slug: "xss-1",
              description:
                '<script>alert("xss")</script><p>Descriptive body text for the posting that comfortably exceeds forty characters after normalization.</p>',
            }),
          ],
        }),
    };
    await run({ sources: "arbeitnow" }, handlers);
    const stored = h.state.postings[0];
    expect(stored.descriptionText).not.toContain("<");
    expect(stored.descriptionText).not.toContain(">");
    expect(stored.descriptionText.length).toBeGreaterThan(40);
  });

  it("never persists rows whose source URL is not HTTPS", async () => {
    const { result } = await run({ sources: "greenhouse", board: "acme" }, {
      "boards-api.greenhouse.io": () =>
        jsonResponse({ jobs: [ghRow({ absolute_url: "javascript:alert(1)" })] }),
    });
    expect(result.providers[0]).toEqual({
      source: "greenhouse",
      status: "ok",
      fetched: 0,
      skipped: 1,
    });
    expect(h.state.postings).toHaveLength(0);
    expect(h.state.jobs).toHaveLength(0);
  });

  it("uses only the four approved sources — no additional provider can be requested", () => {
    for (const forbidden of ["linkedin", "indeed", "naukri", "adzuna", "remotive"]) {
      expect(() => parse({ sources: forbidden })).toThrowError(
        expect.objectContaining({ code: "INVALID_SOURCES" }),
      );
    }
  });
});
