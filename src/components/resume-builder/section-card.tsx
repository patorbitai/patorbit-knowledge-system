"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SectionCardProps } from "./shared-types";

/* ── Card entrance variants ── */
const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
  hover: {
    scale: 1.005,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
};

export function SectionCard({
  id,
  title,
  description,
  icon,
  children,
  isValid,
  isActive,
  actions,
  className,
}: SectionCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      id={id}
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={clsx(
        "group rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden",
        isActive
          ? "border-[rgba(34,211,238,.4)] bg-gradient-to-br from-[rgba(12,24,42,0.98)] to-[rgba(8,16,30,0.95)] shadow-[0_0_35px_rgba(34,211,238,0.08)]"
          : "border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] hover:border-[rgba(34,211,238,.28)] hover:bg-[rgba(10,18,32,0.98)]",
        className,
      )}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-[rgba(148,163,184,.08)]">
        <div className="flex items-center gap-3.5">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -3 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-[#22d3ee] shadow-md shrink-0"
          >
            {icon}
          </motion.div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-[#f8fafc] tracking-tight">{title}</h3>
              {isValid !== undefined && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={clsx(
                    "flex h-2 w-2 rounded-full",
                    isValid ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "bg-slate-600",
                  )}
                />
              )}
            </div>
            <p className="text-xs text-[#94a3b8] mt-0.5 font-light leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {actions}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand section" : "Collapse section"}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Card body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="px-7 py-6 space-y-6"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
