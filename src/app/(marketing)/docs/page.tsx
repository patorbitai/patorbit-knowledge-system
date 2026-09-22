"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

/* Documentation hub with REAL content.
   Every link points to a real route or an in-page section below.
   Only documented: functionality that actually exists today.
   Not-yet-production features are labeled, not pretended. */

const sections = [
  {
    id: "quick-start",
    title: "Quick Start",
    icon: "🚀",
    links: [
      { label: "Create a resume (free)", href: "/resume-builder" },
      { label: "Import an existing resume (PDF/DOCX)", href: "/resume-builder" },
      { label: "Analyze a job description", href: "/free-analysis" },
    ],
  },
  {
    id: "platform",
    title: "Platform Overview",
    icon: "🧭",
    links: [
      { label: "What Patorbit does", href: "/about" },
      { label: "Features by outcome", href: "/features" },
      { label: "Plans & pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    id: "concepts",
    title: "Claims, Evidence & Trust",
    icon: "🧠",
    links: [
      { label: "Claims & evidence explained", href: "#claims" },
      { label: "Knowledge graph explained", href: "#knowledge-graph" },
      { label: "Trust signals", href: "#trust" },
    ],
  },
  {
    id: "api",
    title: "API",
    icon: "📚",
    links: [
      { label: "API reference (internal API)", href: "/api-reference" },
      { label: "API access status", href: "/api-access" },
      { label: "Errors & rate limits", href: "#api-errors" },
    ],
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6">Documentation</h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              How Patorbit works, from first resume to API. Everything below describes
              functionality that exists today — anything still in development is labeled.
            </p>
          </motion.div>

          {/* Section cards — all links are real routes or in-page anchors */}
          <div className="grid gap-6 md:grid-cols-2 mb-16">
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">{section.icon}</span>
                  <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* ── Real content sections ── */}
          <div className="space-y-12">
            {/* Quick Start */}
            <motion.div id="quick-start" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4">Quick Start</h2>
              <ol className="space-y-3 text-sm text-slate-400 list-decimal list-inside">
                <li><strong className="text-slate-200">Build or import.</strong> Start from scratch in the <Link href="/resume-builder" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Resume Builder</Link>, or upload an existing PDF/DOCX and review what was extracted before it merges.</li>
                <li><strong className="text-slate-200">Analyze a job.</strong> Paste any job description to see matched skills, missing skills, and partial matches against your profile.</li>
                <li><strong className="text-slate-200">Tailor with approval.</strong> Suggested rewrites appear as suggestions. Nothing changes your resume until you accept it.</li>
                <li><strong className="text-slate-200">Export.</strong> Download an ATS-friendly A4 PDF or DOCX with correct pagination.</li>
              </ol>
            </motion.div>

            {/* Claims & Evidence */}
            <motion.div id="claims" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4">Claims &amp; Evidence</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">
                A <strong className="text-slate-200">claim</strong> is a statement about your career
                (a role, a degree, a certification). <strong className="text-slate-200">Evidence</strong> is
                proof you attach to it — a document, a link, or a reference.
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                The important part: claims are labeled by their actual status.
                <em> User-provided</em> means you told us. <em>Evidence-backed</em> means a document
                supports it. We never upgrade &ldquo;you uploaded a file&rdquo; into
                &ldquo;verified employment.&rdquo; Save-to-Identity from the resume builder
                creates claims from your resume content so you can attach evidence over time.
              </p>
            </motion.div>

            {/* Knowledge Graph */}
            <motion.div id="knowledge-graph" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4">Knowledge Graph</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">
                Internally, your career is stored as connected facts — roles connected to
                skills, skills connected to claims, claims connected to evidence. This is
                what lets Patorbit reason about job matches and skill gaps precisely instead
                of doing fuzzy text comparison.
              </p>
              <p className="text-sm text-slate-500">
                It&apos;s an internal implementation detail. You don&apos;t need to interact
                with it directly to get value from the product.
              </p>
            </motion.div>

            {/* Trust */}
            <motion.div id="trust" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4">Trust Signals</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your profile&apos;s trust signal reflects how complete and well-supported your
                claims are — not a judgment of you as a candidate. It strengthens as you attach
                evidence. It never implies third-party verification that hasn&apos;t happened.
              </p>
            </motion.div>

            {/* API errors & rate limits */}
            <motion.div id="api-errors" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4">API: Errors &amp; Rate Limits</h2>
              <div className="space-y-4 text-sm text-slate-400">
                <p>
                  Patorbit&apos;s API today is the internal, session-authenticated API that powers
                  the web app — see the <Link href="/api-reference" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">API reference</Link> for
                  the real endpoint list.
                </p>
                <div>
                  <h3 className="text-slate-200 font-semibold mb-2">HTTP status codes</h3>
                  <ul className="grid grid-cols-2 gap-x-6 gap-y-1 list-disc list-inside">
                    <li><code className="text-cyan-400">400</code> — invalid request</li>
                    <li><code className="text-cyan-400">401</code> — not authenticated</li>
                    <li><code className="text-cyan-400">403</code> — forbidden (e.g. plan limit)</li>
                    <li><code className="text-cyan-400">404</code> — not found</li>
                    <li><code className="text-cyan-400">409</code> — version conflict (stale write)</li>
                    <li><code className="text-cyan-400">429</code> — rate limited</li>
                    <li><code className="text-cyan-400">500</code> — server error</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-slate-200 font-semibold mb-2">Rate limits</h3>
                  <p>
                    AI and import endpoints are rate-limited per user. Exceeding the limit returns
                    <code className="text-cyan-400"> 429</code>; retry after a short delay.
                  </p>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
                  <p className="text-amber-300/90">
                    <strong>Not yet production-ready:</strong> public API keys, webhooks, and SDKs
                    are in development and do not exist today. See <Link href="/api-access" className="underline underline-offset-2">API access</Link> for status.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-bold text-white mb-4">Ready to try it?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                The fastest way to understand Patorbit is to build a resume and analyze a job.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/resume-builder"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
                >
                  Build my resume free
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/free-analysis"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100"
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
