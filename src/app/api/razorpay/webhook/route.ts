import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpay, verifyWebhookSignature } from "@/lib/razorpay";

/**
 * POST /api/razorpay/webhook
 *
 * Handles Razorpay webhook events for subscription lifecycle.
 * Events: subscription.activated, subscription.charged, subscription.cancelled,
 *         subscription.paused, subscription.resumed, subscription.completed
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify webhook signature
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not set");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Parse event
    const event = JSON.parse(body);
    const eventType = event.event as string;
    const payload = event.payload;

    console.log(`Razorpay webhook received: ${eventType}`);

    // 3. Handle subscription events
    switch (eventType) {
      case "subscription.activated": {
        const sub = payload.subscription?.entity;
        if (!sub) break;

        await prisma.subscription.update({
          where: { razorpaySubscriptionId: sub.id },
          data: {
            status: "active",
            razorpayPaymentId: payload.payment?.entity?.id,
            currentPeriodEnd: new Date(sub.current_end * 1000),
          },
        });

        // Update user subscription status
        const dbSub = await prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: sub.id },
        });
        if (dbSub) {
          await prisma.user.update({
            where: { id: dbSub.userId },
            data: {
              subscriptionTier: dbSub.tier,
              subscriptionStatus: "active",
              currentPeriodEnd: new Date(sub.current_end * 1000),
              cancelAtPeriodEnd: false,
            },
          });
        }
        break;
      }

      case "subscription.charged": {
        const sub2 = payload.subscription?.entity;
        if (!sub2) break;

        // Payment successful — extend period
        await prisma.subscription.update({
          where: { razorpaySubscriptionId: sub2.id },
          data: {
            status: "active",
            currentPeriodEnd: new Date(sub2.current_end * 1000),
          },
        });

        const dbSub2 = await prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: sub2.id },
        });
        if (dbSub2) {
          await prisma.user.update({
            where: { id: dbSub2.userId },
            data: {
              subscriptionStatus: "active",
              currentPeriodEnd: new Date(sub2.current_end * 1000),
            },
          });
        }
        break;
      }

      case "subscription.cancelled": {
        const sub3 = payload.subscription?.entity;
        if (!sub3) break;

        await prisma.subscription.update({
          where: { razorpaySubscriptionId: sub3.id },
          data: {
            status: "cancelled",
            cancelAtPeriodEnd: true,
            cancelledAt: new Date(),
          },
        });

        const dbSub3 = await prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: sub3.id },
        });
        if (dbSub3) {
          await prisma.user.update({
            where: { id: dbSub3.userId },
            data: {
              cancelAtPeriodEnd: true,
            },
          });
        }
        break;
      }

      case "subscription.completed":
      case "subscription.expired": {
        const sub4 = payload.subscription?.entity;
        if (!sub4) break;

        const newStatus = eventType === "subscription.completed" ? "expired" : "expired";

        await prisma.subscription.update({
          where: { razorpaySubscriptionId: sub4.id },
          data: {
            status: newStatus,
          },
        });

        const dbSub4 = await prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: sub4.id },
        });
        if (dbSub4) {
          await prisma.user.update({
            where: { id: dbSub4.userId },
            data: {
              subscriptionTier: "free",
              subscriptionStatus: "inactive",
            },
          });
        }
        break;
      }

      case "subscription.paused": {
        const sub5 = payload.subscription?.entity;
        if (!sub5) break;

        await prisma.subscription.update({
          where: { razorpaySubscriptionId: sub5.id },
          data: { status: "paused" },
        });
        break;
      }

      case "subscription.resumed": {
        const sub6 = payload.subscription?.entity;
        if (!sub6) break;

        await prisma.subscription.update({
          where: { razorpaySubscriptionId: sub6.id },
          data: {
            status: "active",
            currentPeriodEnd: new Date(sub6.current_end * 1000),
          },
        });
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
