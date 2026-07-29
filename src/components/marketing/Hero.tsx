"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Brain,
  Network,
  ShieldCheck,
  ArrowRight,
  Play,
  Check,
  Loader2,
} from "lucide-react";

/* ─── Pipeline stages — only 4 processing steps ─── */
const pipeline = [
  {
    id: "resume",
    icon: FileText,
    label: "Resume Imported",
    detail: "Parsing 3 pages · 47 data points",
    color: "#3b82f6",
  },
  {
    id: "extraction",
    icon: Brain,
    label: "AI Extraction",
    detail: "LLM extracts 12 verified claims",
    color: "#8b5cf6",
  },
  {
    id: "graph",
    icon: Network,
    label: "Knowledge Graph",
    detail: "68 nodes · 132 edges · semantic map built",
    color: "#06b6d4",
  },
  {
    id: "verify",
    icon: ShieldCheck,
    label: "Evidence Verification",
    detail: "24 of 24 claims matched to verifiable sources",
    color: "#f59e0b",
  },
];

/* ─── Pipeline step cards ─── */
function PipelineStep({ step, index, stage }: { step: typeof pipeline[0]; index: number; stage: number }) {
  const isPast = index < stage;
  const isCurrent = index === stage;
  const Icon = step.icon;

  return (
    <div
      className={`relative z-10 flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-500 ${
        isCurrent
          ? "border-blue-500/30 bg-blue-500/10 shadow-[0_0_20px_-5px_rgba(59,130,246,0.15)]"
          : isPast
          ? "border-slate-800/60 bg-white/[0.03]"
          : "border-slate-800/30 bg-transparent opacity-30"
      }`}
      style={{ transform: isCurrent ? "scale(1.02)" : "scale(1)" }}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
          isPast
            ? "bg-emerald-500/15 text-emerald-400"
            : isCurrent
            ? "bg-blue-500/15 text-blue-400"
            : "bg-slate-800/60 text-slate-600"
        }`}
      >
        {isPast ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Icon className="h-4 w-4" strokeWidth={1.75} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm font-medium ${
              isCurrent ? "text-blue-300" : isPast ? "text-slate-300" : "text-slate-500"
            }`}
          >
            {step.label}
          </span>
          {isPast && <span className="text-[10px] font-medium text-emerald-400/80">Done</span>}
          {isCurrent && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />}
        </div>

        {isCurrent && (
          <div>
            <p className="mt-1 text-[11px] text-slate-500 leading-snug">{step.detail}</p>
            <div className="mt-2.5 h-0.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  backgroundColor: step.color,
                  width: "100%",
                  animation: "progress-fill 1.2s linear forwards",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Pipeline loading steps (always 4) ─── */
function PipelineLoading({ stage }: { stage: number }) {
  return (
    <div className="relative flex flex-col gap-3 py-2" style={{ minHeight: 0 }}>
      {/* SVG connecting line */}
      <svg className="absolute left-[18px] top-0 h-full w-6 pointer-events-none z-0" aria-hidden="true">
        {pipeline.map((step, i) => {
          if (i >= pipeline.length) return null;
          const active = i < stage;
          return (
            <line
              key={step.id}
              x1="12"
              y1="28"
              x2="12"
              y2={i === pipeline.length - 1 ? "28" : "68"}
              stroke={active ? step.color : "rgba(255,255,255,0.06)"}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              className="transition-colors duration-500"
            />
          );
        })}
      </svg>

      {pipeline.map((step, i) => (
        <PipelineStep key={step.id} step={step} index={i} stage={stage} />
      ))}

      {/* Interstitial: "Generating Trust Score..." showing while done=false but stage >= 4 */}
      {stage >= pipeline.length && (
        <div className="relative z-10 flex w-full items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-emerald-300">Generating Trust Score...</span>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50 20" strokeLinecap="round" />
              </svg>
            </div>
            <div className="mt-2.5 h-0.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: "100%", animation: "progress-fill 2s linear infinite" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Final Trust Score Panel ─── */
function TrustScorePanel({ score }: { score: number }) {
  return (
    <div className="p-4">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">Trust Score</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tabular-nums bg-gradient-to-r from-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              {score}
            </span>
            <span className="text-base text-slate-500 font-medium">/100</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 animate-ambient-glow">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-semibold text-emerald-400">Excellent</span>
        </div>
      </div>

      <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400"
          style={{ width: `${score}%`, transition: "width 1s ease-out" }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Verified Claims", value: 24 },
          { label: "Graph Nodes", value: 68 },
          { label: "Evidence Sources", value: 12 },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-slate-800/80 bg-slate-900/60 px-2.5 py-2 text-center">
            <div className="text-base font-bold text-white tabular-nums">{m.value}</div>
            <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Hero Component ─── */
export default function Hero() {
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [trustScore, setTrustScore] = useState(0);
  const [showTrust, setShowTrust] = useState(false);
  const pipelineStarted = useRef(false);

  // Advance pipeline on mount
  useEffect(() => {
    if (pipelineStarted.current) return;
    pipelineStarted.current = true;

    let current = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const run = () => {
      if (current >= pipeline.length) {
        // Pipeline done — show generating state briefly, then reveal trust score
        setStage(current); // triggers "Generating Trust Score..."
        timers.push(setTimeout(() => setDone(true), 1800));
        return;
      }
      setStage(current);
      current++;
      timers.push(setTimeout(run, current === 1 ? 700 : 1300));
    };

    run();
    return () => timers.forEach(clearTimeout);
  }, []);

  // Count up trust score once done
  useEffect(() => {
    if (!done) return;
    let cancelled = false;
    setShowTrust(true);
    const countUp = () => {
      if (cancelled) return;
      setTrustScore((s) => {
        if (s >= 84) return s;
        const next = Math.min(84, s + 2);
        setTimeout(countUp, 18);
        return next;
      });
    };
    setTimeout(countUp, 300);
    return () => { cancelled = true; };
  }, [done]);

  const rightContentHeight = done ? "h-[340px]" : stage >= pipeline.length ? "h-[460px]" : "h-[420px]";

  return (
    <section
      className="relative min-h-screen bg-[#070B14] flex items-center overflow-hidden"
      aria-label="Hero"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070B14]/80 via-[#070B14]/95 to-[#070B14]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-cyan-500/[0.07] via-blue-500/[0.04] to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-gradient-radial from-purple-500/[0.05] via-transparent to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* ─── LEFT: Copy ─── */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-800/80 bg-white/[0.03] backdrop-blur-sm px-3.5 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] text-slate-400 tracking-wider uppercase font-medium">Live on Mainnet</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[4.25rem] xl:text-[5rem] font-bold leading-[0.95] tracking-tight text-white">
              Your Career Should Be{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Verifiable.
              </span>
            </h1>

            <p className="mt-6 text-[17px] text-slate-400 leading-relaxed max-w-lg">
              Resumes are just claims. Patorbit extracts, verifies, and connects every credential into a professional passport you own — building trust that compounds over time.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/resume-builder"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
              >
                Build Your Passport
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100">
                <Play className="w-3.5 h-3.5" fill="currentColor" />
                Watch Demo
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              {["Free Forever", "No Credit Card", "Setup in 2 Minutes"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* ─── RIGHT: Live Demo Panel ─── */}
          <div>
            <div className="relative">
              <div className="relative z-10 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-[0_0_60px_-15px_rgba(59,130,246,0.15)]">
                {/* Card header */}
                <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-[11px] shadow-md shadow-cyan-500/20">
                      P
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">career.patorbit.ai</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Demo
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                  </div>
                </div>

                {/* Content area — fixed height container */}
                <div className="relative px-4 py-3" style={{ minHeight: 300 }}>
                  {/* Pipeline loading (shown until done) */}
                  <AnimatePresence mode="wait">
                    {!done ? (
                      <motion.div
                        key="pipeline"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <PipelineLoading stage={stage} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="trust"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      >
                        <TrustScorePanel score={trustScore} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Ghost cards */}
              <div className="absolute -bottom-2 -left-2 -right-2 rounded-xl border border-slate-800/40 bg-slate-900/20 h-full -z-10" />
              <div className="absolute -bottom-4 -left-4 -right-4 rounded-xl border border-slate-800/20 bg-slate-900/10 h-full -z-20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
