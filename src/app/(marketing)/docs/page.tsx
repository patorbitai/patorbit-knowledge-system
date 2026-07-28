"use client";

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
        </div>
      </section>
    </main>
  );
}