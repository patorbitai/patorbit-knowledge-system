"use client";

import { motion } from "framer-motion";

export default function ApiAccessPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <span className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-sm text-cyan-400 mb-6">Developer Tools</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">API <span className="text-gradient">Access</span></h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                Integrate Patorbit's trust infrastructure into any application with RESTful APIs, webhooks, and SDKs.
              </p>
            </motion.div>

            <div className="mt-20 grid gap-8 md:grid-cols-2">
              {[
                { method: "GET", endpoint: "/api/v1/claims", desc: "Retrieve claims for a given identity" },
                { method: "POST", endpoint: "/api/v1/claims", desc: "Create a new claim with evidence" },
                { method: "GET", endpoint: "/api/v1/trust/score", desc: "Get trust score for a claims graph" },
                { method: "POST", endpoint: "/api/v1/evidence", desc: "Attach evidence to an existing claim" },
              ].map((ep, i) => (
                <motion.div key={ep.endpoint} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${ep.method === "GET" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>
                      {ep.method}
                    </span>
                    <span className="text-sm font-mono text-slate-300">{ep.endpoint}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{ep.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Get Your API Key</h2>
              <p className="text-slate-400 mb-8">Start integrating trust capabilities into your application today.</p>
              <button className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5">
                Create Free Account
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}