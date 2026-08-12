"use strict";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, getStripePriceId } from "@/services/stripe.service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured on this server" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { plan, interval = "monthly" } = body;

    if (!plan || (plan.toLowerCase() !== "professional" && plan.toLowerCase() !== "enterprise")) {
      return NextResponse.json({ error: "Invalid plan specified" }, { status: 400 });
    }

    const priceId = getStripePriceId(plan, interval);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${protocol}://${host}/settings?checkout=success`,
      cancel_url: `${protocol}://${host}/pricing?checkout=cancelled`,
      metadata: {
        userId: user.id,
        plan: plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase(),
      },
    });

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
