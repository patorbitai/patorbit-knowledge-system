import { NextRequest, NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";

/**
 * POST /api/create-order
 *
 * Creates a Razorpay order for Standard Checkout.
 * Body: { amount: number (paise), currency?: string, receipt?: string }
 *
 * Returns: { orderId, amount, currency, keyId }
 */
export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "INR", receipt } = (await req.json()) as {
      amount?: number;
      currency?: string;
      receipt?: string;
    };

    // Validate amount — minimum 100 paise (₹1)
    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: "Amount must be at least 100 paise (₹1)" },
        { status: 400 }
      );
    }

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: unknown) {
    console.error("[create-order] error:", error);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}
