"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, X, ArrowRight } from "lucide-react";

// ─── Pro Badge (inline indicator) ───────────────────────────────────────────

export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 dark:text-cyan-300 ${className}`}
    >
      <Crown className="h-2.5 w-2.5" />
      Pro
    </span>
  );
}

// ─── Feature Gate (upgrade modal) ───────────────────────────────────────────

interface FeatureGateProps {
  /** Whether the feature is gated (user doesn't have access). */
  gated: boolean;
  /** The feature name for display. */
  featureName: string;
  /** What's included in Pro for this feature. */
  proIncludes?: string[];
  /** Child content to render when not gated. */
  children: React.ReactNode;
  /** Optional: render the gated version inline instead of a modal. */
  gatedClassName?: string;
}

export function FeatureGate({
  gated,
  featureName,
  proIncludes = [],
  children,
  gatedClassName = "",
}: FeatureGateProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (!gated) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${gatedClassName}`}>
      {/* Blurred/gated content */}
      <div className="relative overflow-hidden">
        <div className="blur-[2px] opacity-40 pointer-events-none select-none">
          {children}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setShowUpgrade(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all hover:scale-[1.02] active:scale-100"
          >
            <Crown className="h-4 w-4" />
            Unlock {featureName}
          </button>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUpgrade(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0C1322] shadow-2xl p-8">
            <button
              type="button"
              onClick={() => setShowUpgrade(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Upgrade to Professional
                </h3>
                <p className="text-sm text-slate-400">
                  ₹149/month
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-5">
              Professional includes{" "}
              <span className="font-medium text-white">{featureName}</span>
              {proIncludes.length > 0 && (
                <>
                  {" "}along with:
                </>
              )}
            </p>

            {proIncludes.length > 0 && (
              <ul className="space-y-2 mb-6">
                {proIncludes.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-3">
              <Link
                href="/pricing"
                onClick={() => setShowUpgrade(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                View Plans
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setShowUpgrade(false)}
                className="px-5 py-3 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800/40 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
