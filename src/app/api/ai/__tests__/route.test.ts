/**
 * M6 — /api/ai route contract:
 *
 *  401 without a session
 *  rate limiting is PER-USER (session.user.id) — not per-IP:
 *    - 21st request in the window → 429 code RATE_LIMITED + Retry-After
 *    - user B is unaffected while user A is limited
 *    - x-forwarded-for cannot shift or bypass the bucket
 *  rate runs BEFORE quota → a rate-limited request increments zero quota
 *  quota exhaustion → 429 code USAGE_LIMIT_REACHED (never a generic error)
 *  an allowed request increments ai_generations exactly once and dispatches once
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { usageMock, dispatchMock, sessionMock } = vi.hoisted(() => ({
  usageMock: vi.fn(),
  dispatchMock: vi.fn(),
  sessionMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => sessionMock(...args),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/services/usage.service", () => ({
  usageService: { checkAndIncrementUsage: (...args: unknown[]) => usageMock(...args) },
}));
vi.mock("@/lib/ai/service", () => ({
  getAIService: () => ({ dispatch: (...args: unknown[]) => dispatchMock(...args) }),
  AIError: class AIError extends Error {
    code: string;
    status: number;
    constructor(message: string, code = "UPSTREAM", status = 500) {
      super(message);
      this.code = code;
      this.status = status;
    }
  },
}));

import { POST } from "@/app/api/ai/route";

/** Unique per test — the real in-memory limiter keeps state across tests. */
let seq = 0;
const uid = () => `route-user-${++seq}`;

function makeRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): NextRequest {
  const raw = JSON.stringify(body);
  return new NextRequest("http://localhost/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": String(raw.length), ...headers },
    body: raw,
  });
}

const okBody = { action: "analyzeResume", data: { name: "Test" } };

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue({ user: { id: uid() } });
  usageMock.mockResolvedValue({ allowed: true, current: 1, limit: 10, remaining: 9 });
  dispatchMock.mockResolvedValue({ overall: 80 });
});

describe("POST /api/ai", () => {
  it("401s without a session (no rate, no quota, no dispatch)", async () => {
    sessionMock.mockResolvedValue(null);
    const res = await POST(makeRequest(okBody));
    expect(res.status).toBe(401);
    expect(usageMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("returns 429 RATE_LIMITED with Retry-After on the 21st request (per-user)", async () => {
    const user = `rate-user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionMock.mockResolvedValue({ user: { id: user } });

    for (let i = 0; i < 20; i++) {
      const res = await POST(makeRequest(okBody));
      expect(res.status).toBe(200);
    }

    const blocked = await POST(makeRequest(okBody));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    const body = (await blocked.json()) as { code: string; retryAfter: number; success: boolean };
    expect(body.code).toBe("RATE_LIMITED");
    expect(body.success).toBe(false);
    expect(body.retryAfter).toBeGreaterThanOrEqual(1);
  });

  it("user B stays unaffected while user A is rate-limited (check 6)", async () => {
    const userA = `a-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const userB = `b-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    sessionMock.mockResolvedValue({ user: { id: userA } });
    for (let i = 0; i < 20; i++) await POST(makeRequest(okBody));
    expect((await POST(makeRequest(okBody))).status).toBe(429);

    sessionMock.mockResolvedValue({ user: { id: userB } });
    const res = await POST(makeRequest(okBody));
    expect(res.status).toBe(200);
  });

  it("x-forwarded-for cannot bypass or shift the user bucket (check 7)", async () => {
    const user = `xff-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionMock.mockResolvedValue({ user: { id: user } });

    for (let i = 0; i < 20; i++) {
      await POST(makeRequest(okBody, { "x-forwarded-for": `10.0.0.${i}` }));
    }
    // Different spoofed IPs — same user → still limited.
    const blocked = await POST(makeRequest(okBody, { "x-forwarded-for": "203.0.113.9" }));
    expect(blocked.status).toBe(429);
    const body = (await blocked.json()) as { code: string };
    expect(body.code).toBe("RATE_LIMITED");
  });

  it("rate-limited requests increment zero quota (check 4)", async () => {
    const user = `zero-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionMock.mockResolvedValue({ user: { id: user } });

    for (let i = 0; i < 21; i++) await POST(makeRequest(okBody));
    const quotaCallsWhenBlocked = usageMock.mock.calls.length;

    // The blocked attempt(s) must not have touched the usage service.
    expect((await POST(makeRequest(okBody))).status).toBe(429);
    expect(usageMock.mock.calls.length).toBe(quotaCallsWhenBlocked);
  });

  it("quota exhaustion returns 429 USAGE_LIMIT_REACHED and never dispatches (check 8)", async () => {
    usageMock.mockResolvedValue({ allowed: false, current: 10, limit: 10, remaining: 0 });
    const res = await POST(makeRequest(okBody));
    expect(res.status).toBe(429);
    const body = (await res.json()) as { code: string; success: boolean };
    expect(body.code).toBe("USAGE_LIMIT_REACHED");
    expect(body.success).toBe(false);
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("an allowed request increments ai_generations exactly once and dispatches once (check 3)", async () => {
    const res = await POST(makeRequest(okBody));
    expect(res.status).toBe(200);
    expect(usageMock).toHaveBeenCalledTimes(1);
    expect(usageMock.mock.calls[0][1]).toBe("ai_generations");
    expect(dispatchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an unknown action with 400 before touching quota", async () => {
    const res = await POST(makeRequest({ action: "not-a-real-action", data: {} }));
    expect(res.status).toBe(400);
    expect(usageMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
