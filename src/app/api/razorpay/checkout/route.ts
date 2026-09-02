import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpay, getPlanId, type PlanInterval } from "@/lib/razorpay";

/**
 * POST /api/razorpay/checkout
 *
 * Creates a Razorpay subscription for the authenticated user.
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
    const { interval } = (await req.json()) as { interval?: string };
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

    const razorpay = getRazorpay();
    let customerId = user.razorpayCustomerId;

    if (!customerId) {
      // Create new Razorpay customer
      const customer = await razorpay.customers.create({
        name: user.name,
        email: user.email,
      });
      customerId = customer.id;

      // Update user with customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { razorpayCustomerId: customerId },
      });
    }

    // 4. Get plan ID for the interval
    const planId = getPlanId(interval as PlanInterval);

    // 5. Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: interval === "yearly" ? 12 : 24, // months before auto-renewal
    });

    // 6. Store pending subscription in DB
    await prisma.subscription.create({
      data: {
        userId: user.id,
        razorpaySubscriptionId: subscription.id,
        razorpayPlanId: planId,
        razorpayCustomerId: customerId,
        tier: "professional",
        status: "pending",
        interval,
        currentPeriodStart: subscription.current_start ? new Date(subscription.current_start * 1000) : new Date(),
        currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // 7. Return subscription ID for frontend checkout
    return NextResponse.json({
      subscriptionId: subscription.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: unknown) {
    console.error("Razorpay checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
