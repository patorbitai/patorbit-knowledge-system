"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Layout } from "lucide-react";

const templateShowcase = [
  { name: "Professional", category: "Single Column", color: "from-blue-500/20 to-blue-500/5" },
  { name: "Modern", category: "Two Column", color: "from-cyan-500/20 to-cyan-500/5" },
  { name: "Minimal ATS", category: "ATS Optimized", color: "from-emerald-500/20 to-emerald-500/5" },
  { name: "Timeline", category: "Chronological", color: "from-purple-500/20 to-purple-500/5" },
];

export default function ProfessionalPassport() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative bg-[#070B14] py-24 lg:py-32 overflow-hidden"
      aria-label="Templates"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
          }}
          className="text-center mb-16"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
            <Layout className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
              Templates
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            Choose from{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              professional layouts
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-slate-400 leading-relaxed max-w-xl mx-auto">
            Multiple layout families designed for different career stages. Your content stays the same — the presentation adapts.
          </p>
        </div>

        {/* Template cards */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease-out 0.1s, transform 0.5s ease-out 0.1s",
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {templateShowcase.map((template, i) => (
            <div
              key={template.name}
              style={{
                transition: `opacity 0.3s ease-out ${0.1 + i * 0.08}s, transform 0.3s ease-out ${0.1 + i * 0.08}s`,
              }}
              className="group rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/60 hover:shadow-2xl"
            >
              <div className={`mx-auto mb-4 flex h-16 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${template.color} border border-slate-700/40`}>
                <div className="w-8 h-10 rounded bg-white/10 border border-white/5" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{template.name}</h3>
              <p className="text-[11px] text-slate-500">{template.category}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transition: "opacity 0.4s ease-out 0.5s",
          }}
          className="text-center mt-10"
        >
          <Link
            href="/templates"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
          >
            Explore All Templates
            <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
