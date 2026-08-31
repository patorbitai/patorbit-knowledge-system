"use client";

import { type AIActionButtonProps } from "./shared-types";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { useState, useRef, useEffect } from "react";

const variants = {
  primary:
    "bg-gradient-to-r from-[#0ea5e9] via-[#2563eb] to-[#9333ea] text-white shadow-xl shadow-blue-500/20 hover:brightness-110 active:scale-[0.99] border border-[rgba(34,211,238,0.3)]",
  secondary:
    "bg-gray-100 dark:bg-white/[0.04] text-gray-700 dark:text-[#cbd5e1] hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-[rgba(148,163,184,.15)] active:scale-[0.99]",
  ghost:
    "text-gray-500 dark:text-[#94a3b8] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-transparent active:scale-[0.99]",
  outline:
    "bg-transparent text-cyan-600 dark:text-[#22d3ee] border border-cyan-500/30 dark:border-[rgba(34,211,238,0.3)] hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:text-cyan-700 dark:hover:text-white active:scale-[0.99]",
};

const sizes = {
  sm: "px-2.5 py-1 text-[10px] rounded-lg gap-1",
  md: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
};

export function AIActionButton({
  label,
  onClick,
  isLoading = false,
  variant = "secondary",
  size = "sm",
  icon,
  disabled = false,
  className,
}: AIActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={clsx(
        "inline-flex items-center font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 focus:ring-offset-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        isLoading && "cursor-wait",
        className,
      )}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : icon || (
        <Sparkles className="w-3 h-3 text-blue-400" />
      )}
      {label}
    </button>
  );
}

/* Dropdown AI action button – for a group of actions */
interface AIActionDropdownProps {
  label: string;
  items: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }>;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  isLoading?: boolean;
}

export function AIActionDropdown({
  label,
  items,
  variant = "secondary",
  isLoading = false,
}: AIActionDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isLoading}
        className={clsx(
          "inline-flex items-center gap-1 font-medium transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
          "disabled:opacity-50",
          variants[variant],
          sizes.sm,
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Sparkles className="w-3 h-3 text-blue-400" />
        )}
        {label}
        <ChevronDown className={clsx("w-2.5 h-2.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] shadow-2xl shadow-black/50 py-1 backdrop-blur-xl">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-colors text-left"
            >
              {item.icon || <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
