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
        "group rounded-xl border transition-all duration-200 overflow-hidden",
        isActive
          ? "border-cyan-500/30 bg-white dark:bg-[#0C1222] shadow-[0_0_20px_rgba(34,211,238,0.06)]"
          : "border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0A0E1B] hover:border-cyan-500/20",
        className,
      )}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -3 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 shrink-0"
          >
            {icon}
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
              {isValid !== undefined && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={clsx(
                    "flex h-2 w-2 rounded-full",
                    isValid ? "bg-emerald-400" : "bg-slate-600",
                  )}
                />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {actions}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand section" : "Collapse section"}
            className="p-1.5 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
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
            className="px-4 py-3 space-y-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
