"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, ArrowDown, Check, X, FileText } from "lucide-react";
import { track } from "@/lib/analytics";

/* The real workflow, stated once: profile → job → match → tailored resume */
const flow = ["Your profile", "Job description", "Match", "Tailored resume"];

const trustItems = [
  "No credit card required",
  "Free plan: 2 resumes, 5 job analyses, 3 AI tailors a month",
  "You approve every change",
];

export default function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative bg-surface-sunken overflow-hidden" aria-label="Hero">
      {/* Static background — grid + soft glow, no animation */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070B14]/70 via-[#070B14]/90 to-[#070B14]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-cyan-500/[0.06] via-blue-500/[0.03] to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ─── LEFT: copy ─── */}
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.05] tracking-tight text-ink">
              Build your resume once.
              <br />
              <span className="text-gradient">Tailor it to every job.</span>
            </h1>

            <p className="mt-6 text-base sm:text-[17px] text-ink-secondary leading-relaxed max-w-xl">
              Import your experience into one master profile. For every job you
              apply to, Patorbit shows where you match the requirements, where
              the gaps are, and helps you write a resume for that role — using
              only what you&apos;ve actually done.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href={session ? "/overview" : "/register"}
                onClick={() => track("landing_cta_clicked", { location: "hero" })}
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-7 py-3.5 text-sm font-semibold text-brand-contrast transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Build my profile
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-7 py-3.5 text-sm font-medium text-ink-secondary transition-colors hover:border-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                See how it works
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              {trustItems.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* ─── RIGHT: product proof — the real transformation, static ─── */}
          <div className="relative rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-[0_0_60px_-15px_rgba(59,130,246,0.15)]">
            {/* Window chrome */}
            <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-[11px]">
                  P
                </div>
                <span className="text-sm font-medium text-white">Patorbit — Job tailoring</span>
              </div>
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <div className="w-2 h-2 rounded-full bg-slate-600" />
                <div className="w-2 h-2 rounded-full bg-slate-600" />
                <div className="w-2 h-2 rounded-full bg-slate-600" />
              </div>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Flow: profile → job → match → tailored resume */}
              <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5" aria-label="Workflow">
                {flow.map((label, i) => (
                  <li key={label} className="flex items-center gap-1.5">
                    <span
                      className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
                        i === flow.length - 1
                          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                          : "border-slate-700/70 bg-white/[0.03] text-slate-300"
                      }`}
                    >
                      {label}
                    </span>
                    {i < flow.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ol>

              {/* Requirement → your evidence (match) */}
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Requirement
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-600/80 bg-slate-800/70 px-2 py-0.5 text-xs font-semibold text-ink">
                    Python
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Your evidence
                  </span>
                  <p className="mt-1 flex items-start gap-2 text-xs text-slate-200 leading-relaxed">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    &ldquo;Built Python ETL pipelines on Azure Data
                    Factory…&rdquo; — found in your profile
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-md bg-emerald-500/10 px-2.5 py-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="text-[11px] text-emerald-200 leading-snug">
                    Tailored resume leads with your Python ETL work for this job
                  </span>
                </div>
              </div>

              {/* Requirement → gap (explicit, not invented) */}
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.05] p-3.5 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    Requirement
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-600/80 bg-slate-800/70 px-2 py-0.5 text-xs font-semibold text-ink">
                    HIPAA experience
                  </span>
                </div>
                <p className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                  <X className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  Not in your profile — reported as a gap, never added to your
                  resume
                </p>
              </div>

              {/* Outcome footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-slate-500">
                  Master profile stays unchanged — you approve every edit
                </span>
                <span className="inline-flex items-center gap-1.5" aria-hidden="true">
                  <span className="rounded border border-slate-700/70 bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                    PDF
                  </span>
                  <span className="rounded border border-slate-700/70 bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                    DOCX
                  </span>
                </span>
              </div>

              <p className="text-[10px] text-slate-600 flex items-center gap-1.5">
                <ArrowDown className="w-3 h-3 lg:hidden" aria-hidden="true" />
                Illustrative example using sample data
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
