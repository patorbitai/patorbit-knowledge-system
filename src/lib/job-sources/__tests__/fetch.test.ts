"use strict";

/**
 * M7A tests — the secured source-fetch path: allowlist/HTTPS gating before
 * I/O, manual redirect validation, timeout, response-size cap, JSON handling,
 * and the no-credentials/no-user-data request contract. All via injected
 * fake fetch implementations — no live network calls, ever.
 */

import { describe, expect, it } from "vitest";
import {
  SOURCE_FETCH_LIMITS,
  SourceFetchError,
  fetchSourceJson,
  type FetchLike,
} from "@/lib/job-sources/fetch";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const ALLOWED_URL = "https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true";

describe("fetchSourceJson happy path", () => {
  it("parses JSON and issues a credential-free, manual-redirect GET", async () => {
    const calls: Array<{ input: string; init?: RequestInit }> = [];
    const fetchImpl: FetchLike = async (input, init) => {
      calls.push({ input, init });
      return jsonResponse({ jobs: [] });
    };

    const result = await fetchSourceJson("greenhouse", ALLOWED_URL, { fetchImpl });
    expect(result).toEqual({ jobs: [] });
    expect(calls).toHaveLength(1);
    expect(calls[0].input).toBe(ALLOWED_URL);

    const init = calls[0].init!;
    expect(init.method).toBe("GET");
    expect(init.redirect).toBe("manual");
    expect(init.credentials).toBe("omit");
    const headers = init.headers as Record<string, string>;
    expect(headers.Accept).toBe("application/json");
    expect(headers["User-Agent"]).toContain("Patorbit-JobSources");
    expect(headers.Authorization).toBeUndefined();
    // No cookies, no credentials: the signal of intent is enforced structurally.
    expect(init.credentials).not.toBe("include");
  });

  it("publishes centralized fetch limits", () => {
    expect(SOURCE_FETCH_LIMITS.timeoutMs).toBeGreaterThan(0);
    expect(SOURCE_FETCH_LIMITS.maxBytes).toBeGreaterThan(0);
    expect(SOURCE_FETCH_LIMITS.maxRedirects).toBeGreaterThanOrEqual(0);
    expect(Object.isFrozen(SOURCE_FETCH_LIMITS)).toBe(true);
  });
});

describe("fetch gating before any I/O", () => {
  it("rejects unknown sources without calling fetch", async () => {
    let called = 0;
    const fetchImpl: FetchLike = async () => {
      called += 1;
      return jsonResponse({});
    };
    await expect(
      fetchSourceJson("indeed", "https://www.indeed.com/jobs", { fetchImpl }),
    ).rejects.toMatchObject({ name: "SourceFetchError", code: "unknown_source" });
    expect(called).toBe(0);
  });

  it("rejects non-allowlisted or non-HTTPS URLs without calling fetch", async () => {
    let called = 0;
    const fetchImpl: FetchLike = async () => {
      called += 1;
      return jsonResponse({});
    };
    for (const url of [
      "https://evil.com/jobs",
      "http://boards-api.greenhouse.io/x",
      "https://127.0.0.1/x",
      "https://user:pass@boards-api.greenhouse.io/x",
    ]) {
      await expect(
        fetchSourceJson("greenhouse", url, { fetchImpl }),
      ).rejects.toMatchObject({ name: "SourceFetchError", code: "invalid_url" });
    }
    expect(called).toBe(0);
  });

  it("rejects a cross-source URL even though the host is allowlisted elsewhere", async () => {
    let called = 0;
    const fetchImpl: FetchLike = async () => {
      called += 1;
      return jsonResponse({});
    };
    await expect(
      fetchSourceJson("greenhouse", "https://api.lever.co/v0/postings/x", { fetchImpl }),
    ).rejects.toMatchObject({ code: "invalid_url" });
    expect(called).toBe(0);
  });
});

describe("fetch failure modes", () => {
  it("maps HTTP error statuses", async () => {
    const fetchImpl: FetchLike = async () => new Response("nope", { status: 500 });
    await expect(
      fetchSourceJson("greenhouse", ALLOWED_URL, { fetchImpl }),
    ).rejects.toMatchObject({ code: "http_error" });
  });

  it("maps non-JSON bodies", async () => {
    const fetchImpl: FetchLike = async () =>
      new Response("<html>blocked</html>", { status: 200 });
    await expect(
      fetchSourceJson("greenhouse", ALLOWED_URL, { fetchImpl }),
    ).rejects.toMatchObject({ code: "invalid_json" });
  });

  it("maps network-layer failures", async () => {
    const fetchImpl: FetchLike = async () => {
      throw new TypeError("socket hang up");
    };
    await expect(
      fetchSourceJson("greenhouse", ALLOWED_URL, { fetchImpl }),
    ).rejects.toMatchObject({ code: "network_error" });
  });

  it("times out a hanging request", async () => {
    const fetchImpl: FetchLike = () => new Promise<Response>(() => undefined);
    const started = Date.now();
    const promise = fetchSourceJson("greenhouse", ALLOWED_URL, {
      fetchImpl,
      timeoutMs: 25,
    });
    await expect(promise).rejects.toMatchObject({ code: "timeout" });
    expect(Date.now() - started).toBeLessThan(2_000);
  }, 5_000);

  it("enforces the response-size cap while streaming", async () => {
    const big = "x".repeat(5_000);
    const fetchImpl: FetchLike = async () => new Response(big, { status: 200 });
    await expect(
      fetchSourceJson("greenhouse", ALLOWED_URL, { fetchImpl, maxBytes: 100 }),
    ).rejects.toMatchObject({ code: "too_large" });
  });
});

describe("redirect handling", () => {
  it("follows an allowed same-source relative redirect", async () => {
    let calls = 0;
    const fetchImpl: FetchLike = async (input) => {
      calls += 1;
      if (calls === 1) {
        return new Response(null, {
          status: 302,
          headers: { location: "/v1/boards/acme/jobs?page=2" },
        });
      }
      expect(input).toBe("https://boards-api.greenhouse.io/v1/boards/acme/jobs?page=2");
      return jsonResponse({ jobs: [{ id: 1 }] });
    };
    const result = await fetchSourceJson<{ jobs: unknown[] }>(
      "greenhouse",
      ALLOWED_URL,
      { fetchImpl },
    );
    expect(result.jobs).toHaveLength(1);
    expect(calls).toBe(2);
  });

  it("blocks cross-source redirect targets", async () => {
    let calls = 0;
    const fetchImpl: FetchLike = async () => {
      calls += 1;
      return new Response(null, {
        status: 302,
        headers: { location: "https://api.lever.co/v0/postings/acme" },
      });
    };
    await expect(
      fetchSourceJson("greenhouse", ALLOWED_URL, { fetchImpl }),
    ).rejects.toMatchObject({ code: "redirect_blocked" });
    expect(calls).toBe(1);
  });

  it("blocks redirects to private destinations", async () => {
    const fetchImpl: FetchLike = async () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://127.0.0.1/steal" },
      });
    await expect(
      fetchSourceJson("greenhouse", ALLOWED_URL, { fetchImpl }),
    ).rejects.toMatchObject({ code: "redirect_blocked" });
  });

  it("blocks redirects without a Location header", async () => {
    const fetchImpl: FetchLike = async () => new Response(null, { status: 302 });
    await expect(
      fetchSourceJson("greenhouse", ALLOWED_URL, { fetchImpl }),
    ).rejects.toMatchObject({ code: "redirect_blocked" });
  });

  it("stops after the redirect hop limit", async () => {
    let calls = 0;
    const fetchImpl: FetchLike = async () => {
      calls += 1;
      return new Response(null, {
        status: 302,
        headers: { location: "/v1/boards/acme/jobs?hop=" + calls },
      });
    };
    await expect(
      fetchSourceJson("greenhouse", ALLOWED_URL, { fetchImpl, maxRedirects: 1 }),
    ).rejects.toMatchObject({ code: "too_many_redirects" });
    expect(calls).toBe(2);
  });

  it("returns a typed SourceFetchError for every failure mode", async () => {
    const fetchImpl: FetchLike = async () => new Response("x", { status: 503 });
    const err = await fetchSourceJson("greenhouse", ALLOWED_URL, { fetchImpl }).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(SourceFetchError);
  });
});
