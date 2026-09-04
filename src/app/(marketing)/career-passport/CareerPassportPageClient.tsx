"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function CareerPassportPageClient() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <span className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-sm text-cyan-400 mb-6">Product</span>
                <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
                  Career <span className="text-gradient">Passport</span>
                </h1>
                <p className="text-lg text-slate-400 leading-relaxed mb-8">
                  Your complete professional identity, verified by evidence. Share your skills, experience, and credentials with confidence.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-10">
                  {["Self-Sovereign Identity", "Claim Management", "Evidence Attachments", "Export & Share"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />{f}
                    </div>
                  ))}
                </div>
                <Link href="/resume-builder" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 hover:-translate-y-0.5 active:scale-100">
                  Create My Passport
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
            <div className="flex-1">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl">A</div>
                  <div>
                    <div className="text-xl font-semibold text-white">Alex Sample</div>
                    <div className="text-sm text-slate-500">alex@patorbit.ai · 12 verified claims</div>
                  </div>
                </div>
                {[
                  { label: "Senior Engineer @ Stripe", status: "Verified", by: "HR Department" },
                  { label: "B.S. Computer Science, MIT", status: "Verified", by: "Registrar Office" },
                  { label: "Published 3 Research Papers", status: "Verified", by: "DOI Registry" },
                  { label: "Led Team of 8 Engineers", status: "Self-Claimed", by: "Awaiting Verification" },
                ].map((claim) => (
                  <div key={claim.label} className="flex items-center gap-3 py-3 border-b border-slate-800/50 last:border-0">
                    <div className={`w-2 h-2 rounded-full ${claim.status === "Verified" ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <div className="flex-1">
                      <div className="text-sm text-slate-200">{claim.label}</div>
                      <div className="text-xs text-slate-500">{claim.by}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${claim.status === "Verified" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {claim.status}
                    </span>
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