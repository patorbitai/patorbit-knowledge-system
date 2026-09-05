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
  Shield,
  FileText,
  Sparkles,
  Target,
  Crown,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

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

type UsageData = {
  ai_generations: { current: number; limit: number };
  job_analysis: { current: number; limit: number };
  ai_tailoring: { current: number; limit: number };
  resumeCount: { current: number; limit: number };
};

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

export default function BillingPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/account/billing");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    fetch("/api/razorpay/subscription")
      .then((res) => {
        if (!res.ok) throw new Error("load");
        return res.json();
      })
      .then((data) => {
        setSubscription(data);
        setLoading(false);
      })
      .catch(() => {
        setSubscription({ tier: "free", status: "inactive", currentPeriodEnd: null, cancelAtPeriodEnd: false, subscription: null });
        setLoading(false);
      });

    // Fetch usage data
    fetch("/api/account/usage")
      .then((res) => {
        if (!res.ok) throw new Error("load");
        return res.json();
      })
      .then((data) => {
        if (data && !data.error) setUsage(data);
      })
      .catch(() => {});

    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    }
  }, [authStatus]);

  const isPro =
    subscription?.tier === "professional" &&
    (subscription?.status === "active" || subscription?.status === "trialing");

  const sub = subscription?.subscription;

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/razorpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: "monthly" }),
      });

      if (res.status === 401) {
        window.location.href = "/login?callbackUrl=/account/billing";
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setCheckoutError(err.error || "Something went wrong. Please try again.");
        setCheckoutLoading(false);
        return;
      }

      const { subscriptionId, razorpayKeyId } = await res.json();

      const options = {
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: "Patorbit",
        description: "Professional Plan (Monthly)",
        handler: function () {
          window.location.href = "/account/billing?status=success";
        },
        prefill: {},
        theme: { color: "#0891b2" },
        modal: { ondismiss: () => setCheckoutLoading(false) },
      };

      const w = window as unknown as { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void } };
      if (!w.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          new w.Razorpay!(options).open();
        };
        document.body.appendChild(script);
      } else {
        new w.Razorpay(options).open();
      }
    } catch {
      setCheckoutError("Something went wrong. Please check your connection and try again.");
      setCheckoutLoading(false);
    }
  };

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = async () => {
    setShowCancelConfirm(false);
    setCancelling(true);
    try {
      const res = await fetch("/api/razorpay/subscription", { method: "DELETE" });
      if (res.ok) {
        setSubscription((prev) =>
          prev
            ? { ...prev, cancelAtPeriodEnd: true, subscription: prev.subscription ? { ...prev.subscription, cancelAtPeriodEnd: true } : null }
            : prev,
        );
      }
    } catch {
      setCheckoutError("Unable to cancel subscription. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#070B14] flex items-center justify-center">
        <div className="text-gray-400 dark:text-slate-400 text-sm">Loading billing information...</div>
      </div>
    );
  }

  const formatLimit = (limit: number) => (limit === -1 ? "Unlimited" : limit.toString());

  return (
    <div className="min-h-screen bg-white dark:bg-[#070B14]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/overview"
              className="text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Billing & Subscription</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 ml-7">
            Manage your plan, payment method, and usage.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Success banner */}
        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">
              Payment successful! Your subscription is now active.
            </p>
          </div>
        )}

        {checkoutError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-rose-300">{checkoutError}</p>
            <button
              onClick={() => setCheckoutError(null)}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Current Plan */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider">
              Current Plan
            </h2>
            {!isPro && (
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="inline-flex items-center gap-2 text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1.5 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                <Crown className="h-3 w-3" />
                {checkoutLoading ? "Starting..." : "Upgrade to Professional — ₹149/mo"}
              </button>
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
                {isPro
                  ? sub?.interval === "yearly"
                    ? "Annual plan — billed every 12 months"
                    : "Monthly plan — ₹149/month"
                  : "Free plan with basic features"}
              </p>

              {isPro && sub && (
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500" />
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
                  <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                    <CreditCard className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                    <span>Razorpay</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage Meters */}
        {usage && (
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider mb-4">
              Usage This Month
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UsageMeter
                icon={<Sparkles className="w-4 h-4" />}
                label="AI Suggestions"
                current={usage.ai_generations.current}
                limit={usage.ai_generations.limit}
              />
              <UsageMeter
                icon={<FileText className="w-4 h-4" />}
                label="Job Analyses"
                current={usage.job_analysis.current}
                limit={usage.job_analysis.limit}
              />
              <UsageMeter
                icon={<Target className="w-4 h-4" />}
                label="AI Tailoring"
                current={usage.ai_tailoring.current}
                limit={usage.ai_tailoring.limit}
              />
              <UsageMeter
                icon={<FileText className="w-4 h-4" />}
                label="Resumes"
                current={usage.resumeCount.current}
                limit={usage.resumeCount.limit}
              />
            </div>
          </div>
        )}

        {/* Subscription Details */}
        {isPro && sub && (
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider mb-4">
              Subscription Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Subscription ID</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 font-mono">{sub.razorpaySubscriptionId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Status</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 capitalize">{sub.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Billing Interval</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 capitalize">{sub.interval}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Started</p>
                <p className="text-sm text-gray-700 dark:text-slate-300">
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
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Cancel Subscription
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                  You&apos;ll keep access until the end of your current billing period.
                  After that, your account will be downgraded to the free Starter plan.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelling}
                  className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Cancel Subscription"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plan Features */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider mb-4">
            {isPro ? "Included in your plan" : "Upgrade to unlock"}
          </h2>
          <ul className="space-y-3">
            {(isPro
              ? [
                  "Unlimited resumes",
                  "All resume templates",
                  "Advanced AI suggestions",
                  "Advanced job analysis",
                  "Full Qualification Match",
                  "Professional Passport",
                  "Knowledge Graph",
                  "Trust Score",
                  "Evidence Management",
                  "Career Timeline",
                  "AI Career Insights",
                  "Advanced ATS analysis",
                  "Priority support",
                ]
              : [
                  "Up to 2 resumes",
                  "Core resume templates",
                  "Basic AI suggestions",
                  "Basic job analysis",
                  "Basic ATS checks",
                  "PDF export",
                  "Community support",
                ]
            ).map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>
          {!isPro && (
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
            >
              <Crown className="h-4 w-4" />
              {checkoutLoading ? "Starting checkout..." : "Upgrade to Professional — ₹149/mo"}
            </button>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={showCancelConfirm}
        title="Cancel subscription?"
        message="You will keep access until the end of your billing period. After that, your account will be downgraded to the free Starter plan."
        confirmLabel="Cancel Subscription"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}

// ─── Usage Meter Component ──────────────────────────────────────────────────

function UsageMeter({
  icon,
  label,
  current,
  limit,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  limit: number;
}) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, (current / limit) * 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-cyan-500 dark:text-cyan-400">{icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className={`text-xl font-bold ${isAtLimit ? "text-amber-400" : "text-gray-900 dark:text-white"}`}>
          {current}
        </span>
        <span className="text-sm text-gray-400 dark:text-slate-500">
          / {isUnlimited ? "∞" : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit
                ? "bg-amber-500"
                : isNearLimit
                  ? "bg-amber-400"
                  : "bg-cyan-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <p className="text-[11px] text-gray-400 dark:text-slate-500">Unlimited with Professional</p>
      )}
      {isAtLimit && (
        <p className="text-[11px] text-amber-400 mt-1">Limit reached</p>
      )}
    </div>
  );
}
