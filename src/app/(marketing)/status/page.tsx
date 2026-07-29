"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-400 mb-6">System Status</span>
            <h1 className="text-5xl font-bold text-white mb-6">Service Status</h1>
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 mb-8">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold">All Systems Operational</span>
            </div>
          </motion.div>

          <div className="space-y-3">
            {[
              { name: "API", status: "Operational", uptime: "99.99%" },
              { name: "Web Interface", status: "Operational", uptime: "100%" },
              { name: "Database", status: "Operational", uptime: "99.99%" },
              { name: "Trust Scoring", status: "Operational", uptime: "99.95%" },
              { name: "Verification Engine", status: "Operational", uptime: "99.98%" },
            ].map((service, i) => (
              <motion.div key={service.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm text-slate-200">{service.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-emerald-400">{service.status}</span>
                  <span className="text-xs text-slate-500">Uptime: {service.uptime}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-3">Subscribe to Updates</h2>
            <p className="text-sm text-slate-500 mb-6">Get notified of any incidents or maintenance windows.</p>
            <div className="flex justify-center">
              <Link href="/contact" className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-6 py-3 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100">
                Subscribe
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}