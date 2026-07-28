"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

const pipeline = [
  { id: "resume", icon: "📄", label: "Resume Imported", detail: "Parsing 3 pages · 47 data points", color: "#3b82f6" },
  { id: "extraction", icon: "🧠", label: "AI Extraction", detail: "LLM extracts 12 claims — degrees, titles, skills", color: "#8b5cf6" },
  { id: "graph", icon: "🔗", label: "Knowledge Graph", detail: "47 nodes · 132 edges · semantic map built", color: "#06b6d4" },
  { id: "verify", icon: "✓", label: "Evidence Verification", detail: "8 of 12 claims matched to verifiable sources", color: "#f59e0b" },
  { id: "score", icon: "⭐", label: "Trust Score Generated", detail: "Overall trust score: 84/100", color: "#10b981" },
];

const claims = [
  { icon: "🎓", title: "B.S. Computer Science", issuer: "MIT", badge: "Verified" },
  { icon: "💼", title: "Senior Engineer", issuer: "Stripe · HR Verified", badge: "Verified" },
  { icon: "📦", title: "12 OSS packages", issuer: "GitHub · npm registry", badge: "Verified" },
  { icon: "📄", title: "3 Research Papers", issuer: "DOI · ICLR 2024", badge: "Verified" },
  { icon: "🌟", title: "Led 8 engineers", issuer: "Peer References", badge: "Pending" },
];

export default function Hero() {
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [trustScore, setTrustScore] = useState(0);

  const advance = useCallback(() => {
    setStage((p) => {
      if (p >= pipeline.length - 1) { setDone(true); return p; }
      return p + 1;
    });
  }, []);

  useEffect(() => {
    if (!done) {
      const t = setTimeout(advance, stage === 0 ? 800 : 1400);
      return () => clearTimeout(t);
    }
  }, [stage, done, advance]);

  useEffect(() => {
    if (done && trustScore < 84) {
      const t = setTimeout(() => setTrustScore((s) => Math.min(84, s + 2)), 20);
      return () => clearTimeout(t);
    }
  }, [done, trustScore]);

  return (
    <section className="relative min-h-screen bg-[#070B14] flex items-center overflow-hidden" role="region" aria-label="Hero">
      {/* Grid + glow */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070B14]/90 via-[#070B14] to-[#070B14]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-radial from-cyan-500/6 via-blue-500/4 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-80px)]">

          {/* ─── LEFT ─── */}
          <div className="pt-28 lg:pt-0">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] text-slate-400 tracking-wider uppercase font-medium">Live on Mainnet</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.98] tracking-tight text-white">
              Your Career,<br />
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Verified as Code.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}
              className="mt-5 text-base text-slate-400 leading-relaxed max-w-md">
              Resumes are just claims. Patorbit extracts, verifies, and connects every credential into an AI-powered Knowledge Graph you own.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/resume-builder"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/25 transition-all duration-150">
                Build Your Passport
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-6 py-3 text-sm text-slate-300 hover:bg-slate-900 transition-all duration-150">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="10" r="3" /><path d="M22 17v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3" />
                </svg>
                Watch Demo
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.45 }}
              className="mt-12 pt-6 border-t border-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["A", "S", "M", "K"].map((l, i) => (
                    <div key={l} className={`w-7 h-7 rounded-full border-2 border-[#070B14] flex items-center justify-center text-[10px] text-white font-medium
                      ${i === 0 ? "bg-slate-700" : i === 1 ? "bg-slate-600" : i === 2 ? "bg-slate-500" : "bg-slate-400"}`}>
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  <span className="text-slate-300 font-semibold">120+</span> professionals connected <span className="text-slate-300 font-semibold">3.2K</span> claims
                </p>
              </div>
            </motion.div>
          </div>

          {/* ─── RIGHT: Animated Pipeline ─── */}
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
            className="pt-24 lg:pt-0">
            <div className="relative">
              <div className="relative z-10 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                {/* Card Header */}
                <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-[11px]">P</div>
                    <div>
                      <div className="text-sm font-medium text-white">career.patorbit.ai</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Live Demo
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                  </div>
                </div>

                {/* Pipeline */}
                <div className="px-5 py-5 space-y-2.5" role="log" aria-live="polite" aria-label="Pipeline stages">
                  {pipeline.map((p, i) => {
                    const isPast = i < stage;
                    const isCurrent = i === stage;
                    const isFuture = i > stage;
                    return (
                      <motion.div
                        key={p.id}
                        animate={{ opacity: isFuture ? 0.3 : 1 }}
                        transition={{ duration: 0.25 }}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all ${isCurrent
                          ? "bg-blue-500/10 border-blue-500/25 shadow-lg shadow-blue-500/5"
                          : isPast
                          ? "bg-white/[0.03] border-white/[0.06]"
                          : "bg-white/[0.015] border-white/[0.03]"
                        }`}
                      >
                        <motion.span
                          animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.4, repeat: isCurrent ? Infinity : 0, repeatDelay: 2.5 }}
                          className="text-lg shrink-0"
                        >
                          {isPast ? "✅" : p.icon}
                        </motion.span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${isCurrent ? "text-blue-300" : isPast ? "text-slate-300" : "text-slate-500"}`}>
                            {p.label}
                          </div>
                          {isCurrent && (
                            <motion.div initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
                              className="text-[11px] text-slate-500 mt-0.5">{p.detail}</motion.div>
                          )}
                        </div>
                        <div className="shrink-0">
                          {isPast ? (
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : isCurrent ? (
                            <svg className="animate-spin w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 20" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <span className="block w-1.5 h-1.5 rounded-full bg-slate-600" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Trust Score + Claims */}
                <AnimatePresence>
                  {done && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-800/50">
                      {/* Trust Score */}
                      <div className="px-5 py-4 border-b border-slate-800/50 flex items-center justify-between">
                        <span className="text-sm text-slate-300 font-medium">Trust Score</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-slate-700 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: "84%" }} transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
                          </div>
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                            className="text-sm font-bold text-emerald-400">{trustScore}</motion.span>
                        </div>
                      </div>

                      {/* Claims Feed */}
                      <div className="divide-y divide-slate-800/40">
                        {claims.map((c, i) => (
                          <motion.div key={c.title} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.2 }}
                            className="px-5 py-2.5 flex items-center gap-3">
                            <span className="text-base">{c.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-slate-200 truncate font-medium">{c.title}</div>
                              <div className="text-[10px] text-slate-500">{c.issuer}</div>
                            </div>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.badge === "Verified"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>{c.badge}</span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Badges + Recruiter Ready */}
                      <div className="px-5 py-3 border-t border-slate-800/50 flex items-center justify-between bg-slate-900/60">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">MIT</span>
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">Stripe</span>
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">GitHub</span>
                        </div>
                        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Recruiter Ready
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Ghost cards */}
              <div className="absolute -bottom-2 -left-2 -right-2 rounded-2xl border border-slate-800/40 bg-slate-900/20 h-full -z-10" />
              <div className="absolute -bottom-4 -left-4 -right-4 rounded-2xl border border-slate-800/20 bg-slate-900/10 h-full -z-20" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
