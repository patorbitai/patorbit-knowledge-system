"use client";

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
          </div>
        </div>
      </section>
    </main>
  );
}