"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

const logos = [
  { name: "MIT", abbr: "MIT" },
  { name: "Stanford", abbr: "SU" },
  { name: "Stripe", abbr: "ST" },
  { name: "Vercel", abbr: "▲" },
  { name: "OpenAI", abbr: "OA" },
  { name: "GitHub", abbr: "GH" },
  { name: "Harvard", abbr: "HU" },
  { name: "Google", abbr: "G" },
];

export default function SocialProof() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#070B14] border-y border-slate-800/60 py-16 overflow-hidden"
      aria-label="Trusted by"
    >
      <div className="relative mx-auto max-w-7xl px-6">
        <p
          className="text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-500 mb-10"
          style={{
            opacity: isInView ? 1 : 0,
            transition: "opacity 0.25s ease-out",
          }}
        >
          Trusted by professionals at
        </p>

        <div
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14"
          style={{
            opacity: isInView ? 1 : 0,
            transition: "opacity 0.3s ease-out 0.1s",
          }}
        >
          {logos.map((logo, i) => (
            <div
              key={logo.name}
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(8px)",
                transition: `opacity 0.2s ease-out ${0.04 + i * 0.03}s, transform 0.2s ease-out ${0.04 + i * 0.03}s`,
              }}
              className="group flex items-center gap-2.5 opacity-40 grayscale transition-all duration-150 hover:opacity-80 hover:grayscale-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/40 text-[11px] font-semibold text-slate-400 transition-colors duration-150 group-hover:border-slate-600 group-hover:text-slate-200">
                {logo.abbr}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-slate-500 tracking-wide transition-colors duration-150 group-hover:text-slate-300">
                {logo.name}
              </span>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {[
            { target: 3200, suffix: "+", label: "Professionals" },
            { target: 12000, suffix: "+", label: "Credentials Verified" },
            { target: 94, suffix: "%", label: "Verification Accuracy" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(12px)",
                transition: `opacity 0.3s ease-out ${0.3 + i * 0.08}s, transform 0.3s ease-out ${0.3 + i * 0.08}s`,
              }}
              className="text-center"
            >
              <div className="text-2xl lg:text-3xl font-bold text-white tabular-nums">
                <AnimatedCounter target={stat.target} suffix={stat.suffix} duration={2200} />
              </div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
