"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, User, Target, ShieldCheck, Search, Download, Star, Check } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

/* Features organized around user outcomes, not technology.
   Every claim below maps to functionality that exists in the product today. */

const featureDetails = [
  {
    icon: User,
    title: "Build once",
    color: "blue",
    gradient: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
    badge: "One source of truth",
    description:
      "Import your existing resume or start fresh. Your professional information lives in one place and seeds every resume you create.",
    highlights: [
      "Import existing resumes from PDF, DOCX, or JSON",
      "One professional profile reused across multiple resumes",
      "Edit every section — experience, skills, education, projects, and more",
      "Autosave with server persistence — close the tab, come back later",
      "Separate resumes stay separate: edits never leak between them",
    ],
  },
  {
    icon: Target,
    title: "Match better",
    color: "cyan",
    gradient: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
    badge: "Job matching",
    description:
      "Paste any job description and Patorbit compares it against your real experience — before you apply.",
    highlights: [
      "Matched, partially matched, and missing skills at a glance",
      "Qualification match against the specific role",
      "Keyword alignment so you know what the posting actually asks for",
      "Analysis stays attached to the job application you created",
      "A free job-analysis tool — no account required",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Tailor safely",
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
    badge: "You approve everything",
    description:
      "AI suggests rewrites, reordering, and summaries — strictly from what you already wrote. Missing skills are reported, never invented.",
    highlights: [
      "Suggestions are generated only from your existing content",
      "Accept, edit, or reject each change individually",
      "Missing skills are flagged as gaps, not added to your resume",
      "Your original resume is preserved — tailoring creates a new version",
      "AI never changes formatting, fonts, or template design",
    ],
  },
  {
    icon: Search,
    title: "Understand gaps",
    color: "amber",
    gradient: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
    badge: "Gap analysis",
    description:
      "See exactly where you fall short of a role — so you can decide whether to learn, apply, or move on.",
    highlights: [
      "Missing skills listed explicitly for every job you analyze",
      "Partial matches surfaced so related experience gets credit",
      "ATS-oriented checks flag formatting and content issues",
      "Prioritize which gaps are worth closing first",
    ],
  },
  {
    icon: Download,
    title: "Export professionally",
    color: "rose",
    gradient: "from-rose-500/20 to-rose-500/5",
    iconColor: "text-rose-400",
    badge: "PDF & DOCX",
    description:
      "Generate a clean, ATS-friendly resume that matches what you saw in the preview — no surprises after export.",
    highlights: [
      "29 templates across single-column, two-column, and ATS-focused layouts",
      "True A4 pagination with predictable page breaks",
      "PDF and DOCX export",
      "Shareable public link when you want to send a URL instead of a file",
      "What you see in the live preview is what exports",
    ],
  },
  {
    icon: Star,
    title: "Build professional trust",
    color: "purple",
    gradient: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
    badge: "Evidence-backed",
    description:
      "Go beyond the document: back your claims with evidence and share a public profile employers can actually check.",
    highlights: [
      "Claims extracted from your resume become structured, reviewable records",
      "Attach evidence — documents, links, and references — to any claim",
      "Trust Score (0–100) derived from evidence strength and verification status",
      "Public Professional Passport page with a share link and QR code",
      "You control what is public: nothing is shared without you enabling it",
    ],
  },
];

const extraFeatures = [
  {
    icon: Search,
    title: "Free job analysis",
    description:
      "Paste a job description on the marketing site and get a structured breakdown — role, skills, seniority, requirements — with no signup.",
  },
  {
    icon: ShieldCheck,
    title: "Your data, your control",
    description:
      "Encryption in transit, full data export, and one-click account deletion from settings. We never sell your information.",
  },
];

export function FeaturesPageClient() {
  return (
    <main className="min-h-screen bg-surface-sunken text-ink">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-line/50 pt-32 pb-24 md:pb-28">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 -left-32 w-96 h-96 rounded-full blur-[128px] opacity-30 bg-gradient-radial from-cyan-500/10 to-transparent" />
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line/60 bg-slate-900/60 px-3.5 py-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-ink-secondary">Features</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink leading-tight mb-6">
              Build once. Match better.{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Tailor safely.
              </span>
            </h1>
            <p className="text-lg text-ink-secondary leading-relaxed max-w-2xl mx-auto">
              Everything Patorbit does is organized around one goal: get you into the right job
              with a resume that is honest, targeted, and professionally presented.
            </p>
          </div>
        </div>
      </section>

      {/* Feature details */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="space-y-24">
            {featureDetails.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${i % 2 === 1 ? "lg:grid-flow-dense" : ""}`}
              >
                {/* Content */}
                <div className={i % 2 === 1 ? "lg:col-start-2" : ""}>
                  <div className={`mb-4 inline-flex items-center gap-2 rounded-full border border-${feature.color}-500/20 bg-${feature.color}-500/5 px-3 py-1`}>
                    <span className={`text-[11px] font-medium uppercase tracking-[0.15em] text-${feature.color}-400`}>
                      {feature.badge}
                    </span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-ink mb-4">
                    {feature.title}
                  </h2>
                  <p className="text-[17px] text-ink-secondary leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 text-sm text-ink-secondary">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual */}
                <div className={`rounded-xl border border-line/60 bg-gradient-to-br ${feature.gradient} p-8 lg:p-10 flex items-center justify-center ${i % 2 === 1 ? "lg:col-start-1" : ""}`}>
                  <div className="text-center">
                    <div className={`inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} border border-subtle mb-6`}>
                      <feature.icon className={`h-10 w-10 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-ink mb-2">{feature.title}</h3>
                    <p className="text-sm text-ink-secondary max-w-xs mx-auto">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Extra features grid */}
      <section className="py-24 border-t border-line/50">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            label="More Capabilities"
            title="Useful extras, not padding"
            subtitle="Try the job-analysis tool before you sign up — and keep control of your data once you do."
          />
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {extraFeatures.map((f) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-xl border border-line/60 bg-slate-900/40 p-6 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] mb-4">
                  <f.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-base font-semibold text-ink mb-2">{f.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-line/50">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-ink mb-4">
              See it on{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                your own resume
              </span>
            </h2>
            <p className="text-[17px] text-ink-secondary leading-relaxed mb-8">
              Start with a free job analysis, then import your resume and tailor it in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/free-analysis"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-ink shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
              >
                Try a Job Analysis
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-ink-secondary transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-ink hover:scale-[1.02] active:scale-100"
              >
                Build My Resume Free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
