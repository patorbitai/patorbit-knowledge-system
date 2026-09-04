"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const coreConcepts = [
  {
    icon: "🆔",
    title: "Identity",
    desc: "A unique digital identity that anchors all claims and evidence to a real person or organization.",
  },
  {
    icon: "📋",
    title: "Claim",
    desc: "Any assertion — a degree earned, a skill mastered, a project delivered — awaiting verification.",
  },
  {
    icon: "🔍",
    title: "Evidence",
    desc: "Verifiable proof backing each claim: certificates, references, data sources, or peer validation.",
  },
  {
    icon: "🧠",
    title: "Reasoning",
    desc: "Explainable logic behind every trust decision, so nothing is a black box.",
  },
  {
    icon: "📊",
    title: "Confidence",
    desc: "A measurable score for each claim, computed from the strength and quality of its evidence.",
  },
  {
    icon: "🤝",
    title: "Trust",
    desc: "The output — a transparent, verifiable trust score that speaks louder than any resume.",
  },
];

const platformLayers = [
  {
    title: "Presentation",
    items: ["Landing Website", "Dashboard", "Authentication", "Admin Panel"],
  },
  {
    title: "Application",
    items: ["Authentication", "Knowledge Management", "Trust Engine", "Search", "AI Services"],
  },
  {
    title: "Data",
    items: ["PostgreSQL", "Prisma ORM", "Knowledge Graph", "Vector Database"],
  },
  {
    title: "Infrastructure",
    items: ["Next.js", "Vercel", "GitHub", "AI Models"],
  },
];

const users = [
  { icon: "👤", title: "Individuals", desc: "Own your career story with verifiable proof." },
  { icon: "🏢", title: "Organizations", desc: "Hire and partner with confidence." },
  { icon: "🔬", title: "Researchers", desc: "Build trust in academic contributions." },
  { icon: "💻", title: "Developers", desc: "Integrate trust into your own platforms." },
];

export function AboutPageClient() {
  return (
    <main className="min-h-screen bg-slate-950">
      {/* ── Hero ── */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950 to-slate-950" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-radial from-cyan-500/8 via-blue-500/5 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400 tracking-wide uppercase font-medium">About Patorbit</span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white"
          >
            Trust should be
            <br />
            <span className="text-gradient">earned through evidence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Patorbit is a knowledge-centric platform that helps people and organizations build trust
            through structured, verifiable knowledge — instead of isolated, unverifiable documents.
          </motion.p>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10 p-8 sm:p-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Our Mission</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p className="text-lg">
                Founded in 2026, Patorbit emerged from a simple but powerful observation: today&apos;s systems
                store information but rarely capture the reasoning behind it.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
                {[
                  "Knowledge is fragmented",
                  "Trust is difficult to establish",
                  "Claims are hard to verify",
                  "Evidence is disconnected",
                  "Decisions lack transparency",
                ].map((problem, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10 text-red-400 text-xs font-bold">✕</span>
                    <span className="text-sm">{problem}</span>
                  </div>
                ))}
              </div>
              <p>
                Our platform combines cutting-edge AI for trust scoring, decentralized identity principles
                for user sovereignty, and graph technology to represent the interconnected nature of
                real-world trust relationships.
              </p>
              <p className="text-cyan-400 font-semibold">
                We believe trust must be transparent, evidence-backed, and user-controlled. Every feature
                we build serves that mission.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Core Concepts ── */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">The PKS Framework</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Six core concepts that form a connected knowledge graph for explainable, trustworthy decision-making.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreConcepts.map((concept, i) => (
              <motion.div
                key={concept.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-slate-900/60 rounded-xl border border-white/10 p-6 hover:border-cyan-500/30 hover:bg-slate-900/80 transition-all group"
              >
                <span className="text-3xl mb-4 block">{concept.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{concept.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{concept.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Architecture ── */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Platform Architecture</h2>
            <p className="text-slate-400 text-lg">
              Built on modern, scalable infrastructure from day one.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformLayers.map((layer, i) => (
              <motion.div
                key={layer.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900/60 rounded-xl border border-white/10 p-6"
              >
                <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">{layer.title}</h3>
                <ul className="space-y-2.5">
                  {layer.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Users ── */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Who It&apos;s For</h2>
            <p className="text-slate-400 text-lg">Built for everyone who values trust and transparency.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {users.map((user, i) => (
              <motion.div
                key={user.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-white/10 p-6 text-center hover:border-cyan-500/30 transition-all"
              >
                <span className="text-4xl mb-4 block">{user.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{user.title}</h3>
                <p className="text-sm text-slate-400">{user.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Want to learn more about our mission?
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              We&apos;re building the infrastructure for digital trust — one verified claim at a time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                Learn Our Story
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-8 py-3.5 text-base font-medium text-slate-300 hover:bg-slate-900 hover:border-slate-700 hover:text-white transition-all"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
