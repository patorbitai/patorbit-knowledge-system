/**
 * M6 — centralized AI failure classification + telemetry.
 *
 *  check 10: exactly one telemetry event per failed response
 *  check 11: quota takes precedence over generic 429 telemetry
 *  - no emission on success or abort
 *  - props carry only route/action/retryAfter — no resume data, no user ids
 *  - quota failures notify usage listeners and the quota-exhausted gate
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));

vi.mock("@/lib/analytics", () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

import {
  classifyAiFailure,
  ai,
  AIClientError,
  onAiUsageChanged,
  notifyAiUsageChanged,
  setQuotaExhaustedHandler,
} from "@/lib/ai/client";

beforeEach(() => {
  trackMock.mockClear();
});

afterEach(() => {
  setQuotaExhaustedHandler(null);
});

describe("classifyAiFailure (check 10 + 11)", () => {
  it("quota (429 + USAGE_LIMIT_REACHED) → exactly one ai_quota_exceeded, no rate event (check 11)", () => {
    const kind = classifyAiFailure({
      route: "/api/ai",
      action: "analyzeResume",
      status: 429,
      code: "USAGE_LIMIT_REACHED",
    });
    expect(kind).toBe("quota");
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock.mock.calls[0][0]).toBe("ai_quota_exceeded");
    expect(trackMock.mock.calls[0][1]).toMatchObject({ route: "/api/ai", action: "analyzeResume" });
  });

  it("generic 429 (no quota code) → exactly one ai_rate_limited", () => {
    const kind = classifyAiFailure({ route: "/api/ai/score", status: 429, retryAfter: 30 });
    expect(kind).toBe("rate");
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock.mock.calls[0][0]).toBe("ai_rate_limited");
    expect(trackMock.mock.calls[0][1]).toMatchObject({ route: "/api/ai/score", retryAfter: 30 });
  });

  it("quota wins even when BOTH status 429 and code indicate quota (check 11)", () => {
    const kind = classifyAiFailure({
      route: "/api/ai",
      status: 429,
      code: "USAGE_LIMIT_REACHED",
      retryAfter: 60,
    });
    expect(kind).toBe("quota");
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock.mock.calls[0][0]).toBe("ai_quota_exceeded");
  });

  it("ordinary errors (500/network) emit nothing", () => {
    expect(classifyAiFailure({ route: "/api/ai", status: 500 })).toBe("error");
    expect(classifyAiFailure({ route: "/api/ai", status: 0 })).toBe("error");
    expect(classifyAiFailure({ route: "/api/ai", status: 400, code: "BAD_REQUEST" })).toBe("error");
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("props never contain resume data or user ids — only route/action/retryAfter", () => {
    classifyAiFailure({
      route: "/api/ai",
      action: "rewrite",
      status: 429,
      code: "USAGE_LIMIT_REACHED",
      detail: "Monthly AI generation limit reached for Free tier.",
    });
    const props = trackMock.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(props).sort()).toEqual(["action", "route"]);
    // detail (server message) is routed to the gate, NOT to telemetry props
    expect(JSON.stringify(props)).not.toContain("Monthly");
  });
});

describe("classifyAiFailure side effects", () => {
  it("quota fires the usage-changed listeners (usage counters refresh)", () => {
    const listener = vi.fn();
    const off = onAiUsageChanged(listener);
    classifyAiFailure({ route: "/api/ai", status: 429, code: "USAGE_LIMIT_REACHED" });
    expect(listener).toHaveBeenCalledTimes(1);
    off();
  });

  it("rate does NOT fire usage listeners (no credit was consumed)", () => {
    const listener = vi.fn();
    const off = onAiUsageChanged(listener);
    classifyAiFailure({ route: "/api/ai", status: 429, retryAfter: 10 });
    expect(listener).not.toHaveBeenCalled();
    off();
  });

  it("quota invokes the registered quota-exhausted gate with route + detail", () => {
    const handler = vi.fn();
    const off = setQuotaExhaustedHandler(handler);
    classifyAiFailure({
      route: "/api/ai/match",
      status: 429,
      code: "USAGE_LIMIT_REACHED",
      detail: "Monthly job analysis limit reached.",
    });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toMatchObject({
      route: "/api/ai/match",
      detail: "Monthly job analysis limit reached.",
    });
    off();
  });

  it("notifyAiUsageChanged reaches every subscriber exactly once per call", () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = onAiUsageChanged(a);
    const offB = onAiUsageChanged(b);
    notifyAiUsageChanged();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    offA();
    offB();
    notifyAiUsageChanged();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});

describe("callAI classification (one event per failed response)", () => {
  function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers(headers),
      json: async () => body,
    }) as unknown as typeof fetch;
  }

  it("failed /api/ai response → exactly one telemetry event + AIClientError with code", async () => {
    mockFetch(429, {
      success: false,
      error: "Monthly AI generation limit reached for Free tier.",
      code: "USAGE_LIMIT_REACHED",
    });
    await expect(ai.rewrite("x")).rejects.toBeInstanceOf(AIClientError);
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock.mock.calls[0][0]).toBe("ai_quota_exceeded");
  });

  it("rate-limited response (RATE_LIMITED + Retry-After) → one ai_rate_limited", async () => {
    mockFetch(429, { success: false, error: "Too many requests.", code: "RATE_LIMITED" }, {
      "Retry-After": "42",
    });
    await expect(ai.rewrite("x")).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
    });
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock.mock.calls[0][0]).toBe("ai_rate_limited");
    expect(trackMock.mock.calls[0][1]).toMatchObject({ retryAfter: 42 });
  });

  it("successful response → zero telemetry events, zero quota gates", async () => {
    mockFetch(200, { success: true, data: { content: "ok" } });
    const handler = vi.fn();
    const off = setQuotaExhaustedHandler(handler);
    await expect(ai.rewrite("x")).resolves.toEqual({ content: "ok" });
    expect(trackMock).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
    off();
  });

  it("abort → CANCELED, no telemetry (user-initiated cancel is not a failure)", async () => {
    const abortErr = new Error("aborted");
    abortErr.name = "AbortError";
    globalThis.fetch = vi.fn().mockRejectedValue(abortErr) as unknown as typeof fetch;
    await expect(ai.rewrite("x")).rejects.toMatchObject({
      code: "CANCELED",
    });
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("network failure → NETWORK code, no telemetry (ordinary error handling)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch")) as unknown as typeof fetch;
    await expect(ai.rewrite("x")).rejects.toMatchObject({
      code: "NETWORK",
    });
    expect(trackMock).not.toHaveBeenCalled();
  });
});
