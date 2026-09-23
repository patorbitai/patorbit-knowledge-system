"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { ShieldCheck, X, Check, EyeOff, UserCheck, FileCheck2 } from "lucide-react";

const principles = [
  {
    icon: EyeOff,
    title: "Missing skills stay missing",
    desc: "If a job requires a skill you don't have, we report the gap — we never write it into your resume.",
  },
  {
    icon: FileCheck2,
    title: "Suggestions come from your history",
    desc: "AI rewrites and reorders what you already did. It cannot add employers, degrees, or achievements.",
  },
  {
    icon: UserCheck,
    title: "You approve every change",
    desc: "Nothing is saved to your resume until you review and accept it.",
  },
];

export default function TruthfulAI() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative bg-surface-sunken py-24 lg:py-32 overflow-hidden"
      aria-label="Truthful AI"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <div
          className="text-center mb-14"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
          }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-emerald-400">
              Truthful AI
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-ink lg:text-4xl">
            Patorbit doesn&apos;t invent{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              your experience
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-ink-secondary leading-relaxed max-w-2xl mx-auto">
            Other tools fill gaps with fiction. We show you the gap and leave the decision to you.
          </p>
        </div>

        {/* The example — side by side */}
        <div
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-14"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.4s ease-out 0.1s, transform 0.4s ease-out 0.1s",
          }}
        >
          {/* Scenario */}
          <div className="rounded-xl border border-subtle bg-surface p-6">
            <div className="text-[11px] uppercase tracking-wider text-ink-muted font-medium mb-3">
              The job requires
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 mb-5">
              <span className="text-sm font-semibold text-ink">Snowflake</span>
            </div>
            <div className="text-[11px] uppercase tracking-wider text-ink-muted font-medium mb-3">
              Your profile contains
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5">
              <span className="text-sm text-red-300">No Snowflake experience</span>
            </div>
          </div>

          {/* Two outcomes */}
          <div className="space-y-4">
            {/* Wrong outcome */}
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-5">
              <div className="flex items-center gap-2 mb-2">
                <X className="w-4 h-4 text-red-400" aria-hidden="true" />
                <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">
                  What other tools add
                </span>
              </div>
              <p className="text-sm text-ink-secondary italic leading-relaxed">
                &ldquo;Experienced with Snowflake data warehousing…&rdquo;
              </p>
              <p className="text-[11px] text-red-400/80 mt-2">
                False — and easily caught in an interview.
              </p>
            </div>

            {/* Right outcome */}
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                  What Patorbit does
                </span>
              </div>
              <ul className="space-y-1.5 text-sm text-ink-secondary">
                <li>Missing skill: Snowflake</li>
                <li className="text-ink-secondary">We won&apos;t add it to your resume.</li>
                <li className="text-ink-secondary">Consider learning it or gaining relevant experience.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Principles */}
        <div
          className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.4s ease-out 0.2s, transform 0.4s ease-out 0.2s",
          }}
        >
          {principles.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-subtle bg-surface p-6 transition-colors duration-300 hover:border-emerald-500/30"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p.icon className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-2">{p.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
