"use client";

import { useResumeBuilder } from "@/store/resume-builder";
import {
  Check,
  Edit2,
  X,
  FileText,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { AddEvidenceModal } from "@/components/identity/AddEvidenceModal";
import type { Claim } from "@/types/resume";

export function ClaimsReview() {
  const suggestedClaims = useResumeBuilder((s) => s.suggestedClaims);
  const acceptedClaims = useResumeBuilder((s) => s.resume.claims);
  const acceptClaim = useResumeBuilder((s) => s.acceptClaim);
  const rejectClaim = useResumeBuilder((s) => s.rejectClaim);
  const acceptEditedClaim = useResumeBuilder((s) => s.acceptEditedClaim);

  const [expanded, setExpanded] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState("");
  // The claim the user chose to strengthen → drives AddEvidenceModal.
  const [strengthenClaim, setStrengthenClaim] = useState<Claim | null>(null);

  if ((!suggestedClaims || suggestedClaims.length === 0) && acceptedClaims.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-lg w-full">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="rounded-2xl border border-blue-500/20 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-blue-500/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-blue-500/10">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">
                  {suggestedClaims.length > 0
                    ? `AI detected ${suggestedClaims.length} new claim${suggestedClaims.length > 1 ? "s" : ""}`
                    : "Your Claims"}
                </h3>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Claims list */}
            <div className="p-3 space-y-2 max-h-[40vh] overflow-y-auto">
              {/* Suggested (review) claims */}
              {suggestedClaims.map((claim, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/60"
                >
                  {editingIndex === i ? (
                    // Edit mode
                    <div className="space-y-3">
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="w-full bg-slate-900 border border-blue-500/30 rounded-lg text-xs p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            acceptEditedClaim(claim, editedText);
                            setEditingIndex(null);
                          }}
                          className="flex-1 text-center bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-1.5 text-xs font-semibold"
                        >
                          Save & Accept
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="text-slate-400 hover:text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <p className="text-sm text-slate-200">{claim.assertionText}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <FileText className="w-3 h-3" />
                          <span>Source: {claim.sourceActivityId}</span>
                          <span className="text-slate-600">|</span>
                          <span>Confidence: {Math.round(claim.confidence * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            title="Accept"
                            onClick={() => acceptClaim(claim)}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit & Accept"
                            onClick={() => {
                              setEditingIndex(i);
                              setEditedText(claim.assertionText);
                            }}
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Reject"
                            onClick={() => rejectClaim(i)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Accepted claims → continue to evidence */}
              {acceptedClaims.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Accepted Claims ({acceptedClaims.length})
                    </span>
                  </div>
                  {acceptedClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="bg-slate-800/30 rounded-xl p-3 border border-white/[0.04]"
                    >
                      <p className="text-sm text-slate-200">{claim.assertionText}</p>
                      <button
                        onClick={() => setStrengthenClaim(claim)}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 px-2.5 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-600/30 hover:text-blue-200 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Strengthen this claim
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="rounded-full bg-blue-600 text-white p-3 shadow-lg hover:bg-blue-500 transition-all"
        >
          <Lightbulb className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 items-center justify-center text-[10px]">
              {suggestedClaims.length + acceptedClaims.length}
            </span>
          </span>
        </button>
      )}

      {/* Add Evidence modal — opened via "Strengthen this claim" */}
      <AddEvidenceModal
        claimId={strengthenClaim?.id ?? ""}
        claimAssertion={strengthenClaim?.assertionText ?? ""}
        open={!!strengthenClaim}
        onClose={() => setStrengthenClaim(null)}
      />
    </div>
  );
}
