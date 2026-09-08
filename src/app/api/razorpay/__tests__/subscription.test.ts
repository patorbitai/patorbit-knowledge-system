"use strict";

/**
 * Razorpay Subscription Route — ₹5 Trial Cancellation
 *
 * Covers: cancelling a trialing subscription (no conversion), cancelling an
 * active subscription (at period end), and the subscription GET response
 * exposing trial eligibility + trial dates.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Shared Mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  subscriptionFindFirst: vi.fn(),
  subscriptionUpdate: vi.fn(),
  razorpaySubscriptionsCancel: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
    subscription: {
      findFirst: mocks.subscriptionFindFirst,
      update: mocks.subscriptionUpdate,
    },
  },
}));

vi.mock("@/lib/razorpay", () => ({
  getRazorpay: () => ({
    subscriptions: { cancel: mocks.razorpaySubscriptionsCancel },
  }),
  getTrialEndsAt: (startedAt: Date = new Date()) =>
    new Date(startedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cancelRequest(): any {
  return {};
}

// ──────────────────────────────────────────────────────────────────────────────
// TRIAL CANCELLATION TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe("Razorpay Subscription — Trial Cancellation", () => {
  let DELETE: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.getServerSession.mockResolvedValue({ user: { id: "user1" } });
    mocks.razorpaySubscriptionsCancel.mockResolvedValue({ id: "sub_trial_x" });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});

    const mod = await import("../subscription/route");
    DELETE = mod.DELETE;
  });

  it("cancels a trialing subscription without converting to billing", async () => {
    mocks.subscriptionFindFirst.mockResolvedValue({
      id: "db_sub_trial",
      razorpaySubscriptionId: "sub_trial_cancel",
      status: "trialing",
      currentPeriodEnd: new Date(Date.now() + 3 * 86400 * 1000),
    });

    const res = await DELETE(cancelRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("Trial cancelled");

    // Trial has no active billing cycle — Razorpay rejects at-cycle-end
    // cancels, so a trial must be cancelled immediately (atCycleEnd=false).
    expect(mocks.razorpaySubscriptionsCancel).toHaveBeenCalledWith(
      "sub_trial_cancel",
      false,
    );

    // DB marked cancelled so no normal billing conversion
    const dbArgs = mocks.subscriptionUpdate.mock.calls[0][0];
    expect(dbArgs.data).toEqual(
      expect.objectContaining({
        cancelAtPeriodEnd: true,
        status: "cancelled",
        cancelledAt: expect.any(Date),
      }),
    );
  });

  it("cancels an active subscription at period end (existing behavior)", async () => {
    mocks.subscriptionFindFirst.mockResolvedValue({
      id: "db_sub_active",
      razorpaySubscriptionId: "sub_active_cancel",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 20 * 86400 * 1000),
    });

    const res = await DELETE(cancelRequest());
    expect(res.status).toBe(200);

    expect(mocks.razorpaySubscriptionsCancel).toHaveBeenCalledWith(
      "sub_active_cancel",
      true,
    );

    // Active cancel keeps status active until period end (no immediate cancel)
    const dbArgs = mocks.subscriptionUpdate.mock.calls[0][0];
    expect(dbArgs.data).toEqual(expect.objectContaining({ cancelAtPeriodEnd: true }));
    expect(dbArgs.data.status).toBeUndefined();
  });

  it("returns 404 when no active or trialing subscription exists", async () => {
    mocks.subscriptionFindFirst.mockResolvedValue(null);
    const res = await DELETE(cancelRequest());
    expect(res.status).toBe(404);
  });

  it("requires authentication", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const res = await DELETE(cancelRequest());
    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION GET — TRIAL INFO TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe("Razorpay Subscription GET — Trial Info", () => {
  let GET: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.getServerSession.mockResolvedValue({ user: { id: "user1" } });
    mocks.userFindUnique.mockResolvedValue({
      subscriptionTier: "free",
      subscriptionStatus: "inactive",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      razorpayCustomerId: null,
    });
    mocks.subscriptionFindFirst.mockResolvedValue(null);

    const mod = await import("../subscription/route");
    GET = mod.GET;
  });

  it("reports trialEligible true with a server-computed trial end estimate", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.trialEligible).toBe(true);
    expect(json.trialEndsAt).toBeTruthy();
    const end = new Date(json.trialEndsAt).getTime();
    expect(Math.abs(end - (Date.now() + 7 * 86400 * 1000))).toBeLessThan(60_000);
  });

  it("reports trialEligible false after a trial was used", async () => {
    mocks.subscriptionFindFirst.mockResolvedValue({
      id: "sub_used_trial",
      status: "cancelled",
      trialStartedAt: new Date(Date.now() - 86400 * 1000),
    });

    const res = await GET();
    const json = await res.json();
    expect(json.trialEligible).toBe(false);
    expect(json.trialEndsAt).toBeNull();
  });

  it("exposes trial fields on the subscription object", async () => {
    mocks.subscriptionFindFirst.mockResolvedValue({
      id: "db_sub_1",
      razorpaySubscriptionId: "sub_trial_info",
      tier: "Professional",
      status: "trialing",
      interval: "monthly",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 7 * 86400 * 1000),
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      trialStartedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 7 * 86400 * 1000),
      trialPaymentId: "pay_123",
      createdAt: new Date(),
    });

    const res = await GET();
    const json = await res.json();
    expect(json.subscription.trialEndsAt).toBeTruthy();
    expect(json.subscription.trialPaymentId).toBe("pay_123");
    expect(json.subscription.status).toBe("trialing");
  });
});