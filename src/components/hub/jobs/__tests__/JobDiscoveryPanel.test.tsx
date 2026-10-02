"use strict";

/**
 * M7B — JobDiscoveryPanel state tests: loading, results, empty, error, and
 * rate-limit states, plus honest freshness display and safe outbound links.
 * fetch is fully stubbed — zero network access.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { JobDiscoveryPanel } from "../JobDiscoveryPanel";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const JOB_ITEM = {
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
  applyUrl: "https://job-boards.greenhouse.io/acme/jobs/9001/apply",
  sources: ["greenhouse"],
};

function successPayload(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    results: [JOB_ITEM],
    page: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1,
    providers: [{ source: "greenhouse", status: "ok", fetched: 1, skipped: 0 }],
    fetchedAt: "2026-10-01T12:00:00.000Z",
    ...overrides,
  };
}

function respond(status: number, payload: unknown) {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );
}

let fetchMock: ReturnType<typeof vi.fn>;
let container: HTMLDivElement;
let root: Root | undefined;

async function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  const created = createRoot(container);
  root = created;
  await act(async () => {
    created.render(<JobDiscoveryPanel />);
  });
}

async function flush(times = 6) {
  for (let i = 0; i < times; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function submitSearch() {
  const button = Array.from(container.querySelectorAll("button")).find(
    (b) => (b as HTMLButtonElement).type === "submit",
  ) as HTMLButtonElement | undefined;
  expect(button).toBeTruthy();
  await act(async () => {
    button!.click();
  });
  await flush();
}

function text(): string {
  return container.textContent ?? "";
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  if (root) {
    act(() => {
      root!.unmount();
    });
    root = undefined;
  }
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("JobDiscoveryPanel", () => {
  it("renders the search form with an idle hint before any search", async () => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await render();

    expect(text()).toContain("Discover jobs");
    expect(text()).toContain("Search real job postings");
    expect(container.querySelector("#job-search-q")).toBeTruthy();
    expect(container.querySelector("#job-search-source")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a loading skeleton, then renders results with honest freshness and safe links", async () => {
    let resolveFetch: (response: Response) => void;
    fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await render();

    await act(async () => {
      const button = Array.from(container.querySelectorAll("button")).find(
        (b) => (b as HTMLButtonElement).type === "submit",
      ) as HTMLButtonElement;
      button.click();
    });

    // Loading state (skeleton with a status role) while the fetch is pending.
    expect(container.querySelector('[role="status"][aria-label="Searching jobs"]')).toBeTruthy();

    await act(async () => {
      resolveFetch!(
        new Response(JSON.stringify(successPayload()), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    });
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/jobs/search?");

    expect(text()).toContain("Data Engineer");
    expect(text()).toContain("Acme Corp");
    expect(text()).toContain("New York");
    expect(text()).toContain("Full-time");
    expect(text()).toContain("Confirmed recently"); // honest freshness label
    expect(text()).toContain("Jobs via Greenhouse"); // source attribution
    expect(text()).toContain("Sep 25, 2026"); // source-provided date
    expect(text()).toContain("1 job found");

    const links = Array.from(
      container.querySelectorAll('a[target="_blank"]'),
    ) as HTMLAnchorElement[];
    expect(links).toHaveLength(2); // source posting + separate apply URL
    for (const link of links) {
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.href).toMatch(/^https:\/\//);
    }
    expect(links[0].href).toBe("https://job-boards.greenhouse.io/acme/jobs/9001");
    expect(links[1].href).toBe(
      "https://job-boards.greenhouse.io/acme/jobs/9001/apply",
    );
  });

  it("renders the empty state for zero results without claiming an error", async () => {
    fetchMock = respond(
      200,
      successPayload({ results: [], total: 0, totalPages: 0, providers: [
        { source: "arbeitnow", status: "ok", fetched: 0, skipped: 0 },
      ] }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await submitSearch();

    expect(text()).toContain("0 jobs found");
    expect(text()).toContain("No jobs matched your search.");
    expect(text()).not.toContain("Something went wrong");
  });

  it("renders the rate-limit state from the shared 429 contract", async () => {
    fetchMock = respond(429, { success: false, code: "RATE_LIMITED", retryAfter: 17 });
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await submitSearch();

    expect(text()).toContain("Job source rate limit reached");
    expect(text()).toContain("17s");
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
  });

  it("renders server validation errors (400) in the error state", async () => {
    fetchMock = respond(400, {
      success: false,
      error: "A board identifier is required for Greenhouse, Lever, and Ashby searches.",
      code: "BOARD_REQUIRED",
    });
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await submitSearch();

    expect(text()).toContain("A board identifier is required");
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
  });

  it("renders a generic error state for unexpected server failures", async () => {
    fetchMock = respond(500, {
      error: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await submitSearch();

    expect(container.querySelector('[role="alert"]')).toBeTruthy();
    // Safe human-readable message — the INTERNAL_ERROR code is never shown.
    expect(text()).toContain("Something went wrong");
    expect(text()).not.toContain("INTERNAL_ERROR");
  });

  it("renders a connectivity error state when fetch itself rejects", async () => {
    fetchMock = vi.fn(() => Promise.reject(new Error("offline")));
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await submitSearch();

    expect(text()).toContain("Could not reach Patorbit");
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
  });

  it("surfaces partial provider failures without hiding results", async () => {
    fetchMock = respond(
      200,
      successPayload({
        providers: [
          { source: "greenhouse", status: "failed", code: "timeout" },
          { source: "arbeitnow", status: "ok", fetched: 1, skipped: 0 },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await submitSearch();

    expect(text()).toContain("Some sources didn't respond: greenhouse");
    expect(text()).toContain("Data Engineer"); // results still shown
  });
});

/* ─── M7C: provenance & honest confirmation display ────────────────────── */

describe("M7C provenance display", () => {
  it("shows the exact feed identity and the last confirmed observation", async () => {
    fetchMock = respond(
      200,
      successPayload({
        results: [
          {
            ...JOB_ITEM,
            feedKey: "greenhouse:acme",
            lastConfirmedAt: "2026-10-01T00:00:00.000Z",
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await submitSearch();

    expect(text()).toContain("via Greenhouse · acme");
    expect(text()).toContain("Last confirmed Oct 1, 2026");
    expect(text()).not.toContain("Not yet confirmed");
  });

  it("says 'Not yet confirmed' instead of inventing a confirmation time", async () => {
    fetchMock = respond(200, successPayload());
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await submitSearch();

    expect(text()).toContain("Not yet confirmed");
    expect(text()).not.toContain("Last confirmed");
  });

  it("shows no feed suffix for the global corpus (a page is not an employer feed)", async () => {
    fetchMock = respond(
      200,
      successPayload({
        results: [
          {
            ...JOB_ITEM,
            source: {
              kind: "arbeitnow",
              displayName: "Arbeitnow",
              attributionText: "Jobs via Arbeitnow",
              attributionUrl: "https://www.arbeitnow.com/",
            },
            feedKey: "arbeitnow:global",
            lastConfirmedAt: "2026-10-01T00:00:00.000Z",
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await submitSearch();

    expect(text()).toContain("via Arbeitnow");
    expect(text()).not.toContain("· global");
  });

  it("explains the freshness badge with the exact evidence reasons", async () => {
    fetchMock = respond(
      200,
      successPayload({
        results: [
          {
            ...JOB_ITEM,
            freshness: {
              state: "probably_stale",
              reasons: ["not_present_in_latest_source_response"],
            },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await submitSearch();

    const badge = container.querySelector(
      '[title*="Reasons"]',
    ) as HTMLElement | null;
    expect(badge).toBeTruthy();
    expect(badge!.getAttribute("title")).toContain(
      "Reasons: not_present_in_latest_source_response",
    );
    expect(text()).toContain("Possibly stale");
  });
});
