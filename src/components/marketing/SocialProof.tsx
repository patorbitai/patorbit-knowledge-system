"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { FileText, Target, Sparkles, Download } from "lucide-react";

const capabilities = [
  { icon: FileText, label: "Multiple Resumes", desc: "Create separate versions for every opportunity" },
  { icon: Target, label: "Job Tailoring", desc: "AI matches your resume to each job description" },
  { icon: Sparkles, label: "Truthful AI", desc: "Improves content without inventing experience" },
  { icon: Download, label: "Export & Share", desc: "PDF, DOCX, or shareable link" },
];

export default function SocialProof() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#070B14] border-y border-slate-800/60 py-16 overflow-hidden"
      aria-label="Core capabilities"
    >
      <div className="relative mx-auto max-w-7xl px-6">
        <p
          className="text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-500 mb-10"
          style={{
            opacity: isInView ? 1 : 0,
            transition: "opacity 0.25s ease-out",
          }}
        >
          Built for a simpler resume workflow
        </p>

        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          style={{
            opacity: isInView ? 1 : 0,
            transition: "opacity 0.3s ease-out 0.1s",
          }}
        >
          {capabilities.map((cap, i) => (
            <div
              key={cap.label}
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(8px)",
                transition: `opacity 0.2s ease-out ${0.04 + i * 0.03}s, transform 0.2s ease-out ${0.04 + i * 0.03}s`,
              }}
              className="flex flex-col items-center text-center gap-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <cap.icon className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="text-sm font-medium text-slate-300">{cap.label}</span>
              <span className="text-xs text-slate-500 leading-relaxed">{cap.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
