"use client";

import { useState } from "react";
import { ShieldCheck, Clock, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import type { Claim } from "@/types/resume";
import { EvidencePanel } from "./EvidencePanel";
import { AddEvidenceModal } from "./AddEvidenceModal";
import { DisputeClaimModal } from "./DisputeClaimModal";
import { clsx } from "clsx";

export interface ClaimCardProps {
  claim: Claim;
}

export function ClaimCard({ claim }: ClaimCardProps) {
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  const getStatusBadge = (status: Claim["verificationStatus"]) => {
    switch (status) {
      case "verified":
        return {
          label: "Verified",
          icon: ShieldCheck,
          className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "under-review":
        return {
          label: "Pending",
          icon: Clock,
          className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
      case "disputed":
      case "revoked":
        return {
          label: "Disputed",
          icon: AlertTriangle,
          className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
      case "expired":
        return {
          label: "Expired",
          icon: XCircle,
          className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        };
      default:
        return {
          label: "Unverified",
          icon: HelpCircle,
          className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        };
    }
  };

  const statusInfo = getStatusBadge(claim.verificationStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">{claim.assertionText}</p>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="uppercase text-[10px] tracking-wider font-semibold text-slate-500">
              {claim.claimType}
            </span>
            <span>·</span>
            <span>Confidence: {Math.round(claim.confidence * 100)}%</span>
          </div>
          {claim.reasoning && (
            <p className="text-xs text-slate-500 mt-1">{claim.reasoning}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className={clsx(
              "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium border",
              statusInfo.className
            )}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusInfo.label}
          </span>
          {claim.verificationStatus !== "disputed" && claim.verificationStatus !== "revoked" && (
            <button
              onClick={() => setDisputeModalOpen(true)}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors underline"
            >
              Dispute / Request Correction
            </button>
          )}
        </div>
      </div>

      {/* Evidence List / Panel */}
      <div className="border-t border-white/[0.06] pt-4">
        <EvidencePanel claimId={claim.id} onAddEvidence={() => setEvidenceModalOpen(true)} />
      </div>

      <AddEvidenceModal
        claimId={claim.id}
        claimAssertion={claim.assertionText}
        open={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
      />

      <DisputeClaimModal
        claim={claim}
        open={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
      />
    </div>
  );
}
