"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { getStripePriceId, PLAN_PRICE_MAP } from "../stripe.service";

describe("EPIC-06 Phase 1: Stripe Subscription Foundation + Checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps application plans to correct Stripe price IDs server-side", () => {
    const proMonthly = getStripePriceId("Professional", "monthly");
    const proYearly = getStripePriceId("Professional", "yearly");
    const entMonthly = getStripePriceId("Enterprise", "monthly");

    expect(proMonthly).toBeDefined();
    expect(proYearly).toBeDefined();
    expect(entMonthly).toBeDefined();
    expect(proMonthly).not.toBe(proYearly);
  });

  it("throws error for invalid plan mapping", () => {
    expect(() => getStripePriceId("InvalidPlan", "monthly")).toThrow("Invalid plan");
  });

  it("server-side price mapping prevents client price override", () => {
    const planName = "Professional";
    const mappedPriceId = getStripePriceId(planName, "monthly");
    expect(mappedPriceId).toBe(PLAN_PRICE_MAP["Professional"].monthly);
  });
});
