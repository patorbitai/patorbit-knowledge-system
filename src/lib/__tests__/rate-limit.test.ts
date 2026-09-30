/**
 * M6 — shared rate-limiting contract for AI routes.
 *
 *  - per-user buckets are isolated (user A's limit never bleeds into user B)
 *  - retryAfter is computed from the OLDEST hit in the sliding window
 *  - rateLimitResponse returns the single shared 429 shape:
 *      { success:false, code:"RATE_LIMITED", retryAfter } + Retry-After header
 *    so clients can distinguish rate (RATE_LIMITED) from quota
 *    (USAGE_LIMIT_REACHED) in exactly one classification point.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkAIRateLimit,
  checkImportRateLimit,
  rateLimitResponse,
  AI_RATE_LIMIT_MAX,
  AI_RATE_LIMIT_WINDOW,
} from "@/lib/rate-limit";

// Module-level setInterval (GC every 5 min) — fake timers keep it from
// leaking into other suites.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Unique user ids per test so module-level stores never cross-contaminate. */
let seq = 0;
const uid = (label: string) => `u-${label}-${++seq}`;

describe("checkAIRateLimit", () => {
  it("allows exactly AI_RATE_LIMIT_MAX requests then blocks with a sane retryAfter", () => {
    const user = uid("max");
    for (let i = 0; i < AI_RATE_LIMIT_MAX; i++) {
      expect(checkAIRateLimit(user).allowed).toBe(true);
    }
    const blocked = checkAIRateLimit(user);
    expect(blocked.allowed).toBe(false);
    // retryAfter is seconds, at least 1, never more than the window
    expect(blocked.retryAfter).toBeGreaterThanOrEqual(1);
    expect(blocked.retryAfter).toBeLessThanOrEqual(Math.ceil(AI_RATE_LIMIT_WINDOW / 1000));
  });

  it("buckets are isolated per user — A exhausting never blocks B", () => {
    const a = uid("a");
    const b = uid("b");
    for (let i = 0; i < AI_RATE_LIMIT_MAX + 5; i++) {
      checkAIRateLimit(a);
    }
    expect(checkAIRateLimit(a).allowed).toBe(false);
    expect(checkAIRateLimit(b).allowed).toBe(true);
  });

  it("x-forwarded-for / IP identity is irrelevant — only the userId key matters", () => {
    // The old per-IP limiter keyed on header values; the new one cannot see
    // headers at all: same user, any supposed IP → same bucket.
    const user = uid("xff");
    for (let i = 0; i < AI_RATE_LIMIT_MAX; i++) {
      expect(checkAIRateLimit(user).allowed).toBe(true);
    }
    expect(checkAIRateLimit(user).allowed).toBe(false);
    // A different user (a fresh bucket) is unaffected regardless of IP.
    expect(checkAIRateLimit(uid("other")).allowed).toBe(true);
  });

  it("window slides — blocked requests become allowed after the window passes", () => {
    const user = uid("slide");
    for (let i = 0; i < AI_RATE_LIMIT_MAX; i++) {
      checkAIRateLimit(user);
    }
    expect(checkAIRateLimit(user).allowed).toBe(false);

    vi.advanceTimersByTime(AI_RATE_LIMIT_WINDOW + 1000);
    expect(checkAIRateLimit(user).allowed).toBe(true);
  });

  it("retryAfter counts down as the window ages", () => {
    const user = uid("countdown");
    for (let i = 0; i < AI_RATE_LIMIT_MAX; i++) {
      checkAIRateLimit(user);
    }
    const first = checkAIRateLimit(user);
    expect(first.allowed).toBe(false);

    vi.advanceTimersByTime(30_000);
    const later = checkAIRateLimit(user);
    expect(later.allowed).toBe(false);
    expect(later.retryAfter).toBeLessThan(first.retryAfter);
  });
});

describe("checkImportRateLimit (separate bucket)", () => {
  it("import limiting is independent from the AI bucket", () => {
    const user = uid("import");
    // Exhaust the AI bucket…
    for (let i = 0; i < AI_RATE_LIMIT_MAX; i++) {
      checkAIRateLimit(user);
    }
    expect(checkAIRateLimit(user).allowed).toBe(false);
    // …the import bucket still works (and vice versa: import cap is 5/60s).
    expect(checkImportRateLimit(user).allowed).toBe(true);
  });
});

describe("rateLimitResponse", () => {
  it("returns the shared 429 contract: RATE_LIMITED code, retryAfter, Retry-After header", async () => {
    const res = rateLimitResponse(42);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(res.headers.get("Content-Type")).toContain("application/json");

    const body = (await res.json()) as {
      success: boolean;
      code: string;
      retryAfter: number;
      error: string;
    };
    expect(body.success).toBe(false);
    expect(body.code).toBe("RATE_LIMITED");
    expect(body.retryAfter).toBe(42);
    expect(body.error).toBeTruthy();
  });

  it("never uses the quota code — rate and quota stay distinguishable", async () => {
    const res = rateLimitResponse(1);
    const body = (await res.json()) as { code: string };
    expect(body.code).not.toBe("USAGE_LIMIT_REACHED");
  });
});
