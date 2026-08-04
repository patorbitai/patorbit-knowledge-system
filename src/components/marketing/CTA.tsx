"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export default function CTA() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative bg-[#070B14] py-24 lg:py-32 overflow-hidden"
      aria-label="Get Started"
    >
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/[0.08] via-blue-500/[0.04] to-transparent rounded-full blur-3xl" style={{ width: "80%", height: "80%", left: "10%", top: "10%" }} />

      <div
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}
        className="relative mx-auto max-w-7xl px-6"
      >
        <div className="relative rounded-2xl border border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-900/60 p-8 lg:p-16 text-center overflow-hidden">
          {/* Glow orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-cyan-500/[0.06] to-transparent rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-radial from-blue-500/[0.04] to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
                Get Started Free
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white max-w-2xl mx-auto">
              Ready to Build Your{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Professional Passport
              </span>
              ?
            </h2>

            <p className="mt-4 text-[17px] text-slate-400 leading-relaxed max-w-md mx-auto">
              Join thousands of professionals who trust Patorbit to verify and showcase their credentials.
            </p>

            {/* CTA Button */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/resume-builder"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
              >
                Build Your Passport
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-8 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100"
              >
                Book a Demo
              </Link>
            </div>

            {/* Trust builders */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {["Free Forever", "No Credit Card", "Setup in 2 Minutes", "Cancel Anytime"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
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
