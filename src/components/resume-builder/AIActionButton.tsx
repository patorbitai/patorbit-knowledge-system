"use client";

import { type AIActionButtonProps } from "./shared-types";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { useState, useRef, useEffect } from "react";

const variants = {
  primary:
    "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 border border-white/[0.08] active:scale-[0.97]",
  secondary:
    "bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] hover:text-white border border-white/[0.08] hover:border-white/[0.12] active:scale-[0.97]",
  ghost:
    "text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent active:scale-[0.97]",
  outline:
    "bg-transparent text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/50 active:scale-[0.97]",
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
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-xl border border-white/[0.08] bg-[#0C1322] shadow-2xl shadow-black/50 py-1 backdrop-blur-xl">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors text-left"
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
