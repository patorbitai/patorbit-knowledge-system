"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { X, Lock, ArrowRight } from "lucide-react";
import { useFeatureAccess } from "@/components/providers/FeatureAccessProvider";

/**
 * Global Access Restriction Dialog.
 *
 * Renders when a user attempts to use a feature not available on their plan.
 * Shows a clear explanation with an upgrade CTA and a dismiss action.
 */
export function AccessRestrictionDialog() {
  const { activeRestriction, activeMessage, closeRestriction } = useFeatureAccess();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and Escape key handling
  useEffect(() => {
    if (!activeRestriction) return;

    // Focus the close button when dialog opens
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeRestriction();
      }

      // Focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeRestriction, closeRestriction]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (activeRestriction) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeRestriction]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        closeRestriction();
      }
    },
    [closeRestriction],
  );

  if (!activeRestriction || !activeMessage) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-restriction-title"
      aria-describedby="access-restriction-description"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-2xl border border-white/[0.1] bg-gradient-to-b from-[#0f1525] to-[#0a0e1a] shadow-2xl shadow-black/40 overflow-hidden"
      >
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-radial from-cyan-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={closeRestriction}
          className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="relative p-6 space-y-5">
          {/* Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/15 border border-cyan-500/20">
            <Lock className="h-5 w-5 text-cyan-400" />
          </div>

          {/* Title */}
          <h2
            id="access-restriction-title"
            className="text-lg font-bold text-white tracking-tight"
          >
            {activeMessage.title}
          </h2>

          {/* Description */}
          <p
            id="access-restriction-description"
            className="text-sm text-slate-400 leading-relaxed"
          >
            {activeMessage.description}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={activeMessage.actionHref}
              onClick={closeRestriction}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
            >
              {activeMessage.actionLabel}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <button
              onClick={closeRestriction}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.04] px-6 py-3 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white"
            >
              Maybe later
            </button>
          </div>

          {/* Plan indicator */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <span className="text-[11px] text-slate-600">
              Current plan: <span className="text-slate-400 font-medium">Free</span>
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-[11px] text-slate-600">
              Required: <span className="text-cyan-400 font-medium">Pro</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
