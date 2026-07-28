"use client";

import { motion } from "framer-motion";
import PageHeader from "@/components/common/PageHeader";

const features = [
  { icon: "📋", title: "Verifiable Claims", desc: "Create structured, evidence-backed assertions about identity, credentials, and achievements." },
  { icon: "✅", title: "Trust Scoring", desc: "AI-driven confidence scoring based on evidence quality and consistency." },
  { icon: "🧠", title: "Knowledge Graph", desc: "Connected network of identities, claims, and evidence with semantic relationships." },
  { icon: "🔗", title: "Cross-Chain Integration", desc: "Bridge traditional identity systems with decentralized technologies." },
  { icon: "🛡️", title: "Compliance Ready", desc: "Built-in audit trails, GDPR compliance, and regulatory reporting." },
  { icon: "🔌", title: "Enterprise APIs", desc: "Webhook-based integration for third-party applications and services." },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-16">
      <PageHeader
        label="Features"
        title="The Foundation of Trust"
        subtitle="Six core capabilities that transform unverified assertions into verifiable knowledge through evidence, reasoning, and transparent trust scoring."
      />

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-cyan-500/30 transition-all hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h2 className="text-xl font-semibold text-white mb-3">{f.title}</h2>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
