"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { Fingerprint, FileSearch, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Fingerprint,
    title: "Living Identity",
    description: "A digital career identity that evolves with every verified achievement.",
    color: "text-cyan-400",
    bg: "from-cyan-400/15 to-blue-500/10",
    border: "hover:border-cyan-500/30",
  },
  {
    icon: FileSearch,
    title: "Evidence-Backed",
    description: "Every claim linked to verifiable sources — degrees, employers, peers.",
    color: "text-blue-400",
    bg: "from-blue-400/15 to-indigo-500/10",
    border: "hover:border-blue-500/30",
  },
  {
    icon: Shield,
    title: "Transparent Trust",
    description: "Trust scores with full reasoning — not black-box seals or badges.",
    color: "text-indigo-400",
    bg: "from-indigo-400/15 to-purple-500/10",
    border: "hover:border-indigo-500/30",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description: "Import a resume. Get a verified knowledge graph in under two minutes.",
    color: "text-purple-400",
    bg: "from-purple-400/15 to-cyan-500/10",
    border: "hover:border-purple-500/30",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.2s ease-out ${index * 0.05}s, transform 0.2s ease-out ${index * 0.05}s`,
      }}
    >
      <div className={`h-full rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 ${feature.border} hover:bg-slate-900/90 hover:shadow-[0_8px_32px_-8px_rgba(59,130,246,0.12)]`}>
        <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.bg} transition-transform duration-150 group-hover:scale-[1.03]`}>
          <Icon className={`h-5 w-5 ${feature.color}`} strokeWidth={1.75} />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
      </div>
    </div>
  );
}

export default function FeatureBar() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-40px" });

  return (
    <section className="relative bg-slate-950 py-24 overflow-hidden" aria-label="Key features">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-blue-500/5 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div
          ref={headerRef}
          className="mx-auto max-w-2xl text-center mb-14"
          style={{
            opacity: headerInView ? 1 : 0,
            transform: headerInView ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
          }}
        >
          <span className="inline-block rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1 text-xs font-medium text-cyan-400 backdrop-blur-sm mb-5">
            Why Patorbit
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Beyond documents.{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Built on evidence.
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            Traditional platforms treat resumes as truth. Patorbit treats every claim as verifiable — connected by evidence that builds lasting trust.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
