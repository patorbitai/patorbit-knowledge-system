"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const claims = [
  { icon: "🎓", title: "B.S. Computer Science", issuer: "MIT", status: "verified" },
  { icon: "💼", title: "Senior Engineer @ Stripe", issuer: "HR Verified", status: "verified" },
  { icon: "🏆", title: "Authored 12 OSS packages", issuer: "GitHub", status: "self-claimed" },
  { icon: "📄", title: "Published 3 Research Papers", issuer: "DOI Registry", status: "verified" },
  { icon: "🌟", title: "Led team of 8 engineers", issuer: "Peer References", status: "pending" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-slate-950 flex items-center overflow-hidden">
      {/* Deep background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950 to-slate-950" />
        {/* Glowing accent */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-cyan-500/8 via-blue-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT: Copy */}
          <div className="pt-28 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5"
            >
              <span className="flex h-2 w-2 relative">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs text-slate-400 tracking-wide uppercase font-medium">Live on Mainnet</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-white"
            >
              What if your
              <br />
              <span className="relative">
                <span className="text-gradient">career told</span>
                <br />
                <span className="text-gradient">the truth?</span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-base text-slate-400 leading-relaxed max-w-md"
            >
              Resumes are just claims. Patorbit connects every claim to real evidence — degrees, work history, skills, peer validation — into a knowledge graph you control.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-3"
            >
              <Link href="/resume-builder" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 transition-all">
                Build Your Resume (Free)
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 px-6 py-3 text-sm text-slate-300 hover:bg-slate-900 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                Explore Platform
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-12 pt-8 border-t border-slate-800/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-950 flex items-center justify-center text-xs text-white font-medium">A</div>
                  <div className="w-7 h-7 rounded-full bg-slate-600 border-2 border-slate-950 flex items-center justify-center text-xs text-white font-medium">S</div>
                  <div className="w-7 h-7 rounded-full bg-slate-500 border-2 border-slate-950 flex items-center justify-center text-xs text-white font-medium">M</div>
                </div>
                <span className="text-xs text-slate-500">
                  <span className="text-slate-300 font-medium">120+</span> professionals have connected <span className="text-slate-300 font-medium">3.2K</span> claims this month
                </span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Claims Feed */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-24 lg:pt-0"
          >
            <div className="relative">
              {/* Card stack */}
              <div className="relative z-10 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">P</div>
                    <div>
                      <div className="text-sm font-medium text-white">you@ career.patorbit.ai</div>
                      <div className="text-xs text-slate-500">Your Knowledge Graph</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                  </div>
                </div>

                {/* Claims list */}
                <div className="divide-y divide-slate-800/50">
                  {claims.map((claim, i) => (
                    <motion.div
                      key={claim.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.08, duration: 0.3 }}
                      className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    >
                      <span className="text-lg">{claim.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200 truncate">{claim.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{claim.issuer}</div>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full
                        ${claim.status === "verified" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          claim.status === "self-claimed" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full
                          ${claim.status === "verified" ? "bg-emerald-400" :
                            claim.status === "self-claimed" ? "bg-amber-400" : "bg-slate-500"}`} />
                        {claim.status === "verified" ? "Verified" : claim.status === "self-claimed" ? "Self-Claimed" : "Pending"}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 text-center">
                  <span className="text-xs text-slate-500">
                    <span className="text-cyan-400 font-medium">5 connected</span> — Verify rate: <span className="text-slate-300 font-medium">60%</span>
                  </span>
                </div>
              </div>

              {/* Decorative cards behind */}
              <div className="absolute -bottom-2 -left-2 -right-2 rounded-2xl border border-slate-800/50 bg-slate-900/30 h-full -z-10" />
              <div className="absolute -bottom-4 -left-4 -right-4 rounded-2xl border border-slate-800/30 bg-slate-900/10 h-full -z-20" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
