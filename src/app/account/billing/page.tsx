"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Check,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Shield,
} from "lucide-react";
import CheckoutButton from "@/components/CheckoutButton";

type SubscriptionData = {
  tier: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscription: {
    id: string;
    razorpaySubscriptionId: string;
    tier: string;
    status: string;
    interval: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    cancelledAt: string | null;
    createdAt: string;
  } | null;
};

export default function BillingPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/account/billing");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    fetch("/api/razorpay/subscription")
      .then((res) => res.json())
      .then((data) => {
        setSubscription(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Check for success param
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    }
  }, [authStatus]);

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll keep access until the end of the billing period.")) {
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch("/api/razorpay/subscription", { method: "DELETE" });
      if (res.ok) {
        setSubscription((prev) =>
          prev
            ? { ...prev, cancelAtPeriodEnd: true, subscription: prev.subscription ? { ...prev.subscription, cancelAtPeriodEnd: true } : null }
            : prev
        );
      }
    } catch {
      alert("Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading billing information...</div>
      </div>
    );
  }

  const isPro = subscription?.tier === "professional" && subscription?.status === "active";
  const sub = subscription?.subscription;

  return (
    <div className="min-h-screen bg-[#070B14]">
      {/* Header */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/overview"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-semibold text-white">Billing & Subscription</h1>
          </div>
          <p className="text-sm text-slate-400 ml-7">
            Manage your plan, payment method, and invoices.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Success banner */}
        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">
              Payment successful! Your subscription is now active.
            </p>
          </div>
        )}

        {/* Current Plan */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Current Plan
            </h2>
            {!isPro && (
              <CheckoutButton
                amount={14900}
                label="Upgrade to Pro — ₹149"
                description="Patorbit Professional Plan (Monthly)"
                className="text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1.5 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
                onSuccess={() => {
                  setSuccess(true);
                  setTimeout(() => window.location.reload(), 1500);
                }}
                onError={(err) => alert(err)}
              />
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white">
                  {isPro ? "Professional" : "Starter"}
                </h3>
                {isPro && (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                    Active
                  </span>
                )}
                {subscription?.cancelAtPeriodEnd && (
                  <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                    Cancels at period end
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mb-3">
                {isPro
                  ? sub?.interval === "yearly"
                    ? "Annual plan — billed every 12 months"
                    : "Monthly plan — billed every month"
                  : "Free plan with basic features"}
              </p>

              {isPro && sub && (
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>
                      Renews{" "}
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <span>Razorpay</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        {isPro && sub && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Subscription Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Subscription ID</p>
                <p className="text-sm text-slate-300 font-mono">{sub.razorpaySubscriptionId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <p className="text-sm text-slate-300 capitalize">{sub.status}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Billing Interval</p>
                <p className="text-sm text-slate-300 capitalize">{sub.interval}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Started</p>
                <p className="text-sm text-slate-300">
                  {new Date(sub.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancel */}
        {isPro && !subscription?.cancelAtPeriodEnd && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Cancel Subscription
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  You&apos;ll keep access until the end of your current billing period.
                  After that, your account will be downgraded to the free Starter plan.
                </p>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Cancel Subscription"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features Included */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            {isPro ? "Included in your plan" : "Upgrade to unlock"}
          </h2>
          <ul className="space-y-3">
            {(isPro
              ? [
                  "Unlimited resumes",
                  "Professional Passport",
                  "Knowledge Graph",
                  "Trust Score",
                  "Evidence Management",
                  "AI Career Insights",
                  "Priority support",
                ]
              : [
                  "1 Resume",
                  "Basic AI suggestions",
                  "Resume export",
                  "Community support",
                ]
            ).map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-sm text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>
          {!isPro && (
            <Link
              href="/pricing"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              View Plans
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
