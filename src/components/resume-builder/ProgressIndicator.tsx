"use client";

import { motion } from "framer-motion";

interface ProgressIndicatorProps {
  title: string;
  value: number;
  max?: number;
  color: string;
  size?: "sm" | "md";
}

export function ProgressIndicator({
  title,
  value,
  max = 100,
  color,
  size = "sm",
}: ProgressIndicatorProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className={`font-medium text-slate-400 ${size === "sm" ? "text-[10px]" : "text-xs"}`}>
          {title}
        </span>
        <span className={`font-semibold ${size === "sm" ? "text-[10px]" : "text-xs"}`} style={{ color }}>
          {value}{max !== 100 ? ` / ${max}` : "%"}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
