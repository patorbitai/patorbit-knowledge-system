"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function TrustVerificationPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-400 mb-6">Verification</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">Trust <span className="text-gradient">Verification</span></h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                Real-time verification of claims, credentials, and evidence through a transparent, auditable process.
              </p>
            </motion.div>

            <div className="mt-20 grid gap-8 md:grid-cols-2">
              {[
                { icon: "✅", title: "Claim Verification", desc: "Automated verification against trusted data sources and registries." },
                { icon: "🔄", title: "Cross-Reference", desc: "Cross-reference claims against multiple independent data sources." },
                { icon: "📊", title: "Confidence Scoring", desc: "AI-driven confidence assessments based on evidence strength and consistency." },
                { icon: "🔍", title: "Audit Trails", desc: "Full provenance tracking for every verification decision made." },
              ].map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-emerald-500/30 transition-all"
                >
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-white mb-4">Set up verification in minutes</h2>
                <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                  Connect your credentials and let our verification engine do the rest.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/resume-builder"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-150 hover:from-emerald-400 hover:to-green-500 hover:shadow-emerald-400/30 hover:scale-[1.02] active:scale-100"
                  >
                    Verify Your Claims
                    <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}