"use client";

import { motion } from "framer-motion";

export default function BlogPage() {
  const posts = [
    { title: "The Future of Identity Verification", excerpt: "Exploring how decentralized identity changes trust and credentials.", date: "2026-07-15", author: "Alex Chen", read: "8 min" },
    { title: "Building Trust Networks with Graph Technology", excerpt: "How knowledge graphs enable reliable connections between identities and evidence.", date: "2026-07-10", author: "Maria Rodriguez", read: "12 min" },
    { title: "AI-Powered Trust Scoring Explained", excerpt: "How our algorithms evaluate confidence levels and surface contradictions.", date: "2026-07-05", author: "David Kim", read: "10 min" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-sm text-amber-400 mb-6">Blog</span>
              <h1 className="text-5xl font-bold text-white mb-6">Insights & Updates</h1>
            </motion.div>
          </div>
          <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <motion.div key={post.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 hover:border-amber-500/30 transition-all hover:-translate-y-1">
                <div className="flex gap-4 text-sm text-slate-500 mb-4">
                  <span>{post.date}</span><span>{post.read}</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-4">{post.title}</h2>
                <p className="text-slate-400 mb-6">{post.excerpt}</p>
                <span className="text-sm text-slate-500">By {post.author}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
