"use client";

import { motion } from "framer-motion";

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-400 mb-6">Security</span>
            <h1 className="text-5xl font-bold text-white mb-6">Security & Compliance</h1>
            <p className="text-slate-400 text-lg">Trust begins with security. We protect your data with industry-leading practices.</p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              { title: "Encryption", desc: "All data encrypted in transit (TLS 1.3) and at rest (AES-256)." },
              { title: "Access Control", desc: "Role-based access controls with support for SSO, MFA, and custom policies." },
              { title: "Penetration Testing", desc: "Regular third-party security audits and bug bounty program." },
              { title: "Incident Response", desc: "24/7 monitoring with documented incident response procedures." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-emerald-500/30 transition-all"
              >
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}