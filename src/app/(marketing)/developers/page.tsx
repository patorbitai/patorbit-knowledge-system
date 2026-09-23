"use client";

import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";
import { motion } from "framer-motion";

/* Developer hub — only claims what exists.
   EXISTS today: session-authenticated internal API, docs, changelog, status page.
   IN DEVELOPMENT: public API keys, webhooks, SDKs — labeled as such. */

const available = [
  {
    icon: "📘",
    title: "Documentation",
    desc: "Quick start, claims & evidence, trust signals, error codes, and rate limits.",
    href: "/docs",
  },
  {
    icon: "🔌",
    title: "API Reference",
    desc: "The real internal API the product uses — resumes, claims, evidence, import, AI match. Session-authenticated.",
    href: "/api-reference",
  },
  {
    icon: "🧾",
    title: "Changelog",
    desc: "What shipped, when, and what it fixed.",
    href: "/changelog",
  },
  {
    icon: "📡",
    title: "Status",
    desc: "Component-level service status and incident notices.",
    href: "/status",
  },
];

const planned = [
  {
    icon: "🔑",
    title: "Public API keys",
    desc: "Key-authenticated machine access with rate limits — in development.",
    href: "/api-access",
  },
  {
    icon: "🔗",
    title: "Webhooks",
    desc: "Outgoing event notifications — planned, not available yet.",
    href: "/api-access",
  },
  {
    icon: "📦",
    title: "SDKs",
    desc: "Typed client libraries — planned, not available yet.",
    href: "/api-access",
  },
];

export default function DevelopersPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-sm text-cyan-400 mb-6">Developers</span>
            <h1 className="text-5xl font-bold text-ink mb-6">Developer Hub</h1>
            <p className="text-ink-secondary text-lg max-w-2xl mx-auto">
              Docs and APIs that exist today — clearly separated from what&apos;s still
              being built. No phantom endpoints.
            </p>
          </motion.div>

          {/* Available now */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Available now
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {available.map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <Link
                    href={item.href}
                    className="block h-full rounded-xl border border-subtle bg-surface/60 p-7 hover:border-cyan-500/30 hover:-translate-y-1 transition-all"
                  >
                    <div className="text-3xl mb-4">{item.icon}</div>
                    <h3 className="text-xl font-semibold text-ink mb-2">{item.title}</h3>
                    <p className="text-ink-secondary text-sm">{item.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* In development */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                In development
              </span>
              <span className="text-sm text-ink-muted">Not usable yet — labeled honestly</span>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {planned.map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <Link
                    href={item.href}
                    className="block h-full rounded-xl border border-subtle bg-surface/40 p-7 hover:border-amber-500/30 transition-all opacity-90"
                  >
                    <div className="text-3xl mb-4">{item.icon}</div>
                    <h3 className="text-lg font-semibold text-ink mb-2">{item.title}</h3>
                    <p className="text-ink-muted text-sm">{item.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Honesty note */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-5 mb-14 flex items-start gap-3">
            <Construction className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-ink-secondary">
              Patorbit does <strong>not</strong> offer Python/JavaScript/Go SDKs, a CLI,
              a sandbox environment, or usage analytics today. When we do, they&apos;ll
              appear here with real installation instructions.
            </p>
          </motion.div>

          {/* CTA */}
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-bold text-ink mb-4">Building something with Patorbit?</h2>
              <p className="text-ink-secondary text-lg mb-8 max-w-md mx-auto">
                Tell us your use case — early public-API access is granted case by case.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-ink shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
                >
                  Contact Us
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-ink-secondary transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-ink hover:scale-[1.02] active:scale-100"
                >
                  Read the Docs
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
