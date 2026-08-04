"use client";

import Link from "next/link";
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  FileText,
  Brain,
  Network,
  ShieldCheck,
  Star,
  ArrowRight,
  Play,
  Check,
  Clock,
  Activity,
} from "lucide-react";

/* ─── Pipeline stages ─── */
const pipeline = [
  {
    id: "resume",
    icon: FileText,
    label: "Resume Imported",
    detail: "Parsing 3 pages · 47 data points",
    time: "0.4s",
    evidence: 0,
    confidence: null as number | null,
    color: "#3b82f6",
  },
  {
    id: "extraction",
    icon: Brain,
    label: "AI Extraction",
    detail: "LLM extracts 12 claims — degrees, titles, skills",
    time: "1.2s",
    evidence: 12,
    confidence: 94,
    color: "#8b5cf6",
  },
  {
    id: "graph",
    icon: Network,
    label: "Knowledge Graph",
    detail: "68 nodes · 132 edges · semantic map built",
    time: "0.8s",
    evidence: 68,
    confidence: 91,
    color: "#06b6d4",
  },
  {
    id: "verify",
    icon: ShieldCheck,
    label: "Evidence Verification",
    detail: "24 of 24 claims matched to verifiable sources",
    time: "1.6s",
    evidence: 24,
    confidence: 88,
    color: "#f59e0b",
  },
  {
    id: "score",
    icon: Star,
    label: "Trust Score Generated",
    detail: "Overall trust score: 84/100 — Excellent",
    time: "0.3s",
    evidence: 24,
    confidence: 84,
    color: "#10b981",
  },
];

const trustMetrics = [
  { label: "Verified Claims", value: 24 },
  { label: "Graph Nodes", value: 68 },
  { label: "Evidence Sources", value: 12 },
];

/* ─── Animated Knowledge Graph Background ─── */
function KnowledgeGraphBg({ mouseX = 0, mouseY = 0 }) {
  const nodes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: 10 + ((i * 37) % 80),
        y: 15 + ((i * 53) % 70),
        r: 1.5 + (i % 3) * 0.6,
        delay: (i % 6) * 0.4,
      })),
    []
  );

  const edges = useMemo(
    () =>
      [
        [0, 3], [1, 4], [2, 5], [3, 7], [4, 8], [5, 9],
        [6, 10], [7, 11], [8, 12], [9, 13], [10, 14],
        [11, 15], [12, 16], [13, 17], [0, 6], [1, 7],
        [2, 8], [3, 9], [4, 14], [5, 15],
      ] as [number, number][],
    []
  );

  // Parallax offset: 2-3px max movement
  const px = mouseX * 0.015;
  const py = mouseY * 0.015;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      style={{ opacity: 0.07, transform: `translate(${px}px, ${py}px)` }}
    >
      {edges.map(([a, b], i) => {
        const n1 = nodes[a];
        const n2 = nodes[b];
        if (!n1 || !n2) return null;
        return (
          <line
            key={`e-${i}`}
            x1={`${n1.x}%`}
            y1={`${n1.y}%`}
            x2={`${n2.x}%`}
            y2={`${n2.y}%`}
            stroke="url(#kg-grad)"
            strokeWidth="0.4"
            className="kg-edge"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        );
      })}
      {nodes.map((n) => (
        <circle
          key={n.id}
          cx={`${n.x}%`}
          cy={`${n.y}%`}
          r={n.r}
          fill="#60a5fa"
          className="kg-node"
          style={{ animationDelay: `${n.delay}s` }}
        />
      ))}
      <defs>
        <linearGradient id="kg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Trust Score Panel ─── */
function TrustScorePanel({ score }: { score: number }) {
  const scaleRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-t border-slate-800/60 overflow-hidden">
      <div className="px-4 py-4">
        {/* Score header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">
              Trust Score
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums bg-gradient-to-r from-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                {score}
              </span>
              <span className="text-lg text-slate-500 font-medium">/100</span>
            </div>
          </div>
          <div
            ref={scaleRef}
            className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 animate-ambient-glow"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Excellent</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mb-5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 transition-all duration-1000 ease-out"
            style={{ width: "84%" }}
          />
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-3">
          {trustMetrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-3 text-center"
            >
              <div className="text-lg font-bold text-white tabular-nums">{m.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Hero ─── */
export default function Hero() {
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [trustScore, setTrustScore] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const pipelineStarted = useRef(false);

  const advance = useCallback(() => {
    setStage((p) => {
      if (p >= pipeline.length - 1) {
        setDone(true);
        return p;
      }
      return p + 1;
    });
  }, []);

  // Start pipeline once on mount, never replay
  useEffect(() => {
    if (pipelineStarted.current) return;
    pipelineStarted.current = true;

    // Staggered timer
    const timers: ReturnType<typeof setTimeout>[] = [];
    let currentStage = 0;

    const runStage = () => {
      if (currentStage >= pipeline.length) {
        setDone(true);
        return;
      }
      setStage(currentStage);
      const delay = currentStage === 0 ? 700 : 1300;
      currentStage++;
      timers.push(setTimeout(runStage, delay));
    };

    runStage();

    return () => timers.forEach(clearTimeout);
  }, []);

  // Trust score counter — runs once when done
  useEffect(() => {
    if (!done) return;
    let cancelled = false;
    const countUp = () => {
      if (cancelled) return;
      setTrustScore((s) => {
        if (s >= 84) return s;
        const next = Math.min(84, s + 2);
        setTimeout(countUp, 18);
        return next;
      });
    };
    setTimeout(countUp, 200);
    return () => { cancelled = true; };
  }, [done]);

  // Mouse position for parallax
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  // Pipeline stage helper
  const getStageState = (i: number) => {
    if (done) return "past";
    if (i < stage) return "past";
    if (i === stage) return "current";
    return "future";
  };

  return (
    <section
      className="relative min-h-screen bg-[#070B14] flex items-center overflow-hidden"
      role="region"
      aria-label="Hero"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.006)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070B14]/80 via-[#070B14]/95 to-[#070B14]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-cyan-500/[0.07] via-blue-500/[0.04] to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-purple-500/[0.05] via-transparent to-transparent rounded-full blur-3xl" />

      {/* Ambient knowledge graph — continuous loop, never replays entrance */}
      <KnowledgeGraphBg mouseX={mousePos.x} mouseY={mousePos.y} />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[calc(100vh-80px)]">

          {/* ─── LEFT: Copy — no entrance animation, loads instantly ─── */}
          <div className="pt-28 lg:pt-0">
            {/* Live badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm px-3.5 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] text-slate-400 tracking-wider uppercase font-medium">
                Live on Mainnet
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-[4.25rem] font-bold leading-[1.05] tracking-tight text-white">
              The Ground Truth
              <br />
              for{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Professional Identity.
              </span>
            </h1>

            {/* Supporting copy */}
            <p className="mt-6 text-[17px] text-slate-400 leading-relaxed max-w-lg">
              Resumes are just claims. Patorbit extracts, verifies, and connects every credential into an AI-powered Knowledge Graph you own — building trust that compounds over time.
            </p>

            {/* CTAs */}
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

            {/* Trust builders */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              {["Free Forever", "No Credit Card", "Setup in 2 Minutes"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                  {item}
                </span>
              ))}
            </div>

            {/* Social proof strip */}
            <div className="mt-12 pt-6 border-t border-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["A", "S", "M", "K", "R"].map((l, i) => (
                    <div
                      key={l}
                      className="w-8 h-8 rounded-full border-2 border-[#070B14] flex items-center justify-center text-[10px] text-white font-medium"
                      style={{
                        background: `hsl(${210 + i * 20}, 30%, ${35 + i * 5}%)`,
                      }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 leading-snug">
                  <span className="text-slate-300 font-semibold">3.2K+</span> professionals ·{" "}
                  <span className="text-slate-300 font-semibold">12K+</span> claims verified
                </p>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Live Demo Panel ─── */}
          <div className="pt-16 lg:pt-0">
            <div className="relative">
              {/* Main card */}
              <div className="relative z-10 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-[0_0_60px_-15px_rgba(59,130,246,0.15)] transition-shadow duration-150 hover:shadow-[0_0_80px_-15px_rgba(59,130,246,0.25)] min-h-[560px]">
                {/* Card header */}
                <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
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

                {/* Pipeline stages */}
                <div
                  className="px-5 py-4 space-y-2"
                  role="log"
                  aria-live="polite"
                  aria-label="Pipeline stages"
                >
                  {pipeline.map((p, i) => {
                    const state = getStageState(i);
                    const isPast = state === "past";
                    const isCurrent = state === "current";
                    const isFuture = state === "future";
                    const Icon = p.icon;

                    return (
                      <div
                        key={p.id}
                        className={`relative flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                          isCurrent
                            ? "bg-blue-500/[0.08] border-blue-500/25"
                            : isPast
                            ? "bg-white/[0.02] border-white/[0.06]"
                            : "bg-transparent border-white/[0.03] opacity-30"
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                            isPast
                              ? "bg-emerald-500/15 text-emerald-400"
                              : isCurrent
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-slate-800/60 text-slate-600"
                          }`}
                        >
                          {isPast ? (
                            <Check className="w-4 h-4" strokeWidth={2.5} />
                          ) : (
                            <Icon className="w-4 h-4" strokeWidth={1.75} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-sm font-medium ${
                                isCurrent
                                  ? "text-blue-300"
                                  : isPast
                                  ? "text-slate-300"
                                  : "text-slate-500"
                              }`}
                            >
                              {p.label}
                            </span>

                            {/* Status indicator */}
                            <div className="shrink-0">
                              {isPast ? (
                                <span className="text-[10px] font-medium text-emerald-400/80">
                                  Done
                                </span>
                              ) : isCurrent ? (
                                <svg
                                  className="animate-spin w-3.5 h-3.5 text-blue-400"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeDasharray="50 20"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              ) : (
                                <span className="block w-1.5 h-1.5 rounded-full bg-slate-700" />
                              )}
                            </div>
                          </div>

                          {/* Detail row for current stage only */}
                          {isCurrent && (
                            <div>
                              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                {p.detail}
                              </p>
                              {/* Meta row */}
                              <div className="mt-2 flex items-center gap-3">
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
                                  <Clock className="w-3 h-3" />
                                  {p.time}
                                </span>
                                {p.evidence > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
                                    <Activity className="w-3 h-3" />
                                    {p.evidence} items
                                  </span>
                                )}
                                {p.confidence !== null && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-600">
                                    <ShieldCheck className="w-3 h-3" />
                                    {p.confidence}% conf.
                                  </span>
                                )}
                              </div>
                              {/* Progress bar for current */}
                              <div className="mt-2.5 h-0.5 w-full rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full progress-animate"
                                  style={
                                    {
                                      backgroundColor: p.color,
                                      width: "100%",
                                      transformOrigin: "left",
                                      animation: "progress-fill 1.2s linear forwards",
                                    } as React.CSSProperties
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Trust Score panel (appears once when done) */}
                {done && <TrustScorePanel score={trustScore} />}
              </div>

              {/* Ghost depth cards — stable, no animation */}
              <div className="absolute -bottom-2 -left-2 -right-2 rounded-xl border border-slate-800/40 bg-slate-900/20 h-full -z-10" />
              <div className="absolute -bottom-4 -left-4 -right-4 rounded-xl border border-slate-800/20 bg-slate-900/10 h-full -z-20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
