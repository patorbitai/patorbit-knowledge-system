"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Shield, Brain, Zap } from "lucide-react";

const layers = [
  {
    title: "Identity Layer",
    desc: "Self-sovereign identities with persistent, portable profiles across every platform.",
    icon: Shield,
    color: "cyan",
    gradient: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
    capabilities: ["Decentralized identity", "Cross-platform sync", "Privacy-first design", "Verifiable credentials"],
  },
  {
    title: "Claims Layer",
    desc: "Structured assertions about skills, experience, and credentials with full provenance tracking.",
    icon: Brain,
    color: "blue",
    gradient: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
    capabilities: ["Structured assertions", "Provenance tracking", "Lifecycle management", "Relationship mapping"],
  },
  {
    title: "Evidence Layer",
    desc: "Connect every claim to verifiable supporting data from trusted sources and institutions.",
    icon: Zap,
    color: "indigo",
    gradient: "from-indigo-500/20 to-indigo-500/5",
    iconColor: "text-indigo-400",
    capabilities: ["Verification protocols", "Document anchoring", "Peer verification", "API integrations"],
  },
  {
    title: "Reasoning Layer",
    desc: "Explainable AI that evaluates confidence, surfaces contradictions, and suggests improvements.",
    icon: Brain,
    color: "purple",
    gradient: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
    capabilities: ["Confidence scoring", "Contradiction detection", "Gap analysis", "Explainable AI"],
  },
  {
    title: "Trust Layer",
    desc: "Combine claims, evidence, and reasoning into transparent, auditable trust decisions.",
    icon: Shield,
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
    capabilities: ["Trust scoring", "Audit trails", "Decision transparency", "Compliance ready"],
  },
];

const stats = [
  { label: "Identity Nodes", value: "50K+" },
  { label: "Claims Processed", value: "120K+" },
  { label: "Verifications Completed", value: "200K+" },
  { label: "Platform Uptime", value: "99.9%" },
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-slate-800/50 pt-32 pb-24 md:pb-28">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 -left-32 w-96 h-96 rounded-full blur-[128px] opacity-30 bg-gradient-radial from-cyan-500/10 to-transparent" />
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-white/[0.03] px-3.5 py-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">Platform Architecture</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Built on a{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Knowledge Graph
              </span>
              <br />Not Documents
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Five interconnected layers that transform raw claims into verifiable trust — from identity to evidence to confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Arch Layers */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="space-y-12 relative">
            {/* Connecting line */}
            <div className="absolute left-[31px] top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-blue-500/40 to-emerald-500/40 hidden md:block" />

            {layers.map((layer, i) => (
              <motion.div
                key={layer.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative pl-0 md:pl-16"
              >
                <div className="hidden md:flex absolute left-[14px] top-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-slate-900 border-2 border-slate-700 group-hover:border-cyan-500/50 transition-colors z-10 items-center justify-center">
                  <span className="text-[10px] font-bold tabular-nums text-slate-400 group-hover:text-cyan-400 transition-colors">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/60 to-slate-900/30 p-6 lg:p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700/60">
                  <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
                    <div className={`hidden lg:flex w-16 h-16 rounded-2xl bg-gradient-to-br ${layer.gradient} items-center justify-center shrink-0 border border-white/[0.06]`}>
                      <layer.icon className={`h-7 w-7 ${layer.iconColor}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-xl lg:text-2xl font-bold text-white">{layer.title}</h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed mb-6">{layer.desc}</p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {layer.capabilities.map((cap) => (
                          <div key={cap} className="flex items-center gap-2 text-xs text-slate-500">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
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

      {/* Stats */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center border-t border-slate-800/50">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to integrate with the knowledge graph?</h2>
          <p className="text-[17px] text-slate-400 mb-8 max-w-md mx-auto">Comprehensive docs, SDKs, and API references to get you building quickly.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/docs" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100">
              Read Documentation
              <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/api-access" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100">
              Start API Integration
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
