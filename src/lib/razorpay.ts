import Razorpay from "razorpay";
import crypto from "crypto";

// ─── Plan IDs (configured in Razorpay Dashboard) ──────────────

export const RAZORPAY_PLANS = {
  professional_monthly: process.env.RAZORPAY_PLAN_PROFESSIONAL_MONTHLY || "",
  professional_yearly: process.env.RAZORPAY_PLAN_PROFESSIONAL_YEARLY || "",
} as const;

export type PlanInterval = "monthly" | "yearly";
export type SubscriptionTier = "free" | "professional" | "enterprise";

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
