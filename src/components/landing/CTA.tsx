"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="bg-gradient-to-br from-cyan-600 to-blue-700 py-24 text-center text-white">
      <div className="mx-auto max-w-4xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, amount: 0.5 }}
          className="text-4xl font-bold tracking-tight"
        >
          Build Your Free Career Passport
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true, amount: 0.5 }}
          className="mt-6 text-lg text-blue-100"
        >
          Start building a verifiable career history today. It's free to get started.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          <Link
            href="/resume-builder"
            className="mt-10 inline-block rounded-lg bg-white px-8 py-3.5 font-semibold text-blue-700 shadow-lg hover:bg-slate-100 transition-all"
          >
            Create My Passport
          </Link>
        </motion.div>
      </div>
    </section>
  );
}