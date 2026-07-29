"use client";

import { useRef, useState } from "react";
import { useInView } from "framer-motion";
import { ShieldCheck, Clock, Activity, ArrowUp } from "lucide-react";

const evidenceSources = [
  { label: "Academic Registries", value: 8, color: "#3b82f6" },
  { label: "Professional Networks", value: 6, color: "#8b5cf6" },
  { label: "Company Records", value: 5, color: "#f59e0b" },
  { label: "Certification Databases", value: 5, color: "#10b981" },
];

export default function TrustScoreDemo() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [hoveredSource, setHoveredSource] = useState<number | null>(null);

  return (
    <section
      ref={ref}
      className="relative bg-[#070B14] py-24 lg:py-32 overflow-hidden"
      aria-label="Trust Score"
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
              Trust Score
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            How your trust score is{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              calculated
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-slate-400 leading-relaxed max-w-xl mx-auto">
            Your Patorbit Trust Score is a weighted metric based on the depth, breadth, and verification of your credentials.
          </p>
        </div>

        {/* Score + evidence grid */}
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
            <div className="text-7xl font-bold tabular-nums bg-gradient-to-r from-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              84
            </div>
            <div className="text-lg text-slate-500 font-medium mt-1">/100</div>
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <ArrowUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Excellent</span>
            </div>

            {/* Score bar */}
            <div className="mt-6 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 transition-all duration-1000" style={{ width: "84%" }} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              {[
                { label: "Verified Claims", value: "24/24" },
                { label: "Evidence Sources", value: "12" },
                { label: "Graph Nodes", value: "68" },
                { label: "Confidence Score", value: "94%" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
                  <div className="text-xs text-slate-500">{stat.label}</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence sources */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Evidence Sources</span>
            </div>

            {evidenceSources.map((source, i) => (
              <div
                key={source.label}
                onMouseEnter={() => setHoveredSource(i)}
                onMouseLeave={() => setHoveredSource(null)}
                className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-4 transition-all duration-200 hover:border-slate-700/60"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-sm text-slate-300">{source.label}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{source.value}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: source.color,
                      width: hoveredSource === i ? "100%" : `${(source.value / 8) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Timeline */}
            <div className="mt-6 rounded-lg border border-slate-800/60 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">Verification Timeline</span>
              </div>
              <div className="space-y-2">
                {[
                  { time: "0.4s", event: "Resume parsed — 47 data points" },
                  { time: "1.2s", event: "12 claims extracted & mapped" },
                  { time: "0.8s", event: "Knowledge graph built" },
                  { time: "1.6s", event: "24 claim verifications completed" },
                ].map((item) => (
                  <div key={item.event} className="flex items-center gap-3 text-xs text-slate-400">
                    <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="font-mono text-slate-500 w-10">{item.time}</span>
                    <span>{item.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
