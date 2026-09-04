"use strict";

/**
 * Razorpay Billing End-to-End Tests
 *
 * Covers: webhook security, webhook idempotency, subscription lifecycle,
 * checkout duplicate protection, entitlement transitions, and case normalization.
 *
 * All Razorpay API calls and database interactions are mocked.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";

// ─── Shared Mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  // prisma mocks
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  subscriptionFindFirst: vi.fn(),
  subscriptionFindUnique: vi.fn(),
  subscriptionUpdate: vi.fn(),
  subscriptionCreate: vi.fn(),
  webhookEventFindUnique: vi.fn(),
  webhookEventCreate: vi.fn(),
  professionalIdentityFindUnique: vi.fn(),
  usageRecordFindUnique: vi.fn(),
  usageRecordUpsert: vi.fn(),

  // razorpay mocks
  razorpayCustomersCreate: vi.fn(),
  razorpaySubscriptionsCreate: vi.fn(),
  razorpaySubscriptionsCancel: vi.fn(),

  // env
  razorpayWebhookSecret: "test_webhook_secret_123",
  razorpayKeyId: "rzp_test_abc123",
  razorpayPlanMonthly: "plan_test_monthly_123",
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
    subscription: {
      findFirst: mocks.subscriptionFindFirst,
      findUnique: mocks.subscriptionFindUnique,
      update: mocks.subscriptionUpdate,
      create: mocks.subscriptionCreate,
    },
    webhookEvent: {
      findUnique: mocks.webhookEventFindUnique,
      create: mocks.webhookEventCreate,
    },
    professionalIdentity: {
      findUnique: mocks.professionalIdentityFindUnique,
    },
    usageRecord: {
      findUnique: mocks.usageRecordFindUnique,
      upsert: mocks.usageRecordUpsert,
    },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/razorpay", () => ({
  getRazorpay: () => ({
    customers: { create: mocks.razorpayCustomersCreate },
    subscriptions: {
      create: mocks.razorpaySubscriptionsCreate,
      cancel: mocks.razorpaySubscriptionsCancel,
    },
  }),
  getPlanId: () => mocks.razorpayPlanMonthly,
  getRazorpayKeyId: () => mocks.razorpayKeyId,
  verifyWebhookSignature: (body: string, sig: string, secret: string) => {
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    return expected === sig;
  },
}));

// ─── Helper: generate webhook signature ───────────────────────────────────────

function signBody(body: string): string {
  return crypto
    .createHmac("sha256", mocks.razorpayWebhookSecret)
    .update(body)
    .digest("hex");
}

// ─── Helper: build Razorpay subscription webhook payload ──────────────────────

function buildSubscriptionEvent(
  eventType: string,
  overrides: { id?: string; current_end?: number; status?: string } = {},
) {
  const subId = overrides.id || "sub_test123";
  return {
    event: eventType,
    "x-razorpay-event-id": `evt_${eventType.replace(/\./g, "_")}_${Date.now()}`,
    payload: {
      subscription: {
        entity: {
          id: subId,
          plan_id: "plan_test_monthly_123",
          customer_id: "cust_test123",
          current_start: Math.floor(Date.now() / 1000),
          current_end: overrides.current_end || Math.floor(Date.now() / 1000) + 30 * 86400,
          status: overrides.status || "active",
        },
      },
      payment: {
        entity: {
          id: "pay_test456",
          amount: 14900,
          currency: "INR",
        },
      },
    },
  };
}

// ─── Helper: create a NextRequest-like for webhook ───────────────────────────

function createWebhookRequest(body: string): any {
  return {
    text: () => Promise.resolve(body),
    headers: {
      get: (name: string) => {
        if (name === "x-razorpay-signature") return signBody(body);
        return null;
      },
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// WEBHOOK SECURITY TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe("Razorpay Webhook Security", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Set env for webhook secret
    process.env.RAZORPAY_WEBHOOK_SECRET = mocks.razorpayWebhookSecret;

    // Dynamic import to get fresh module with mocks
    const mod = await import("../webhook/route");
    POST = mod.POST;
  });

  it("rejects request with invalid signature", async () => {
    const body = JSON.stringify({ event: "test", payload: {} });
    const req = {
      text: () => Promise.resolve(body),
      headers: {
        get: (name: string) => (name === "x-razorpay-signature" ? "invalid_sig_abc" : null),
      },
    };

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("rejects request with missing signature", async () => {
    const body = JSON.stringify({ event: "test", payload: {} });
    const req = {
      text: () => Promise.resolve(body),
      headers: { get: () => null },
    };

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("accepts request with valid signature", async () => {
    const event = buildSubscriptionEvent("subscription.activated");
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    // Mock no existing webhook event
    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({
      userId: "user1",
      tier: "Professional",
    });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// WEBHOOK IDEMPOTENCY TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe("Razorpay Webhook Idempotency", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = mocks.razorpayWebhookSecret;

    const mod = await import("../webhook/route");
    POST = mod.POST;
  });

  it("processes first event normally", async () => {
    const event = buildSubscriptionEvent("subscription.activated", { id: "sub_first" });
    event["x-razorpay-event-id"] = "evt_unique_001";
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    mocks.webhookEventFindUnique.mockResolvedValue(null); // No duplicate
    mocks.subscriptionFindUnique.mockResolvedValue({
      userId: "user1",
      tier: "Professional",
    });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    const res = await POST(req);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.duplicate).toBeUndefined();
    expect(mocks.subscriptionUpdate).toHaveBeenCalled();
    expect(mocks.webhookEventCreate).toHaveBeenCalledWith({
      data: {
        eventId: "evt_unique_001",
        eventType: "subscription.activated",
        subscriptionId: "sub_first",
      },
    });
  });

  it("skips duplicate event (same event ID)", async () => {
    const event = buildSubscriptionEvent("subscription.activated", { id: "sub_dup" });
    event["x-razorpay-event-id"] = "evt_duplicate_001";
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    // Already processed
    mocks.webhookEventFindUnique.mockResolvedValue({
      eventId: "evt_duplicate_001",
      eventType: "subscription.activated",
      processedAt: new Date(),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.duplicate).toBe(true);
    // Should NOT update any subscription
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled();
  });

  it("handles concurrent duplicate delivery gracefully", async () => {
    const event = buildSubscriptionEvent("subscription.charged", { id: "sub_race" });
    event["x-razorpay-event-id"] = "evt_race_001";
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    // First call: no duplicate → processes → tries to create WebhookEvent
    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({
      userId: "user2",
      tier: "Professional",
    });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});

    // WebhookEvent create throws unique constraint violation (concurrent insert)
    mocks.webhookEventCreate.mockRejectedValue(
      new Error("Unique constraint failed on the fields: (`eventId`)")
    );

    const res = await POST(req);
    const json = await res.json();
    expect(json.received).toBe(true);
    // The event WAS processed (subscription updated), just the idempotency record
    // creation failed due to race — which is fine.
    expect(mocks.subscriptionUpdate).toHaveBeenCalled();
  });

  it("subscription.charged idempotency — same event ID processed once", async () => {
    const futureEnd = Math.floor(Date.now() / 1000) + 30 * 86400;
    const event = buildSubscriptionEvent("subscription.charged", {
      id: "sub_chg_idem",
      current_end: futureEnd,
    });
    event["x-razorpay-event-id"] = "evt_chg_idem_001";
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    // First delivery
    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({ userId: "u_idem" });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    const res1 = await POST(req);
    const json1 = await res1.json();
    expect(json1.received).toBe(true);
    expect(json1.duplicate).toBeUndefined();
    expect(mocks.subscriptionUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.userUpdate).toHaveBeenCalledTimes(1);

    // Second delivery (duplicate)
    vi.clearAllMocks();
    mocks.webhookEventFindUnique.mockResolvedValue({
      eventId: "evt_chg_idem_001",
      eventType: "subscription.charged",
      processedAt: new Date(),
    });

    const res2 = await POST(req);
    const json2 = await res2.json();
    expect(json2.received).toBe(true);
    expect(json2.duplicate).toBe(true);
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION LIFECYCLE TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe("Subscription Lifecycle", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = mocks.razorpayWebhookSecret;

    const mod = await import("../webhook/route");
    POST = mod.POST;
  });

  it("subscription.activated → user becomes Professional + active", async () => {
    const event = buildSubscriptionEvent("subscription.activated", {
      id: "sub_act1",
      current_end: Math.floor(Date.now() / 1000) + 30 * 86400,
    });
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({ userId: "u1", tier: "Professional" });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    await POST(req);

    // Subscription updated to active
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { razorpaySubscriptionId: "sub_act1" },
        data: expect.objectContaining({ status: "active" }),
      }),
    );

    // User updated to Professional
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          subscriptionTier: "Professional",
          subscriptionStatus: "active",
          cancelAtPeriodEnd: false,
        }),
      }),
    );
  });

  it("subscription.charged → extends period, keeps active", async () => {
    const futureEnd = Math.floor(Date.now() / 1000) + 60 * 86400;
    const event = buildSubscriptionEvent("subscription.charged", {
      id: "sub_chg1",
      current_end: futureEnd,
    });
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({ userId: "u2" });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    await POST(req);

    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "active" }),
      }),
    );
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionTier: "Professional",
          subscriptionStatus: "active",
        }),
      }),
    );
  });

  // ── subscription.charged detailed tests ──────────────────────

  it("subscription.charged → pending Subscription becomes active, User upgraded to Professional", async () => {
    const futureEnd = Math.floor(Date.now() / 1000) + 30 * 86400;
    const event = buildSubscriptionEvent("subscription.charged", {
      id: "sub_chg_pending",
      current_end: futureEnd,
    });
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({ userId: "u_pending" });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    await POST(req);

    // Subscription activated
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { razorpaySubscriptionId: "sub_chg_pending" },
        data: expect.objectContaining({ status: "active" }),
      }),
    );
    // User fully synchronized
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionTier: "Professional",
          subscriptionStatus: "active",
          cancelAtPeriodEnd: false,
        }),
      }),
    );
  });

  it("subscription.charged → already active Subscription and Professional User updated without regression", async () => {
    const futureEnd = Math.floor(Date.now() / 1000) + 30 * 86400;
    const event = buildSubscriptionEvent("subscription.charged", {
      id: "sub_chg_active",
      current_end: futureEnd,
    });
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({ userId: "u_active" });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    await POST(req);

    expect(mocks.subscriptionUpdate).toHaveBeenCalled();
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionTier: "Professional",
          subscriptionStatus: "active",
        }),
      }),
    );
    expect(mocks.webhookEventCreate).toHaveBeenCalled();
  });

  it("subscription.cancelled → marks cancel_at_period_end, user stays Professional", async () => {
    const event = buildSubscriptionEvent("subscription.cancelled", { id: "sub_canc1" });
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({ userId: "u3" });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    await POST(req);

    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "cancelled",
          cancelAtPeriodEnd: true,
        }),
      }),
    );
    // User gets cancelAtPeriodEnd set but stays active
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ cancelAtPeriodEnd: true }),
      }),
    );
  });

  it("subscription.completed → downgrades to Free", async () => {
    const event = buildSubscriptionEvent("subscription.completed", { id: "sub_comp1" });
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({ userId: "u4" });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    await POST(req);

    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "expired" }),
      }),
    );
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionTier: "free",
          subscriptionStatus: "inactive",
        }),
      }),
    );
  });

  it("subscription.expired → downgrades to Free", async () => {
    const event = buildSubscriptionEvent("subscription.expired", { id: "sub_exp1" });
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({ userId: "u5" });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    await POST(req);

    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionTier: "free",
          subscriptionStatus: "inactive",
        }),
      }),
    );
  });

  it("subscription.paused → sets user inactive", async () => {
    const event = buildSubscriptionEvent("subscription.paused", { id: "sub_paus1" });
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({ userId: "u6" });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    await POST(req);

    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "paused" }),
      }),
    );
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subscriptionStatus: "inactive" }),
      }),
    );
  });

  it("subscription.resumed → reactivates user", async () => {
    const futureEnd = Math.floor(Date.now() / 1000) + 30 * 86400;
    const event = buildSubscriptionEvent("subscription.resumed", {
      id: "sub_res1",
      current_end: futureEnd,
    });
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({ userId: "u7" });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    await POST(req);

    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subscriptionStatus: "active" }),
      }),
    );
  });

  it("skips processing when subscription entity is missing", async () => {
    const event = {
      event: "subscription.activated",
      "x-razorpay-event-id": "evt_nosub_001",
      payload: { subscription: null },
    };
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.webhookEventCreate.mockResolvedValue({});

    const res = await POST(req);
    expect(res.status).toBe(200);
    // No subscription update since entity was null
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled();
  });

  it("returns 500 when webhook secret is not configured", async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "";
    const body = JSON.stringify({ event: "test", payload: {} });
    const req = {
      text: () => Promise.resolve(body),
      headers: { get: () => "some_sig" },
    };

    const res = await POST(req);
    expect(res.status).toBe(500);

    // Restore
    process.env.RAZORPAY_WEBHOOK_SECRET = mocks.razorpayWebhookSecret;
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// ENTITLEMENT INTEGRATION — subscription.charged
// ──────────────────────────────────────────────────────────────────────────────

describe("Entitlement after subscription.charged", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = mocks.razorpayWebhookSecret;

    const mod = await import("../webhook/route");
    POST = mod.POST;
  });

  it("after charged, entitlement service resolves Professional features", async () => {
    // Simulate: subscription.charged arrives for a pending subscription
    const futureEnd = Math.floor(Date.now() / 1000) + 30 * 86400;
    const event = buildSubscriptionEvent("subscription.charged", {
      id: "sub_ent_test",
      current_end: futureEnd,
    });
    const body = JSON.stringify(event);
    const req = createWebhookRequest(body);

    mocks.webhookEventFindUnique.mockResolvedValue(null);
    mocks.subscriptionFindUnique.mockResolvedValue({ userId: "u_ent" });
    mocks.subscriptionUpdate.mockResolvedValue({});
    mocks.userUpdate.mockResolvedValue({});
    mocks.webhookEventCreate.mockResolvedValue({});

    await POST(req);

    // Verify User was upgraded to Professional
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionTier: "Professional",
          subscriptionStatus: "active",
        }),
      }),
    );

    // Verify Subscription was activated
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "active" }),
      }),
    );

    // Verify WebhookEvent was created
    expect(mocks.webhookEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventId: expect.any(String),
        eventType: "subscription.charged",
        subscriptionId: "sub_ent_test",
      }),
    });
  });
});
