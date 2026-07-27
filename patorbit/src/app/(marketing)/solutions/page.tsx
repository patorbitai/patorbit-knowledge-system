"use client";

import { motion } from "framer-motion";

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm text-blue-400 mb-6">Solutions</span>
              <h1 className="text-5xl font-bold text-white mb-6">Built for Every Scenario</h1>
              <p className="text-slate-400 text-lg">Four solutions that address the full spectrum of trust requirements.</p>
            </motion.div>
          </div>
          <div className="mt-20 grid gap-8 md:grid-cols-2">
            {[
              { name: "Career Passport", tagline: "Your complete professional identity", desc: "Build a verifiable digital resume that is evidence-backed and self-sovereign." },
              { name: "Recruiter Workspace", tagline: "Hire with confidence", desc: "Evaluate candidates through transparent claims verification and trust scoring." },
              { name: "Enterprise Platform", tagline: "Organizational trust at scale", desc: "Connect entire teams with verifiable identities and evidence-based trust." },
              { name: "Developer APIs", tagline: "Embed trust in everything", desc: "Integrate knowledge and trust capabilities into any application." },
            ].map((s, i) => (
              <motion.div key={s.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 hover:border-blue-500/30 transition-all hover:-translate-y-1">
                <h2 className="text-3xl font-bold text-white mb-3">{s.name}</h2>
                <p className="text-lg text-blue-400 font-medium mb-4">{s.tagline}</p>
                <p className="text-slate-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
