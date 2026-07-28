"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

const PROFICIENCY_LEVELS = [
  { value: "Beginner", icon: "🟢", label: "Beginner", desc: "Basic understanding", color: "bg-emerald-500", barColor: "bg-emerald-400", pct: 25 },
  { value: "Intermediate", icon: "🔵", label: "Intermediate", desc: "Working knowledge", color: "bg-blue-500", barColor: "bg-blue-400", pct: 50 },
  { value: "Advanced", icon: "🟣", label: "Advanced", desc: "Highly proficient", color: "bg-purple-500", barColor: "bg-purple-400", pct: 75 },
  { value: "Expert", icon: "🔴", label: "Expert", desc: "Professional mastery", color: "bg-red-500", barColor: "bg-red-400", pct: 100 },
];

export default function ProficiencyDropdown({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = PROFICIENCY_LEVELS.find((l) => l.value === value) || PROFICIENCY_LEVELS[1];

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[10px] font-medium text-slate-500 mb-1.5">Proficiency Level</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white outline-none transition-all duration-200",
          open
            ? "bg-blue-500/15 border border-blue-500/40 shadow-[0_0_12px_-4px_rgba(59,130,246,0.4)]"
            : "bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.06]"
        )}
      >
        <span className="text-base shrink-0">{selected.icon}</span>
        <div className="flex-1 text-left">
          <span className="font-semibold">{selected.label}</span>
          <div className="h-1.5 w-full bg-white/[0.05] rounded-full mt-1 overflow-hidden">
            <motion.div
              className={clsx("h-full rounded-full", selected.barColor)}
              initial={{ width: 0 }}
              animate={{ width: `${selected.pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          className="w-3.5 h-3.5 text-slate-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.15, ease: "easeIn" } }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-[#141B2E] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden p-1"
          >
            {PROFICIENCY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => {
                  onChange(level.value);
                  setOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 rounded-lg",
                  value === level.value
                    ? "bg-blue-500/20 text-white"
                    : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                )}
              >
                <span className="text-base shrink-0">{level.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-semibold">{level.label}</span>
                  <span className="block text-[11px] text-slate-400 font-normal">{level.desc}</span>
                </div>
                {value === level.value && (
                  <motion.div layoutId={`check-${id}`}>
                    <svg
                      className="w-4 h-4 text-blue-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </motion.div>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
