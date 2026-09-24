"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Check } from "lucide-react";
import { track } from "@/lib/analytics";

const trustItems = [
  "No credit card required",
  "Free plan: 2 resumes, 5 job analyses, 3 AI tailors a month",
  "You approve every change",
];

export default function CTA() {
  const { data: session } = useSession();

  return (
    <section className="relative bg-surface-sunken py-24 lg:py-32 overflow-hidden" aria-label="Get Started">
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/[0.06] via-blue-500/[0.03] to-transparent rounded-full blur-3xl" style={{ width: "80%", height: "80%", left: "10%", top: "10%" }} />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="relative rounded-2xl border border-subtle bg-gradient-to-b from-slate-900 to-slate-900/60 p-8 lg:p-16 text-center overflow-hidden">
          <div className="relative">
            {/* Headline */}
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-ink max-w-2xl mx-auto">
              Your next resume starts{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                with one profile
              </span>
            </h2>

            <p className="mt-4 text-[17px] text-ink-secondary leading-relaxed max-w-md mx-auto">
              Import your experience once. Add a job, review the evidence-based
              match, and export a tailored resume — your master profile stays
              unchanged.
            </p>

            {/* Single primary CTA — same wording as the hero */}
            <div className="mt-8 flex justify-center">
              <Link
                href={session ? "/overview" : "/register"}
                onClick={() => track("landing_cta_clicked", { location: "bottom" })}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-semibold text-ink shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
              >
                Build my profile
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>

            {/* Honest trust builders — real free-tier limits, stated up front */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {trustItems.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
