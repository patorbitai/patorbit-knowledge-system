"use strict";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertTriangle, Loader2, Check } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import type { Claim } from "@/types/resume";

interface DisputeClaimModalProps {
  claim: Claim;
  open: boolean;
  onClose: () => void;
}

export function DisputeClaimModal({ claim, open, onClose }: DisputeClaimModalProps) {
  const updateClaim = useResumeBuilder((s) => s.updateClaim);

  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setReason("");
    setError(null);
    setSubmitting(false);
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for the dispute or correction.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const updatedReasoning = claim.reasoning
        ? `${claim.reasoning} | Dispute: ${reason.trim()}`
        : `Dispute: ${reason.trim()}`;

      updateClaim(claim.id, {
        verificationStatus: "disputed",
        reasoning: updatedReasoning,
      });

      setSubmitting(false);
      setSuccess(true);
    } catch (err: unknown) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Failed to submit dispute. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0C1322] shadow-2xl shadow-black/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-white">Dispute / Request Correction</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {success ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Claim Marked as Disputed</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Your correction reason has been recorded and the claim status updated to disputed.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-4 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-300">
                    Assertion: <span className="text-white font-medium">{claim.assertionText}</span>
                  </p>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Correction / Dispute Reason <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => { setReason(e.target.value); setError(null); }}
                      rows={3}
                      placeholder="Explain why this claim is incorrect or requires correction..."
                      className="mt-1.5 w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500/40 resize-none"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-[11px] text-rose-300">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-white/[0.06]">
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !reason.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" /> Submit Dispute
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
