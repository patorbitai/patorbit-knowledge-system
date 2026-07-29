"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

          {/* CTA */}
          <div className="mt-16 text-center border-t border-white/10 pt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">Enjoyed this article?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                Get the latest insights on digital trust, identity, and credential verification delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/blog"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all duration-150 hover:from-amber-400 hover:to-orange-500 hover:shadow-amber-400/30 hover:scale-[1.02] active:scale-100"
                >
                  Read More
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100"
                >
                  Subscribe
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </article>
    </main>
  );
}