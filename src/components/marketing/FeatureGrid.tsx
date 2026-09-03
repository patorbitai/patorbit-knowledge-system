"use client";

import GlowCard from "@/components/ui/GlowCard";
import {
  User,
  FileText,
  Target,
  Sparkles,
  Layout,
  Download,
} from "lucide-react";

const features = [
  {
    icon: User,
    title: "Professional Identity",
    description: "Maintain reusable professional information as the foundation for all your resumes.",
    gradient: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
  },
  {
    icon: FileText,
    title: "Multiple Resumes",
    description: "Create separate resume versions for different roles without losing your original.",
    gradient: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
  },
  {
    icon: Target,
    title: "Job Tailoring",
    description: "Paste a job description and get a tailored resume based on your existing information.",
    gradient: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
  },
  {
    icon: Sparkles,
    title: "Truthful AI",
    description: "Improve wording and structure without fabricating employers, skills, or achievements.",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: Layout,
    title: "Professional Templates",
    description: "Choose from multiple layout families designed for different career stages and industries.",
    gradient: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    icon: Download,
    title: "Export & Share",
    description: "Export as PDF or DOCX, or share your resume with a public link.",
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
            Your complete{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              resume toolkit
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-slate-400 leading-relaxed max-w-xl mx-auto">
            From Professional Identity to tailored exports, everything you need to build the right resume for every opportunity.
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
