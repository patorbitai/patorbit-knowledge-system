"use client";

import { clsx } from "clsx";
import { useResumeBuilder } from "@/store/resume-builder";
import type { AIActionState } from "@/types/resume";
import { Sparkles, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FieldInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: "text" | "textarea" | "email" | "tel" | "url";
  rows?: number;
  maxLength?: number;
  aiActionKey?: string;
  disabled?: boolean;
}

export function FieldInput({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  rows = 3,
  maxLength,
  aiActionKey,
  disabled = false,
}: FieldInputProps) {
  const aiActions = useResumeBuilder((s) => aiActionKey ? s.aiActions[aiActionKey] : undefined);

  const charCount = typeof value === "string" ? value.length : 0;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let v = e.target.value;
    if (maxLength && v.length > maxLength) v = v.slice(0, maxLength);
    onChange(v);
  };

  const inputClasses = clsx(
    "w-full bg-gray-50 dark:bg-[#070d18] border rounded-lg text-sm text-gray-900 dark:text-white font-normal",
    "focus:outline-none focus:ring-1 transition-all duration-200",
    "placeholder:text-gray-400 dark:placeholder:text-slate-500",
    "hover:border-gray-300 dark:hover:border-white/[0.2]",
    "focus:shadow-[0_0_20px_rgba(34,211,238,0.08)]",
    error
      ? "border-red-500/50 focus:border-red-500/80 focus:ring-red-500/20 hover:border-red-500/40"
      : "border-gray-200 dark:border-white/[0.1] focus:border-cyan-400 focus:ring-cyan-500/30",
    disabled && "opacity-50 cursor-not-allowed",
    type === "textarea" ? "px-4 py-3 min-h-[120px] text-sm leading-relaxed resize-y" : "px-3.5 py-2.5 text-sm",
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</label>
        {maxLength && (
          <span className={clsx(
            "text-[10px] font-mono",
            charCount > maxLength * 0.9 ? "text-red-400" : "text-gray-400 dark:text-slate-500",
          )}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>

      {type === "textarea" ? (
        <textarea
          value={value ?? ""}
          onChange={handleInput}
          onBlur={onBlur}
        placeholder={placeholder}
        rows={Math.max(rows, 5)}
          disabled={disabled}
          className={inputClasses}
        />
      ) : (
        <input
          type={type === "email" ? "email" : type === "tel" ? "tel" : "text"}
          value={value ?? ""}
          onChange={handleInput}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={inputClasses}
        />
      )}

      {/* AI action indicator */}
      <AnimatePresence>
        {aiActionKey && aiActions?.status === "streaming" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-[10px] text-blue-400"
          >
            <Sparkles className="w-3 h-3 animate-pulse" />
            AI generating...
          </motion.div>
        )}
        {aiActionKey && aiActions?.status === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-[10px] text-emerald-400"
          >
            <Check className="w-3 h-3" />
            AI updated
          </motion.div>
        )}
        {aiActionKey && aiActions?.status === "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-[10px] text-red-400"
          >
            <AlertCircle className="w-3 h-3" />
            {aiActions.error || "AI error"}
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
