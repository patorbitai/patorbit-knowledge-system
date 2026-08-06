"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, GraduationCap, Code, Brain, Search, Users, Building2, Briefcase, FileText, Database, ShieldCheck, BarChart3, CreditCard } from "lucide-react";

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
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800/50 pt-32 pb-20 md:pb-28">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.004)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.004)_1px,transparent_1px)] bg-[size:56px_56px]" />
        {/* Ambient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px] opacity-40 bg-gradient-to-b from-cyan-500/10 via-blue-500/6 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full blur-[100px] opacity-25 bg-gradient-to-tl from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">

            {/* Left: Copy */}
            <div>
              {/* Category badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-800/80 bg-white/[0.03] backdrop-blur-sm px-3.5 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                </span>
                <span className="text-[11px] text-slate-400 tracking-[0.15em] uppercase font-medium">Professional Identity Platform</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-[3.75rem] xl:text-[4.25rem] font-bold leading-[0.95] tracking-tight text-white mb-6">
                One verified identity.{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Every career stage.
                </span>
              </h1>

              <p className="text-[17px] text-slate-400 leading-relaxed max-w-lg mb-3">
                Your credentials are scattered across resumes, LinkedIn, GitHub, and certificates. Patorbit unifies them into one verified professional identity that grows with you.
              </p>

              {/* Platform signals */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 mb-8 mt-6">
                {[
                  { label: "Verified Credentials", color: "text-emerald-400" },
                  { label: "Trust Score", color: "text-cyan-400" },
                  { label: "Professional Passport", color: "text-blue-400" },
                ].map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`w-1.5 h-1.5 rounded-full bg-current ${item.color}`} />
                    <span className={item.color}>{item.label}</span>
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
                >
                  Build Your Identity
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/contact#sales"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100"
                >
                  Talk to Sales
                </a>
              </div>
            </div>

            {/* Right: Platform mockup */}
            <div className="relative hidden lg:block">
              {/* Ghost depth layers */}
              <div className="absolute -bottom-4 -left-4 -right-4 h-full rounded-2xl border border-slate-800/20 bg-slate-900/10 -z-20" />
              <div className="absolute -bottom-2 -left-2 -right-2 h-full rounded-2xl border border-slate-800/30 bg-slate-900/20 -z-10" />

              {/* Main card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-[0_0_80px_-20px_rgba(6,182,212,0.12)]">
                {/* Card chrome */}
                <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-[11px] shadow-md shadow-cyan-500/20">
                      P
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Professional Passport</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Identity verified
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-[11px] font-semibold text-emerald-400">Trust Score 84</span>
                  </div>
                </div>

                {/* Passport body */}
                <div className="p-5 space-y-4">
                  {/* Identity row */}
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-800/60 bg-white/[0.02]">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700/60 flex items-center justify-center text-lg font-bold text-slate-300">
                      AK
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Alex Kim</div>
                      <div className="text-xs text-slate-500">Senior Software Engineer · 5 yrs verified</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-2xl font-bold tabular-nums bg-gradient-to-r from-emerald-300 to-cyan-400 bg-clip-text text-transparent">84</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider">Trust Score</div>
                    </div>
                  </div>

                  {/* Credential grid */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { label: "Verified Claims", value: "24", accent: "text-cyan-400", bg: "bg-cyan-500/8 border-cyan-500/20" },
                      { label: "Evidence Sources", value: "12", accent: "text-blue-400", bg: "bg-blue-500/8 border-blue-500/20" },
                      { label: "Certifications", value: "6", accent: "text-purple-400", bg: "bg-purple-500/8 border-purple-500/20" },
                    ].map((stat) => (
                      <div key={stat.label} className={`rounded-xl border ${stat.bg} px-3 py-3 text-center`}>
                        <div className={`text-xl font-bold tabular-nums ${stat.accent}`}>{stat.value}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Verified claims feed */}
                  <div className="space-y-2">
                    {[
                      { claim: "5 years React experience", source: "GitHub · 1,840 commits", verified: true },
                      { claim: "AWS Solutions Architect", source: "Amazon Certification DB", verified: true },
                      { claim: "Led team of 8 engineers", source: "LinkedIn · Manager confirmed", verified: true },
                    ].map((item) => (
                      <div key={item.claim} className="flex items-start gap-3 rounded-lg border border-slate-800/50 bg-white/[0.015] px-3.5 py-2.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-200 truncate">{item.claim}</div>
                          <div className="text-[10px] text-slate-600 mt-0.5 truncate">{item.source}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Platform ecosystem hint */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider">Part of</div>
                    <div className="flex gap-1.5">
                      {["Resume Builder", "Knowledge Graph", "Career Hub"].map((p) => (
                        <span key={p} className="rounded-md border border-slate-800/60 bg-slate-900/60 px-2 py-0.5 text-[9px] text-slate-500">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Why Patorbit */}
      <section className="relative bg-[#070B14] py-24 lg:py-36 overflow-hidden border-b border-slate-800/40">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/10 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6">

          {/* Headline + description */}
          <div className="text-center mb-20">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">The Problem</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-white leading-[1.0] mb-7 max-w-3xl mx-auto">
              Professional identity is{" "}
              <span className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                fragmented.
              </span>
            </h2>
            <p className="text-[17px] text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Today&apos;s professionals manage resumes, LinkedIn profiles, portfolios, certificates, GitHub, and work history across multiple platforms. None of them provide a single trusted identity.
            </p>
          </div>

          {/* Three-column comparison */}
          <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-0 max-w-5xl mx-auto items-start">

            {/* Left — Traditional Way */}
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-600 font-semibold text-center mb-6">Traditional Way</p>

              {/* Source platforms */}
              <div className="space-y-2.5 mb-6">
                {["Resume", "LinkedIn", "Portfolio", "Certificates", "GitHub"].map((src) => (
                  <div key={src} className="flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-900/30 px-4 py-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                    <span className="text-sm font-medium text-slate-400">{src}</span>
                  </div>
                ))}
              </div>

              {/* Down arrow */}
              <div className="flex flex-col items-center gap-1 my-5">
                <div className="w-px h-6 bg-gradient-to-b from-slate-700/80 to-transparent" />
                <ArrowRight className="w-4 h-4 text-slate-600 rotate-90" />
              </div>

              {/* Problems */}
              <div className="space-y-2.5">
                {[
                  { label: "Scattered", sub: "Spread across platforms" },
                  { label: "Manual", sub: "Updated by hand" },
                  { label: "Hard to verify", sub: "No proof of claims" },
                  { label: "Outdated", sub: "Stale within months" },
                  { label: "Disconnected", sub: "No unified picture" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-rose-500/10 bg-rose-500/[0.03] px-4 py-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500/50 shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-rose-300/80">{item.label}</span>
                      <span className="text-xs text-slate-600 ml-2">{item.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center — arrow connector */}
            <div className="flex lg:flex-col items-center justify-center px-10 shrink-0 gap-2 py-6 lg:py-0 lg:mt-[3.75rem]">
              <div className="hidden lg:block w-px h-16 bg-gradient-to-b from-transparent via-slate-700/60 to-transparent" />
              <div className="rounded-full border border-slate-700/60 bg-slate-900/80 p-3 shrink-0">
                <ArrowRight className="w-4 h-4 text-cyan-400 lg:hidden" />
                <ArrowRight className="w-4 h-4 text-cyan-400 rotate-90 hidden lg:block" />
              </div>
              <div className="hidden lg:block w-px h-16 bg-gradient-to-b from-transparent via-slate-700/60 to-transparent" />
              <span className="text-[10px] uppercase tracking-widest text-slate-600 font-medium lg:hidden">becomes</span>
            </div>

            {/* Right — Patorbit */}
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-500/70 font-semibold text-center mb-6">Patorbit</p>

              {/* Platform identity card */}
              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/[0.06] to-transparent p-6 shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)] mb-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-base font-bold text-white">One Professional Identity</div>
                    <div className="text-xs text-slate-500 mt-0.5">Unified · Portable · Yours</div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-[11px] font-semibold text-emerald-400">Verified</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Trust Score", value: "84 / 100", bar: "bg-gradient-to-r from-cyan-400 to-emerald-400", pct: "84%" },
                    { label: "Verified Claims", value: "24", bar: "bg-cyan-400", pct: "96%" },
                    { label: "Evidence Sources", value: "12", bar: "bg-blue-400", pct: "75%" },
                  ].map((row) => (
                    <div key={row.label} className="rounded-lg border border-slate-800/60 bg-slate-900/60 px-3 py-2.5">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[11px] text-slate-500">{row.label}</span>
                        <span className="text-[11px] font-semibold text-white tabular-nums">{row.value}</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${row.bar}`} style={{ width: row.pct }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Qualities */}
              <div className="space-y-2.5">
                {[
                  { label: "Verified", sub: "Every claim backed by evidence" },
                  { label: "Evidence-backed", sub: "Linked to real sources" },
                  { label: "Continuously updated", sub: "Always current" },
                  { label: "Trusted", sub: "Recruiters hire with confidence" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] px-4 py-3">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2.5} />
                    <div>
                      <span className="text-sm font-medium text-emerald-300/90">{item.label}</span>
                      <span className="text-xs text-slate-600 ml-2">{item.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Patorbit Identity Engine */}
      <section className="relative bg-[#070B14] py-24 lg:py-36 overflow-hidden border-b border-slate-800/40">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] opacity-20 bg-gradient-radial from-cyan-500/20 via-blue-500/10 to-transparent pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6">

          {/* Header */}
          <div className="text-center mb-20">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">How It Works</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-white leading-[1.05] mb-6">
              The Patorbit{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Identity Engine
              </span>
            </h2>
            <p className="text-[17px] text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Every credential you&apos;ve earned flows through a single pipeline — extracted, verified, connected, and scored into one trusted professional identity.
            </p>
          </div>

          {/* Pipeline — desktop: horizontal row; mobile: vertical stack */}
          <div className="relative flex flex-col lg:flex-row items-center lg:items-start justify-center gap-0">

            {[
              {
                step: "01",
                label: "Identity",
                detail: "Your raw career data — resume, profiles, repos — imported into Patorbit.",
                color: "from-slate-400/20 to-slate-400/5",
                border: "border-slate-600/40",
                dot: "bg-slate-400",
                text: "text-slate-300",
                accent: "#94a3b8",
              },
              {
                step: "02",
                label: "Claims",
                detail: "AI extracts structured claims: roles, skills, tenure, achievements.",
                color: "from-blue-500/20 to-blue-500/5",
                border: "border-blue-500/30",
                dot: "bg-blue-400",
                text: "text-blue-300",
                accent: "#60a5fa",
              },
              {
                step: "03",
                label: "Evidence",
                detail: "Each claim is matched to verifiable sources: commits, databases, registries.",
                color: "from-purple-500/20 to-purple-500/5",
                border: "border-purple-500/30",
                dot: "bg-purple-400",
                text: "text-purple-300",
                accent: "#a78bfa",
              },
              {
                step: "04",
                label: "Verification",
                detail: "Evidence is cross-referenced and validated. Unverifiable claims are flagged.",
                color: "from-amber-500/20 to-amber-500/5",
                border: "border-amber-500/30",
                dot: "bg-amber-400",
                text: "text-amber-300",
                accent: "#fbbf24",
              },
              {
                step: "05",
                label: "Trust Score",
                detail: "A weighted 0–100 score computed from depth, breadth, and verification rate.",
                color: "from-emerald-500/20 to-emerald-500/5",
                border: "border-emerald-500/30",
                dot: "bg-emerald-400",
                text: "text-emerald-300",
                accent: "#34d399",
              },
              {
                step: "06",
                label: "Passport",
                detail: "Your verified identity packaged as a shareable, portable Professional Passport.",
                color: "from-cyan-500/20 to-cyan-500/5",
                border: "border-cyan-500/30",
                dot: "bg-cyan-400",
                text: "text-cyan-300",
                accent: "#22d3ee",
              },
              {
                step: "07",
                label: "Career Growth",
                detail: "Your passport compounds over time — every new credential strengthens your identity.",
                color: "from-indigo-500/20 to-indigo-500/5",
                border: "border-indigo-500/30",
                dot: "bg-indigo-400",
                text: "text-indigo-300",
                accent: "#818cf8",
              },
            ].map((node, i, arr) => (
              <div key={node.label} className="flex flex-col lg:flex-row items-center w-full lg:w-auto flex-1">

                {/* Card */}
                <div className={`relative flex-1 w-full max-w-[180px] lg:max-w-none rounded-2xl border ${node.border} bg-gradient-to-b ${node.color} p-5 text-center lg:text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]`}>
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                    <span className={`h-2 w-2 rounded-full ${node.dot} shrink-0`} />
                    <span className="text-[10px] font-mono text-slate-600 tracking-widest">{node.step}</span>
                  </div>
                  <div className={`text-base font-bold mb-1.5 ${node.text}`}>{node.label}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{node.detail}</p>
                </div>

                {/* Connector — hidden after last item */}
                {i < arr.length - 1 && (
                  <div className="flex flex-col lg:flex-row items-center justify-center px-1 lg:px-2 py-2 lg:py-0 shrink-0">
                    {/* Vertical line on mobile, horizontal on desktop */}
                    <div className="flex lg:hidden flex-col items-center gap-1">
                      <div className="w-px h-4 bg-slate-700/60" />
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: arr[i + 1].accent }}
                      />
                      <div className="w-px h-4 bg-slate-700/60" />
                    </div>
                    <div className="hidden lg:flex flex-row items-center gap-1">
                      <div className="h-px w-4 bg-slate-700/60" />
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: arr[i + 1].accent }}
                      />
                      <div className="h-px w-4 bg-slate-700/60" />
                    </div>
                  </div>
                )}

              </div>
            ))}

          </div>

          {/* Bottom note */}
          <p className="text-center text-slate-600 text-[13px] mt-16 max-w-xl mx-auto">
            The engine runs continuously — every new credential you add is re-processed, re-verified, and re-scored automatically.
          </p>

        </div>
      </section>

      {/* Platform Ecosystem */}
      <section className="relative bg-[#070B14] py-24 lg:py-36 overflow-hidden border-b border-slate-800/40">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full blur-[140px] opacity-15 bg-gradient-to-t from-indigo-500/20 via-blue-500/10 to-transparent pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">The Platform</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-white leading-[1.05] mb-6">
              One platform.{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Every tool you need.
              </span>
            </h2>
            <p className="text-[17px] text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Each product is powerful on its own. Together, they form a complete professional identity platform — connected through a single verified data layer.
            </p>
          </div>

          {/* Platform label */}
          <div className="flex items-center justify-center gap-3 mb-14">
            <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-slate-700/60" />
            <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-1.5">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-[9px]">P</div>
              <span className="text-xs font-semibold text-slate-300 tracking-wide">Professional Identity Platform</span>
            </div>
            <div className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-slate-700/60" />
          </div>

          {/* Product grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: CreditCard,
                name: "Professional Passport",
                tag: "Core",
                tagColor: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
                iconBg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
                border: "border-cyan-500/20 hover:border-cyan-500/40",
                glow: "hover:shadow-[0_0_32px_-8px_rgba(6,182,212,0.18)]",
                gradient: "from-cyan-500/[0.07] to-transparent",
                learnHref: "/career-passport",
                description: "Your entire verified career in one shareable link. Trust Score, evidence-backed claims, and credentials — packaged as a living document you own forever.",
                preview: (
                  <div className="mt-5 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Trust Score</span>
                      <span className="text-xs font-bold text-emerald-400">84 / 100</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {["React · verified", "AWS · verified", "Node.js · verified"].map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/8 px-2 py-0.5 text-[10px] text-emerald-400">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />{s}
                        </span>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                icon: FileText,
                name: "Resume Builder",
                tag: "AI-Powered",
                tagColor: "bg-purple-500/10 border-purple-500/20 text-purple-400",
                iconBg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
                border: "border-purple-500/20 hover:border-purple-500/40",
                glow: "hover:shadow-[0_0_32px_-8px_rgba(168,85,247,0.18)]",
                gradient: "from-purple-500/[0.07] to-transparent",
                learnHref: "/resume-builder",
                description: "ATS-optimized resumes built from your verified identity. Your passport data populates the resume automatically — no manual entry, no formatting headaches.",
                preview: (
                  <div className="mt-5 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 space-y-2">
                    <div className="h-2.5 w-2/3 rounded-full bg-slate-700/70" />
                    <div className="h-1.5 w-full rounded-full bg-slate-800" />
                    <div className="h-1.5 w-5/6 rounded-full bg-slate-800" />
                    <div className="h-1.5 w-4/6 rounded-full bg-slate-800" />
                    <div className="flex items-center gap-2 pt-1">
                      <span className="rounded-md border border-purple-500/30 bg-purple-500/8 px-2 py-0.5 text-[10px] text-purple-400 font-medium">ATS 96%</span>
                      <span className="text-[10px] text-slate-600">3 premium templates</span>
                    </div>
                  </div>
                ),
              },
              {
                icon: Database,
                name: "Knowledge Graph",
                tag: "Semantic AI",
                tagColor: "bg-blue-500/10 border-blue-500/20 text-blue-400",
                iconBg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
                border: "border-blue-500/20 hover:border-blue-500/40",
                glow: "hover:shadow-[0_0_32px_-8px_rgba(59,130,246,0.18)]",
                gradient: "from-blue-500/[0.07] to-transparent",
                learnHref: "/knowledge-graph",
                description: "A semantic map of your skills, roles, and achievements. Surfaces hidden connections between your experiences and reveals skill gaps before they cost you an offer.",
                preview: (
                  <div className="mt-5 rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
                    <svg viewBox="0 0 160 80" className="w-full h-16">
                      <line x1="80" y1="40" x2="30" y2="15" stroke="rgba(96,165,250,0.25)" strokeWidth="1.5" />
                      <line x1="80" y1="40" x2="130" y2="15" stroke="rgba(96,165,250,0.25)" strokeWidth="1.5" />
                      <line x1="80" y1="40" x2="20" y2="65" stroke="rgba(96,165,250,0.25)" strokeWidth="1.5" />
                      <line x1="80" y1="40" x2="140" y2="65" stroke="rgba(96,165,250,0.25)" strokeWidth="1.5" />
                      <line x1="80" y1="40" x2="80" y2="72" stroke="rgba(96,165,250,0.25)" strokeWidth="1.5" />
                      <circle cx="80" cy="40" r="7" fill="#60a5fa" fillOpacity="0.9" />
                      <circle cx="30" cy="15" r="4.5" fill="#93c5fd" fillOpacity="0.8" />
                      <circle cx="130" cy="15" r="4.5" fill="#93c5fd" fillOpacity="0.8" />
                      <circle cx="20" cy="65" r="3.5" fill="#bfdbfe" fillOpacity="0.7" />
                      <circle cx="140" cy="65" r="3.5" fill="#bfdbfe" fillOpacity="0.7" />
                      <circle cx="80" cy="72" r="3.5" fill="#bfdbfe" fillOpacity="0.7" />
                    </svg>
                    <div className="flex justify-between mt-1 px-1">
                      <span className="text-[9px] text-slate-600">68 nodes</span>
                      <span className="text-[9px] text-slate-600">132 edges</span>
                    </div>
                  </div>
                ),
              },
              {
                icon: BarChart3,
                name: "Trust Timeline",
                tag: "Verification",
                tagColor: "bg-amber-500/10 border-amber-500/20 text-amber-400",
                iconBg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
                border: "border-amber-500/20 hover:border-amber-500/40",
                glow: "hover:shadow-[0_0_32px_-8px_rgba(245,158,11,0.18)]",
                gradient: "from-amber-500/[0.07] to-transparent",
                learnHref: "/trust-verification",
                description: "A tamper-proof chronological record of your career milestones. Every entry is timestamped, evidence-backed, and permanently verifiable by anyone you share it with.",
                preview: (
                  <div className="mt-5 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 space-y-2.5">
                    {[
                      { year: "2024", event: "Senior Engineer", verified: true },
                      { year: "2022", event: "AWS Certified", verified: true },
                      { year: "2020", event: "CS Degree · Stanford", verified: true },
                    ].map((item) => (
                      <div key={item.year} className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-600 w-8 shrink-0">{item.year}</span>
                        <div className="w-2 h-2 rounded-full bg-amber-400/80 shrink-0" />
                        <span className="text-[11px] text-slate-400 flex-1 truncate">{item.event}</span>
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" strokeWidth={2.5} />
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                icon: Brain,
                name: "AI Career Copilot",
                tag: "Intelligent",
                tagColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                iconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                border: "border-emerald-500/20 hover:border-emerald-500/40",
                glow: "hover:shadow-[0_0_32px_-8px_rgba(52,211,153,0.18)]",
                gradient: "from-emerald-500/[0.07] to-transparent",
                learnHref: "/platform",
                description: "An AI assistant that knows your full verified career. Recommends roles, flags credential gaps, and suggests resume improvements — all grounded in your real data.",
                preview: (
                  <div className="mt-5 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 space-y-2.5">
                    <div className="rounded-lg bg-slate-800/70 px-3 py-2.5">
                      <p className="text-[11px] text-slate-300 leading-relaxed">&ldquo;Add your AWS cert to close a gap in 3 senior roles and boost your Trust Score by ~8 pts.&rdquo;</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-[10px] text-emerald-500/80">Analyzing your profile in real-time</span>
                    </div>
                  </div>
                ),
              },
              {
                icon: Users,
                name: "Career Hub",
                tag: "Dashboard",
                tagColor: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
                iconBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
                border: "border-indigo-500/20 hover:border-indigo-500/40",
                glow: "hover:shadow-[0_0_32px_-8px_rgba(129,140,248,0.18)]",
                gradient: "from-indigo-500/[0.07] to-transparent",
                learnHref: "/platform",
                description: "Your command center. Monitor your Trust Score, track verification progress, manage all credentials, and launch every Patorbit product — all from one authenticated dashboard.",
                preview: (
                  <div className="mt-5 rounded-xl border border-slate-800/60 bg-slate-900/60 p-3 grid grid-cols-3 gap-1.5">
                    {[
                      { label: "Passport", icon: CreditCard },
                      { label: "Resume", icon: FileText },
                      { label: "Graph", icon: Database },
                      { label: "Timeline", icon: BarChart3 },
                      { label: "Copilot", icon: Brain },
                      { label: "Trust", icon: ShieldCheck },
                    ].map((w) => (
                      <div key={w.label} className="rounded-lg border border-slate-800/60 bg-slate-900/50 px-2 py-2 flex flex-col items-center gap-1">
                        <w.icon className="w-3 h-3 text-slate-600" />
                        <span className="text-[9px] text-slate-600">{w.label}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
            ].map((product) => {
              const Icon = product.icon;
              return (
                <div
                  key={product.name}
                  className={`relative flex flex-col rounded-2xl border ${product.border} bg-gradient-to-b ${product.gradient} bg-slate-900/40 p-6 transition-all duration-200 ${product.glow} group`}
                >
                  {/* Icon + tag row */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${product.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${product.tagColor}`}>
                      {product.tag}
                    </span>
                  </div>

                  {/* Name + description */}
                  <h3 className="text-lg font-bold text-white mb-2 leading-snug">{product.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{product.description}</p>

                  {/* Inline preview */}
                  {product.preview}

                  {/* Learn More */}
                  <div className="mt-5">
                    <Link
                      href={product.learnHref}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors duration-150 hover:text-white group/link"
                    >
                      Learn More
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <p className="text-center text-slate-600 text-[13px] mt-16 max-w-xl mx-auto">
            Add a credential once — it automatically enriches your Passport, Resume, Graph, Timeline, and Copilot simultaneously.
          </p>

        </div>
      </section>

      {/* Audience Benefits */}
      <section className="relative bg-[#070B14] py-24 lg:py-36 overflow-hidden border-b border-slate-800/40">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/10 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">Built For You</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-white leading-[1.05] mb-5">
              Every professional.{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                One platform.
              </span>
            </h2>
            <p className="text-[17px] text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Patorbit adapts to where you are in your career — and where you want to go.
            </p>
          </div>

          {/* Audience tabs */}
          <div className="flex flex-wrap gap-2 mb-12 justify-center">
            {audiences.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveTab(a.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === a.id
                    ? `${a.borderColor} ${a.gradient} ${a.iconColor} border`
                    : "text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-800/60"
                }`}
              >
                <a.icon className="w-4 h-4" />
                {a.label}
              </button>
            ))}
          </div>

          {/* Active audience panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">

                {/* Left: title + description + CTA */}
                <div className={`rounded-2xl border ${active.borderColor} bg-gradient-to-b ${active.gradient} p-8 flex flex-col`}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${active.borderColor} bg-white/[0.04]`}>
                      <active.icon className={`w-5 h-5 ${active.iconColor}`} />
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-widest ${active.iconColor}`}>{active.label}</span>
                  </div>

                  <h3 className="text-2xl lg:text-3xl font-bold text-white leading-snug mb-4">
                    {active.title}
                  </h3>
                  <p className="text-[15px] text-slate-400 leading-relaxed flex-1">
                    {active.description}
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/register"
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02] active:scale-100"
                    >
                      Get Started Free
                      <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                      href="/contact#sales"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-6 py-3 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100"
                    >
                      Talk to Sales
                    </Link>
                  </div>
                </div>

                {/* Right: benefits list */}
                <div className="flex flex-col gap-3">
                  {active.benefits.map((b, i) => (
                    <div
                      key={b}
                      className="flex items-start gap-3.5 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3.5 transition-colors duration-150 hover:border-slate-700/60 hover:bg-slate-900/60"
                      style={{ transitionDelay: `${i * 30}ms` }}
                    >
                      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${active.borderColor} bg-white/[0.03]`}>
                        <Check className={`w-3 h-3 ${active.iconColor}`} strokeWidth={2.5} />
                      </div>
                      <span className="text-sm text-slate-300 leading-relaxed">{b}</span>
                    </div>
                  ))}
                </div>

              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </section>

      {/* Capability Matrix */}
      <section className="relative bg-[#070B14] py-24 lg:py-36 overflow-hidden border-b border-slate-800/40">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/10 pointer-events-none" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[500px] rounded-full blur-[140px] opacity-10 bg-cyan-500/20 pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-6">

          {/* Header */}
          <div className="text-center mb-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">Comparison</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-white leading-[1.05] mb-5">
              How Patorbit compares
            </h2>
            <p className="text-[17px] text-slate-400 leading-relaxed max-w-xl mx-auto">
              A factual capability matrix. No marketing language — just what each platform can and cannot do.
            </p>
          </div>

          {/* Matrix — scrollable on mobile */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800/50 bg-slate-900/30">
            <table className="w-full min-w-[560px] border-collapse">

              {/* Column headers */}
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="w-[38%] px-6 py-5 text-left">
                    <span className="text-[11px] uppercase tracking-[0.15em] text-slate-600 font-medium">Capability</span>
                  </th>
                  {[
                    { label: "Resume", sub: "PDF / DOCX", highlight: false },
                    { label: "LinkedIn", sub: "Social profile", highlight: false },
                    { label: "Portfolio", sub: "Personal site", highlight: false },
                    { label: "Patorbit", sub: "Identity Platform", highlight: true },
                  ].map((col) => (
                    <th key={col.label} className={`py-5 text-center ${col.highlight ? "bg-cyan-500/[0.04]" : ""}`}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-sm font-semibold ${col.highlight ? "text-cyan-300" : "text-slate-400"}`}>
                          {col.label}
                        </span>
                        <span className={`text-[10px] ${col.highlight ? "text-cyan-500/60" : "text-slate-600"}`}>
                          {col.sub}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {[
                  { capability: "Verified Identity",       resume: false,      linkedin: false,     portfolio: false,  patorbit: true  },
                  { capability: "Evidence-backed Claims",  resume: false,      linkedin: false,     portfolio: false,  patorbit: true  },
                  { capability: "Trust Score",             resume: false,      linkedin: false,     portfolio: false,  patorbit: true  },
                  { capability: "Professional Passport",   resume: false,      linkedin: false,     portfolio: false,  patorbit: true  },
                  { capability: "Knowledge Graph",         resume: false,      linkedin: false,     portfolio: false,  patorbit: true  },
                  { capability: "Career Timeline",         resume: false,      linkedin: "Partial", portfolio: false,  patorbit: true  },
                  { capability: "AI Assistance",           resume: false,      linkedin: false,     portfolio: false,  patorbit: true  },
                  { capability: "Privacy Controls",        resume: false,      linkedin: "Limited", portfolio: "Basic", patorbit: true  },
                ].map((row, i) => {
                  const vals = [row.resume, row.linkedin, row.portfolio, row.patorbit];
                  return (
                    <tr
                      key={row.capability}
                      className={`border-b border-slate-800/40 last:border-0 transition-colors duration-100 hover:bg-white/[0.015] ${i % 2 === 0 ? "" : "bg-white/[0.008]"}`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-300">{row.capability}</span>
                      </td>
                      {vals.map((val, j) => (
                        <td key={j} className={`py-4 text-center ${j === 3 ? "bg-cyan-500/[0.04]" : ""}`}>
                          {val === true ? (
                            <div className="inline-flex items-center justify-center">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/12 border border-cyan-500/30">
                                <Check className="w-3.5 h-3.5 text-cyan-400" strokeWidth={2.5} />
                              </div>
                            </div>
                          ) : val === false ? (
                            <span className="inline-block w-4 h-[1.5px] bg-slate-700/70 rounded-full mx-auto" />
                          ) : (
                            <span className="inline-block text-[10px] font-medium text-amber-400/80 bg-amber-500/8 border border-amber-500/20 rounded-md px-2 py-0.5 leading-none">
                              {val}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-center text-slate-600 text-[13px] mt-8 max-w-xl mx-auto">
            "Partial" and "Limited" reflect platform capabilities as of 2026. Patorbit works alongside your existing profiles — not instead of them.
          </p>

        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-[#070B14] py-36 lg:py-48 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full blur-[180px] opacity-20 bg-gradient-to-r from-cyan-500/25 via-blue-500/15 to-indigo-500/20 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#070B14] to-transparent pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">

          {/* Eyebrow */}
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Professional Identity Platform</span>
          </div>

          {/* Headline */}
          <h2 className="text-5xl sm:text-6xl lg:text-[4.75rem] xl:text-[5.25rem] font-bold tracking-tight leading-[1.0] text-white mb-8">
            The future of hiring{" "}
            <br className="hidden sm:block" />
            begins with{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              verified
            </span>
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              professional identity.
            </span>
          </h2>

          {/* Sub-copy */}
          <p className="text-lg sm:text-[18px] text-slate-400 leading-relaxed max-w-2xl mx-auto mb-14">
            Stop sending static documents into a void. Build one verified identity that proves who you are — and carries your career forward for life.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-9 py-4 text-base font-semibold text-white shadow-xl shadow-cyan-500/25 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/35 hover:scale-[1.02] active:scale-100"
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/platform"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/50 px-9 py-4 text-base font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-600 hover:text-white hover:scale-[1.02] active:scale-100"
            >
              Explore the Platform
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5">
            {[
              "Free forever plan",
              "No credit card required",
              "Setup in 2 minutes",
              "Export anytime",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                <Check className="w-3.5 h-3.5 text-emerald-500/60" strokeWidth={2.5} />
                {item}
              </span>
            ))}
          </div>

        </div>
      </section>
    </main>
  );
}