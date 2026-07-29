"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { FileText, Search, ShieldCheck, UserCheck } from "lucide-react";

const problems = [
  {
    icon: FileText,
    title: "Resumes Are Just Claims",
    description: "Anyone can write anything on a resume. There's no way to verify what's true and what's exaggerated.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Search,
    title: "Hiring on Faith",
    description: "Recruiters spend hours cross-referencing candidates with LinkedIn, GitHub, and references — with no guarantee.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Trust Is Fragile",
    description: "A single overstated claim can destroy credibility. Yet verification is an afterthought in most hiring pipelines.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: UserCheck,
    title: "Your Identity Is Fragmented",
    description: "Your degrees, skills, and experience are scattered across platforms. No unified professional identity exists.",
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
            Why resumes{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              don&apos;t work
            </span>{" "}
            anymore
          </h2>
          <p className="mt-4 text-[17px] text-slate-400 leading-relaxed max-w-xl mx-auto">
            The professional world runs on trust — yet the tools we use to prove ourselves haven&apos;t evolved in decades.
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
