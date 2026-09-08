import Razorpay from "razorpay";
import crypto from "crypto";

// ─── Plan IDs (configured in Razorpay Dashboard) ──────────────

export const RAZORPAY_PLANS = {
  professional_monthly: process.env.RAZORPAY_PLAN_PROFESSIONAL_MONTHLY || "",
  professional_yearly: process.env.RAZORPAY_PLAN_PROFESSIONAL_YEARLY || "",
} as const;

export type PlanInterval = "monthly" | "yearly";
export type SubscriptionTier = "free" | "professional" | "enterprise";

// ─── ₹5 Promotional Trial ───────────────────────────────────────
// The trial uses Razorpay's documented "Subscription with a Trial Period"
// pattern: a one-time add-on (₹5) is charged when the subscription is
// authenticated, and the subscription itself starts billing at start_at
// (7 days later). All amounts are in paise.

export const TRIAL_AMOUNT_PAISE = 500; // ₹5

export const TRIAL_DURATION_DAYS = 7;

/**
 * Compute the Razorpay `start_at` unix timestamp for a trial subscription
 * (now + 7 days, server-side).
 */
export function getTrialStartAt(now: Date = new Date()): number {
  return Math.floor(now.getTime() / 1000) + TRIAL_DURATION_DAYS * 24 * 60 * 60;
}

/**
 * Compute the server-authoritative trial end date (start + 7 days).
 */
export function getTrialEndsAt(startedAt: Date = new Date()): Date {
  return new Date(
    startedAt.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );
}

/**
 * Razorpay add-on item that charges the ₹5 trial fee as part of the
 * subscription authentication transaction.
 */
export function getTrialAddon() {
  return [
    {
      item: {
        name: "7-day trial fee",
        amount: TRIAL_AMOUNT_PAISE,
        currency: "INR",
      },
    },
  ];
}

// ─── Server-side Razorpay client ─────────────────────────────

let _razorpay: InstanceType<typeof Razorpay> | null = null;

export function getRazorpay(): InstanceType<typeof Razorpay> {
  if (_razorpay) return _razorpay;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
    );
  }

  _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return _razorpay;
}

// ─── Helpers ─────────────────────────────────────────────────

export function getRazorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) throw new Error("RAZORPAY_KEY_ID not set");
  return keyId;
}

export function getPlanId(interval: PlanInterval): string {
  const planId =
    interval === "yearly"
      ? RAZORPAY_PLANS.professional_yearly
      : RAZORPAY_PLANS.professional_monthly;
  if (!planId) {
    throw new Error(
      `Razorpay plan ID not configured for ${interval}. Set RAZORPAY_PLAN_PROFESSIONAL_${interval.toUpperCase()} in .env`
    );
  }
  return planId;
}

/**
 * Verify Razorpay webhook signature.
 */
export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}
