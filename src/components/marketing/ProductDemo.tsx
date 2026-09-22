"use client";

import { useRef, useState, useEffect } from "react";
import { useInView } from "framer-motion";
import {
  FileText,
  ClipboardPaste,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Check,
  X,
  Download,
} from "lucide-react";

/* ─── Demo data — a realistic, clearly illustrative walkthrough ─── */

const candidateExperience = [
  {
    role: "Senior Data Engineer",
    company: "Nimbus Retail",
    period: "2022 – Present",
    points: [
      "Built Azure Data Factory pipelines feeding a 2TB Snowflake warehouse",
      "Cut nightly batch runtime 40% by partitioning PySpark jobs",
      "Mentored 2 junior engineers on SQL code review",
    ],
  },
];

const jobDescription = `Senior Data Engineer — Meridian Health

Must have:
• 5+ years building data pipelines (Azure or AWS)
• Strong Python and SQL
• Experience with dbt and Snowflake
• Healthcare / HIPAA data experience a plus

Nice to have:
• Airflow orchestration
• CI/CD for data workflows`;

const matchedSkills = ["Python", "SQL", "Azure Data Factory", "PySpark", "Snowflake"];
const partialSkills = ["dbt", "CI/CD"];
const missingSkills = ["HIPAA experience"];

const suggestions = [
  {
    before:
      "Built Azure Data Factory pipelines feeding a 2TB Snowflake warehouse",
    after:
      "Built and orchestrated Azure Data Factory pipelines feeding a 2TB Snowflake warehouse, with dbt-style transformation tests on critical tables",
    reason: "Matches the job's pipeline + transformation language",
    requiresApproval: true,
  },
  {
    before: "Mentored 2 junior engineers on SQL code review",
    after:
      "Mentored 2 junior engineers through structured SQL review, raising query standards across the team",
    reason: "Stronger, more specific wording — no new facts added",
    requiresApproval: true,
  },
];

const steps = [
  "Your experience",
  "Job description",
  "Analyzing",
  "Matched skills",
  "Partial matches",
  "Missing skills",
  "Suggested changes",
  "Your approval",
  "Tailored resume",
] as const;

const stepIcons = [
  FileText,
  ClipboardPaste,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Check,
  Download,
];

function Chip({
  label,
  variant,
}: {
  label: string;
  variant: "matched" | "partial" | "missing";
}) {
  const styles = {
    matched:
      "bg-emerald-500/10 border-emerald-500/25 text-emerald-300",
    partial:
      "bg-amber-500/10 border-amber-500/25 text-amber-300",
    missing:
      "bg-red-500/10 border-red-500/25 text-red-300",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[variant]}`}
    >
      {variant === "matched" && <Check className="h-3 w-3" aria-hidden="true" />}
      {variant === "partial" && <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
      {variant === "missing" && <X className="h-3 w-3" aria-hidden="true" />}
      {label}
    </span>
  );
}

/* ─── Step panels ─── */

function StepPanel({ step }: { step: number }) {
  // Step 2: analyzing — animate the progress bar
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (step !== 2) return;
    setProgress(0);
    const id = setInterval(
      () => setProgress((p) => (p >= 100 ? 100 : p + 10)),
      60,
    );
    return () => clearInterval(id);
  }, [step]);

  switch (step) {
    case 0:
      return (
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Your resume · Experience
          </div>
          {candidateExperience.map((exp) => (
            <div
              key={exp.role}
              className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-white">
                  {exp.role}
                </span>
                <span className="text-xs text-slate-500">{exp.period}</span>
              </div>
              <div className="text-xs text-cyan-400/90 mb-2.5">
                {exp.company}
              </div>
              <ul className="space-y-1.5">
                {exp.points.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-xs text-slate-400 leading-relaxed"
                  >
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-600 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case 1:
      return (
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Pasted job description
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-slate-800/60 bg-slate-900/50 p-4 text-xs text-slate-400 leading-relaxed font-sans overflow-x-auto max-h-[260px]">
            {jobDescription}
          </pre>
        </div>
      );

    case 2:
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2
            className="h-8 w-8 animate-spin text-cyan-400"
            aria-hidden="true"
          />
          <div className="text-sm text-slate-300">
            Comparing the job against your real experience…
          </div>
          <div
            className="h-1.5 w-56 rounded-full bg-slate-800 overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Analysis progress"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );

    case 3:
      return (
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-medium">
            Matched ({matchedSkills.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((s) => (
              <Chip key={s} label={s} variant="matched" />
            ))}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Found in your resume — these will be emphasized in the tailored
            version.
          </p>
        </div>
      );

    case 4:
      return (
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-wider text-amber-400 font-medium">
            Partial ({partialSkills.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {partialSkills.map((s) => (
              <Chip key={s} label={s} variant="partial" />
            ))}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Related experience found — we&apos;ll surface it where it&apos;s
            honest to do so, without claiming full proficiency.
          </p>
        </div>
      );

    case 5:
      return (
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-wider text-red-400 font-medium">
            Missing ({missingSkills.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((s) => (
              <Chip key={s} label={s} variant="missing" />
            ))}
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5">
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-emerald-300">
                Not added to your resume.
              </strong>{" "}
              We report the gap instead of inventing the skill. Consider
              learning it or gaining relevant experience.
            </p>
          </div>
        </div>
      );

    case 6:
      return (
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Suggested changes — before / after
          </div>
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-4 space-y-2.5"
            >
              <div className="flex items-start gap-2 text-xs text-slate-500 line-through decoration-red-400/50">
                <X className="h-3.5 w-3.5 text-red-400/70 mt-0.5 shrink-0" aria-hidden="true" />
                {s.before}
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-200">
                <Check
                  className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {s.after}
              </div>
              <div className="text-[11px] text-cyan-400/80">
                <Sparkles className="h-3 w-3 inline -mt-0.5 mr-1" aria-hidden="true" />
                {s.reason}
              </div>
            </div>
          ))}
        </div>
      );

    case 7:
      return (
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Nothing saves until you say so
          </div>
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-800/60 bg-slate-900/50 p-4"
            >
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {s.after}
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 px-3 py-1.5 text-xs font-medium text-emerald-300">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Accept
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 text-xs font-medium text-slate-400">
                  Edit
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 text-xs font-medium text-slate-400">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Reject
                </span>
              </div>
            </div>
          ))}
        </div>
      );

    case 8:
      return (
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Ready to export
          </div>
          <div className="rounded-lg border border-slate-800/60 bg-white/[0.02] p-5">
            {/* Mini A4 preview */}
            <div className="mx-auto w-full max-w-[220px] aspect-[210/297] rounded border border-slate-700/60 bg-slate-950/80 p-4 space-y-2">
              <div className="h-2.5 w-2/3 rounded bg-cyan-400/40" />
              <div className="h-1.5 w-1/2 rounded bg-slate-600/60" />
              <div className="h-1 w-full rounded bg-slate-700/50" />
              <div className="h-1 w-5/6 rounded bg-slate-700/50" />
              <div className="h-1.5 w-1/3 rounded bg-slate-500/50 mt-2" />
              <div className="h-1 w-full rounded bg-slate-700/50" />
              <div className="h-1 w-11/12 rounded bg-slate-700/50" />
              <div className="h-1 w-4/5 rounded bg-slate-700/50" />
              <div className="h-1.5 w-1/3 rounded bg-slate-500/50 mt-2" />
              <div className="h-1 w-full rounded bg-slate-700/50" />
              <div className="h-1 w-3/4 rounded bg-slate-700/50" />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-semibold text-white">
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export PDF
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3.5 py-2 text-xs font-medium text-slate-300">
                Export DOCX
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Tailored from your original — your source resume stays untouched.
          </p>
        </div>
      );

    default:
      return null;
  }
}

/* ─── Section ─── */

export default function ProductDemo() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Auto-play the walkthrough once when it scrolls into view
  useEffect(() => {
    if (!isInView || playing) return;
    setPlaying(true);
    let current = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const advance = () => {
      if (current >= steps.length - 1) return;
      current += 1;
      setActiveStep(current);
      timers.push(setTimeout(advance, current === 2 ? 2200 : 1900));
    };
    timers.push(setTimeout(advance, 1400));
    return () => timers.forEach(clearTimeout);
  }, [isInView, playing]);

  return (
    <section
      ref={ref}
      className="relative bg-[#070B14] py-24 lg:py-32 overflow-hidden"
      aria-label="Product demonstration"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-transparent to-slate-900/20" />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <div
          className="text-center mb-12"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
          }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/60 px-3.5 py-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-400">
              See it in action
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            A real walkthrough,{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              step by step
            </span>
          </h2>
          <p className="mt-4 text-[17px] text-slate-400 leading-relaxed max-w-2xl mx-auto">
            One candidate, one job description, nine steps — from paste to
            exported resume. Illustrative example using sample data.
          </p>
        </div>

        <div
          className="grid lg:grid-cols-[240px_1fr] gap-6 max-w-5xl mx-auto items-start"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.4s ease-out 0.1s, transform 0.4s ease-out 0.1s",
          }}
        >
          {/* Step rail */}
          <nav
            aria-label="Demo steps"
            className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-6 px-6 lg:mx-0 lg:px-0"
          >
            {steps.map((label, i) => {
              const Icon = stepIcons[i];
              const isActive = i === activeStep;
              const isDone = i < activeStep;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setActiveStep(i);
                    setPlaying(true); // stop autoplay on manual interaction
                  }}
                  aria-current={isActive ? "step" : undefined}
                  className={`flex items-center gap-2.5 shrink-0 lg:w-full rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    isActive
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                      : isDone
                      ? "border-slate-800/60 bg-white/[0.02] text-slate-400 hover:border-slate-700/60"
                      : "border-slate-800/30 bg-transparent text-slate-600 hover:text-slate-400"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive
                        ? "text-cyan-400"
                        : isDone
                        ? "text-emerald-400/80"
                        : "text-slate-600"
                    } ${i === 2 && isActive ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                  <span className="whitespace-nowrap lg:whitespace-normal">
                    <span className="text-slate-600 mr-1.5 tabular-nums">
                      {i + 1}
                    </span>
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Step content — app-window chrome */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-[0_0_60px_-15px_rgba(59,130,246,0.12)] min-h-[380px]">
            {/* Window header */}
            <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-[10px]">
                  P
                </div>
                <span className="text-xs font-medium text-slate-300">
                  Patorbit — Job Tailoring
                </span>
              </div>
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <div className="w-2 h-2 rounded-full bg-slate-600" />
                <div className="w-2 h-2 rounded-full bg-slate-600" />
                <div className="w-2 h-2 rounded-full bg-slate-600" />
              </div>
            </div>

            {/* Progress ticks */}
            <div className="px-4 pt-3">
              <div className="flex gap-1" aria-hidden="true">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                      i <= activeStep ? "bg-cyan-400/80" : "bg-slate-800"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Panel */}
            <div className="p-5" aria-live="polite">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/15 text-[10px] font-bold text-cyan-300 tabular-nums">
                  {activeStep + 1}
                </span>
                <h3 className="text-sm font-semibold text-white">
                  {steps[activeStep]}
                </h3>
              </div>
              <StepPanel step={activeStep} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
