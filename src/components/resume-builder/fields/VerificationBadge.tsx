"use client";

import { clsx } from "clsx";
import { Shield, ShieldCheck, ShieldAlert, ShieldOff, Upload, Link2 } from "lucide-react";
import { useState } from "react";

export type VerificationStatus = "verified" | "pending" | "needs-evidence" | "not-connected";

interface VerificationBadgeProps {
  status: VerificationStatus;
  onUploadEvidence?: () => void;
  onConnectAccount?: () => void;
  size?: "sm" | "md";
}

const config: Record<VerificationStatus, { label: string; color: string; bg: string; Icon: React.ComponentType<{ className?: string }> }> = {
  verified: {
    label: "Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    Icon: ShieldCheck,
  },
  pending: {
    label: "Pending",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    Icon: Shield,
  },
  "needs-evidence": {
    label: "Needs Evidence",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    Icon: ShieldAlert,
  },
  "not-connected": {
    label: "Not Connected",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    Icon: ShieldOff,
  },
};

export function VerificationBadge({
  status,
  onUploadEvidence,
  onConnectAccount,
  size = "sm",
}: VerificationBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const c = config[status];
  const Icon = c.Icon;

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-lg border transition-all",
          "focus:outline-none focus:ring-1 focus:ring-blue-500/30",
          c.bg,
          `border-${status === "verified" ? "emerald" : status === "pending" ? "amber" : status === "needs-evidence" ? "rose" : "slate"}-500/20`,
          size === "sm" ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs",
        )}
      >
        <Icon className={clsx(c.color, size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
        <span className={clsx("font-medium", c.color)}>{c.label}</span>
      </button>

      {expanded && (status === "needs-evidence" || status === "not-connected") && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-xl border border-white/[0.08] bg-[#0C1322] shadow-2xl shadow-black/50 py-2 backdrop-blur-xl">
          {status === "needs-evidence" && onUploadEvidence && (
            <button
              onClick={() => { onUploadEvidence(); setExpanded(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              Upload Evidence
            </button>
          )}
          {status === "not-connected" && onConnectAccount && (
            <button
              onClick={() => { onConnectAccount(); setExpanded(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              Connect Account
            </button>
          )}
        </div>
      )}
    </div>
  );
}
