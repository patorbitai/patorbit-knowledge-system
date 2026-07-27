"use client";

import { motion } from "framer-motion";

export default function EnterprisePage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <span className="inline-block rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-sm text-purple-400 mb-6">Enterprise</span>
                <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
                  Enterprise <span className="text-gradient">Suite</span>
                </h1>
                <p className="text-lg text-slate-400 leading-relaxed mb-8">
                  Trust infrastructure for organizations. Manage identities, verify claims, and build confidence at scale.
                </p>
                <div className="flex flex-wrap gap-3 mb-10">
                  {["SSO Integration", "Bulk Verification", "Compliance Reports", "Dedicated Support", "Custom Workflows"].map((f) => (
                    <div key={f} className="rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300">{f}</div>
                  ))}
                </div>
                <button className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all">
                  Contact Sales
                </button>
              </motion.div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                {["10K+", "99.9%", "< 2s", "200+"].map((stat, i) => (
                  <div key={stat} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">{stat}</div>
                    <div className="text-sm text-slate-500">{["Verified identities", "Uptime", "Response time", "Enterprise partners"][i]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}