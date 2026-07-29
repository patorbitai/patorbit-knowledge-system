"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { ShieldCheck, Share2, QrCode, Globe } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const credentialBlocks = [
  { label: "Degree", value: "B.S. Computer Science", verified: true },
  { label: "Role", value: "Senior Software Engineer", verified: true },
  { label: "Certification", value: "AWS Solutions Architect", verified: true },
  { label: "Skill", value: "React, TypeScript, Python", verified: true },
];

export default function ProfessionalPassport() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative bg-[#070B14] py-24 lg:py-32 overflow-hidden"
      aria-label="Professional Passport"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent" />
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
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
              Professional Passport
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            One identity to{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              prove it all
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-slate-400 leading-relaxed max-w-xl mx-auto">
            Your Patorbit Passport is a shareable, verifiable, always-updating professional identity.
          </p>
        </div>

        {/* Passport card */}
        <div
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.5s ease-out 0.1s, transform 0.5s ease-out 0.1s",
          }}
          className="max-w-lg mx-auto"
        >
          <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900 to-slate-900/80 p-8 shadow-[0_0_40px_-10px_rgba(59,130,246,0.1)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-md shadow-cyan-500/20">
                  <span className="text-sm font-bold text-white">P</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Patorbit Passport</div>
                  <div className="text-[10px] text-slate-500">Verified Professional Identity</div>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>

            {/* Identity */}
            <div className="mb-6 pb-6 border-b border-slate-800/60">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xl font-bold text-white">
                  A
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">Alex Morgan</div>
                  <div className="text-sm text-slate-400">Senior Software Engineer</div>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-semibold text-emerald-400">Trust Score: 84/100</span>
              </div>
            </div>

            {/* Credentials */}
            <div className="space-y-3 mb-6">
              {credentialBlocks.map((block) => (
                <div key={block.label} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-2.5">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">{block.label}</div>
                    <div className="text-sm text-white mt-0.5">{block.value}</div>
                  </div>
                  {block.verified && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Share options */}
            <div className="flex items-center justify-between border-t border-slate-800/60 pt-4">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <Share2 className="w-3.5 h-3.5" />
                Shareable link
                <QrCode className="w-3.5 h-3.5 ml-2" />
                QR code
                <Globe className="w-3.5 h-3.5 ml-2" />
                API access
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <Link
              href="/resume-builder"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
            >
              Preview Passport
              <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
