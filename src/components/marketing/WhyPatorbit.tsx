"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { User, Copy, Target, ShieldCheck } from "lucide-react";

const cards = [
  {
    title: "One Professional Identity",
    description:
      "Stop re-entering the same information across every resume. Build your professional profile once and reuse it everywhere.",
    icon: User,
    gradient: "from-cyan-500/20 to-cyan-500/10",
    border: "hover:border-cyan-500/30",
    glow: "group-hover:shadow-cyan-500/5",
  },
  {
    title: "Multiple Resumes, Zero Clutter",
    description:
      "Create separate resumes for different roles — Data Engineer, ML Engineer, Tech Lead — without losing your original or managing confusing file versions.",
    icon: Copy,
    gradient: "from-blue-500/20 to-blue-500/10",
    border: "hover:border-blue-500/30",
    glow: "group-hover:shadow-blue-500/5",
  },
  {
    title: "Job-Specific Tailoring",
    description:
      "Paste a job description and Patorbit identifies what matches, what partially matches, and what's missing — then suggests improvements based on your existing experience.",
    icon: Target,
    gradient: "from-purple-500/20 to-purple-500/10",
    border: "hover:border-purple-500/30",
    glow: "group-hover:shadow-purple-500/5",
  },
  {
    title: "Truthful AI",
    description:
      "AI improves wording and structure without fabricating employers, skills, certifications, or achievements. You review every change before saving.",
    icon: ShieldCheck,
    gradient: "from-emerald-500/20 to-emerald-500/10",
    border: "hover:border-emerald-500/30",
    glow: "group-hover:shadow-emerald-500/5",
  },
];

export default function WhyPatorbit() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative bg-[#070B14] py-24 lg:py-32 overflow-hidden"
      aria-label="Why Patorbit"
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
          }}
          className="text-center mb-16"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
              Why Patorbit
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            Resume building{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              without the busywork
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Patorbit keeps your professional information organized, creates multiple resumes from it, and helps you tailor each one to the job — without inventing experience.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                style={{
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? "translateY(0)" : "translateY(24px)",
                  transition: `opacity 0.5s ease-out ${0.12 + i * 0.1}s, transform 0.5s ease-out ${0.12 + i * 0.1}s`,
                }}
                className={`group relative rounded-2xl border border-slate-800/60 bg-gradient-to-b ${card.gradient} p-8 transition-all duration-500 hover:-translate-y-1 ${card.border} ${card.glow} hover:shadow-2xl`}
              >
                {/* Icon */}
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} border border-slate-700/40`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-3 leading-snug">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Vision Statement */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.6s ease-out 0.5s, transform 0.6s ease-out 0.5s",
          }}
          className="mt-20 text-center"
        >
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-6xl text-slate-700/30 select-none leading-none">
                &ldquo;
              </div>
              <p className="text-xl lg:text-2xl font-medium text-white/90 leading-relaxed">
                Tailor the truth.
              </p>
              <p className="text-xl lg:text-2xl font-medium mt-2 bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Don&apos;t manufacture a better-looking truth.
              </p>
              <div className="absolute -bottom-12 right-1/4 text-6xl text-slate-700/30 select-none leading-none">
                &rdquo;
              </div>
            </div>

            {/* Divider */}
            <div className="mt-12 flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-700/50" />
              <div className="h-1 w-1 rounded-full bg-blue-400/50" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-700/50" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
