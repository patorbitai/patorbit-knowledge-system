"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { FileText, XCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const comparisons = [
  {
    label: "Professional information",
    resume: "Re-entered for every resume",
    patorbit: "One Professional Identity, reused everywhere",
  },
  {
    label: "Multiple versions",
    resume: "Manual copies with confusing file names",
    patorbit: "Multiple resumes from one source",
  },
  {
    label: "Job tailoring",
    resume: "Manual editing for each application",
    patorbit: "AI-assisted tailoring from job description",
  },
  {
    label: "AI changes",
    resume: "Hard to review or reject",
    patorbit: "Review every change before approval",
  },
  {
    label: "Truthfulness",
    resume: "Depends on your workflow",
    patorbit: "Explicit factuality safeguards",
  },
  {
    label: "Design",
    resume: "Separate template tools",
    patorbit: "Built-in professional templates",
  },
];

export default function ComparisonTable() {
  const { data: session } = useSession();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      ref={sectionRef}
      className="relative bg-surface-sunken py-24 lg:py-32 overflow-hidden"
      aria-label="Comparison"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-transparent to-slate-900/20" />
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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-subtle bg-slate-900/60 px-3.5 py-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-ink-secondary">
              Why Patorbit
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-ink lg:text-4xl">
            Traditional workflow vs.{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Patorbit
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-ink-secondary leading-relaxed max-w-xl mx-auto">
            Stop rebuilding your resume from scratch for every application.
          </p>
        </div>

        {/* Comparison table */}
        <div
          className="max-w-4xl mx-auto"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.4s ease-out 0.1s, transform 0.4s ease-out 0.1s",
          }}
        >
          {/* Table header */}
          <div className="grid grid-cols-3 gap-4 mb-2 px-4">
            <div className="text-xs uppercase tracking-wider text-ink-muted font-medium" />
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-muted font-medium">
              <FileText className="w-3.5 h-3.5" />
              Traditional
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-cyan-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Patorbit
            </div>
          </div>

          {/* Table rows */}
          {comparisons.map((row, i) => (
            <div
              key={row.label}
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(10px)",
                transition: `opacity 0.3s ease-out ${0.15 + i * 0.05}s, transform 0.3s ease-out ${0.15 + i * 0.05}s`,
              }}
              className={`grid grid-cols-3 gap-4 items-center rounded-xl px-4 py-4 ${
                i % 2 === 0 ? "bg-white/[0.02]" : ""
              }`}
            >
              <div className="text-sm font-medium text-ink-secondary">{row.label}</div>
              <div className="flex items-center gap-3 text-sm text-ink-muted">
                <XCircle className="w-4 h-4 text-red-400/60 shrink-0" />
                <span>{row.resume}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-secondary">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{row.patorbit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transition: "opacity 0.4s ease-out 0.5s",
          }}
          className="text-center mt-12"
        >
          <Link
            href={session ? "/overview" : "/register"}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-ink shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
