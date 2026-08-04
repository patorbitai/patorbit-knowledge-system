"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import type { AnalysisScoreProps } from "./shared-types";

const sizeConfig = {
  sm: { outer: 36, stroke: 3, fontSize: "text-[9px]", placeholderSize: "text-[7px]" },
  md: { outer: 48, stroke: 4, fontSize: "text-xs", placeholderSize: "text-[8px]" },
  lg: { outer: 64, stroke: 5, fontSize: "text-sm", placeholderSize: "text-[9px]" },
};

function getColorForScore(score: number): string {
  if (score >= 80) return "#22d3ee";
  if (score >= 60) return "#10b981";
  if (score >= 40) return "#f59e0b";
  if (score >= 20) return "#f97316";
  return "#ef4444";
}

export function AnalysisScore({
  label,
  score,
  maxScore = 100,
  size = "md",
  showAnimation = true,
  tooltip,
  statusLabel,
}: AnalysisScoreProps & { statusLabel?: string }) {
  const cfg = sizeConfig[size];
  const isAvailable = score !== null && score !== undefined && !isNaN(score);
  const pct = isAvailable ? Math.min(Math.round((score! / maxScore) * 100), 100) : 0;
  const radius = (cfg.outer - cfg.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedPct, setAnimatedPct] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAvailable || !showAnimation) {
      setAnimatedPct(isAvailable ? pct : 0);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [pct, showAnimation, isAvailable]);

  useEffect(() => {
    if (!isVisible || !isAvailable) return;
    const start = performance.now();
    const duration = 1200;
    function animate(time: number) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPct(Math.round(eased * pct));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [isVisible, pct, isAvailable]);

  const color = isAvailable ? getColorForScore(pct) : "#334155";
  const dashOffset = isAvailable ? circumference * (1 - animatedPct / 100) : circumference;

  return (
    <div ref={ref} className="flex items-center gap-3 group relative" title={tooltip}>
      <div className="relative shrink-0" style={{ width: cfg.outer, height: cfg.outer }}>
        <svg width={cfg.outer} height={cfg.outer} className="transform -rotate-90">
          <circle cx={cfg.outer / 2} cy={cfg.outer / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={cfg.stroke} />
          {isAvailable && (
            <circle cx={cfg.outer / 2} cy={cfg.outer / 2} r={radius} fill="none" stroke={color} strokeWidth={cfg.stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} className="transition-all duration-300" style={{ filter: `drop-shadow(0 0 4px ${color}40)` }} />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isAvailable ? (
            <span className={clsx("font-bold text-white", cfg.fontSize)}>{animatedPct}</span>
          ) : (
            <span className={clsx("font-medium text-slate-500 leading-tight text-center px-0.5", cfg.placeholderSize)}>—</span>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-slate-400 leading-tight">{label}</span>
        {isAvailable ? (
          <span className="text-[10px] leading-tight" style={{ color }}>
            {pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : pct >= 40 ? "Needs Work" : "Poor"}
          </span>
        ) : (
          <span className="text-[10px] text-slate-600 leading-tight">{statusLabel || "No Data"}</span>
        )}
      </div>
    </div>
  );
}

export function AnalysisStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    "insufficient-data": { label: "Waiting for Analysis", color: "text-slate-500" },
    "extracting": { label: "Extracting Information...", color: "text-blue-400" },
    "analyzing": { label: "Analyzing Resume...", color: "text-blue-400" },
    "evaluating-ats": { label: "Evaluating ATS...", color: "text-blue-400" },
    "building-graph": { label: "Building Knowledge Graph...", color: "text-blue-400" },
    "calculating-scores": { label: "Calculating Scores...", color: "text-blue-400" },
    "complete": { label: "Analysis Complete", color: "text-emerald-400" },
    "error": { label: "Analysis Error", color: "text-red-400" },
  };
  const c = config[status] || { label: "Waiting", color: "text-slate-500" };
  return <span className={clsx("text-[10px] font-medium", c.color)}>{c.label}</span>;
}
