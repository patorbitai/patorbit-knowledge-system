import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getRazorpay,
  getPlanId,
  type PlanInterval,
  TRIAL_AMOUNT_PAISE,
  getTrialStartAt,
  getTrialEndsAt,
  getTrialAddon,
} from "@/lib/razorpay";

/**
 * POST /api/razorpay/checkout
 *
 * Creates a Razorpay subscription for the authenticated user.
 *
 * When `trial: true` (and the user is eligible for the promotional ₹5 trial),
 * the subscription is created with a one-time ₹5 add-on and a `start_at`
 * 7 days in the future. Razorpay charges the ₹5 add-on during the checkout
 * authentication transaction; the subscription itself (and its first full
 * billing charge) starts automatically at `start_at`. The server remains the
 * source of truth: trial dates are computed server-side and never from the
 * browser.
 *
 * Returns the subscription ID for the frontend to open Razorpay checkout.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request
    const body = (await req.json()) as { interval?: string; trial?: boolean };
    const { interval } = body;
    const wantsTrial = body.trial !== false; // trial is the default for new checkouts
    if (interval !== "monthly" && interval !== "yearly") {
      return NextResponse.json(
        { error: "Invalid interval. Must be 'monthly' or 'yearly'." },
        { status: 400 }
      );
    }

    // 3. Get or create Razorpay customer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. Check for existing active subscription
    const existingSub = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: { in: ["active", "pending", "trialing"] },
      },
    });
    if (existingSub) {
      return NextResponse.json(
        { error: "You already have an active subscription. Manage it from your billing page." },
        { status: 409 }
      );
    }

    // 5. Trial eligibility — server-side, authoritative.
    // A user may use the ₹5 promotional trial only once. A "pending"
    // subscription (checkout abandoned before the add-on was authenticated)
    // does not consume the trial.
    if (wantsTrial) {
      const usedTrial = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          trialStartedAt: { not: null },
          NOT: { status: "pending" },
        },
      });
      if (usedTrial) {
        return NextResponse.json(
          {
            error: "You've already used your ₹5 trial. Subscribe at the regular price to continue.",
            code: "TRIAL_ALREADY_USED",
          },
          { status: 403 }
        );
      }
    }

    const razorpay = getRazorpay();
    let customerId = user.razorpayCustomerId;

    if (!customerId) {
      // Look up an existing Razorpay customer by email first. Razorpay's
      // customers list endpoint does not filter by email server-side, so fetch
      // recent customers and match the email in code. This reuses the existing
      // customer when one already exists for this email — Razorpay rejects
      // creating a duplicate ("Customer already exists for the merchant"),
      // which can happen when the user's DB row lost its razorpayCustomerId or
      // the customer was created earlier under this account.
      if (user.email) {
        const existing = await razorpay.customers.all({ count: 100 });
        const match = existing.items?.find(
          (c) => c.email?.toLowerCase() === user.email?.toLowerCase()
        );
        if (match) {
          customerId = match.id;
        }
      }

      // Create a new Razorpay customer only if none exists for this email
      if (!customerId) {
        const customer = await razorpay.customers.create({
          name: user.name,
          email: user.email,
        });
        customerId = customer.id;
      }

      // Persist the customer ID back to the user
      if (customerId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { razorpayCustomerId: customerId },
        });
      }
    }

    // 6. Get plan ID for the interval
    const planId = getPlanId(interval as PlanInterval);

    // 7. Create Razorpay subscription.
    // Trial: one-time ₹5 add-on + delayed start (7 days). The add-on is
    // charged during authentication; the plan's first recurring charge happens
    // automatically at start_at. No browser timers, no client-side scheduling.
    const now = new Date();
    const trialStartedAt = now;
    const trialEndsAt = getTrialEndsAt(trialStartedAt);

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: interval === "yearly" ? 12 : 24, // months before auto-renewal
      ...(wantsTrial
        ? {
            start_at: getTrialStartAt(now),
            addons: getTrialAddon(),
          }
        : {}),
    });

    // 8. Store pending subscription in DB
    await prisma.subscription.create({
      data: {
        userId: user.id,
        razorpaySubscriptionId: subscription.id,
        razorpayPlanId: planId,
        razorpayCustomerId: customerId,
        tier: "Professional",
        status: "pending",
        interval,
        currentPeriodStart: subscription.current_start ? new Date(subscription.current_start * 1000) : new Date(),
        currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialStartedAt: wantsTrial ? trialStartedAt : null,
        trialEndsAt: wantsTrial ? trialEndsAt : null,
      },
    });

    // 9. Return subscription ID for frontend checkout
    return NextResponse.json({
      subscriptionId: subscription.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      trial: wantsTrial
        ? {
            amountPaise: TRIAL_AMOUNT_PAISE,
            startedAt: trialStartedAt.toISOString(),
            endsAt: trialEndsAt.toISOString(),
          }
        : null,
    });
  } catch (error: unknown) {
    console.error("[razorpay-checkout] error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription. Please try again." },
      { status: 500 }
    );
  }
}