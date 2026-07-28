"use client";

import { motion } from "framer-motion";

export default function CoreModel() {
  const steps = [
    { label: "Identity", icon: "👤", color: "border-cyan-500 bg-cyan-500/10 text-cyan-400" },
    { label: "Claims", icon: "📋", color: "border-blue-500 bg-blue-500/10 text-blue-400" },
    { label: "Evidence", icon: "🔍", color: "border-indigo-500 bg-indigo-500/10 text-indigo-400" },
    { label: "Reasoning", icon: "🧠", color: "border-purple-500 bg-purple-500/10 text-purple-400" },
    { label: "Confidence", icon: "⚖️", color: "border-emerald-500 bg-emerald-500/10 text-emerald-400" },
    { label: "Trust", icon: "✅", color: "border-cyan-500 bg-cyan-500/10 text-cyan-400" },
  ];

  return (
    <section className="relative bg-slate-950 py-32 text-white overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/3 to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-t from-blue-500/3 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
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
          </motion.div>
        </div>

        <div className="mt-20">
          <div className="relative mx-auto flex flex-wrap items-center justify-center gap-6">
            {/* Connection line background */}
            <div className="absolute top-1/2 left-0 right-0 hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 via-indigo-500/20 via-purple-500/20 to-emerald-500/20 lg:block" />

            {steps.map((step, index) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
                className="relative group z-10"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-64 rounded-2xl border-2 bg-slate-900/90 p-6 backdrop-blur-xl transition-all duration-300 group-hover:shadow-xl group-hover:shadow-cyan-500/10"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.color} border-2 transition-all group-hover:scale-110`}
                    >
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

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-400" />
                    <span>Core Concept</span>
                  </div>
                </motion.div>

                {/* Arrow to next step */}
                {index < steps.length - 1 && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden text-cyan-400 lg:block">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}