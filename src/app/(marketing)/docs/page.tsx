"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      icon: "🚀",
      links: ["Quick Start Guide", "Platform Overview", "Creating Your First Claim", "Understanding Trust Scores"],
      color: "from-cyan-400 to-blue-400",
    },
    {
      title: "Core Concepts",
      icon: "🧠",
      links: ["Knowledge Graph", "Claims & Evidence", "Trust & Confidence", "Identity Management"],
      color: "from-blue-400 to-indigo-400",
    },
    {
      title: "Guides",
      icon: "📖",
      links: ["Verification Workflows", "API Integration", "Best Practices", "Security Configuration"],
      color: "from-indigo-400 to-purple-400",
    },
    {
      title: "Reference",
      icon: "📚",
      links: ["API Reference", "SDK Documentation", "Webhook Events", "Release Notes"],
      color: "from-purple-400 to-pink-400",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              Documentation
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need to build and integrate with the Patorbit platform.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-cyan-500/30 transition-all"
              >
                <div className="text-3xl mb-4">{section.icon}</div>
                <h2 className="text-xl font-semibold text-white mb-6">{section.title}</h2>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-slate-600" />
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
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
              <h2 className="text-3xl font-bold text-white mb-4">Ready to build with Patorbit?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                Explore our APIs, SDKs, and example projects to get started.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/api-reference"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
                >
                  Explore API
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/developers"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100"
                >
                  View Examples
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}