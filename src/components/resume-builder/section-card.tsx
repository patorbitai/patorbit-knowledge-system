"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import type { SectionCardProps } from "./shared-types";

/**
 * Flat editorial section shell (redesign §11).
 *
 * The old card (border + shadow + emoji + entrance slide) made every
 * section feel like a dashboard widget. Sections are now flat blocks
 * separated by hairlines and whitespace — the resume preview is the
 * visual hero, not the form chrome.
 *
 * `icon` / `description` stay in the props API for callers but are no
 * longer rendered; `isActive` remains accepted for compatibility.
 */
export function SectionCard({
  id,
  title,
  children,
  isValid,
  actions,
  className,
}: SectionCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section
      id={id}
      className={clsx(
        "border-b border-gray-200 dark:border-white/[0.06] last:border-b-0",
        className,
      )}
    >
      {/* Section heading — quiet, with the actions aligned right */}
      <div className="flex items-center justify-between gap-2 py-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer group"
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
        >
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h3>
          {isValid !== undefined && (
            <span
              className={clsx(
                "flex h-1.5 w-1.5 rounded-full shrink-0",
                isValid ? "bg-emerald-400" : "bg-gray-300 dark:bg-slate-600",
              )}
            />
          )}
          <ChevronDown
            className={clsx(
              "w-3.5 h-3.5 text-gray-300 dark:text-slate-600 shrink-0 transition-transform duration-200",
              !collapsed && "rotate-180",
            )}
          />
        </button>
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      </div>

      {/* Body — fades in; no card border, no nested padding stacks */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pb-6 space-y-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
