"use client";

import { motion } from "framer-motion";

export default function BlogPostPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <article className="py-24">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-8">
              <a href="/blog" className="text-cyan-400 hover:underline">&larr; Back to Blog</a>
              <span>•</span>
              <span>July 15, 2026</span>
              <span>•</span>
              <span>8 min read</span>
            </div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              The Future of Identity Verification
            </h1>
            <p className="text-xl text-slate-400 mb-12">
              Exploring how decentralized identity is changing the way we think about trust and credentials.
            </p>
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 mb-12" />
            <div className="prose prose-lg prose-invert max-w-none">
              <p>In a world where digital interactions are becoming increasingly prevalent, the question of identity verification has never been more pressing. Traditional systems rely on centralized authorities, static documents, and manual verification processes. These approaches are slow, expensive, and vulnerable to fraud.</p>

              <h2>The Rise of Self-Sovereign Identity</h2>
              <p>Self-sovereign identity (SSI) represents a paradigm shift in how we think about digital identity. Instead of relying on third-party providers to assert who we are, SSI puts individuals in control of their own identity information, allowing them to share only what's necessary, with whom they choose, for as long as needed.</p>

              <h2>Claims-Based Systems</h2>
              <p>At the heart of this new approach lies the concept of claims. A claim is a structured assertion about an identity. It might be "I earned a B.S. in Computer Science" or "I worked at Stripe for three years." Alone, a claim is just words. What gives it power is the evidence attached to it and the verification process that confirms it.</p>

              <h2>The Role of Trust Networks</h2>
              <p>Trust networks enable a web of verification where claims can be cross-referenced, validated, and scored based on the strength of the supporting evidence. By connecting identities, claims, and evidence into a knowledge graph, we create a system where trust is earned through transparency rather than assumed through assertion.</p>

              <h2>AI and Trust Scoring</h2>
              <p>Artificial intelligence plays a crucial role in modern trust systems. By analyzing patterns across thousands of claims and their evidence, AI can assess confidence levels, detect inconsistencies, and suggest improvements. The result is a trust score that reflects the real strength of an identity's evidence base.</p>

              <h2>Looking Forward</h2>
              <p>The future of identity verification is decentralized, evidence-based, and user-controlled. As these technologies mature, we expect to see widespread adoption across industries from hiring and education to healthcare and finance.</p>
            </div>
          </motion.div>
        </div>
      </article>
    </main>
  );
}