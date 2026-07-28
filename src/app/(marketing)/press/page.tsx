"use client";

import { motion } from "framer-motion";

export default function PressPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1.5 text-sm text-orange-400 mb-6">Press</span>
              <h1 className="text-5xl font-bold text-white mb-6">Press & Media</h1>
            </motion.div>
          </div>
          <div className="mt-20 space-y-6">
            {[
              { title: "Patorbit Raises $50M Series A", desc: "Trust platform secures funding to expand global operations.", date: "2026-07-01" },
              { title: "Building Trust in the AI Age", desc: "Knowledge graph approach addresses verification challenges.", date: "2026-06-15" },
              { title: "From CV to Knowledge: Patorbit's Revolution", desc: "Professional verification transformed with graph technology.", date: "2026-06-01" },
            ].map((a, i) => (
              <motion.div key={a.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-orange-500/30 transition-all">
                <span className="text-sm text-orange-400">{a.date}</span>
                <h2 className="text-2xl font-bold text-white mt-2 mb-3">{a.title}</h2>
                <p className="text-slate-400">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
