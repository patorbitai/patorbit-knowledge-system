"use client";

import { motion } from "framer-motion";

const layers = [
  {
    title: "Identity Layer",
    icon: "👤",
    desc: "Self-sovereign identities with persistent, portable profiles across every platform.",
    capabilities: ["Decentralized identity", "Cross-platform sync", "Privacy-first design", "Verifiable credentials"],
    color: "from-cyan-400 to-blue-400",
  },
  {
    title: "Claims Layer",
    icon: "📋",
    desc: "Structured assertions about skills, experience, and credentials with full provenance tracking.",
    capabilities: ["Structured assertions", "Provenance tracking", "Lifecycle management", "Relationship mapping"],
    color: "from-blue-400 to-indigo-400",
  },
  {
    title: "Evidence Layer",
    icon: "🔍",
    desc: "Connect every claim to verifiable supporting data from trusted sources and institutions.",
    capabilities: ["Verification protocols", "Document anchoring", "Peer verification", "API integrations"],
    color: "from-indigo-400 to-purple-400",
  },
  {
    title: "Reasoning Layer",
    icon: "🧠",
    desc: "Explainable AI that evaluates confidence, surfaces contradictions, and suggests improvements.",
    capabilities: ["Confidence scoring", "Contradiction detection", "Gap analysis", "Explainable AI"],
    color: "from-purple-400 to-pink-400",
  },
  {
    title: "Trust Layer",
    icon: "✅",
    desc: "Combine claims, evidence, and reasoning into transparent, auditable trust decisions.",
    capabilities: ["Trust scoring", "Audit trails", "Decision transparency", "Compliance ready"],
    color: "from-pink-400 to-emerald-400",
  },
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-slate-800/50 py-24">
        <div className="absolute inset-0 bg-grid-lg" />
        <div className="absolute top-0 -left-32 w-96 h-96 bg-cyan-500/8 rounded-full blur-[128px]" />
        <div className="mx-auto max-w-7xl px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-sm text-cyan-400 mb-6">Platform Architecture</span>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Built on a <span className="text-gradient">Knowledge Graph</span>
              <br />Not Documents
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              Five interconnected layers that transform raw claims into verifiable trust — from identity to evidence to confidence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Architecture Layers */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-blue-500/40 to-emerald-500/40 hidden md:block" />

            {layers.map((layer, i) => (
              <motion.div
                key={layer.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative mb-12 last:mb-0 pl-0 md:pl-20"
              >
                <div className="hidden md:block absolute left-4 top-8 w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 group-hover:border-cyan-500/50 transition-colors z-10" />
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-8 hover:border-cyan-500/30 transition-all hover:-translate-y-0.5">
                  <div className="flex items-start gap-6">
                    <div className="hidden md:flex w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 items-center justify-center text-3xl flex-shrink-0">
                      {layer.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-2xl font-bold text-white">{layer.title}</h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
                      </div>
                      <p className="text-slate-400 leading-relaxed mb-6">{layer.desc}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {layer.capabilities.map((cap) => (
                          <div key={cap} className="flex items-center gap-2 text-sm text-slate-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400" />
                            {cap}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800/50 py-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Build on Patorbit?</h2>
          <p className="text-slate-400 mb-10">Start with a Career Passport or integrate our APIs into your platform.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all hover:-translate-y-0.5">
              Start Building
            </button>
            <button className="rounded-xl border border-slate-700 px-8 py-4 text-sm font-medium text-slate-300 hover:bg-slate-800/50 transition-all">
              View Documentation
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
