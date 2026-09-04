"use client";

import { useState, useCallback } from "react";

/* Note: Window.Razorpay global type is declared in billing/page.tsx */

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface CheckoutButtonProps {
  /** Amount in paise (e.g. 14900 for ₹149) */
  amount: number;
  /** Currency code */
  currency?: string;
  /** Product name shown in Razorpay modal */
  name?: string;
  /** Description shown in Razorpay modal */
  description?: string;
  /** Button label */
  label?: string;
  /** CSS classes for the button */
  className?: string;
  /** Called on successful payment verification */
  onSuccess?: (response: RazorpayResponse) => void;
  /** Called on payment failure or dismissal */
  onError?: (error: string) => void;
}

export default function CheckoutButton({
  amount,
  currency = "INR",
  name = "Patorbit",
  description = "Patorbit Professional Plan",
  label = "Pay Now",
  className = "",
  onSuccess,
  onError,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const handleCheckout = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay checkout script");
      }

      // 2. Create order on server
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create order");
      }

      const { orderId, keyId } = await res.json();

      // 3. Open Razorpay modal
      const options: RazorpayOptions = {
        key: keyId,
        amount,
        currency,
        name,
        description,
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          // 4. Verify payment signature on server
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json();
              throw new Error(err.error || "Payment verification failed");
            }

            onSuccess?.(response);
          } catch (err) {
            onError?.(err instanceof Error ? err.message : "Verification failed");
          } finally {
            setLoading(false);
          }
        },
        prefill: {},
        theme: { color: "#0891b2" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onError?.("Payment cancelled");
          },
        },
      };

      const w = window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open: () => void; on: (event: string, handler: (resp: { error: { description: string } }) => void) => void } };
      const rzp = new w.Razorpay(options as unknown as Record<string, unknown>);

      // Handle payment failure
      rzp.on("payment.failed", (response: { error: { description: string } }) => {
        setLoading(false);
        onError?.(response.error.description || "Payment failed");
      });

      rzp.open();
    } catch (err) {
      setLoading(false);
      onError?.(err instanceof Error ? err.message : "Payment failed");
    }
  }, [amount, currency, name, description, loading, loadRazorpayScript, onSuccess, onError]);

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className={className}
    >
      {loading ? "Processing..." : label}
    </button>
  );
}
