/**
 * M6 — UsageHint displays the CORRECT counter for the action it sits next to
 * (check 12): ai_generations / job_analysis / ai_tailoring are separate
 * counters with separate labels — never one universal "AI actions" quota.
 *
 * Hides when: limit is -1 (unlimited), usage unavailable, or unauthenticated.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { renderToContainer, installObserverStubs } from "@/components/resume-builder/__tests__/gallery-test-utils";

installObserverStubs();

const { sessionMock, fetchMock } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: (...args: unknown[]) => sessionMock(...args),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
  trackOnce: vi.fn(),
  trackEvent: vi.fn(),
}));

import { FeatureAccessProvider, useFeatureAccess } from "@/components/providers/FeatureAccessProvider";
import { UsageHint } from "@/components/common/UsageHint";

/** Probe: expose the context's usage counters to the test. */
function Probe() {
  const { usage } = useFeatureAccess();
  return (
    <div>
      <span data-testid="raw-usage">{usage ? JSON.stringify(usage) : "null"}</span>
      <UsageHint feature="ai_generations" />
      <UsageHint feature="job_analysis" />
      <UsageHint feature="ai_tailoring" />
    </div>
  );
}

function usagePayload(overrides: Record<string, { current: number; limit: number }> = {}) {
  const base = {
    ai_generations: { current: 3, limit: 10 },
    job_analysis: { current: 2, limit: 5 },
    ai_tailoring: { current: 1, limit: 3 },
  };
  return {
    subscription: { tier: "Free", status: "active", isActive: true },
    entitlements: { features: {} },
    ai_generations: { ...base.ai_generations, ...overrides.ai_generations },
    job_analysis: { ...base.job_analysis, ...overrides.job_analysis },
    ai_tailoring: { ...base.ai_tailoring, ...overrides.ai_tailoring },
    resumeCount: { current: 1, max: 2, limit: 2 },
  };
}

let rendered: { unmount: () => void } | null = null;

function renderProvider() {
  rendered = renderToContainer(
    <FeatureAccessProvider>
      <Probe />
    </FeatureAccessProvider>,
  );
  return rendered;
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockReturnValue({ data: { user: { id: "u1" } }, status: "authenticated" });
  fetchMock.mockResolvedValue({ ok: true, json: async () => usagePayload() });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  rendered?.unmount();
  rendered = null;
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("UsageHint (check 12)", () => {
  it("shows the correct per-feature counter with the correct label", async () => {
    renderProvider();
    await flush();

    const gen = document.querySelector('[data-testid="usage-hint-ai_generations"]');
    const job = document.querySelector('[data-testid="usage-hint-job_analysis"]');
    const tail = document.querySelector('[data-testid="usage-hint-ai_tailoring"]');

    expect(gen?.textContent).toContain("3");
    expect(gen?.textContent).toContain("10");
    expect(gen?.textContent).toContain("AI generation actions");

    expect(job?.textContent).toContain("2");
    expect(job?.textContent).toContain("5");
    expect(job?.textContent).toContain("job-analysis actions");

    expect(tail?.textContent).toContain("1");
    expect(tail?.textContent).toContain("3");
    expect(tail?.textContent).toContain("tailoring actions");

    // Never one universal "AI actions" label
    for (const el of [gen, job, tail]) {
      expect(el?.textContent).not.toBe("3 / 10 AI actions");
    }
  });

  it("fetches counters from GET /api/account/usage exactly once on mount", async () => {
    renderProvider();
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/account/usage");
  });

  it("hides when the limit is unlimited (-1)", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        usagePayload({
          ai_generations: { current: 99, limit: -1 },
        }),
    });
    renderProvider();
    await flush();

    const gen = document.querySelector('[data-testid="usage-hint-ai_generations"]');
    expect(gen).toBeNull();
    // other features still show their finite counters
    expect(document.querySelector('[data-testid="usage-hint-job_analysis"]')).not.toBeNull();
  });

  it("hides all hints when the user is unauthenticated", async () => {
    sessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
    renderProvider();
    await flush();

    expect(document.querySelector('[data-testid="usage-hint-ai_generations"]')).toBeNull();
    expect(document.querySelector('[data-testid="usage-hint-job_analysis"]')).toBeNull();
    expect(document.querySelector('[data-testid="usage-hint-ai_tailoring"]')).toBeNull();
    expect(document.querySelector('[data-testid="raw-usage"]')?.textContent).toBe("null");
    // unauthenticated → no usage fetch
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hides when usage failed to load (no data available)", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    renderProvider();
    await flush();
    expect(document.querySelector('[data-testid="usage-hint-ai_generations"]')).toBeNull();
  });

  it("marks the counter as exhausted when current >= limit", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => usagePayload({ ai_generations: { current: 10, limit: 10 } }),
    });
    renderProvider();
    await flush();

    const gen = document.querySelector('[data-testid="usage-hint-ai_generations"]');
    expect(gen?.textContent).toContain("limit reached");
  });
});
