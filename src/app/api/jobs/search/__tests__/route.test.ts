"use strict";

/**
 * M7B — GET /api/jobs/search route tests.
 *
 * searchJobs is mocked (no network, no database); query parsing and the
 * error classes stay REAL so the route's classification contract (400/429/500)
 * is exercised end-to-end.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/services/job-discovery.service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/job-discovery.service")>();
  return {
    ...actual,
    searchJobs: vi.fn(),
  };
});

const SAMPLE_RESULT = {
  results: [
    {
      jobId: "job_0001",
      title: "Data Engineer",
      companyName: "Acme Corp",
      location: "New York",
      remote: false,
      employmentType: "full_time",
      postedAt: "2026-09-25T00:00:00.000Z",
      freshness: { state: "active", reasons: ["confirmed_present_within_sla"] },
      source: {
        kind: "greenhouse",
        displayName: "Greenhouse",
        attributionText: "Jobs via Greenhouse",
        attributionUrl: "https://www.greenhouse.io/",
      },
      sourceUrl: "https://job-boards.greenhouse.io/acme/jobs/9001",
      applyUrl: "https://job-boards.greenhouse.io/acme/jobs/9001",
      sources: ["greenhouse"],
    },
  ],
  page: 1,
  pageSize: 10,
  total: 1,
  totalPages: 1,
  providers: [{ source: "greenhouse", status: "ok", fetched: 1, skipped: 0 }],
  fetchedAt: "2026-10-01T12:00:00.000Z",
};

async function load() {
  const { getServerSession } = await import("next-auth");
  const service = await import("@/services/job-discovery.service");
  const route = await import("../route");
  return { getServerSession, service, route };
}

function getRequest(url: string) {
  return new NextRequest(`http://localhost${url}`) as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/jobs/search", () => {
  it("returns 401 for unauthenticated requests and never calls the service", async () => {
    const { getServerSession, service, route } = await load();
    vi.mocked(getServerSession).mockResolvedValue(null);

    const res = await route.GET(getRequest("/api/jobs/search"));
    expect(res.status).toBe(401);
    expect(vi.mocked(service.searchJobs)).not.toHaveBeenCalled();
  });

  it("returns 400 with a stable code for an unknown source, without fetching", async () => {
    const { getServerSession, service, route } = await load();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user_1" } } as any);

    const res = await route.GET(getRequest("/api/jobs/search?sources=linkedin"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe("INVALID_SOURCES");
    expect(vi.mocked(service.searchJobs)).not.toHaveBeenCalled();
  });

  it("returns 400 BOARD_REQUIRED when a per-company source has no board", async () => {
    const { getServerSession, service, route } = await load();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user_1" } } as any);

    const res = await route.GET(getRequest("/api/jobs/search?sources=greenhouse"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("BOARD_REQUIRED");
    expect(vi.mocked(service.searchJobs)).not.toHaveBeenCalled();
  });

  it("returns 200 with the discovery contract and passes the parsed query through", async () => {
    const { getServerSession, service, route } = await load();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user_1" } } as any);
    vi.mocked(service.searchJobs).mockResolvedValue(SAMPLE_RESULT as any);

    const res = await route.GET(
      getRequest("/api/jobs/search?q=engineer&page=2&pageSize=10"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].jobId).toBe("job_0001");
    expect(body.providers).toEqual(SAMPLE_RESULT.providers);
    expect(body.total).toBe(1);

    expect(service.searchJobs).toHaveBeenCalledTimes(1);
    const [userId, input] = vi.mocked(service.searchJobs).mock.calls[0];
    expect(userId).toBe("user_1");
    expect(input).toMatchObject({
      q: "engineer",
      page: 2,
      pageSize: 10,
      sources: ["arbeitnow"],
    });
  });

  it("maps a source rate-limit denial to the SHARED 429 contract", async () => {
    const { getServerSession, service, route } = await load();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user_1" } } as any);
    vi.mocked(service.searchJobs).mockRejectedValue(
      new service.JobSearchRateLimitedError(17),
    );

    const res = await route.GET(getRequest("/api/jobs/search"));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("17");
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe("RATE_LIMITED");
    expect(body.retryAfter).toBe(17);
  });

  it("returns a safe 500 without leaking internals for unexpected failures", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getServerSession, service, route } = await load();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user_1" } } as any);
    vi.mocked(service.searchJobs).mockRejectedValue(
      new Error("secret internal detail"),
    );

    const res = await route.GET(getRequest("/api/jobs/search"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("secret internal detail");
    expect(consoleError).toHaveBeenCalled();
  });
});
