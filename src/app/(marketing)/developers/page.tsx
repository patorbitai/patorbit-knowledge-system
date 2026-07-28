"use client";

import { motion } from "framer-motion";

export default function DevelopersPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
            <span className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-sm text-cyan-400 mb-6">Developer Hub</span>
            <h1 className="text-5xl font-bold text-white mb-6">Developer Hub</h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Build trust-powered applications with our developer tools, SDKs, and comprehensive documentation.</p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: "📘", title: "Documentation", desc: "Comprehensive guides and API references for integrating with Patorbit." },
              { icon: "🔧", title: "SDKs & Libraries", desc: "Official SDKs for Python, JavaScript, Go, and more languages." },
              { icon: "💻", title: "CLI Tools", desc: "Command-line tools for managing claims, evidence, and verification workflows." },
              { icon: "🔗", title: "Webhooks", desc: "Real-time event notifications for claim updates and verification results." },
              { icon: "🧪", title: "Sandbox", desc: "Test your integrations in a safe, isolated environment before going live." },
              { icon: "📊", title: "Analytics", desc: "Monitor API usage, performance metrics, and integration health." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-cyan-500/30 transition-all hover:-translate-y-1"
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}