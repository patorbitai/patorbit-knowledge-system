"use client";

import { motion } from "framer-motion";

const endpoints = [
  { method: "GET", path: "/api/v1/claims", desc: "List all claims for an identity", auth: "API Key" },
  { method: "POST", path: "/api/v1/claims", desc: "Create a new claim", auth: "API Key" },
  { method: "GET", path: "/api/v1/claims/{id}", desc: "Get a specific claim with evidence", auth: "API Key" },
  { method: "PUT", path: "/api/v1/claims/{id}/evidence", desc: "Attach evidence to a claim", auth: "API Key" },
  { method: "GET", path: "/api/v1/trust/score", desc: "Get trust score for an identity", auth: "API Key" },
  { method: "POST", path: "/api/v1/verify", desc: "Trigger verification workflow", auth: "API Key + Signature" },
  { method: "GET", path: "/api/v1/identities", desc: "List registered identities", auth: "Admin Key" },
  { method: "POST", path: "/api/v1/webhooks", desc: "Register a webhook endpoint", auth: "Admin Key" },
];

export default function ApiReferencePage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-bold text-white mb-6">API Reference</h1>
            <p className="text-slate-400 text-lg mb-12">Complete documentation for the Patorbit REST API.</p>
          </motion.div>

          <div className="space-y-3">
            {endpoints.map((ep, i) => (
              <motion.div
                key={ep.path}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex items-center gap-4 hover:border-cyan-500/30 transition-all"
              >
                <span className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded flex-shrink-0 ${
                  ep.method === "GET" ? "bg-emerald-500/10 text-emerald-400" :
                  ep.method === "POST" ? "bg-blue-500/10 text-blue-400" :
                  ep.method === "PUT" ? "bg-amber-500/10 text-amber-400" :
                  "bg-red-500/10 text-red-400"
                }`}>
                  {ep.method}
                </span>
                <code className="text-sm text-slate-300 font-mono flex-1">{ep.path}</code>
                <span className="text-xs text-slate-500 hidden md:block">{ep.desc}</span>
                <span className="text-xs text-slate-600 flex-shrink-0">{ep.auth}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}