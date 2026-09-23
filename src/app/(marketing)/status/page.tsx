"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const components = [
  "Resume Builder",
  "Job Analysis",
  "AI Suggestions",
  "PDF / DOCX Export",
  "Payments (Razorpay)",
];

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-400 mb-6">Status</span>
            <h1 className="text-5xl font-bold text-ink mb-6">Service Status</h1>
            <p className="text-ink-secondary text-lg max-w-2xl mx-auto">
              Patorbit is a small, actively developed product. We post incidents and
              maintenance notices here as they occur — we don&apos;t publish historical
              uptime numbers because we don&apos;t yet have automated public monitoring.
            </p>
          </motion.div>

          <div className="rounded-xl border border-subtle bg-surface/60 p-8">
            <h2 className="text-xl font-semibold text-ink mb-1">Components we run</h2>
            <p className="text-sm text-ink-muted mb-6">
              If one of these is broken, it&apos;s a real incident — we&apos;ll say so here.
            </p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {components.map((name) => (
                <li
                  key={name}
                  className="flex items-center gap-3 rounded-xl border border-line bg-slate-900/60 px-5 py-4"
                >
                  <span className="w-2 h-2 rounded-full bg-slate-600" aria-hidden="true" />
                  <span className="text-sm text-slate-200">{name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 rounded-xl border border-subtle bg-surface/60 p-8 text-center">
            <h2 className="text-xl font-semibold text-ink mb-3">Report an issue</h2>
            <p className="text-sm text-ink-muted mb-6">
              Something not working? Tell us what you saw and we&apos;ll investigate.
            </p>
            <div className="flex justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-slate-900/40 px-6 py-3 text-sm font-medium text-ink-secondary transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-ink"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
