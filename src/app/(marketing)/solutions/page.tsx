"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, GraduationCap, Code, Brain, Search, Users, Building2, Briefcase } from "lucide-react";

const audiences = [
  {
    id: "students",
    icon: GraduationCap,
    label: "Students",
    gradient: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/30",
    title: "Build your professional identity before graduation",
    description: "Stand out to employers with a verified digital passport that showcases your degrees, projects, and skills — backed by evidence.",
    benefits: [
      "Upload transcripts and certifications for instant verification",
      "Showcase projects with verifiable contribution history",
      "Share your passport with recruiters before applying",
      "Get a Trust Score that strengthens as you add credentials",
      "Never lose your credentials — they follow you after graduation",
    ],
  },
  {
    id: "engineers",
    icon: Code,
    label: "Software Engineers",
    gradient: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    title: "Let your code speak. We'll verify the rest.",
    description: "Connect GitHub, certifications, and work history into a unified, verifiable profile that hiring teams trust at a glance.",
    benefits: [
      "Auto-verify contributions, commits, and open-source work",
      "Link AWS, Google, and Microsoft certifications automatically",
      "Generate a shareable passport with your Trust Score",
      "QR-code ready for networking events and interviews",
      "Privacy controls — choose what to share, when to share it",
    ],
  },
  {
    id: "ai-ml",
    icon: Brain,
    label: "AI/ML Engineers",
    gradient: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    title: "Prove your expertise with verified credentials",
    description: "From research papers to model deployments, verify every aspect of your AI/ML career with tamper-proof evidence.",
    benefits: [
      "Verify publications, patents, and research contributions",
      "Link Kaggle, arXiv, and conference proceedings",
      "Auto-detect and verify ML certifications and badges",
      "Showcase model deployment history with verifiable links",
      "Trust Score weighted for technical depth and breadth",
    ],
  },
  {
    id: "recruiters",
    icon: Search,
    label: "Recruiters",
    gradient: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/30",
    title: "Cut screening time by 80%. Hire with confidence.",
    description: "Stop cross-referencing LinkedIn, GitHub, and resumes. See verified credentials instantly and focus on what matters.",
    benefits: [
      "View verified Trust Scores at a glance",
      "Filter candidates by verified skills and certifications",
      "Access detailed evidence breakdowns per credential",
      "Integrate with your ATS via REST API or webhooks",
      "Reduce time-to-hire with pre-vetted candidate pools",
    ],
  },
  {
    id: "managers",
    icon: Users,
    label: "Hiring Managers",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    title: "Build teams you can trust — from day one",
    description: "Make informed hiring decisions with transparent, verified credential data that eliminates guesswork.",
    benefits: [
      "Compare candidates side-by-side with Trust Scores",
      "Verify claimed experience before the interview stage",
      "Reduce mis-hires with evidence-backed profiles",
      "Collaborate with recruiters on verified shortlists",
      "Audit-ready hiring pipeline with full credential traceability",
    ],
  },
  {
    id: "enterprise",
    icon: Building2,
    label: "Enterprise",
    gradient: "from-rose-500/20 to-rose-500/5",
    iconColor: "text-rose-400",
    borderColor: "border-rose-500/30",
    title: "Enterprise-grade verification at scale",
    description: "Deploy Patorbit across your organization for consistent, verifiable credential management — from hiring to compliance.",
    benefits: [
      "SSO, SCIM, and directory sync for team management",
      "Custom verification workflows and compliance rules",
      "Role-based access control with audit trails",
      "Dedicated API rate limits and SLA guarantees",
      "On-premise deployment option for regulated industries",
    ],
  },
  {
    id: "freelancers",
    icon: Briefcase,
    label: "Freelancers",
    gradient: "from-orange-500/20 to-orange-500/5",
    iconColor: "text-orange-400",
    borderColor: "border-orange-500/30",
    title: "Win more clients with verified trust",
    description: "Replace static portfolios with a live, verifiable professional passport that proves your expertise instantly.",
    benefits: [
      "Verify client testimonials and project outcomes",
      "Showcase verified skills with Trust Score badges",
      "Share your passport on Upwork, Fiverr, and LinkedIn",
      "Auto-updating credential portfolio with QR sharing",
      "Stand out from competitors with verified proof of work",
    ],
  },
];

export default function SolutionsPage() {
  const [activeTab, setActiveTab] = useState("students");

  const active = audiences.find((a) => a.id === activeTab) || audiences[0];

  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-slate-800/50 pt-32 pb-16 md:pb-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 -left-32 w-96 h-96 rounded-full blur-[128px] opacity-30 bg-gradient-radial from-cyan-500/10 to-transparent" />
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-white/[0.03] px-3.5 py-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">Solutions</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Built for{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                every professional
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Whether you&apos;re a student, engineer, recruiter, or enterprise — Patorbit adapts to how you build and verify professional trust.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs + Content */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-12 justify-center">
            {audiences.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveTab(a.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === a.id
                    ? `${a.borderColor} ${a.gradient} ${a.iconColor} border`
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
              >
                <a.icon className="w-4 h-4" />
                {a.label}
              </button>
            ))}
          </div>

          {/* Active solution */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-4xl mx-auto">
                <div className={`rounded-2xl border ${active.borderColor} ${active.gradient} p-8 lg:p-10 mb-8`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.06]">
                      <active.icon className={`w-6 h-6 ${active.iconColor}`} />
                    </div>
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-white">{active.title}</h2>
                    </div>
                  </div>
                  <p className="text-[17px] text-slate-400 leading-relaxed">{active.description}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-8">
                  {active.benefits.map((b) => (
                    <div key={b} className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-300">{b}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <Link
                    href="/contact"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
                  >
                    Find Your Solution
                    <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/contact#sales"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100"
                  >
                    Contact Sales
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}