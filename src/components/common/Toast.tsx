"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { clsx } from "clsx";

/* ── Types ── */

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

/* ── Config ── */

const TOAST_CONFIG: Record<ToastType, {
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
}> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    text: "text-emerald-400",
  },
  error: {
    icon: <XCircle className="w-4 h-4" />,
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
    text: "text-rose-400",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    text: "text-amber-400",
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    text: "text-blue-400",
  },
};

const DEFAULT_DURATION = 4000;

/* ── Context ── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/* ── Provider ── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const toast: Toast = { id, type, message, duration };
      setToasts((prev) => [...prev, toast]);

      const dismissAfter = duration ?? DEFAULT_DURATION;
      if (dismissAfter > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, dismissAfter);
      }
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/* ── Container ── */

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

/* ── Individual toast ── */

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const config = TOAST_CONFIG[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 64, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      role="status"
      className={clsx(
        "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg shadow-black/20",
        "bg-white dark:bg-[#0C1322]/95",
        config.border,
      )}
    >
      <span className={clsx("mt-0.5 shrink-0", config.text)}>
        {config.icon}
      </span>
      <p className="flex-1 text-[13px] leading-snug text-gray-700 dark:text-slate-200">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 mt-0.5 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-white transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
