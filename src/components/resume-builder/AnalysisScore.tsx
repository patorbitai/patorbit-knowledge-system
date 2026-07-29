"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import type { AnalysisScoreProps } from "./shared-types";

const sizeConfig = {
  sm: { outer: 36, stroke: 3, fontSize: "text-[9px]" },
  md: { outer: 48, stroke: 4, fontSize: "text-xs" },
  lg: { outer: 64, stroke: 5, fontSize: "text-sm" },
};

const defaultColors = [
  { from: "#22d3ee", to: "#3b82f6" },   // cyan->blue
  { from: "#10b981", to: "#059669" },   // emerald
  { from: "#f59e0b", to: "#f97316" },   // amber->orange
  { from: "#ef4444", to: "#dc2626" },   // red
  { from: "#8b5cf6", to: "#6d28d9" },   // purple
];

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
}: AnalysisScoreProps) {
  const cfg = sizeConfig[size];
  const pct = Math.min(Math.round((score / maxScore) * 100), 100);
  const radius = (cfg.outer - cfg.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedPct, setAnimatedPct] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAnimation) {
      setAnimatedPct(pct);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [pct, showAnimation]);

  useEffect(() => {
    if (!isVisible) return;
    const start = performance.now();
    const duration = 1200;
    const from = 0;
    const to = pct;

    function animate(time: number) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPct(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [isVisible, pct]);

  const color = getColorForScore(pct);
  const dashOffset = circumference * (1 - animatedPct / 100);

  return (
    <div ref={ref} className="flex items-center gap-3 group relative" title={tooltip}>
      <div className="relative shrink-0" style={{ width: cfg.outer, height: cfg.outer }}>
        <svg
          width={cfg.outer}
          height={cfg.outer}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={cfg.outer / 2}
            cy={cfg.outer / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={cfg.stroke}
          />
          {/* Animated circle */}
          <circle
            cx={cfg.outer / 2}
            cy={cfg.outer / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={cfg.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-300"
            style={{
              filter: `drop-shadow(0 0 4px ${color}40)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx("font-bold text-white", cfg.fontSize)}>
            {animatedPct}
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-slate-400 leading-tight">{label}</span>
        <span className="text-[10px] text-slate-600 leading-tight">
          {pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : pct >= 40 ? "Needs Work" : "Poor"}
        </span>
      </div>
    </div>
  );
}
