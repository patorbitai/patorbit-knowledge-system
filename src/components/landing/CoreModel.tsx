"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";

const steps = [
  { label: "Identity", icon: "👤", color: "border-cyan-500 bg-cyan-500/10 text-cyan-400" },
  { label: "Claims", icon: "📋", color: "border-blue-500 bg-blue-500/10 text-blue-400" },
  { label: "Evidence", icon: "🔍", color: "border-indigo-500 bg-indigo-500/10 text-indigo-400" },
  { label: "Reasoning", icon: "🧠", color: "border-purple-500 bg-purple-500/10 text-purple-400" },
  { label: "Confidence", icon: "⚖️", color: "border-emerald-500 bg-emerald-500/10 text-emerald-400" },
  { label: "Trust", icon: "✅", color: "border-cyan-500 bg-cyan-500/10 text-cyan-400" },
];

function StepCard({ step, index }: { step: typeof steps[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className="relative group z-10"
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
        transition: `opacity 0.2s ease-out ${index * 0.08}s, transform 0.2s ease-out ${index * 0.08}s`,
      }}
    >
      <div className="w-64 rounded-xl border-2 bg-slate-900/90 p-6 backdrop-blur-xl transition-all duration-150 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-0.5">
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.color} border-2 transition-all duration-150`}>
            <span className="text-xl">{step.icon}</span>
          </div>
          <div>
            <span className="text-sm text-slate-500 block">Step {index + 1}</span>
            <span className="text-lg font-semibold text-white">{step.label}</span>
          </div>
        </div>

        <div className="mt-4 h-0.5 w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

        <p className="mt-4 text-sm text-slate-400">
          {index === 0 && "The foundation of trust—digital identities that persist beyond profiles."}
          {index === 1 && "Structured assertions about identity, experience, or capabilities."}
          {index === 2 && "Verifiable data that supports, contradicts, or clarifies claims."}
          {index === 3 && "Transparent reasoning that connects evidence to conclusions."}
          {index === 4 && "Evaluated confidence based on available evidence and reasoning quality."}
          {index === 5 && "The outcome—an earned trust relationship built on transparency."}
        </p>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 transition-colors duration-150 group-hover:text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 transition-colors duration-150 group-hover:bg-cyan-400" />
          <span>Core Concept</span>
        </div>
      </div>

      {/* Arrow to next step */}
      {index < steps.length - 1 && (
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden text-cyan-400 lg:block">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function CoreModel() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <section className="relative bg-slate-950 py-32 text-white overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/3 to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-t from-blue-500/3 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl">
          <div
            ref={headerRef}
            style={{
              opacity: headerInView ? 1 : 0,
              transform: headerInView ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
            }}
          >
            <span className="inline-block rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-sm font-medium text-cyan-400 backdrop-blur-sm mb-6">
              Foundation Architecture
            </span>

            <h2 className="text-4xl font-bold md:text-5xl mb-6">
              The <span className="text-gradient">Patorbit Knowledge Model</span>
            </h2>

            <p className="text-lg text-slate-400 leading-relaxed">
              Every trusted interaction flows through our six foundational concepts—creating a chain of evidence that builds verifiable trust.
            </p>
          </div>
        </div>

        <div className="mt-20">
          <div className="relative mx-auto flex flex-wrap items-center justify-center gap-6">
            <div className="absolute top-1/2 left-0 right-0 hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 via-indigo-500/20 via-purple-500/20 to-emerald-500/20 lg:block" />

            {steps.map((step, index) => (
              <StepCard key={step.label} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
