"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { FileText, Brain, ShieldCheck, Network, Star, UserCheck } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Import Your Resume",
    description: "Upload any resume — PDF, DOCX, or JSON. Our AI parses every data point with 98%+ accuracy.",
    color: "#3b82f6",
  },
  {
    icon: Brain,
    title: "AI Extracts & Maps",
    description: "LLMs identify every claim — degrees, titles, skills, certifications — and map them to verifiable fields.",
    color: "#8b5cf6",
  },
  {
    icon: ShieldCheck,
    title: "Verify Every Claim",
    description: "Each credential is cross-referenced against public databases, academic registries, and professional networks.",
    color: "#f59e0b",
  },
  {
    icon: Network,
    title: "Build Your Knowledge Graph",
    description: "Every verified fact becomes a node in your personal knowledge graph — connected, searchable, secure.",
    color: "#06b6d4",
  },
  {
    icon: Star,
    title: "Generate Your Trust Score",
    description: "A dynamic 0–100 score reflecting the strength and completeness of your verified professional identity.",
    color: "#10b981",
  },
  {
    icon: UserCheck,
    title: "Claim Your Passport",
    description: "Share your professional passport with anyone — employers, clients, networks — with one link or QR code.",
    color: "#00D4FF",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#070B14] py-24 lg:py-32 overflow-hidden"
      aria-label="How It Works"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
          }}
          className="text-center mb-16"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
              How It Works
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            From resume to verified identity in{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              minutes.
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-slate-400 leading-relaxed max-w-xl mx-auto">
            No manual data entry. No waiting. Just upload and let AI do the work.
          </p>
        </div>

        {/* Steps grid */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 hidden md:block" />

          <div className="space-y-8 md:space-y-0">
            {steps.map((step, i) => (
              <div
                key={step.title}
                style={{
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.4s ease-out ${i * 0.08}s, transform 0.4s ease-out ${i * 0.08}s`,
                }}
                className="relative md:grid md:grid-cols-[80px_1fr] gap-6 items-start py-4"
              >
                {/* Step number + icon */}
                <div className="flex md:flex-col items-center gap-3 md:items-center">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border"
                    style={{
                      borderColor: `${step.color}30`,
                      backgroundColor: `${step.color}10`,
                    }}
                  >
                    <step.icon className="h-6 w-6" style={{ color: step.color }} />
                  </div>
                  <span className="text-xs font-bold tabular-nums" style={{ color: step.color }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Content */}
                <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5 transition-all duration-300 hover:border-slate-700/60">
                  <h3 className="text-base font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
