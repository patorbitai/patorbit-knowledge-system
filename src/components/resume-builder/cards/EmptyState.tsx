"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { AIActionButton } from "../AIActionButton";

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  submessage: string;
  action: () => void;
  actionLabel: string;
}

/**
 * Shared empty state for resume sections — attractive, concise, actionable.
 * Replaces per-section ad-hoc empty blocks so every section feels consistent.
 */
export function EmptyState({ icon, message, submessage, action, actionLabel }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] text-gray-400 dark:text-slate-500">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 mt-4">{message}</p>
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-5 max-w-[280px]">{submessage}</p>
      <AIActionButton label={actionLabel} onClick={action} variant="primary" size="md" icon={<Plus className="w-3.5 h-3.5" />} />
    </motion.div>
  );
}