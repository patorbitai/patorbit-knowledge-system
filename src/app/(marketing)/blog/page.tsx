"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

/* Blog index.
   Posts are authored by the Patorbit team — no fabricated author personas.
   Topics reflect what the product actually does today. */

const posts = [
  {
    slug: "why-we-wont-write-experience-you-dont-have",
    title: "Why we won't write experience you don't have",
    excerpt:
      "Most AI resume tools will happily add ‘Experienced with Snowflake’ because the job posting mentioned it. Here's why Patorbit refuses to — and what it does instead.",
    date: "2026-07-15",
    read: "6 min",
  },
  {
    slug: "one-resume-many-jobs",
    title: "One resume, many jobs: tailoring without rewriting",
    excerpt:
      "Keep one source of truth for your career, then tailor per application. How structured resume data makes job-by-job customization fast instead of tedious.",
    date: "2026-07-10",
    read: "5 min",
  },
  {
    slug: "claims-evidence-explained",
    title: "Claims and evidence, explained",
    excerpt:
      "What it means when we label something ‘user-provided’ versus ‘evidence-backed’ — and why we never call an uploaded file verified employment.",
    date: "2026-07-05",
    read: "7 min",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-block rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-sm text-amber-400 mb-6">Blog</span>
              <h1 className="text-5xl font-bold text-ink mb-6">Notes from the Patorbit team</h1>
              <p className="text-ink-secondary text-lg">
                Practical writing on truthful AI, resume tailoring, and professional identity —
                from the people building Patorbit.
              </p>
            </motion.div>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <motion.div
                key={post.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-subtle bg-surface/60 p-8 hover:border-amber-500/30 transition-all hover:-translate-y-1 flex flex-col"
              >
                <div className="flex gap-4 text-sm text-ink-muted mb-4">
                  <span>{post.date}</span>
                  <span>{post.read}</span>
                </div>
                <h2 className="text-xl font-bold text-ink mb-4">{post.title}</h2>
                <p className="text-ink-secondary mb-6 flex-1">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Read article
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-bold text-ink mb-4">See the product instead</h2>
              <p className="text-ink-secondary text-lg mb-8 max-w-md mx-auto">
                The fastest way to understand truthful AI is to use it.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/resume-builder"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-7 py-3.5 text-sm font-semibold text-ink shadow-lg shadow-amber-500/20 transition-all duration-150 hover:from-amber-400 hover:to-orange-500 hover:shadow-amber-400/30 hover:scale-[1.02] active:scale-100"
                >
                  Build my resume free
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/free-analysis"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-ink-secondary transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-ink hover:scale-[1.02] active:scale-100"
                >
                  Try a job analysis
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
