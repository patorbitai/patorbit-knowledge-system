"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { Repeat, FileText, Shuffle, Sparkles } from "lucide-react";

const problems = [
  {
    icon: Repeat,
    title: "Rewriting the Same Resume",
    description: "You update your resume for every application, re-entering the same information repeatedly.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: FileText,
    title: "Too Many Versions",
    description: "You end up with multiple resume files and forget which version contains what.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Shuffle,
    title: "Manual Tailoring",
    description: "Matching your resume to each job description takes hours of manual editing.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Sparkles,
    title: "AI That Overstates",
    description: "Some AI tools add skills and experience you don't actually have.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

export default function Problem() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative bg-[#070B14] py-24 lg:py-32 overflow-hidden"
      aria-label="The Problem"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:48px_48px]" />
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
              The Problem
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            Resumes are{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              harder than they should be
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-slate-400 leading-relaxed max-w-xl mx-auto">
            Every job application means rewriting the same information. There should be a better way.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {problems.map((item, i) => (
            <div
              key={item.title}
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.4s ease-out ${0.1 + i * 0.08}s, transform 0.4s ease-out ${0.1 + i * 0.08}s`,
              }}
              className="group rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700/60"
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
