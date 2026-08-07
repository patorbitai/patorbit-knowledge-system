"use client";

import { useState, useEffect, useRef } from "react";
import { useDeploymentVersion, CURRENT_SHA } from "@/hooks/useDeploymentVersion";

function shortSha(sha: string | null) {
  if (!sha) return null;
  return sha.slice(0, 7);
}

function useRelativeTime(date: Date | null): string {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!date) return;

    function update() {
      const secs = Math.floor((Date.now() - date!.getTime()) / 1000);
      if (secs < 60) setLabel("just now");
      else if (secs < 3600) setLabel(`${Math.floor(secs / 60)} min ago`);
      else setLabel(`${Math.floor(secs / 3600)}h ago`);
    }

    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [date]);

  return label;
}

export function DeploymentUpdateBanner() {
  const { updateAvailable, newSha, detectedAt } = useDeploymentVersion();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const relativeTime = useRelativeTime(detectedAt);

  useEffect(() => {
    if (updateAvailable && !dismissed) {
      // Small delay so the animation is perceptible on mount
      const id = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(id);
    }
  }, [updateAvailable, dismissed]);

  function dismiss() {
    setVisible(false);
    // Wait for exit animation before unmounting
    const id = setTimeout(() => setDismissed(true), 300);
    return () => clearTimeout(id);
  }

  if (!updateAvailable || dismissed) return null;

  const currentShort = shortSha(CURRENT_SHA);
  const newShort = shortSha(newSha);

  return (
    <div
      ref={bannerRef}
      role="status"
      aria-live="polite"
      aria-label="Application update available"
      className="deployment-banner fixed bottom-5 right-5 z-50 rounded-2xl p-px"
      style={{
        maxWidth: "320px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.35s ease-out, transform 0.35s ease-out",
      }}
    >
      {/* Cyan gradient border via padding trick */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(34,211,238,0.45) 0%, rgba(59,130,246,0.2) 50%, rgba(34,211,238,0.1) 100%)",
        }}
        aria-hidden
      />

      {/* Card body */}
      <div
        className="relative rounded-2xl p-4"
        style={{
          background:
            "linear-gradient(145deg, rgba(10,14,27,0.97) 0%, rgba(12,19,34,0.97) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow:
            "0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(34,211,238,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.7) 50%, transparent 100%)",
          }}
          aria-hidden
        />

        {/* Dismiss */}
        <button
          onClick={dismiss}
          aria-label="Dismiss update notification"
          className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-md text-xs transition-colors"
          style={{ color: "rgba(241,245,249,0.35)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(241,245,249,0.7)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(241,245,249,0.35)")}
        >
          ✕
        </button>

        <div className="flex flex-col gap-3 pr-4">
          {/* Header */}
          <div className="flex items-start gap-2.5">
            <span className="mt-px text-base leading-none" aria-hidden>🚀</span>
            <div>
              <p className="text-sm font-semibold leading-snug" style={{ color: "#f1f5f9" }}>
                A new version of Patorbit is available
              </p>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "rgba(241,245,249,0.45)" }}>
                We&apos;ve improved performance and added new features.
              </p>
            </div>
          </div>

          {/* Version row */}
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-mono"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(241,245,249,0.6)",
            }}
          >
            {currentShort && newShort ? (
              <>
                <span>
                  <span style={{ color: "rgba(241,245,249,0.35)" }}>current </span>
                  <span style={{ color: "rgba(241,245,249,0.7)" }}>{currentShort}</span>
                </span>
                <span style={{ color: "rgba(34,211,238,0.4)" }}>→</span>
                <span>
                  <span style={{ color: "rgba(241,245,249,0.35)" }}>new </span>
                  <span style={{ color: "#22d3ee" }}>{newShort}</span>
                </span>
                {relativeTime && (
                  <span style={{ color: "rgba(241,245,249,0.3)" }}>{relativeTime}</span>
                )}
              </>
            ) : (
              <span style={{ color: "rgba(241,245,249,0.45)" }}>
                Detected {relativeTime || "just now"}
              </span>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl py-2 text-xs font-semibold tracking-wide transition-opacity hover:opacity-90 active:opacity-75"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)",
              color: "#030712",
              boxShadow: "0 0 16px rgba(34,211,238,0.2)",
            }}
          >
            Refresh Now
          </button>
        </div>
      </div>
    </div>
  );
}

