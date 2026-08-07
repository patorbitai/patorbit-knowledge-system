"use client";

import { useDeploymentVersion } from "@/hooks/useDeploymentVersion";

export function DeploymentUpdateBanner() {
  const updateAvailable = useDeploymentVersion();

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 rounded-2xl border p-4"
      style={{
        background:
          "linear-gradient(135deg, rgba(12,19,34,0.98) 0%, rgba(17,24,39,0.98) 100%)",
        borderColor: "rgba(34,211,238,0.2)",
        color: "var(--foreground)",
        boxShadow:
          "0 0 0 1px rgba(34,211,238,0.08), 0 8px 32px rgba(0,0,0,0.6), 0 0 48px rgba(34,211,238,0.04)",
        maxWidth: "320px",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(34,211,238,0.6), transparent)",
        }}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-base leading-none" aria-hidden>
            🚀
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
              A new version of Patorbit is available
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(241,245,249,0.5)" }}>
              We&apos;ve improved performance and added new features.
            </p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full rounded-xl py-2 text-xs font-semibold tracking-wide transition-opacity hover:opacity-90 active:opacity-75"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)",
            color: "#030712",
          }}
        >
          Refresh Now
        </button>
      </div>
    </div>
  );
}
