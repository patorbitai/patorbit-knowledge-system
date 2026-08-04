"use client";

import GlowCard from "@/components/ui/GlowCard";
import {
  Brain,
  ShieldCheck,
  Network,
  Star,
  UserCheck,
  Fingerprint,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Resume Intelligence",
    description: "98%+ accurate extraction from any resume format.",
    gradient: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
  },
  {
    icon: ShieldCheck,
    title: "Credential Verification",
    description: "Real-time cross-referencing against public databases.",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: Network,
    title: "AI Knowledge Graph",
    description: "A living map of your skills, experience, and connections.",
    gradient: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
  },
  {
    icon: Star,
    title: "Trust Score",
    description: "Dynamic 0–100 score reflecting verification depth.",
    gradient: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    icon: UserCheck,
    title: "Professional Passport",
    description: "Portable identity — share anywhere with one link.",
    gradient: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
  },
  {
    icon: Fingerprint,
    title: "Blockchain Verification",
    description: "Tamper-proof credential anchoring on chain.",
    gradient: "from-rose-500/20 to-rose-500/5",
    iconColor: "text-rose-400",
  },
];

export default function FeatureGrid() {
  return (
    <section className="relative bg-[#070B14] py-24 lg:py-32 overflow-hidden" aria-label="Features">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
              Everything You Need
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            Your complete professional{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              identity toolkit
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-slate-400 leading-relaxed max-w-xl mx-auto">
            From AI extraction to verified credentials, everything you need to prove who you are.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <GlowCard key={feature.title} index={i}>
              <div
                className={`mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient} border border-white/[0.06]`}
              >
                <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </GlowCard>
          ))}
        </div>
      </div>
    </section>
  );
}
