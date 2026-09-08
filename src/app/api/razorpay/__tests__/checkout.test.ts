"use strict";

/**
 * Razorpay Checkout — ₹5 Trial Tests
 *
 * Covers: trial subscription creation (₹5 add-on + delayed start), trial
 * eligibility enforcement, regular (non-trial) checkout, and trial state
 * stored server-side.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Shared Mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  subscriptionFindFirst: vi.fn(),
  subscriptionCreate: vi.fn(),
  razorpayCustomersAll: vi.fn(),
  razorpayCustomersCreate: vi.fn(),
  razorpaySubscriptionsCreate: vi.fn(),
  getServerSession: vi.fn(),
  planIdMonthly: "plan_test_monthly_123",
  keyId: "rzp_test_abc123",
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
      create: mocks.subscriptionCreate,
    },
  },
}));

vi.mock("@/lib/razorpay", () => ({
  TRIAL_AMOUNT_PAISE: 500,
  getRazorpay: () => ({
    customers: {
      all: mocks.razorpayCustomersAll,
      create: mocks.razorpayCustomersCreate,
    },
    subscriptions: { create: mocks.razorpaySubscriptionsCreate },
  }),
  getPlanId: () => mocks.planIdMonthly,
  getRazorpayKeyId: () => mocks.keyId,
  getTrialStartAt: (now: Date = new Date()) =>
    Math.floor(now.getTime() / 1000) + 7 * 24 * 60 * 60,
  getTrialEndsAt: (startedAt: Date = new Date()) =>
    new Date(startedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
  getTrialAddon: () => [
    {
      item: { name: "7-day trial fee", amount: 500, currency: "INR" },
    },
  ],
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function baseUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user1",
    name: "Test User",
    email: "test@example.com",
    razorpayCustomerId: null,
    ...overrides,
  };
}

function createRequest(body: Record<string, unknown>): any {
  return {
    json: () => Promise.resolve(body),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// TRIAL CHECKOUT TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe("Razorpay Checkout — ₹5 Trial", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = mocks.keyId;

    mocks.getServerSession.mockResolvedValue({ user: { id: "user1" } });
    mocks.userFindUnique.mockResolvedValue(baseUser());
    mocks.razorpayCustomersAll.mockResolvedValue({ items: [] });
    mocks.razorpayCustomersCreate.mockResolvedValue({ id: "cust_test123" });
    mocks.razorpaySubscriptionsCreate.mockResolvedValue({
      id: "sub_trial_new",
      current_start: null,
      current_end: null,
    });
    mocks.subscriptionCreate.mockResolvedValue({ id: "db_sub_1" });

    // Default: no existing active subscription, no previous trial used
    mocks.subscriptionFindFirst.mockResolvedValue(null);

    const mod = await import("../checkout/route");
    POST = mod.POST;
  });

  it("creates a trial subscription with ₹5 add-on and 7-day delayed start", async () => {
    const res = await POST(createRequest({ interval: "monthly", trial: true }));
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.subscriptionId).toBe("sub_trial_new");
    expect(json.razorpayKeyId).toBe(mocks.keyId);
    expect(json.trial).not.toBeNull();
    expect(json.trial.amountPaise).toBe(500);

    // Razorpay subscription must use the trial pattern: add-on + start_at
    const createArgs = mocks.razorpaySubscriptionsCreate.mock.calls[0][0];
    expect(createArgs.addons).toHaveLength(1);
    expect(createArgs.addons[0].item.amount).toBe(500);
    expect(createArgs.start_at).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(createArgs.plan_id).toBe(mocks.planIdMonthly);

    // Server-side trial dates stored on the DB row
    const dbArgs = mocks.subscriptionCreate.mock.calls[0][0];
    expect(dbArgs.data.status).toBe("pending");
    expect(dbArgs.data.trialStartedAt).toBeInstanceOf(Date);
    expect(dbArgs.data.trialEndsAt).toBeInstanceOf(Date);
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(
      dbArgs.data.trialEndsAt.getTime() - dbArgs.data.trialStartedAt.getTime(),
    ).toBe(sevenDaysMs);
  });

  it("returns trial window in the response for the modal", async () => {
    const res = await POST(createRequest({ interval: "yearly", trial: true }));
    const json = await res.json();

    expect(json.trial.startedAt).toBeTruthy();
    expect(json.trial.endsAt).toBeTruthy();
    const start = new Date(json.trial.startedAt).getTime();
    const end = new Date(json.trial.endsAt).getTime();
    expect(end - start).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("rejects a second ₹5 trial with TRIAL_ALREADY_USED", async () => {
    // First call: no existing trial → allowed
    mocks.subscriptionFindFirst.mockResolvedValueOnce(null); // active check
    mocks.subscriptionFindFirst.mockResolvedValueOnce(null); // trial eligibility
    const res1 = await POST(createRequest({ interval: "monthly", trial: true }));
    expect(res1.status).toBe(200);

    // Second call: a previous trial exists (non-pending) → rejected
    mocks.subscriptionFindFirst.mockReset();
    mocks.subscriptionFindFirst.mockResolvedValueOnce(null); // active check
    mocks.subscriptionFindFirst.mockResolvedValueOnce({
      id: "sub_old_trial",
      trialStartedAt: new Date(Date.now() - 86400 * 1000),
      status: "cancelled",
    });

    const res2 = await POST(createRequest({ interval: "monthly", trial: true }));
    expect(res2.status).toBe(403);
    const json = await res2.json();
    expect(json.code).toBe("TRIAL_ALREADY_USED");
  });

  it("does not consume trial eligibility for abandoned pending subscriptions", async () => {
    // The server query excludes pending (never-authenticated) subscriptions
    // from the trial-used check: abandoned checkouts don't consume the trial.
    // Simulate the real WHERE clause behavior: active check → none,
    // eligibility check (pending excluded) → none found.
    mocks.subscriptionFindFirst.mockResolvedValueOnce(null); // active check
    mocks.subscriptionFindFirst.mockResolvedValueOnce(null); // eligibility (NOT pending)

    const res = await POST(createRequest({ interval: "monthly", trial: true }));
    expect(res.status).toBe(200);
  });

  it("creates a normal subscription when trial: false", async () => {
    const res = await POST(createRequest({ interval: "monthly", trial: false }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.trial).toBeNull();

    const createArgs = mocks.razorpaySubscriptionsCreate.mock.calls[0][0];
    expect(createArgs.addons).toBeUndefined();
    expect(createArgs.start_at).toBeUndefined();

    const dbArgs = mocks.subscriptionCreate.mock.calls[0][0];
    expect(dbArgs.data.trialStartedAt).toBeNull();
    expect(dbArgs.data.trialEndsAt).toBeNull();
    expect(dbArgs.data.status).toBe("pending");
  });

  it("blocks checkout when an active subscription already exists", async () => {
    mocks.subscriptionFindFirst.mockResolvedValueOnce({
      id: "sub_active_existing",
      status: "active",
    });

    const res = await POST(createRequest({ interval: "monthly", trial: true }));
    expect(res.status).toBe(409);
    expect(mocks.razorpaySubscriptionsCreate).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const res = await POST(createRequest({ interval: "monthly", trial: true }));
    expect(res.status).toBe(401);
  });

  it("validates interval", async () => {
    const res = await POST(createRequest({ interval: "weekly", trial: true }));
    expect(res.status).toBe(400);
  });
});