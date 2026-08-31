"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Check, RefreshCw, X, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import type { SmartSuggestionProps } from "./shared-types";

const typeStyles = {
  improvement: "border-blue-500/30 bg-blue-500/5",
  rewrite: "border-purple-500/30 bg-purple-500/5",
  ats: "border-emerald-500/30 bg-emerald-500/5",
  grammar: "border-amber-500/30 bg-amber-500/5",
  impact: "border-rose-500/30 bg-rose-500/5",
  metric: "border-cyan-500/30 bg-cyan-500/5",
};

const typeIcons = {
  improvement: <Sparkles className="w-4 h-4 text-blue-400" />,
  rewrite: <Sparkles className="w-4 h-4 text-purple-400" />,
  ats: <Lightbulb className="w-4 h-4 text-emerald-400" />,
  grammar: <Lightbulb className="w-4 h-4 text-amber-400" />,
  impact: <Sparkles className="w-4 h-4 text-rose-400" />,
  metric: <Lightbulb className="w-4 h-4 text-cyan-400" />,
};

export function SmartSuggestion({
  original,
  suggestion,
  onAccept,
  onRegenerate,
  onDismiss,
  isLoading = false,
  type = "improvement",
}: SmartSuggestionProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={clsx(
          "rounded-xl border p-4 mt-3 overflow-hidden",
          typeStyles[type],
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {typeIcons[type]}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-900 dark:text-white capitalize">{type} Suggestion</span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium bg-gray-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded">AI</span>
            </div>
            {original && (
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-medium">Current</span>
                <div className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2 border border-gray-200 dark:border-white/[0.04]">
                  {original}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-medium">Suggested</span>
              <div className="text-xs text-gray-800 dark:text-slate-200 bg-gray-100 dark:bg-white/[0.06] rounded-lg px-3 py-2 border border-gray-200 dark:border-white/[0.06]">
                {suggestion}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onAccept}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold transition-all disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
                Accept
              </button>
              <button
                onClick={onRegenerate}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.12] text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white text-[10px] font-medium transition-all disabled:opacity-50"
              >
                <RefreshCw className={clsx("w-3 h-3", isLoading && "animate-spin")} />
                Regenerate
              </button>
              <button
                onClick={onDismiss}
                disabled={isLoading}
                className="ml-auto p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
