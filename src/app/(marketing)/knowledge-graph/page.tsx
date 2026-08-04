"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function KnowledgeGraphPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <span className="inline-block rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-sm text-indigo-400 mb-6">Architecture</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">Knowledge <span className="text-gradient">Graph</span></h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                A semantic network of identities, claims, and evidence — modeling real-world trust relationships instead of isolated documents.
              </p>
            </motion.div>

            <div className="mt-20 grid gap-8 md:grid-cols-2">
              {[
                { icon: "🧠", title: "Semantic Relationships", desc: "Claims connected by meaning, not just tags or categories." },
                { icon: "🔗", title: "Cross-Domain Links", desc: "Claims from different domains connected through shared evidence." },
                { icon: "📈", title: "Dynamic Scoring", desc: "Confidence evolves as new evidence and relationships are added." },
                { icon: "🔍", title: "Graph Queries", desc: "Powerful querying capabilities to trace trust across the network." },
              ].map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-indigo-500/30 transition-all"
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
                <h2 className="text-3xl font-bold text-white mb-4">Explore the graph</h2>
                <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                  See how your credentials connect — and discover new opportunities.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/resume-builder"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-150 hover:from-indigo-400 hover:to-purple-500 hover:shadow-indigo-400/30 hover:scale-[1.02] active:scale-100"
                  >
                    Build Your Graph
                    <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/docs"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100"
                  >
                    Read the Docs
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