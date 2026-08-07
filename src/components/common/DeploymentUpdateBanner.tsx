"use client";

import { useDeploymentVersion } from "@/hooks/useDeploymentVersion";

export function DeploymentUpdateBanner() {
  const updateAvailable = useDeploymentVersion();

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg"
      style={{
        background: "var(--surface-overlay)",
        borderColor: "var(--glass-border)",
        color: "var(--foreground)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        maxWidth: "360px",
      }}
    >
      <span className="text-sm leading-snug">
        A new version of Patorbit is available.
      </span>
      <button
        onClick={() => window.location.reload()}
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
        style={{
          background: "var(--accent-cyan)",
          color: "#030712",
        }}
      >
        Refresh Now
      </button>
    </div>
  );
}
