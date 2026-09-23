"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/* About page structure: plain language first, technical concepts second.
   Answers: Who is it for? What problem? Why created? How different?
   How does the tech work? Why trust it? */

const audience = [
  {
    icon: "👤",
    title: "Job seekers",
    desc: "Build one strong resume, then tailor it to each application without rewriting everything.",
  },
  {
    icon: "💼",
    title: "Working professionals",
    desc: "Keep an accurate, up-to-date record of your experience that you control.",
  },
  {
    icon: "🏢",
    title: "Teams & organizations",
    desc: "A shared, structured view of skills and credentials — coming later, not sold today.",
  },
];

const principles = [
  {
    icon: "✅",
    title: "Your experience is yours",
    desc: "We never invent jobs, skills, or credentials for you. If you don't have a skill, we say so.",
  },
  {
    icon: "👁️",
    title: "You approve the changes",
    desc: "AI suggests rewrites and improvements. Nothing is applied to your resume until you accept it.",
  },
  {
    icon: "🔑",
    title: "You own your data",
    desc: "Export everything as JSON at any time. Delete your account and the data goes with it.",
  },
];

const concepts = [
  {
    icon: "🪪",
    title: "Professional Identity",
    plain: "A durable profile of your career — roles, skills, education, projects — that stays constant while individual resumes change.",
    tech: "Stored as structured records linked to your account, independent of any single resume document.",
  },
  {
    icon: "📝",
    title: "Claims",
    plain: "Statements about your career: \"I worked at Acme as a Data Engineer from 2022 to 2024.\"",
    tech: "Each claim is a discrete record that can carry its own evidence and status.",
  },
  {
    icon: "📎",
    title: "Evidence",
    plain: "Proof behind a claim — a document, a link, a reference. Claims without evidence are labeled as user-stated, not verified.",
    tech: "Evidence records are attached to claims with explicit provenance (user-provided vs. checked).",
  },
  {
    icon: "🔍",
    title: "Trust",
    plain: "A simple signal of how well-supported your profile is — stronger with more evidence, never a judgment of you.",
    tech: "Computed from claim completeness and attached evidence; surfaced on your Professional Passport.",
  },
  {
    icon: "🕸️",
    title: "Knowledge graph",
    plain: "Under the hood, your experience is stored as connected facts (this role used these skills at this company) so the product can reason about matches and gaps.",
    tech: "Graph-structured storage of identities, claims, and evidence — this is an internal implementation detail, not something you need to learn.",
  },
];

export function AboutPageClient() {
  return (
    <main className="min-h-screen bg-slate-950">
      {/* ── Hero ── */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950 to-slate-950" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-slate-900/80 px-3 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-ink-secondary tracking-wide uppercase font-medium">About Patorbit</span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-ink"
          >
            Build your resume once.
            <br />
            <span className="text-gradient">Tailor it to every job.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-ink-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Patorbit keeps one accurate source of truth for your career, analyzes each job
            description against it, and helps you tailor your application — without ever
            inventing experience you don&apos;t have.
          </motion.p>
        </div>
      </section>

      {/* ── The problem ── */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10 p-8 sm:p-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-6">The problem we&apos;re solving</h2>
            <div className="space-y-4 text-ink-secondary leading-relaxed">
              <p className="text-lg">
                Applying for jobs means rewriting your resume for every single posting.
                It&apos;s slow, repetitive, and easy to accidentally overstate — or undersell —
                what you&apos;ve actually done.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
                {[
                  "Same career history, rewritten dozens of times",
                  "No quick read on where you match a role",
                  "AI tools that happily fabricate experience",
                  "No clear signal separating stated vs. proven claims",
                  "Hard to see which skills a role actually needs",
                ].map((problem, i) => (
                  <div key={i} className="flex items-center gap-3 text-ink-secondary">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10 text-red-400 text-xs font-bold">✕</span>
                    <span className="text-sm">{problem}</span>
                  </div>
                ))}
              </div>
              <p>
                Patorbit was created in 2026 to fix this: keep your career facts in one
                place, analyze jobs against those facts, and let you tailor applications
                quickly — while staying truthful about what you have and haven&apos;t done.
              </p>
              <p className="text-cyan-400 font-semibold">
                One source of truth. Job-by-job tailoring. No fabricated experience.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">Who Patorbit is for</h2>
            <p className="text-ink-secondary text-lg">Anyone who applies to jobs and wants the process to be faster and more honest.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {audience.map((user, i) => (
              <motion.div
                key={user.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-white/10 p-6 text-center hover:border-cyan-500/30 transition-all"
              >
                <span className="text-4xl mb-4 block">{user.icon}</span>
                <h3 className="text-lg font-semibold text-ink mb-2">{user.title}</h3>
                <p className="text-sm text-ink-secondary">{user.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How Patorbit is different ── */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">How Patorbit is different</h2>
            <p className="text-ink-secondary text-lg max-w-2xl mx-auto">
              Most resume tools optimize for speed. We optimize for speed <em>and</em> accuracy.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {principles.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900/60 rounded-xl border border-white/10 p-6 hover:border-cyan-500/30 hover:bg-slate-900/80 transition-all"
              >
                <span className="text-3xl mb-4 block">{p.icon}</span>
                <h3 className="text-lg font-semibold text-ink mb-2">{p.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How the technology works — plain language first ── */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">How the technology works</h2>
            <p className="text-ink-secondary text-lg max-w-2xl mx-auto">
              Plain language first. The technical detail is underneath if you want it —
              you never need it to use the product.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concepts.map((concept, i) => (
              <motion.div
                key={concept.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-slate-900/60 rounded-xl border border-white/10 p-6 hover:border-cyan-500/30 hover:bg-slate-900/80 transition-all flex flex-col"
              >
                <span className="text-3xl mb-4 block">{concept.icon}</span>
                <h3 className="text-lg font-semibold text-ink mb-2">{concept.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed mb-3">{concept.plain}</p>
                <p className="text-xs text-ink-muted leading-relaxed border-t border-line pt-3 mt-auto">
                  <span className="text-ink-muted uppercase tracking-wider text-[10px] font-semibold">Technical detail</span><br />
                  {concept.tech}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why trust the platform ── */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 sm:p-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-6">Why you can trust Patorbit</h2>
            <ul className="space-y-4 text-ink-secondary">
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold shrink-0">1.</span>
                <span><strong className="text-ink">You approve every change.</strong> AI-generated edits to your resume are suggestions until you accept them.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold shrink-0">2.</span>
                <span><strong className="text-ink">Claims are labeled honestly.</strong> We distinguish what you told us from what has supporting evidence — we never call an upload &ldquo;verified employment.&rdquo;</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold shrink-0">3.</span>
                <span><strong className="text-ink">Your data is portable and deletable.</strong> Export all of it as JSON, or delete your account, from settings.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold shrink-0">4.</span>
                <span><strong className="text-ink">No inflated security claims.</strong> Our <Link href="/security" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">security page</Link> lists exactly what&apos;s implemented today — and what isn&apos;t.</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">
              See it for yourself
            </h2>
            <p className="text-ink-secondary text-lg mb-8">
              Build a resume in minutes, then analyze it against a real job description.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/resume-builder"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-base font-semibold text-ink shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                Build my resume free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-slate-900/40 px-8 py-3.5 text-base font-medium text-ink-secondary hover:bg-slate-900 hover:border-slate-700 hover:text-ink transition-all"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
