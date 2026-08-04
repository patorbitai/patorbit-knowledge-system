"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Brain, ShieldCheck, Network, Star, UserCheck, Fingerprint, Check } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

const featureDetails = [
  {
    icon: Brain,
    title: "AI Resume Intelligence",
    color: "blue",
    gradient: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
    badge: "98%+ Accuracy",
    description: "Upload any resume format — PDF, DOCX, or JSON — and our AI extracts every data point with unmatched precision.",
    highlights: [
      "Multi-format parsing with 98%+ field accuracy",
      "LLM-powered skill, experience, and education extraction",
      "Confidence scoring per extracted field",
      "Supports 50+ resume formats and languages",
      "Real-time parsing with sub-second processing",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Credential Verification",
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
    badge: "Real-time",
    description: "Every claim on your resume is cross-referenced against authoritative sources to confirm its validity.",
    highlights: [
      "Academic registry cross-referencing (degrees, transcripts)",
      "Professional network verification (LinkedIn, GitHub, etc.)",
      "Company and employment record validation",
      "Certification database checks (AWS, Google, Microsoft, etc.)",
      "Ongoing monitoring — re-verify credentials automatically",
    ],
  },
  {
    icon: Network,
    title: "AI Knowledge Graph",
    color: "cyan",
    gradient: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
    badge: "Semantic Web",
    description: "Your verified credentials form a living knowledge graph — revealing connections between skills, experiences, and opportunities.",
    highlights: [
      "Semantic relationship mapping between credentials",
      "Skill adjacency and gap analysis",
      "Dynamic graph updates as new credentials are added",
      "Visual graph explorer for recruiters and hiring managers",
      "API access for programmatic graph traversal",
    ],
  },
  {
    icon: Star,
    title: "Trust Score",
    color: "amber",
    gradient: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
    badge: "0–100 Scale",
    description: "A single, transparent metric that reflects the depth and verification status of your entire professional identity.",
    highlights: [
      "Weighted scoring based on credential type and source reliability",
      "Evidence count and quality factored into final score",
      "Real-time updates as new credentials are verified",
      "Breakdown by category (education, experience, skills, certs)",
      "Shareable score badge for profiles, portfolios, and applications",
    ],
  },
  {
    icon: UserCheck,
    title: "Professional Passport",
    color: "purple",
    gradient: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
    badge: "Shareable",
    description: "Your portable, always-updating professional identity. Share it anywhere with a single link or QR code.",
    highlights: [
      "Single shareable link with live credential updates",
      "Built-in QR code for quick sharing at events and interviews",
      "Privacy controls — choose what to share and with whom",
      "Embeddable widget for portfolio sites and LinkedIn",
      "Export as PDF, JSON, or verifiable credential format",
    ],
  },
  {
    icon: Fingerprint,
    title: "Blockchain Verification",
    color: "rose",
    gradient: "from-rose-500/20 to-rose-500/5",
    iconColor: "text-rose-400",
    badge: "Tamper-Proof",
    description: "Critical credentials can be anchored to blockchain for permanent, tamper-evident verification that you control.",
    highlights: [
      "Immutable credential hashing on Ethereum and Polygon",
      "Self-sovereign identity — you control access, not platforms",
      "Verifiable credential standard (W3C VC) compliance",
      "Zero-knowledge proof support for selective disclosure",
      "Cross-chain verification via Patorbit verification API",
    ],
  },
];

const extraFeatures = [
  {
    icon: Brain,
    title: "API & Integrations",
    description: "RESTful APIs and webhooks for seamless integration with your existing HR tech stack, ATS platforms, and workflow automation tools.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Security",
    description: "GDPR-compliant, SOC 2-ready infrastructure with end-to-end encryption, audit trails, and granular access controls.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-slate-800/50 pt-32 pb-24 md:pb-28">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 -left-32 w-96 h-96 rounded-full blur-[128px] opacity-30 bg-gradient-radial from-cyan-500/10 to-transparent" />
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">Features</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                prove who you are
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              From AI-powered extraction to blockchain verification — Patorbit gives you and your organization the tools to build, verify, and share professional identity with confidence.
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
                  <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-4">
                    {feature.title}
                  </h2>
                  <p className="text-[17px] text-slate-400 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual */}
                <div className={`rounded-xl border border-slate-800/60 bg-gradient-to-br ${feature.gradient} p-8 lg:p-10 flex items-center justify-center ${i % 2 === 1 ? "lg:col-start-1" : ""}`}>
                  <div className="text-center">
                    <div className={`inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/[0.06] mb-6`}>
                      <feature.icon className={`h-10 w-10 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Extra features grid */}
      <section className="py-24 border-t border-slate-800/50">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            label="More Capabilities"
            title="Platform features that scale with you"
            subtitle="APIs, security, and integrations to fit any workflow."
          />
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {extraFeatures.map((f) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] mb-4">
                  <f.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-slate-800/50">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-4">
              Every feature designed to{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                build trust
              </span>
            </h2>
            <p className="text-[17px] text-slate-400 leading-relaxed mb-8">
              From AI extraction to blockchain verification — see the full capabilities in a live walkthrough.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/platform"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
              >
                Explore all Features
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/resume-builder"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100"
              >
                View Live Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
