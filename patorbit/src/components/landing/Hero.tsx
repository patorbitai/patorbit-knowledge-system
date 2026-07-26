"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-sm text-cyan-400"
        >
          Trusted Knowledge Platform
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-5xl font-bold md:text-7xl"
        >
          Build Trust Through
          <span className="block text-cyan-400">Evidence</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-slate-300"
        >
          Patorbit transforms identities, claims, evidence, reasoning,
          confidence, and trust into connected knowledge.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-10 flex justify-center gap-4"
        >
          <button className="rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-black hover:bg-cyan-400">
            Get Started
          </button>

          <button className="rounded-lg border border-slate-700 px-6 py-3 hover:bg-slate-800">
            Learn More
          </button>
        </motion.div>
      </div>
    </section>
  );
}