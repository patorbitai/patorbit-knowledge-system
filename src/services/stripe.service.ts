"use strict";

import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia" as any,
      typescript: true,
    })
  : null;

export const PLAN_PRICE_MAP: Record<string, { monthly?: string; yearly?: string }> = {
  Professional: {
    monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || "price_pro_monthly_mock",
    yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || "price_pro_yearly_mock",
  },
  Enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "price_ent_monthly_mock",
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || "price_ent_yearly_mock",
  },
};

export function getStripePriceId(plan: string, interval: "monthly" | "yearly" = "monthly"): string {
  const normalizedPlan = plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
  const planPrices = PLAN_PRICE_MAP[normalizedPlan];
  if (!planPrices) {
    throw new Error(`Invalid plan: ${plan}`);
  }
  const priceId = interval === "yearly" ? planPrices.yearly : planPrices.monthly;
  if (!priceId) {
    throw new Error(`Price ID not configured for plan ${normalizedPlan} (${interval})`);
  }
  return priceId;
}
