"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
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
  return (
    <motion.div
      id={id}
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={clsx(
        "group rounded-2xl border transition-all duration-300 shadow-card",
        isActive
          ? "border-blue-500/30 bg-gradient-to-b from-blue-500/[0.03] to-transparent shadow-lg shadow-blue-500/5"
          : "border-white/[0.06] glass-card hover:border-white/[0.1] hover:bg-white/[0.04]",
        className,
      )}
    >
      {/* Card header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <motion.span
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 text-base shadow-sm"
          >
            {icon}
          </motion.span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
              {isValid !== undefined && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={clsx(
                    "flex h-2 w-2 rounded-full",
                    isValid ? "bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/60" : "bg-slate-600",
                  )}
                />
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-1.5 shrink-0 ml-4">
            {actions}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="px-6 pb-5 space-y-4">
        {children}
      </div>
    </motion.div>
  );
}
