import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpay, getTrialEndsAt } from "@/lib/razorpay";

/**
 * GET /api/razorpay/subscription
 * Returns the user's current subscription status.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        razorpayCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Server-side trial eligibility: the ₹5 trial may be used once, and only
    // if no trial has actually started before (pending/abandoned checkouts
    // don't consume it).
    const usedTrial = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        trialStartedAt: { not: null },
        NOT: { status: "pending" },
      },
    });
    const trialEligible = !usedTrial;

    // Server-computed display estimate for the modal (now + 7 days). The
    // authoritative trialEndsAt is created server-side at checkout time.
    const trialEndsAtEstimate = trialEligible ? getTrialEndsAt().toISOString() : null;

    // Get latest active subscription details
    const subscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        razorpaySubscriptionId: true,
        tier: true,
        status: true,
        interval: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        cancelledAt: true,
        trialStartedAt: true,
        trialEndsAt: true,
        trialPaymentId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      trialEligible,
      trialEndsAt: trialEndsAtEstimate,
      subscription,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/razorpay/subscription
 * Cancels the user's active subscription at period end.
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["active", "trialing"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const isTrial = subscription.status === "trialing";

    // Cancel via Razorpay API.
    // Trial: cancel immediately (cancel_at_cycle_end=false). An authenticated
    // trial subscription has no active billing cycle yet, so Razorpay rejects
    // an at-cycle-end cancel ("no billing cycle is going on"). Immediate
    // cancel means the trial never converts to normal billing; the user keeps
    // paid access until trialEndsAt (enforced by the entitlement service).
    // Paid subscription: cancel at period end as before.
    const razorpay = getRazorpay();
    await razorpay.subscriptions.cancel(
      subscription.razorpaySubscriptionId,
      !isTrial, // atCycleEnd = false for trial, true for paid
    );

    // Update local DB
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        ...(isTrial ? { status: "cancelled", cancelledAt: new Date() } : {}),
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({
      message: isTrial
        ? "Trial cancelled — you'll keep access until your trial ends, and you won't be charged after."
        : "Subscription will be cancelled at the end of the billing period",
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
