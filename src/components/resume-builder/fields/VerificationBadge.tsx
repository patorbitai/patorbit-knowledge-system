"use client";

import { clsx } from "clsx";
import { Shield, ShieldCheck, ShieldAlert, ShieldOff, ShieldX, Upload, Link2, Eye } from "lucide-react";
import { useState, useMemo } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import type { Claim } from "@/types/resume";
import { deriveBadgeStatus, BADGE_CONFIG, type BadgeState } from "@/lib/evidence/badge";
import { EvidencePanel } from "@/components/identity/EvidencePanel";
import { AddEvidenceModal } from "@/components/identity/AddEvidenceModal";

interface VerificationBadgeProps {
  claim: Claim;
  size?: "sm" | "md";
}

const ICONS = { ShieldCheck, Shield, ShieldAlert, ShieldOff, ShieldX };

export function VerificationBadge({ claim, size = "sm" }: VerificationBadgeProps) {
  const allEvidence = useResumeBuilder((s) => s.evidence);
  const evidence = useMemo(() => allEvidence.filter((e) => e.claimId === claim.id), [allEvidence, claim.id]);
  const status = deriveBadgeStatus(claim, evidence);
  const config = BADGE_CONFIG[status];
  const Icon = ICONS[config.icon];

  const [panelOpen, setPanelOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // The badge's primary action depends on its state.
  const handleBadgeClick = () => {
    switch (status) {
      case "no-evidence":
        setModalOpen(true);
        break;
      case "evidence-added":
      case "under-review":
      case "verified":
      case "expired":
      case "rejected":
        setPanelOpen(true);
        break;
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={handleBadgeClick}
          title={config.tooltip}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-lg border transition-all",
            "focus:outline-none focus:ring-1 focus:ring-blue-500/30",
            config.bg,
            config.border,
            size === "sm" ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs",
          )}
        >
          <Icon className={clsx(config.color, size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
          <span className={clsx("font-medium", config.color)}>{config.label}</span>
        </button>

        {/* The evidence panel is rendered in a popover for now; will move to a dedicated Hub view. */}
        {panelOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setPanelOpen(false)}
          >
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0C1322] shadow-2xl shadow-black/50 p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-sm font-semibold text-white">Evidence for Claim</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4 line-clamp-2">{claim.assertionText}</p>
              <EvidencePanel claimId={claim.id} onAddEvidence={() => setModalOpen(true)} />
            </div>
          </div>
        )}
      </div>

      <AddEvidenceModal
        claimId={claim.id}
        claimAssertion={claim.assertionText}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

