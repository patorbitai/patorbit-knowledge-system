"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

          {/* CTA */}
          <div className="mt-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">Start building with our SDKs</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                Quickstart guides, sample apps, and community packages to accelerate your integration.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/docs"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
                >
                  Browse Docs
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="https://github.com/patorbit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100"
                >
                  View on GitHub
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}