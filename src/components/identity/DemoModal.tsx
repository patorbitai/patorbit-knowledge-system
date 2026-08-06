"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  videoId?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * DemoModal — a reusable, accessible modal for embedding product videos.
 *
 * Provides:
 *  - centered layout with title, embedded video, and close button
 *  - close on Escape, outside click, or the close button
 *  - body scroll lock while open
 *  - focus trap + initial focus on open, focus restore on close
 *  - ARIA roles/labels (role="dialog", aria-modal, aria-labelledby)
 *
 * No external dependencies beyond React.
 */
export function DemoModal({
  open,
  onOpenChange,
  title = "Patorbit Product Walkthrough",
  videoId = "dQw4w9WgXcQ",
}: DemoModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Engagement tracking — single swap-point in src/lib/analytics.ts.
  // When open flips to true, the demo was opened; when it flips back, it was closed.
  useEffect(() => {
    if (open) {
      trackEvent("demo_opened");
    } else {
      trackEvent("demo_closed");
    }
  }, [open]);

  // Note: video-progress events (started, 25%, 50%, 100%) require a video player
  // (e.g. the YouTube IFrame Player API), which is out of scope until the
  // walkthrough video is finalized.

  // Body scroll lock + focus trap + Escape
  useEffect(() => {
    if (!open) return;

    lastFocusedRef.current = document.activeElement as HTMLElement | null;

    // Lock body scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }

      if (event.key !== "Tab") return;

      const el = contentRef.current;
      if (!el) return;

      // Focus trap: cycle within the dialog
      const focusables = Array.from(
        el.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((n) => n.offsetParent !== null);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Restore focus to the element that opened the modal
      lastFocusedRef.current?.focus();
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      {/* Backdrop — clicking it closes the modal */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={close}
      />

      {/* Dialog content */}
      <div
        ref={contentRef}
        className="relative z-10 w-full max-w-4xl mx-4 border border-slate-800 bg-slate-900 shadow-2xl sm:rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 id="demo-modal-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close demo"
            className="rounded-sm p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video — placeholder "Coming Soon" until the walkthrough is ready */}
        <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-2xl font-semibold text-white">Coming Soon</p>
            <p className="mt-2 text-slate-400">
              Our product walkthrough is being finalized and will be available here shortly.
            </p>
            <button
              type="button"
              onClick={() => {
                trackEvent("demo_cta_click");
                close();
              }}
              className="mt-5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:from-cyan-400 hover:to-blue-500"
            >
              Start Building Instead →
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}