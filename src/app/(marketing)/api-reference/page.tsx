"use client";

import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";
import { motion } from "framer-motion";

/* The public API-key API does not exist yet. The endpoints below are REAL
   routes the product exposes today — but they authenticate via the user's
   session cookie (the web app), not API keys, and are not a stable public API.
   Never document endpoints that don't exist. */

const endpoints = [
  { method: "GET", path: "/api/resumes", desc: "List your resumes" },
  { method: "POST", path: "/api/resumes", desc: "Create a resume" },
  { method: "GET", path: "/api/claims", desc: "List your claims" },
  { method: "POST", path: "/api/claims", desc: "Create a claim" },
  { method: "GET", path: "/api/evidence", desc: "List evidence records" },
  { method: "POST", path: "/api/import", desc: "Parse an uploaded resume" },
  { method: "GET", path: "/api/trust", desc: "Get your trust report" },
  { method: "POST", path: "/api/ai/match", desc: "Match resume against a job" },
  { method: "GET", path: "/api/user/export", desc: "Export all your data (GDPR)" },
];

export default function ApiReferencePage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-bold text-ink mb-6">API Reference</h1>
            <p className="text-ink-secondary text-lg mb-6">
              Patorbit&apos;s internal API — the routes the product itself uses.
            </p>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-5 mb-10">
              <div className="flex items-start gap-3">
                <Construction className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm text-ink-secondary">
                  <strong className="text-amber-300">Not a public API yet.</strong>{" "}
                  These routes authenticate with a browser session (cookies), not API keys,
                  and their shapes may change without notice. A stable, key-authenticated
                  public API is in development — it is <em>not</em> generally available.
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-3">
            {endpoints.map((ep, i) => (
              <motion.div
                key={`${ep.method}-${ep.path}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-line bg-slate-900/60 p-5 flex items-center gap-4 hover:border-cyan-500/30 transition-all"
              >
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded shrink-0 ${
                    ep.method === "GET"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {ep.method}
                </span>
                <code className="text-sm text-ink-secondary font-mono flex-1 break-all">{ep.path}</code>
                <span className="text-xs text-ink-muted hidden md:block">{ep.desc}</span>
                <span className="text-xs text-slate-600 shrink-0">Session auth</span>
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-slate-600 mt-6">
            All routes require an authenticated session and are rate-limited. Responses are
            JSON; errors use standard HTTP status codes (400, 401, 403, 404, 409, 429, 500).
          </p>

          {/* CTA */}
          <div className="mt-16 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-bold text-ink mb-4">Want API access?</h2>
              <p className="text-ink-secondary text-lg mb-8 max-w-md mx-auto">
                Tell us what you&apos;re building — early public-API access is granted case by case.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-ink shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
                >
                  Request Access
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-ink-secondary transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-ink hover:scale-[1.02] active:scale-100"
                >
                  Documentation
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
