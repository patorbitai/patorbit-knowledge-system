"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { Target, CheckCircle2, AlertTriangle, X } from "lucide-react";

const matchedSkills = ["Python", "SQL", "Azure Data Factory", "PySpark", "ETL Pipelines"];
const partialMatches = ["Databricks", "Airflow"];
const missingSkills = ["Power BI", "Snowflake"];

export default function TrustScoreDemo() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative bg-[#070B14] py-24 lg:py-32 overflow-hidden"
      aria-label="AI Job Tailoring"
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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
              AI Job Tailoring
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            See how your resume{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              matches the job
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-slate-400 leading-relaxed max-w-xl mx-auto">
            Paste a job description and Patorbit analyzes the match — showing what you already have, what partially matches, and what's missing.
          </p>
        </div>

        {/* Match demo */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.4s ease-out 0.1s, transform 0.4s ease-out 0.1s",
          }}
          className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-start"
        >
          {/* Score visual */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-8 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2">Job Match Score</div>
            <div className="text-7xl font-bold tabular-nums bg-gradient-to-r from-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              82
            </div>
            <div className="text-lg text-slate-500 font-medium mt-1">/100</div>

            {/* Score bar */}
            <div className="mt-6 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400" style={{ width: "82%" }} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              {[
                { label: "Matched Skills", value: "5" },
                { label: "Partial Matches", value: "2" },
                { label: "Missing Skills", value: "2" },
                { label: "Experience", value: "Strong" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
                  <div className="text-xs text-slate-500">{stat.label}</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill breakdown */}
          <div className="space-y-4">
            {/* Matched */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Matched ({matchedSkills.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.map((skill) => (
                  <span key={skill} className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Partial */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Partial ({partialMatches.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {partialMatches.map((skill) => (
                  <span key={skill} className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                    ~ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing */}
            <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <X className="w-4 h-4 text-red-500" />
                <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                  Missing ({missingSkills.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map((skill) => (
                  <span key={skill} className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-[11px] font-medium text-red-700 dark:text-red-300">
                    ! {skill}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-red-500/70 dark:text-red-400/50 mt-2">
                These were NOT added to the resume — they are missing from your profile.
              </p>
            </div>

            {/* Trust note */}
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] px-3 py-2">
              <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-relaxed">
                <strong className="text-gray-700 dark:text-slate-300">Truthful AI:</strong> Patorbit only works with information already in your resume. Missing skills are identified, not invented.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
