"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

/* Security claims must match the actual implementation.
   "Implemented" = verifiable in the codebase / infrastructure today.
   "In progress" = actively being developed. Nothing here claims certification. */

const implemented = [
  {
    title: "Encryption in transit",
    desc: "All traffic between your browser and Patorbit is served over HTTPS/TLS.",
  },
  {
    title: "Password security",
    desc: "Passwords are hashed with bcrypt before storage — plaintext passwords are never stored.",
  },
  {
    title: "Session-based access control",
    desc: "Every API route checks your authenticated session server-side. Data is scoped to your account.",
  },
  {
    title: "Payment webhook verification",
    desc: "Razorpay webhooks are verified by signature before any subscription state changes.",
  },
  {
    title: "Rate limiting",
    desc: "AI and import endpoints are rate-limited per user to prevent abuse.",
  },
  {
    title: "Data export & account deletion",
    desc: "Export all your data as JSON from settings, or permanently delete your account and its data.",
  },
];

const inProgress = [
  {
    title: "Automated public status monitoring",
    desc: "Real uptime tracking with a public status history.",
  },
  {
    title: "Formal security audits",
    desc: "Third-party penetration testing and a public bug-bounty program.",
  },
  {
    title: "SOC 2 certification",
    desc: "We are working toward SOC 2 but are NOT certified today. See our compliance page.",
  },
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-400 mb-6">Security</span>
            <h1 className="text-5xl font-bold text-white mb-6">Security at Patorbit</h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Your resume and career data are sensitive. Here is exactly what we protect
              today — and what we&apos;re still building. No inflated claims.
            </p>
          </motion.div>

          {/* Implemented */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Implemented
              </span>
              <span className="text-sm text-slate-500">Working today</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {implemented.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 hover:border-emerald-500/30 transition-all"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* In progress */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                In progress
              </span>
              <span className="text-sm text-slate-500">Being developed — not available yet</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {inProgress.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Certifications — explicit non-claim */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-6 mb-12">
            <h2 className="text-lg font-semibold text-white mb-2">Certifications</h2>
            <p className="text-sm text-slate-400">
              Patorbit holds <strong className="text-white">no security certifications</strong> today.
              We do not claim SOC 2, ISO 27001, or any audit attestation. When that changes,
              we&apos;ll publish evidence — not badges.
            </p>
          </div>

          {/* Data practices */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">Your data</h2>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><strong className="text-slate-300">Retention:</strong> Your data stays while your account exists. Delete your account and it&apos;s removed.</li>
              <li><strong className="text-slate-300">Export:</strong> Download a full JSON copy of your data from settings at any time.</li>
              <li><strong className="text-slate-300">AI processing:</strong> Content you send to AI features is processed by our configured AI provider to generate suggestions. We don&apos;t sell your data.</li>
              <li><strong className="text-slate-300">Subprocessors:</strong> Hosting (Vercel), database (Neon/Postgres), payments (Razorpay), sign-in (GitHub, LinkedIn), AI provider (per configuration).</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-bold text-white mb-4">Questions about security?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                Contact us directly — we&apos;ll answer specifics about how your data is handled.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-150 hover:from-emerald-400 hover:to-green-500 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-100"
                >
                  Contact Security
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/compliance"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100"
                >
                  View Compliance
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
