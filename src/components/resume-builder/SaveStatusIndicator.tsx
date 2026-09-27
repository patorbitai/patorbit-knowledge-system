"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { useResumeBuilder } from "@/store/resume-builder";
import { cancelSaveRetry, retryFailedSave } from "@/lib/resume-write-back";

/**
 * Truthful save state, visually quiet (redesign §12).
 *
 * Not a pill, not a badge — a small dot + word. "Saved" is only ever
 * server-confirmed (M5B); a failure shows the server's actual reason (from
 * lastSaveError) plus an explicit Retry action; a 409 conflict renders as
 * its own state derived from `writeConflict` (never bypassing the existing
 * conflict workflow).
 *
 * Rendered synchronously on status change (no AnimatePresence): the
 * earlier mode="wait" wrapper could leave a stale child in the DOM and
 * the header kept showing "Saved" after a 403.
 */
const indicators: Record<
  string,
  { text: string; dot: string; label: string; title: string }
> = {
  saved: {
    text: "Saved",
    dot: "bg-emerald-400",
    label: "text-gray-400 dark:text-slate-500",
    title: "Saved to your account — the server confirmed the latest changes.",
  },
  saving: {
    text: "Saving…",
    dot: "bg-cyan-500 animate-pulse",
    label: "text-gray-400 dark:text-slate-500",
    title: "Sending your latest changes to your account…",
  },
  unsaved: {
    text: "Unsaved changes",
    dot: "bg-gray-400 dark:bg-slate-500",
    label: "text-gray-400 dark:text-slate-500",
    title: "Edited on this device — not yet confirmed by the server.",
  },
  offline: {
    text: "Offline",
    dot: "bg-amber-400",
    label: "text-amber-600 dark:text-amber-400",
    title:
      "No connection — changes are stored on this device and will sync when you're back online.",
  },
  "sync-failed": {
    text: "Save failed",
    dot: "bg-rose-500",
    label: "text-rose-600 dark:text-rose-400",
    title: "The server did not confirm your changes — they are kept on this device.",
  },
  conflict: {
    text: "Conflict",
    dot: "bg-violet-500",
    label: "text-violet-600 dark:text-violet-400",
    title:
      "The server has a newer version of this resume — your changes are kept on this device.",
  },
};

export function SaveStatusIndicator() {
  const saveStatus = useResumeBuilder((s) => s.saveStatus);
  const lastSaveError = useResumeBuilder((s) => s.lastSaveError);
  const writeConflict = useResumeBuilder((s) => s.writeConflict);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }
    // M5B: connectivity listeners only flip the DISPLAY — they never
    // overwrite the underlying save state (a failed save must stay visible
    // through a browser offline event). Reconnect recovery lives in the
    // write-back's own online listener (recoverFromOffline).
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      // Retries are pointless while unreachable; the online listener
      // restarts recovery when connectivity returns.
      cancelSaveRetry();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const status = writeConflict ? "conflict" : isOnline ? saveStatus : "offline";
  const config = indicators[status] ?? indicators.unsaved;
  const failureDetail =
    status === "sync-failed" && lastSaveError ? lastSaveError : null;
  const canRetry = status === "sync-failed" || status === "offline";

  return (
    <div
      role="status"
      aria-live="polite"
      data-save-status={status}
      className="flex items-center gap-1.5 px-1 py-0.5"
      title={failureDetail ?? config.title}
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
      {canRetry && (
        <button
          type="button"
          onClick={() => void retryFailedSave()}
          aria-label="Retry save"
          className="ml-0.5 shrink-0 rounded border border-gray-300 dark:border-white/15 px-1.5 py-px text-[10px] font-medium text-gray-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-cyan-500"
        >
          Retry
        </button>
      )}
    </div>
  );
}
