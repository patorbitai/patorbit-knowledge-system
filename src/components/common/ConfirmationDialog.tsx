"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

/* ── Types ── */

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

/* ── Component ── */

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus trap
  useEffect(() => {
    if (open) {
      // Slight delay so the animation has started
      const timer = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // ESC to cancel
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  const handleConfirm = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onConfirm();
    },
    [onConfirm],
  );

  const confirmStyles = {
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20",
    warning: "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20",
    default: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",
  };

  const iconBg = {
    danger: "bg-rose-500/15 text-rose-400",
    warning: "bg-amber-500/15 text-amber-400",
    default: "bg-blue-500/15 text-blue-400",
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              "relative w-full max-w-md rounded-2xl border p-6 shadow-2xl shadow-black/30",
              "bg-white dark:bg-[#0C1322]",
              variant === "danger" ? "border-rose-500/20" :
              variant === "warning" ? "border-amber-500/20" :
              "border-white/[0.08]",
            )}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={clsx(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                iconBg[variant],
              )}>
                <AlertTriangle className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h2
                  id="confirm-dialog-title"
                  className="text-base font-semibold text-gray-900 dark:text-white"
                >
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-slate-400">
                  {message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                onClick={handleConfirm}
                className={clsx(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                  confirmStyles[variant],
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ── Convenience hook for confirm ── */

export function useConfirmation() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: "danger" | "warning" | "default";
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    variant: "danger",
    onConfirm: () => {},
  });

  const confirm = useCallback(
    (opts: {
      title: string;
      message: string;
      confirmLabel?: string;
      variant?: "danger" | "warning" | "default";
    }) => {
      return new Promise<boolean>((resolve) => {
        setState({
          open: true,
          title: opts.title,
          message: opts.message,
          confirmLabel: opts.confirmLabel ?? "Confirm",
          variant: opts.variant ?? "danger",
          onConfirm: () => {
            setState((prev) => ({ ...prev, open: false }));
            resolve(true);
          },
        });
      });
    },
    [],
  );

  const cancel = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    confirm,
    cancel,
    dialogProps: {
      ...state,
      onCancel: cancel,
    },
  };
}
