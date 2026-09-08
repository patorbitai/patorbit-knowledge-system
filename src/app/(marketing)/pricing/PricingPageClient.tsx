"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Minus,
  ShieldCheck,
  Sparkles,
  CreditCard,
  X,
  ChevronDown,
  Zap,
} from "lucide-react";
import { useFeatureAccess } from "@/components/providers/FeatureAccessProvider";

/* ═══════════════ Data ═══════════════ */

type Plan = {
  name: string;
  tagline: string;
  monthly: number | null;
  yearly: number | null;
  badges?: string[];
  /** Short list of key features for the compact card */
  highlights: string[];
  cta: string;
  href: string;
};

const plans: Plan[] = [
  {
    name: "Starter",
    tagline: "Perfect for students and early professionals.",
    monthly: 0,
    yearly: 0,
    highlights: [
      "Resume Builder",
      "Core templates",
      "PDF export",
      "Basic AI",
    ],
    cta: "Get Started Free",
    href: "/resume-builder",
  },
  {
    name: "Professional",
    tagline: "For career professionals ready to stand out.",
    monthly: 149,
    yearly: 119,
    badges: ["Most Popular"],
    highlights: [
      "Unlimited resumes",
      "All 29+ templates",
      "AI tailoring & matching",
      "Trust Score & Passport",
    ],
    cta: "Start Professional",
    href: "/resume-builder",
  },
  {
    name: "Enterprise",
    tagline: "For universities and organizations.",
    monthly: null,
    yearly: null,
    highlights: [
      "Organization workspaces",
      "Verification workflows",
      "API & SSO access",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    href: "/contact",
  },
];

type ComparisonRow = {
  feature: string;
  values: [string | boolean, string | boolean, string | boolean];
};

const comparisonRows: ComparisonRow[] = [
  { feature: "Resume Builder", values: [true, true, true] },
  { feature: "Resume Import", values: [true, true, true] },
  { feature: "Resume limit", values: ["2", "Unlimited", "Unlimited"] },
  { feature: "Templates", values: ["Core", "All", "All"] },
  { feature: "PDF Export", values: [true, true, true] },
  { feature: "Basic AI", values: [true, true, true] },
  { feature: "Advanced AI", values: [false, true, true] },
  { feature: "Job Analysis", values: ["Basic", "Advanced", "Advanced"] },
  { feature: "Qualification Match", values: ["Basic", "Full", "Full"] },
  { feature: "Career Profile", values: ["Basic", "Full", "Full"] },
  { feature: "Career Insights", values: [false, true, true] },
  { feature: "Professional Passport", values: [false, true, true] },
  { feature: "Knowledge Graph", values: [false, true, true] },
  { feature: "Trust Score", values: [false, true, true] },
  { feature: "Evidence Management", values: [false, true, true] },
  { feature: "Career Timeline", values: [false, true, true] },
  { feature: "ATS Analysis", values: ["Basic", "Advanced", "Advanced"] },
  { feature: "Priority Support", values: [false, true, true] },
  { feature: "Organization Features", values: [false, false, true] },
  { feature: "API Access", values: [false, false, true] },
  { feature: "SSO & SCIM", values: [false, false, true] },
];

const faqs = [
  {
    q: "Why is Patorbit different from a resume builder?",
    a: "A resume builder produces a document. Patorbit builds a verified professional identity — every claim you make is backed by evidence, connected in a knowledge graph, and summarized in a dynamic Trust Score.",
  },
  {
    q: "What is a Professional Passport?",
    a: "Your Professional Passport is a shareable, verifiable summary of your professional identity. It consolidates your verified claims, evidence, and Trust Score into a single link you can share with employers.",
  },
  {
    q: "What is a Trust Score?",
    a: "Your Trust Score is a 0–100 rating that reflects the strength and completeness of your verified professional identity, computed from the quality, recency, and verification status of your evidence.",
  },
  {
    q: "Can I switch plans?",
    a: "Yes. You can upgrade or downgrade at any time. Changes are prorated automatically, and you'll never be locked in.",
  },
  {
    q: "Do you offer student discounts?",
    a: "Yes. We offer a discounted Professional plan for verified students. Contact our team with your institutional email to get started.",
  },
  {
    q: "Is my data private?",
    a: "Your data belongs to you. We encrypt data in transit and at rest, never sell your information, and give you full control over what's public, private, or shared.",
  },
];

const focusRing =
  "focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

/* ═══════════════ UI helpers ═══════════════ */

function PriceDisplay({
  plan,
  isYearly,
}: {
  plan: Plan;
  isYearly: boolean;
}) {
  if (plan.monthly === null) {
    return <div className="text-4xl font-bold text-white mb-1">Custom</div>;
  }
  const price = isYearly && plan.yearly !== null ? plan.yearly : plan.monthly;
  return (
    <div className="flex items-baseline justify-center gap-1 mb-1">
      <span className="text-4xl font-bold text-white tabular-nums">
        ₹{price}
      </span>
      <span className="text-sm text-slate-400">/month</span>
    </div>
  );
}

function ComparisonCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15">
        <Check className="h-3.5 w-3.5 text-cyan-400" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/60">
        <Minus className="h-3.5 w-3.5 text-slate-600" />
      </span>
    );
  }
  return <span className="text-sm text-slate-300">{value}</span>;
}

/* ═══════════════ Subscription Confirmation Modal ═══════════════ */

const TRIAL_FEE = 5; // ₹5 display value; authoritative amount lives server-side
const TRIAL_DAYS = 7;

function SubscriptionModal({
  open,
  onClose,
  plan,
  isYearly,
  onConfirm,
  loading,
  trialEligible,
  trialEndsAt,
}: {
  open: boolean;
  onClose: () => void;
  plan: Plan;
  isYearly: boolean;
  onConfirm: () => void;
  loading: boolean;
  /** null = unknown (e.g. logged out); false = already used; true = eligible */
  trialEligible: boolean | null;
  /** Server-computed trial end estimate (ISO), when available */
  trialEndsAt: string | null;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus first button on open
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        dialogRef.current
          ?.querySelector<HTMLElement>("button")
          ?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  const price =
    plan.monthly === null
      ? null
      : isYearly && plan.yearly !== null
        ? plan.yearly
        : plan.monthly;
  const interval = isYearly ? "yearly" : "monthly";
  const billingLabel = isYearly ? "Billed yearly" : "Billed monthly";

  // The ₹5 trial is the primary offer; fall back to the plain subscription
  // only when the server says the trial was already used.
  const isTrialOffer = trialEligible !== false;
  const trialEndDate =
    trialEndsAt ||
    new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const trialEndLabel = new Date(trialEndDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog — viewport-centered */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-2xl border border-white/[0.1] bg-gradient-to-b from-[#0f1525] to-[#0a0e1a] shadow-2xl shadow-black/40 overflow-hidden"
      >
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-radial from-cyan-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="relative p-6 space-y-5">
          {/* Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/15 border border-cyan-500/20">
            <Zap className="h-5 w-5 text-cyan-400" />
          </div>

          {/* Title */}
          <h2
            id="checkout-modal-title"
            className="text-lg font-bold text-white tracking-tight"
          >
            {isTrialOffer
              ? `Start your ${TRIAL_DAYS}-day trial`
              : `Upgrade to ${plan.name}`}
          </h2>

          {/* Plan summary */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
            {isTrialOffer ? (
              <>
                {/* ₹5 today + trial end */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    Today
                  </span>
                  <span className="text-lg font-bold text-cyan-300 tabular-nums">
                    ₹{TRIAL_FEE}
                    <span className="text-sm font-normal text-slate-400">
                      {" "}one-time
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Your trial ends
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {trialEndLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    After your trial
                  </span>
                  <span className="text-sm font-semibold text-white tabular-nums">
                    ₹{price}
                    <span className="text-slate-400">/mo</span>
                    <span className="ml-1 text-xs font-normal text-slate-500">
                      ({billingLabel})
                    </span>
                  </span>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
                  <p className="text-xs leading-relaxed text-amber-200/90">
                    Your subscription automatically renews at ₹{price}/mo after
                    the trial unless you cancel before it ends. You can cancel
                    anytime during the trial.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-white">
                    {plan.name}
                  </span>
                  {price !== null ? (
                    <span className="text-lg font-bold text-white tabular-nums">
                      ₹{price}
                      <span className="text-sm font-normal text-slate-400">
                        /mo
                      </span>
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-white">Custom</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>{billingLabel}</span>
                </div>
              </>
            )}

            {/* Key features */}
            <ul className="space-y-2 pt-1">
              {plan.highlights.map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span className="text-sm text-slate-300">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-1">
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-100 cursor-pointer ${focusRing} bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading
                ? "Starting checkout..."
                : isTrialOffer
                  ? `Start Trial for ₹${TRIAL_FEE}`
                  : "Continue to checkout"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.04] px-6 py-3 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white"
            >
              Maybe later
            </button>
          </div>

          {/* Trust */}
          <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/60" />
              Secure checkout
            </span>
            <span>·</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Page ═══════════════ */

export function PricingPageClient() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [trialChecked, setTrialChecked] = useState(false);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Current user tier from the global feature-access provider
  const { tier } = useFeatureAccess();

  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;
    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = wrapper;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    };
    handleScroll();
    wrapper.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      wrapper.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Server-side trial eligibility + trial end estimate for the modal.
  // Logged-out users get 401 and fall back to the trial offer copy.
  const checkTrialStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/razorpay/subscription", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setTrialEligible(data.trialEligible === false ? false : true);
        setTrialEndsAt(data.trialEndsAt || null);
      } else {
        setTrialEligible(null);
        setTrialEndsAt(null);
      }
    } catch {
      setTrialEligible(null);
      setTrialEndsAt(null);
    } finally {
      setTrialChecked(true);
    }
  }, []);

  const handlePlanClick = useCallback(
    (plan: Plan) => {
      if (plan.name === "Starter") {
        window.location.href = plan.href;
        return;
      }
      if (plan.name === "Enterprise") {
        window.location.href = plan.href;
        return;
      }
      setSelectedPlan(plan);
      setCheckoutError(null);
      setModalOpen(true);
      if (!trialChecked) {
        checkTrialStatus();
      }
    },
    [trialChecked, checkTrialStatus],
  );

  const handleConfirmCheckout = useCallback(async () => {
    if (!selectedPlan) return;
    setCheckoutError(null);
    setCheckoutLoading(true);

    try {
      // The server is the source of truth for trial eligibility. If the
      // server says the trial was already used, fall back to a normal
      // subscription checkout rather than repeating the ₹5 trial.
      const wantsTrial = trialEligible !== false;

      const res = await fetch("/api/razorpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interval: isYearly ? "yearly" : "monthly",
          trial: wantsTrial,
        }),
      });

      if (res.status === 401) {
        window.location.href = `/login?callbackUrl=/pricing`;
        return;
      }
      if (res.status === 403) {
        const err = await res.json().catch(() => ({}));
        if (err.code === "TRIAL_ALREADY_USED") {
          // Trial used — switch the modal to the plain subscription offer and
          // let the user subscribe at the regular price.
          setTrialEligible(false);
          setCheckoutError(
            "You've already used your ₹5 trial. You can subscribe at the regular price.",
          );
        } else {
          setCheckoutError(err.error || "Something went wrong. Please try again.");
        }
        setCheckoutLoading(false);
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setCheckoutError(
          err.error || "Something went wrong. Please try again.",
        );
        setCheckoutLoading(false);
        return;
      }

      const { subscriptionId, razorpayKeyId } = await res.json();

      const options = {
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: "Patorbit",
        description: `${selectedPlan.name} Plan (${isYearly ? "Yearly" : "Monthly"})${wantsTrial ? ` — ${TRIAL_DAYS}-day trial ₹${TRIAL_FEE}` : ""}`,
        handler: function (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) {
          window.location.href = "/account/billing?status=success";
        },
        prefill: {},
        theme: {
          color: "#0891b2",
          backdrop_color: "rgba(0, 0, 0, 0.6)",
        },
        modal: {
          ondismiss: function () {
            setCheckoutLoading(false);
            setModalOpen(false);
          },
        },
      };

      const w = window as unknown as {
        Razorpay?: new (opts: typeof options) => { open: () => void };
      };
      if (typeof window !== "undefined" && !w.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const rzp = new w.Razorpay!(options);
          rzp.open();
          setCheckoutLoading(false);
          setModalOpen(false);
        };
        document.body.appendChild(script);
      } else if (w.Razorpay) {
        const rzp = new w.Razorpay(options);
        rzp.open();
        setCheckoutLoading(false);
        setModalOpen(false);
      }
    } catch {
      setCheckoutError(
        "Something went wrong. Please check your connection and try again.",
      );
      setCheckoutLoading(false);
    }
  }, [selectedPlan, isYearly, trialEligible]);

  /** Determine the CTA label for a plan based on the user's current tier */
  const getCtaLabel = useCallback(
    (plan: Plan) => {
      if (plan.name === "Starter") return "Get Started Free";
      if (plan.name === "Enterprise") return "Contact Sales";
      const currentTierLower = tier.toLowerCase();
      if (plan.name.toLowerCase() === currentTierLower) return "Current Plan";
      if (plan.name === "Professional" && trialEligible !== false) {
        return `Start ${TRIAL_DAYS}-Day Trial`;
      }
      return plan.cta;
    },
    [tier, trialEligible],
  );

  const isCurrentPlan = useCallback(
    (plan: Plan) => {
      if (plan.name === "Starter" && tier === "Free") return true;
      return plan.name.toLowerCase() === tier.toLowerCase();
    },
    [tier],
  );

  return (
    <main className="min-h-screen bg-slate-950">
      {/* ── Compact Hero ── */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950 to-slate-950" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 mb-5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs text-slate-400 tracking-wide uppercase font-medium">
                Pricing
              </span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-4xl sm:text-5xl font-bold tracking-tight text-white"
          >
            Invest in Your{" "}
            <span className="text-gradient">Professional Identity</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-4 text-base text-slate-400 max-w-xl mx-auto leading-relaxed"
          >
            Build a trusted professional profile, verify your experience, and
            stand out with AI-powered career intelligence.
          </motion.p>
        </div>
      </section>

      {/* ── Billing Toggle ── */}
      <section className="pb-6">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${focusRing} ${
                !isYearly
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${focusRing} flex items-center gap-2 ${
                isYearly
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Save 20%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Compact Pricing Cards ── */}
      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-6">
          {/* Checkout error banner */}
          {checkoutError && (
            <div className="mx-auto max-w-md rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-center mb-6">
              <p className="text-sm font-medium text-rose-300">
                {checkoutError}
              </p>
              <button
                onClick={() => setCheckoutError(null)}
                className="mt-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3 items-start">
            {plans.map((plan, i) => {
              const highlighted = plan.badges && plan.badges.length > 0;
              const current = isCurrentPlan(plan);
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    highlighted
                      ? "border-cyan-500/50 bg-slate-900/80 shadow-[0_0_60px_-12px_rgba(34,211,238,0.35)] lg:scale-[1.03] lg:z-10"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all duration-300"
                  }`}
                >
                  {/* Badge */}
                  {plan.badges && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-cyan-500/30">
                        {plan.badges[0]}
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <h2 className="text-lg font-bold text-white mb-0.5">
                    {plan.name}
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">{plan.tagline}</p>

                  {/* Price */}
                  <div className="mb-4">
                    <PriceDisplay plan={plan} isYearly={isYearly} />
                    {plan.monthly !== null && (
                      <p className="text-xs text-slate-500 text-center">
                        {isYearly ? "billed yearly" : "billed monthly"}
                      </p>
                    )}
                    {/* ₹5 trial offer on the Professional card */}
                    {plan.name === "Professional" && trialEligible !== false && (
                      <div className="mt-2 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 text-xs font-semibold text-amber-300">
                          {TRIAL_DAYS}-day trial · ₹{TRIAL_FEE} today
                        </span>
                        <p className="mt-1.5 text-[11px] text-slate-500">
                          Then ₹{isYearly && plan.yearly !== null ? plan.yearly : plan.monthly}
                          /mo {isYearly ? "billed yearly" : "billed monthly"} ·
                          auto-renews unless cancelled
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Key features — compact */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.highlights.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
                          <Check className="h-2.5 w-2.5 text-cyan-400" />
                        </span>
                        <span className="text-sm text-slate-300 leading-snug">
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    type="button"
                    onClick={() => handlePlanClick(plan)}
                    disabled={current}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-100 cursor-pointer ${focusRing} ${
                      current
                        ? "bg-slate-800 text-slate-500 cursor-default hover:scale-100"
                        : highlighted
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
                          : "border border-slate-700 text-slate-200 hover:border-cyan-500/40 hover:text-white"
                    }`}
                  >
                    {getCtaLabel(plan)}
                    {!current && <ArrowRight className="w-4 h-4" />}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-400"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Secure payments
            </span>
            <span className="hidden sm:inline text-slate-700">·</span>
            <span className="inline-flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-cyan-400" />
              Cancel anytime
            </span>
            <span className="hidden sm:inline text-slate-700">·</span>
            <span className="inline-flex items-center gap-2">
              <X className="h-4 w-4 text-slate-500" />
              No hidden fees
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── Feature Comparison ── */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Compare Features
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              Everything you need to see which plan fits your goals.
            </p>
          </motion.div>

          {/* Desktop / Tablet table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="hidden sm:block"
          >
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              {/* Scroll fades */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-slate-900/80 to-transparent transition-opacity duration-200 ${
                  showLeftFade ? "opacity-100" : "opacity-0"
                }`}
              />
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-slate-900/80 to-transparent transition-opacity duration-200 ${
                  showRightFade ? "opacity-100" : "opacity-0"
                }`}
              />

              <div
                ref={tableWrapperRef}
                className="overflow-x-auto scrollbar-none"
              >
                <table className="w-full table-fixed text-left">
                  <colgroup>
                    <col className="w-[38%]" />
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th
                        scope="col"
                        className="sticky left-0 z-20 bg-slate-900/95 backdrop-blur-sm px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500"
                      >
                        Feature
                      </th>
                      {plans.map((plan) => {
                        const isPro = Boolean(plan.badges?.length);
                        return (
                          <th
                            key={plan.name}
                            scope="col"
                            className={`px-4 py-3.5 text-center text-sm font-bold ${
                              isPro
                                ? "text-cyan-400 border-x border-cyan-500/20 bg-cyan-500/[0.04]"
                                : "text-white"
                            }`}
                          >
                            {plan.name}
                            {isPro && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400">
                                Popular
                              </span>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, i) => (
                      <tr
                        key={row.feature}
                        className={i % 2 === 0 ? "bg-slate-950/30" : ""}
                      >
                        <td className="sticky left-0 z-10 bg-inherit px-5 py-2.5 text-sm text-slate-300 font-medium">
                          {row.feature}
                        </td>
                        {row.values.map((value, j) => {
                          const isPro = Boolean(plans[j].badges?.length);
                          return (
                            <td
                              key={j}
                              className={`px-4 py-2.5 text-center ${
                                isPro
                                  ? "border-x border-cyan-500/10 bg-cyan-500/[0.02]"
                                  : ""
                              }`}
                            >
                              <ComparisonCell value={value} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Mobile stacked cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="sm:hidden space-y-4"
            aria-label="Feature comparison by plan"
          >
            {plans.map((plan) => {
              const isPro = Boolean(plan.badges?.length);
              return (
                <div
                  key={plan.name}
                  className={`rounded-2xl border bg-slate-900/60 overflow-hidden ${
                    isPro
                      ? "border-cyan-500/40 shadow-[0_0_32px_-8px_rgba(34,211,238,0.2)]"
                      : "border-slate-800"
                  }`}
                >
                  <div
                    className={`px-5 py-3 border-b flex items-center justify-between ${
                      isPro
                        ? "border-cyan-500/20 bg-cyan-500/[0.06]"
                        : "border-slate-800"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        isPro ? "text-cyan-400" : "text-white"
                      }`}
                    >
                      {plan.name}
                    </span>
                    {isPro && (
                      <span className="inline-flex items-center rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <ul>
                    {comparisonRows.map((row, i) => {
                      const planIndex = plans.indexOf(plan);
                      const value = row.values[planIndex];
                      return (
                        <li
                          key={row.feature}
                          className={`flex items-center justify-between px-5 py-2.5 text-sm ${
                            i % 2 === 0 ? "bg-slate-950/30" : ""
                          }`}
                        >
                          <span className="text-slate-400">{row.feature}</span>
                          <ComparisonCell value={value} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-base">
              Everything you need to know about Patorbit plans.
            </p>
          </motion.div>

          <div className="space-y-2">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      id={`faq-button-${i}`}
                      className={`w-full flex items-center justify-between gap-4 px-5 py-4 text-left ${focusRing}`}
                    >
                      <span className="text-sm font-semibold text-white">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-cyan-400" : ""
                        }`}
                      />
                    </button>
                  </h3>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-button-${i}`}
                    className="grid transition-[grid-template-rows] duration-200 ease-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden min-h-0">
                      <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to build your{" "}
              <span className="text-gradient">Professional Identity?</span>
            </h2>
            <p className="text-slate-400 text-base mb-6 max-w-md mx-auto">
              Start free and verify your first achievements today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/resume-builder"
                className={`group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all hover:scale-[1.02] ${focusRing}`}
              >
                Start Free Today
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/contact"
                className={`inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3 text-base font-medium text-slate-300 hover:bg-slate-900 hover:border-slate-700 hover:text-white transition-all ${focusRing}`}
              >
                Talk to Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Subscription Confirmation Modal ── */}
      <AnimatePresence>
        {modalOpen && selectedPlan && (
          <SubscriptionModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setSelectedPlan(null);
              setCheckoutLoading(false);
            }}
            plan={selectedPlan}
            isYearly={isYearly}
            onConfirm={handleConfirmCheckout}
            loading={checkoutLoading}
            trialEligible={trialEligible}
            trialEndsAt={trialEndsAt}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
