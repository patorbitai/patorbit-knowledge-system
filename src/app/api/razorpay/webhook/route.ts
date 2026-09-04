import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * POST /api/razorpay/webhook
 *
 * Handles Razorpay webhook events for subscription lifecycle.
 * Uses the WebhookEvent table for idempotency — each Razorpay event ID
 * is processed exactly once even if delivered multiple times.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify webhook signature (must use raw body, not parsed JSON)
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Parse event
    const event = JSON.parse(body);
    const eventType = event.event as string;
    const eventId = event["x-razorpay-event-id"] as string | undefined;
    const payload = event.payload;

    console.log(`Razorpay webhook received: ${eventType} (event: ${eventId})`);

    // 3. Idempotency: check if this event was already processed
    if (eventId) {
      const existing = await prisma.webhookEvent.findUnique({
        where: { eventId },
      });
      if (existing) {
        console.log(`Duplicate webhook event ${eventId} — skipping`);
        return NextResponse.json({ received: true, duplicate: true });
      }
    }

    // 4. Extract subscription entity from payload
    const subEntity = payload.subscription?.entity;
    const paymentEntity = payload.payment?.entity;
    const subId = subEntity?.id as string | undefined;

    // 5. Handle subscription events
    switch (eventType) {
      case "subscription.activated": {
        if (!subId) break;

        await prisma.subscription.update({
          where: { razorpaySubscriptionId: subId },
          data: {
            status: "active",
            razorpayPaymentId: paymentEntity?.id || undefined,
            currentPeriodEnd: subEntity?.current_end
              ? new Date(subEntity.current_end * 1000)
              : undefined,
          },
        });

        // Update user entitlement
        const dbSub = await prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: subId },
        });
        if (dbSub) {
          await prisma.user.update({
            where: { id: dbSub.userId },
            data: {
              subscriptionTier: "Professional",
              subscriptionStatus: "active",
              currentPeriodEnd: subEntity?.current_end
                ? new Date(subEntity.current_end * 1000)
                : undefined,
              cancelAtPeriodEnd: false,
            },
          });
        }
        break;
      }

      case "subscription.charged": {
        if (!subId) break;

        // Payment successful — extend the subscription period.
        // Do NOT downgrade here; "charged" means the renewal payment succeeded.
        await prisma.subscription.update({
          where: { razorpaySubscriptionId: subId },
          data: {
            status: "active",
            razorpayPaymentId: paymentEntity?.id || undefined,
            currentPeriodEnd: subEntity?.current_end
              ? new Date(subEntity.current_end * 1000)
              : undefined,
          },
        });

        const dbSub2 = await prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: subId },
        });
        if (dbSub2) {
          await prisma.user.update({
            where: { id: dbSub2.userId },
            data: {
              subscriptionStatus: "active",
              currentPeriodEnd: subEntity?.current_end
                ? new Date(subEntity.current_end * 1000)
                : undefined,
            },
          });
        }
        break;
      }

      case "subscription.cancelled": {
        if (!subId) break;

        // User or admin scheduled cancellation.
        // The subscription remains active until the current period ends.
        await prisma.subscription.update({
          where: { razorpaySubscriptionId: subId },
          data: {
            status: "cancelled",
            cancelAtPeriodEnd: true,
            cancelledAt: new Date(),
          },
        });

        const dbSub3 = await prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: subId },
        });
        if (dbSub3) {
          await prisma.user.update({
            where: { id: dbSub3.userId },
            data: { cancelAtPeriodEnd: true },
          });
        }
        break;
      }

      case "subscription.completed": {
        // "completed" means the subscription has run through ALL its billing
        // cycles (total_count reached) without cancellation. The subscription
        // is now expired/ended. Downgrade to Free.
        if (!subId) break;

        await prisma.subscription.update({
          where: { razorpaySubscriptionId: subId },
          data: { status: "expired" },
        });

        const dbSub4 = await prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: subId },
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

      case "subscription.expired": {
        if (!subId) break;

        await prisma.subscription.update({
          where: { razorpaySubscriptionId: subId },
          data: { status: "expired" },
        });

        const dbSub5 = await prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: subId },
        });
        if (dbSub5) {
          await prisma.user.update({
            where: { id: dbSub5.userId },
            data: {
              subscriptionTier: "free",
              subscriptionStatus: "inactive",
            },
          });
        }
        break;
      }

      case "subscription.paused": {
        if (!subId) break;

        await prisma.subscription.update({
          where: { razorpaySubscriptionId: subId },
          data: { status: "paused" },
        });

        const dbSub6 = await prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: subId },
        });
        if (dbSub6) {
          await prisma.user.update({
            where: { id: dbSub6.userId },
            data: { subscriptionStatus: "inactive" },
          });
        }
        break;
      }

      case "subscription.resumed": {
        if (!subId) break;

        await prisma.subscription.update({
          where: { razorpaySubscriptionId: subId },
          data: {
            status: "active",
            currentPeriodEnd: subEntity?.current_end
              ? new Date(subEntity.current_end * 1000)
              : undefined,
          },
        });

        const dbSub7 = await prisma.subscription.findUnique({
          where: { razorpaySubscriptionId: subId },
        });
        if (dbSub7) {
          await prisma.user.update({
            where: { id: dbSub7.userId },
            data: {
              subscriptionStatus: "active",
              currentPeriodEnd: subEntity?.current_end
                ? new Date(subEntity.current_end * 1000)
                : undefined,
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    // 6. Record processed event for idempotency
    if (eventId) {
      try {
        await prisma.webhookEvent.create({
          data: {
            eventId,
            eventType,
            subscriptionId: subId || null,
          },
        });
      } catch (err) {
        // Race condition: another request already recorded this event.
        // This is safe — the event was already processed.
        console.log(`WebhookEvent already recorded for ${eventId} (concurrent delivery)`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
