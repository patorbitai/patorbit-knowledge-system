"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { Fingerprint, ShieldCheck, Rocket, Users } from "lucide-react";

const cards = [
  {
    title: "Build Once. Reuse Everywhere.",
    description:
      "Professionals repeatedly recreate the same information across resumes, job portals, LinkedIn, freelance platforms, and application forms. Patorbit creates one structured Professional Passport that evolves with your career.",
    icon: Users,
    gradient: "from-blue-500/20 to-cyan-500/10",
    border: "hover:border-blue-500/30",
    glow: "group-hover:shadow-blue-500/5",
  },
  {
    title: "Evidence, Not Just Claims",
    description:
      "Anyone can claim skills on a resume. Patorbit connects projects, certifications, portfolios, and career achievements into one evidence-backed professional identity.",
    icon: ShieldCheck,
    gradient: "from-emerald-500/20 to-teal-500/10",
    border: "hover:border-emerald-500/30",
    glow: "group-hover:shadow-emerald-500/5",
  },
  {
    title: "Career Ready, Anytime",
    description:
      "Whether you're applying for a job, internship, scholarship, or future professional opportunities, your Professional Passport is always ready to share.",
    icon: Rocket,
    gradient: "from-purple-500/20 to-violet-500/10",
    border: "hover:border-purple-500/30",
    glow: "group-hover:shadow-purple-500/5",
  },
];

export default function WhyPatorbit() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative bg-[#070B14] py-24 lg:py-32 overflow-hidden"
      aria-label="Why professionals need Patorbit"
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
              The Problem
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            Why Professional Identity{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Needs to Change
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The resume hasn&apos;t evolved in decades. It&apos;s a static document
            built on claims, not evidence. Professionals deserve better.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
              {/* Decorative quote marks */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-6xl text-slate-700/30 select-none leading-none">
                &ldquo;
              </div>
              <p className="text-xl lg:text-2xl font-medium text-white/90 leading-relaxed">
                The future of professional identity isn&apos;t another resume.
              </p>
              <p className="text-xl lg:text-2xl font-medium mt-2 bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                It&apos;s a secure, portable Professional Passport that you own.
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
