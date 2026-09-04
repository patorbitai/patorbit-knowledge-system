"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Minus,
  ShieldCheck,
  Sparkles,
  CreditCard,
  X,
  ChevronDown,
} from "lucide-react";

/* ═══════════════ Data ═══════════════ */

type Plan = {
  name: string;
  tagline: string;
  monthly: number | null;
  yearly: number | null;
  badges?: string[];
  features: string[];
  cta: string;
  href: string;
};

const plans: Plan[] = [
  {
    name: "Starter",
    tagline: "Perfect for students and early professionals.",
    monthly: 0,
    yearly: 0,
    features: [
      "Resume Builder",
      "Resume Import",
      "Core resume templates",
      "Up to 2 resumes",
      "PDF export",
      "Basic ATS checks",
      "Basic AI suggestions",
      "Basic job analysis",
      "Basic Career Profile",
      "Community support",
    ],
    cta: "Get Started Free",
    href: "/resume-builder",
  },
  {
    name: "Professional",
    tagline: "For career professionals ready to stand out.",
    monthly: 149,
    yearly: null,
    badges: ["Most Popular"],
    features: [
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
    ],
    cta: "Start Professional",
    href: "/resume-builder",
  },
  {
    name: "Enterprise",
    tagline: "For universities and organizations.",
    monthly: null,
    yearly: null,
    features: [
      "Organization workspaces",
      "Professional identity infrastructure",
      "Verification workflows",
      "Candidate & student profiles",
      "Analytics & reporting",
      "API access",
      "SSO & SCIM",
      "Custom integrations",
      "Custom AI policies",
      "Security review",
      "Dedicated support",
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
    a: "A resume builder produces a document. Patorbit builds a verified professional identity — every claim you make is backed by evidence, connected in a knowledge graph, and summarized in a dynamic Trust Score. Recruiters don't just read your story; they can verify it.",
  },
  {
    q: "What is a Professional Passport?",
    a: "Your Professional Passport is a shareable, verifiable summary of your professional identity. It consolidates your verified claims, evidence, and Trust Score into a single link or QR code you can share with employers, clients, and networks.",
  },
  {
    q: "What is a Trust Score?",
    a: "Your Trust Score is a 0–100 rating that reflects the strength and completeness of your verified professional identity. It's computed from the quality, recency, and verification status of the evidence behind each claim you've added.",
  },
  {
    q: "Can I switch plans?",
    a: "Yes. You can upgrade or downgrade at any time. Changes are prorated automatically, and you'll never be locked in — cancel or change whenever your needs evolve.",
  },
  {
    q: "Do you offer student discounts?",
    a: "Yes. We offer a discounted Professional plan for verified students. Contact our team through the contact page with your institutional email to get started.",
  },
  {
    q: "Is my data private?",
    a: "Your data belongs to you. We encrypt data in transit and at rest, never sell your information, and give you full control over what's public, private, or shared. See our Privacy Policy for details.",
  },
];

const upgradeReasons = [
  {
    title: "Build Trust",
    icon: "🛡️",
    points: [
      "Evidence-backed achievements",
      "Verified claims",
      "Professional Identity Score",
    ],
  },
  {
    title: "Get Better AI",
    icon: "🤖",
    points: [
      "Personalized career guidance",
      "Resume intelligence",
      "Opportunity matching",
    ],
  },
  {
    title: "Stand Out",
    icon: "⭐",
    points: [
      "Shareable Professional Passport",
      "Recruiter-ready profile",
      "Verified career timeline",
    ],
  },
];

const focusRing =
  "focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

/* ═══════════════ UI helpers ═══════════════ */

function PriceDisplay({ plan }: { plan: Plan }) {
  if (plan.monthly === null) {
    return <div className="text-4xl font-bold text-white mb-2">Custom</div>;
  }
  return (
    <div className="flex items-baseline justify-center gap-1 mb-2">
      <span className="text-4xl font-bold text-white tabular-nums">₹{plan.monthly}</span>
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

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
        <Check className="h-3 w-3 text-cyan-400" />
      </span>
      <span className="text-sm text-slate-300 leading-relaxed">{children}</span>
    </li>
  );
}

/* ═══════════════ Page ═══════════════ */

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

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

  const handleUpgrade = async (planName: string) => {
    if (planName === "Starter") {
      window.location.href = "/resume-builder";
      return;
    }
    if (planName === "Enterprise") {
      window.location.href = "/contact";
      return;
    }

    try {
      // 1. Create subscription on server
      const res = await fetch("/api/razorpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: "monthly" }),
      });

      if (res.status === 401) {
        window.location.href = `/login?callbackUrl=/pricing`;
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to start checkout");
        return;
      }

      const { subscriptionId, razorpayKeyId } = await res.json();

      // 2. Open Razorpay checkout modal
      const options = {
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: "Patorbit",
        description: `${planName} Plan (Monthly)`,
        handler: function (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) {
          // Payment successful — redirect to billing portal
          window.location.href = "/account/billing?status=success";
        },
        prefill: {},
        theme: {
          color: "#0891b2",
          backdrop_color: "rgba(0, 0, 0, 0.6)"
        },
        modal: {
          ondismiss: function () {
            // User closed the modal
            console.log("Checkout dismissed");
          }
        }
      };

      // Load Razorpay script if not loaded
      const w = window as unknown as { Razorpay?: new (opts: typeof options) => { open: () => void } };
      if (typeof window !== "undefined" && !w.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const rzp = new w.Razorpay!(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else if (w.Razorpay) {
        const rzp = new w.Razorpay(options);
        rzp.open();
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950">
      {/* ── Hero ── */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950 to-slate-950" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-radial from-cyan-500/8 via-blue-500/5 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs text-slate-400 tracking-wide uppercase font-medium">Pricing</span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-bold tracking-tight text-white"
          >
            Invest in Your{" "}
            <span className="text-gradient">Professional Identity</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Build a trusted professional profile, verify your experience, and stand out with
            AI-powered career intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/resume-builder"
              className={`group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all hover:scale-[1.02] ${focusRing}`}
            >
              Start Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/contact"
              className={`inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-8 py-3.5 text-base font-medium text-slate-300 hover:bg-slate-900 hover:border-slate-700 hover:text-white transition-all ${focusRing}`}
            >
              Talk to Sales
            </Link>
          </motion.div>


        </div>
      </section>

      {/* ── Social proof ── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mx-auto max-w-3xl px-6 pb-4 text-center"
      >
        <p className="text-sm text-slate-400 leading-relaxed">
          Trusted for building{" "}
          <span className="text-slate-300 font-medium">verifiable professional identities</span> —
          built for students, professionals, recruiters, and enterprise hiring teams.
        </p>
      </motion.div>

      {/* ── Pricing Cards ── */}
      <section className="pt-8 pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 lg:grid-cols-3 items-center">
            {plans.map((plan, i) => {
              const isHighlighted = plan.badges && plan.badges.length > 0;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative flex flex-col rounded-2xl border p-8 ${
                    isHighlighted
                      ? "border-cyan-500/50 bg-slate-900/80 shadow-[0_0_80px_-15px_rgba(34,211,238,0.45)] lg:scale-[1.05] lg:z-10"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all duration-300"
                  }`}
                >
                  {plan.badges && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap">
                      {plan.badges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-cyan-500/30"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
                  <p className="text-sm text-slate-400 mb-6">{plan.tagline}</p>

                  <div className="mb-6">
                    <PriceDisplay plan={plan} />
                    {plan.monthly !== null && (
                      <p className="text-xs text-slate-400 text-center">billed monthly</p>
                    )}
                  </div>

                  <ul className="space-y-3.5 mb-8 flex-1">
                    {plan.features.map((feat) => (
                      <CheckItem key={feat}>{feat}</CheckItem>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handleUpgrade(plan.name)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-100 cursor-pointer ${focusRing} ${
                      isHighlighted
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
                        : plan.monthly === 0
                          ? "border border-slate-700 text-slate-200 hover:border-cyan-500/40 hover:text-white"
                          : "border border-slate-700 text-slate-200 hover:border-slate-600 hover:bg-slate-800/40"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
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
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-400"
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

      {/* ── Why Professionals Upgrade ── */}
      <section className="py-24 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Professionals <span className="text-gradient">Upgrade</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              It&apos;s not just a plan — it&apos;s the difference between a résumé and a verified career.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {upgradeReasons.map((reason, i) => (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-cyan-500/30 transition-all"
              >
                <span className="text-3xl mb-4 block">{reason.icon}</span>
                <h3 className="text-xl font-semibold text-white mb-4">{reason.title}</h3>
                <ul className="space-y-3">
                  {reason.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
                        <Check className="h-3 w-3 text-cyan-400" />
                      </span>
                      <span className="text-sm text-slate-300 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Comparison ── */}
      <section className="py-24 border-t border-white/5">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Compare Features</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need to see which plan fits your goals.
            </p>
          </motion.div>

          {/* ── Desktop / Tablet table ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="hidden sm:block"
          >
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              {/* Tablet gradient fades */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-slate-900/80 to-transparent transition-opacity duration-200 ${showLeftFade ? "opacity-100" : "opacity-0"}`}
              />
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-slate-900/80 to-transparent transition-opacity duration-200 ${showRightFade ? "opacity-100" : "opacity-0"}`}
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
                        className="sticky left-0 z-20 bg-slate-900/95 backdrop-blur-sm px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500"
                      >
                        Feature
                      </th>
                      {plans.map((plan) => {
                        const isPro = Boolean(plan.badges?.length);
                        return (
                          <th
                            key={plan.name}
                            scope="col"
                            className={`px-4 py-4 text-center text-sm font-bold ${
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
                      <tr key={row.feature} className={i % 2 === 0 ? "bg-slate-950/30" : ""}>
                        <td className="sticky left-0 z-10 bg-inherit px-5 py-3 text-sm text-slate-300 font-medium">
                          {row.feature}
                        </td>
                        {row.values.map((value, j) => {
                          const isPro = Boolean(plans[j].badges?.length);
                          return (
                            <td
                              key={j}
                              className={`px-4 py-3 text-center ${
                                isPro ? "border-x border-cyan-500/10 bg-cyan-500/[0.02]" : ""
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

          {/* ── Mobile stacked cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
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
                    className={`px-5 py-3.5 border-b flex items-center justify-between ${
                      isPro ? "border-cyan-500/20 bg-cyan-500/[0.06]" : "border-slate-800"
                    }`}
                  >
                    <span className={`text-sm font-bold ${isPro ? "text-cyan-400" : "text-white"}`}>
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
                          className={`flex items-center justify-between px-5 py-3 text-sm ${
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

      {/* ── ROI ── */}
      <section className="py-24 border-t border-white/5">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 lg:p-12 text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              The real ROI of a verified identity
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
              A stronger professional identity helps you stand out — not just with a polished resume,
              but with verifiable achievements and evidence-backed experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-lg">Everything you need to know about Patorbit plans.</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 10 }}
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
                      className={`w-full flex items-center justify-between gap-4 px-6 py-5 text-left ${focusRing}`}
                    >
                      <span className="text-sm font-semibold text-white">{faq.q}</span>
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
                      <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to build your <span className="text-gradient">Professional Identity?</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
              Start free and verify your first achievements today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/resume-builder"
                className={`group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all hover:scale-[1.02] ${focusRing}`}
              >
                Start Free Today
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/contact"
                className={`inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-8 py-3.5 text-base font-medium text-slate-300 hover:bg-slate-900 hover:border-slate-700 hover:text-white transition-all ${focusRing}`}
              >
                Talk to Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
