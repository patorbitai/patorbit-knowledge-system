"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { useResumeBuilder } from "@/store/resume-builder";

/**
 * Truthful save state, visually quiet (redesign §12).
 *
 * Not a pill, not a badge — a small dot + word. "Saved" must be readable
 * at a glance without being one of the loudest elements on screen, while
 * a failure still shows the server's actual reason (from lastSaveError).
 *
 * Rendered synchronously on status change (no AnimatePresence): the
 * earlier mode="wait" wrapper could leave a stale child in the DOM and
 * the header kept showing "Saved" after a 403.
 */
const indicators: Record<
  string,
  { text: string; dot: string; label: string }
> = {
  saved: {
    text: "Saved",
    dot: "bg-emerald-400",
    label: "text-gray-400 dark:text-slate-500",
  },
  saving: {
    text: "Saving…",
    dot: "bg-cyan-500 animate-pulse",
    label: "text-gray-400 dark:text-slate-500",
  },
  unsaved: {
    text: "Unsaved",
    dot: "bg-gray-400 dark:bg-slate-500",
    label: "text-gray-400 dark:text-slate-500",
  },
  offline: {
    text: "Offline",
    dot: "bg-amber-400",
    label: "text-amber-600 dark:text-amber-400",
  },
  "sync-failed": {
    text: "Save failed",
    dot: "bg-rose-500",
    label: "text-rose-600 dark:text-rose-400",
  },
};

export function SaveStatusIndicator() {
  const saveStatus = useResumeBuilder((s) => s.saveStatus);
  const setSaveStatus = useResumeBuilder((s) => s.setSaveStatus);
  const lastSaveError = useResumeBuilder((s) => s.lastSaveError);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      if (saveStatus === "offline") {
        setSaveStatus("unsaved"); // Trigger a re-sync
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [saveStatus, setSaveStatus]);

  const currentStatus = isOnline ? saveStatus : "offline";
  const config = indicators[currentStatus] ?? indicators.unsaved;
  const failureDetail =
    currentStatus === "sync-failed" && lastSaveError ? lastSaveError : null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-save-status={currentStatus}
      className="flex items-center gap-1.5 px-1 py-0.5"
      title={failureDetail ?? config.text}
    >
      <span
        className={clsx("h-1.5 w-1.5 rounded-full shrink-0", config.dot)}
        aria-hidden="true"
      />
      <span
        className={clsx(
          "text-[11px] font-medium leading-tight whitespace-nowrap",
          config.label,
        )}
      >
        {config.text}
      </span>
      {failureDetail && (
        <span className="hidden lg:block max-w-[220px] truncate text-[10px] text-rose-500/80 dark:text-rose-400/80">
          {failureDetail}
        </span>
      )}
    </div>
  );
}
