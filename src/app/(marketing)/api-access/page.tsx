"use client";

import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";
import { motion } from "framer-motion";

/* Honest API-access page: no invented /api/v1 endpoints, no "get your API key"
   for a system that doesn't exist yet. */

const planned = [
  {
    path: "API keys & rate-limited public access",
    desc: "Authenticated machine access with keys, not browser sessions",
  },
  {
    path: "Outgoing webhooks",
    desc: "Event notifications for claim, trust, and resume events",
  },
  {
    path: "Official SDKs",
    desc: "Typed client libraries — not available yet",
  },
];

export default function ApiAccessPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <span className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-sm text-cyan-400 mb-6">Developer Tools</span>
              <h1 className="text-5xl md:text-6xl font-bold text-ink leading-tight mb-6">API <span className="text-gradient">Access</span></h1>
              <p className="text-lg text-ink-secondary leading-relaxed max-w-2xl mx-auto">
                A stable, key-authenticated public API is on the roadmap. It is not available
                today — here is exactly where things stand.
              </p>
            </motion.div>

            <div className="mt-12 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-6">
              <div className="flex items-start gap-3">
                <Construction className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="text-base font-semibold text-ink mb-1">Status: in development</h2>
                  <p className="text-sm text-ink-secondary">
                    Today Patorbit exposes an internal, session-authenticated API that powers the
                    web app — documented on the{" "}
                    <Link href="/api-reference" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                      API Reference
                    </Link>
                    . Public API keys, webhooks, and SDKs do not exist yet.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-lg font-semibold text-ink mb-4">Planned capabilities</h2>
              <div className="space-y-3">
                {planned.map((ep) => (
                  <div
                    key={ep.path}
                    className="rounded-xl border border-line bg-slate-900/60 p-5 flex items-center gap-4 opacity-70"
                  >
                    <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-ink-muted">TBD</span>
                    <span className="text-sm text-ink-secondary font-mono flex-1">{ep.path}</span>
                    <span className="text-xs text-ink-muted hidden md:block">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-14 rounded-xl border border-subtle bg-surface/60 p-10 text-center"
            >
              <h2 className="text-2xl font-bold text-ink mb-4">Need access for a real use case?</h2>
              <p className="text-ink-secondary mb-8">
                We consider early access requests individually. Tell us what you&apos;d integrate.
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
                  href="/api-reference"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-ink-secondary transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-ink hover:scale-[1.02] active:scale-100"
                >
                  See Current API
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
