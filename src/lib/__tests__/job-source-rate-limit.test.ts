"use strict";

/**
 * M7B — job-source discovery rate limiter.
 *
 * Extends the existing M6 sliding-window infrastructure with its own bucket:
 *  - limits derive from JOB_SOURCE_RATE_LIMIT (M7A centralized config);
 *  - per-user isolation;
 *  - INDEPENDENT from AI and import buckets (exhausting source calls never
 *    affects AI limits — M6 behavior is untouched);
 *  - the window actually slides (recovery after windowMs).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkAIRateLimit,
  checkImportRateLimit,
  checkJobSourceRateLimit,
  JOB_SOURCE_RATE_LIMIT_MAX,
  JOB_SOURCE_RATE_LIMIT_WINDOW,
} from "@/lib/rate-limit";
import { JOB_SOURCE_RATE_LIMIT } from "@/lib/job-sources";

// Module-level setInterval (GC every 5 min) — fake timers keep it from
// leaking into other suites (same convention as rate-limit.test.ts).
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Unique user ids per test so module-level stores never cross-contaminate. */
let seq = 0;
const uid = (label: string) => `js-${label}-${++seq}`;

describe("checkJobSourceRateLimit", () => {
  it("derives its limits from the centralized JOB_SOURCE_RATE_LIMIT config", () => {
    expect(JOB_SOURCE_RATE_LIMIT_MAX).toBe(JOB_SOURCE_RATE_LIMIT.maxRequests);
    expect(JOB_SOURCE_RATE_LIMIT_WINDOW).toBe(JOB_SOURCE_RATE_LIMIT.windowMs);
  });

  it("allows exactly JOB_SOURCE_RATE_LIMIT_MAX calls, then blocks with a sane retryAfter", () => {
    const user = uid("max");
    for (let i = 0; i < JOB_SOURCE_RATE_LIMIT_MAX; i++) {
      expect(checkJobSourceRateLimit(user).allowed).toBe(true);
    }
    const blocked = checkJobSourceRateLimit(user);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThanOrEqual(1);
    expect(blocked.retryAfter).toBeLessThanOrEqual(
      Math.ceil(JOB_SOURCE_RATE_LIMIT_WINDOW / 1000),
    );
  });

  it("buckets are isolated per user — exhausting one user never blocks another", () => {
    const a = uid("a");
    const b = uid("b");
    for (let i = 0; i < JOB_SOURCE_RATE_LIMIT_MAX + 5; i++) {
      checkJobSourceRateLimit(a);
    }
    expect(checkJobSourceRateLimit(a).allowed).toBe(false);
    expect(checkJobSourceRateLimit(b).allowed).toBe(true);
  });

  it("is fully independent from the AI and import buckets (M6 untouched)", () => {
    const user = uid("independent");
    for (let i = 0; i < JOB_SOURCE_RATE_LIMIT_MAX + 3; i++) {
      checkJobSourceRateLimit(user);
    }
    expect(checkJobSourceRateLimit(user).allowed).toBe(false);
    // Exhausting source calls must not consume AI/import capacity…
    expect(checkAIRateLimit(user).allowed).toBe(true);
    expect(checkImportRateLimit(user).allowed).toBe(true);
    // …and the reverse direction holds too.
    for (let i = 0; i < 25; i++) {
      checkAIRateLimit(uid("ai-heavy"));
    }
    expect(checkJobSourceRateLimit(user).allowed).toBe(false);
  });

  it("the window slides: the bucket recovers after windowMs", () => {
    const user = uid("slide");
    for (let i = 0; i < JOB_SOURCE_RATE_LIMIT_MAX; i++) {
      checkJobSourceRateLimit(user);
    }
    expect(checkJobSourceRateLimit(user).allowed).toBe(false);

    vi.advanceTimersByTime(JOB_SOURCE_RATE_LIMIT_WINDOW + 1);
    expect(checkJobSourceRateLimit(user).allowed).toBe(true);
  });
});
