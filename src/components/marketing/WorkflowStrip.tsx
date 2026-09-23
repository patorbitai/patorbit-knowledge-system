"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { Upload, Search, Target, CheckCircle2, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    label: "Upload",
    desc: "Import your existing resume or start fresh.",
  },
  {
    icon: Search,
    label: "Analyze",
    desc: "Paste a job description. See your match instantly.",
  },
  {
    icon: Target,
    label: "Tailor",
    desc: "Get suggestions from your real experience only.",
  },
  {
    icon: CheckCircle2,
    label: "Approve",
    desc: "You review and accept every change.",
  },
  {
    icon: Download,
    label: "Export",
    desc: "Download an ATS-friendly PDF or DOCX.",
  },
];

export default function WorkflowStrip() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      className="relative bg-surface-sunken py-16 border-y border-subtle overflow-hidden"
      aria-label="How Patorbit works"
    >
      <div className="relative mx-auto max-w-7xl px-6">
        <h2
          className="text-center text-sm font-medium uppercase tracking-[0.2em] text-ink-muted mb-10"
          style={{ opacity: isInView ? 1 : 0, transition: "opacity 0.3s ease-out" }}
        >
          Upload → Analyze → Tailor → Approve → Export
        </h2>

        <ol
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-5xl mx-auto list-none"
          style={{ opacity: isInView ? 1 : 0, transition: "opacity 0.3s ease-out 0.1s" }}
        >
          {steps.map((step, i) => (
            <li
              key={step.label}
              className="relative flex flex-col items-center text-center gap-2.5"
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(10px)",
                transition: `opacity 0.3s ease-out ${0.15 + i * 0.07}s, transform 0.3s ease-out ${0.15 + i * 0.07}s`,
              }}
            >
              {/* Connector arrow (hidden on small screens and after last step) */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden lg:block absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-gradient-to-r from-slate-700 to-slate-800"
                >
                  <span className="absolute right-0 -top-[3px] w-1.5 h-1.5 rotate-45 border-t border-r border-slate-600" />
                </span>
              )}

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                <step.icon className="h-5 w-5 text-cyan-400" aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold text-ink">{step.label}</span>
              <span className="text-xs text-ink-muted leading-relaxed max-w-[180px]">
                {step.desc}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
