import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/verify-payment
 *
 * Verifies Razorpay payment signature using HMAC-SHA256.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Returns: { verified: true } or error.
 */
export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      (await req.json()) as {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
      };

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature" },
        { status: 400 }
      );
    }

    // Verify signature: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay secret not configured" },
        { status: 500 }
      );
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment signature verification failed" },
        { status: 400 }
      );
    }

    // Signature verified — mark payment as successful
    // Store payment record in DB if needed
    console.log(`Payment verified: order=${razorpay_order_id}, payment=${razorpay_payment_id}`);

    return NextResponse.json({ verified: true });
  } catch (error: unknown) {
    console.error("Verify payment error:", error);
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
