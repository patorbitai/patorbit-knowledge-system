"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { User, FileText, Target, Sparkles, Download } from "lucide-react";

const steps = [
  {
    icon: User,
    title: "Build your Professional Identity",
    description: "Keep your professional information organized in one place — name, experience, education, skills, and more.",
    color: "#06b6d4",
  },
  {
    icon: FileText,
    title: "Create multiple resumes",
    description: "Create separate resumes for different roles and opportunities. Each one starts from your Professional Identity.",
    color: "#3b82f6",
  },
  {
    icon: Target,
    title: "Tailor to a job",
    description: "Paste a job description and Patorbit analyzes the match — identifying strengths, gaps, and improvement opportunities.",
    color: "#8b5cf6",
  },
  {
    icon: Sparkles,
    title: "Review AI suggestions",
    description: "AI suggests changes based on your existing information. Missing skills are identified, not invented. You approve every change.",
    color: "#10b981",
  },
  {
    icon: Download,
    title: "Export or share",
    description: "Export your finished resume as PDF or DOCX, or share it with a link.",
    color: "#f59e0b",
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
            From professional identity to{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              tailored resume
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-slate-400 leading-relaxed max-w-xl mx-auto">
            Build once, tailor for every opportunity. No manual rewrites. No invented experience.
          </p>
        </div>

        {/* Steps grid */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line */}
          <div className="absolute left-10 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 hidden md:block" />

          <div className="space-y-8 md:space-y-0">
            {steps.map((step, i) => (
              <div
                key={step.title}
                style={{
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.4s ease-out ${i * 0.08}s, transform 0.4s ease-out ${i * 0.08}s`,
                }}
                className="relative md:grid md:grid-cols-[80px_1fr] gap-6 items-center py-4"
              >
                {/* Step number + icon */}
                <div className="relative flex md:flex-col items-center gap-3 md:items-center md:h-full">
                  <div className="relative z-10 h-14 w-14 shrink-0 rounded-full bg-[#070B14] md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-full border"
                      style={{
                        borderColor: `${step.color}30`,
                        backgroundColor: `${step.color}10`,
                      }}
                    >
                      <step.icon className="h-6 w-6" style={{ color: step.color }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold tabular-nums md:mt-auto md:mb-0" style={{ color: step.color }}>
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
