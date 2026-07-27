"use client";

import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-bold text-white mb-8">Our Mission</h1>
            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              Patorbit was founded on the belief that trust should be earned through evidence, not assumed through assertion.
            </p>
            <div className="space-y-6 text-slate-300 leading-relaxed">
              <p>Founded in 2026, Patorbit emerged from years of frustration watching traditional systems treat resumes as truth when they were merely collections of unverified claims.</p>
              <p>Our platform combines cutting-edge AI for trust scoring, decentralized identity principles for user sovereignty, and graph technology to represent the interconnected nature of real-world trust relationships.</p>
              <p>We believe trust must be transparent, evidence-backed, and user-controlled. Every feature we build serves that mission.</p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
