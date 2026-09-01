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
      className={clsx(
        "group rounded-xl border transition-all duration-200 overflow-hidden",
        isActive
          ? "border-cyan-500/20 bg-white dark:bg-[#0C1222] shadow-sm"
          : "border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0A0E1B]",
        className,
      )}
    >
      {/* Card header — compact */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title}`}
        >
          <span className="text-base shrink-0" role="img" aria-hidden>{icon}</span>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
          {isValid !== undefined && (
            <span
              className={clsx(
                "flex h-1.5 w-1.5 rounded-full shrink-0",
                isValid ? "bg-emerald-400" : "bg-gray-300 dark:bg-slate-600",
              )}
            />
          )}
          <ChevronDown className={clsx(
            "w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0 transition-transform duration-200",
            !collapsed && "rotate-180",
          )} />
        </button>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {actions}
        </div>
      </div>

      {/* Card body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-white/[0.06]"
          >
            <div className="pt-3">
              {description && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">{description}</p>
              )}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
