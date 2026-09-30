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
import { AddEvidenceModal } from "@/components/identity/AddEvidenceModal";
import type { Claim } from "@/types/resume";
import { confidenceWord } from "@/lib/provenance";
import { ai } from "@/lib/ai/client";
import { UsageHint } from "@/components/common/UsageHint";

export function ClaimsReview() {
  const suggestedClaims = useResumeBuilder((s) => s.suggestedClaims);
  const acceptedClaims = useResumeBuilder((s) => s.resume.claims);
  const acceptClaim = useResumeBuilder((s) => s.acceptClaim);
  const rejectClaim = useResumeBuilder((s) => s.rejectClaim);
  const acceptEditedClaim = useResumeBuilder((s) => s.acceptEditedClaim);
  const setSuggestedClaims = useResumeBuilder((s) => s.setSuggestedClaims);

  const [expanded, setExpanded] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState("");
  // The claim the user chose to strengthen → drives AddEvidenceModal.
  const [strengthenClaim, setStrengthenClaim] = useState<Claim | null>(null);
  // M6 — claims generation is EXPLICIT ONLY (the passive debounced call was
  // removed from useResumeAutosave). One activation = one request.
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const handleSuggest = async () => {
    if (suggesting) return; // ignore double-clicks — one activation, one request
    setSuggesting(true);
    setSuggestError(null);
    try {
      const st = useResumeBuilder.getState();
      const result = await ai.generateClaims(st.resume, st.resume.claims);
      if (result?.claims?.length) {
        setSuggestedClaims(result.claims);
      } else {
        // Truthful empty state — never dressed up as success.
        setSuggestError("No new claim suggestions were found in your resume. You can edit your experience and try again.");
      }
    } catch (err: unknown) {
      // Failed generation must never render suggestions or a success state.
      setSuggestError(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't generate claim suggestions. Please try again.",
      );
    } finally {
      setSuggesting(false);
    }
  };

  const hasSuggestions = !!suggestedClaims && suggestedClaims.length > 0;
  const hasAccepted = !!acceptedClaims && acceptedClaims.length > 0;

  // Empty state → the explicit "Suggest claims" launcher (M6). Previously this
  // returned null and claims could only arrive from the removed passive call.
  if (!hasSuggestions && !hasAccepted) {
    return (
      <div className="fixed top-20 right-4 z-40 max-w-sm w-full">
        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-blue-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-white">Claim Suggestions</h3>
          </div>
          <p className="text-xs text-slate-400">
            Let AI scan your resume for statements that could be backed by evidence.
          </p>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => void handleSuggest()}
              disabled={suggesting}
              aria-busy={suggesting}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-wait text-white px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              {suggesting ? "Suggesting…" : "Suggest claims"}
            </button>
            <UsageHint feature="ai_generations" />
          </div>
          {suggestError && (
            <p role="alert" className="text-[11px] text-rose-400">
              {suggestError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-40 max-w-sm w-full">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="rounded-2xl border border-blue-500/20 bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-blue-500/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-blue-500/10">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-semibold text-white">
                  {(() => {
                  const sc = suggestedClaims ?? [];
                  return sc.length > 0
                    ? `AI detected ${sc.length} new claim${sc.length > 1 ? "s" : ""}`
                    : "Your Claims";
                })()}
                </h3>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Claims list */}
            <div className="p-2 space-y-1.5 max-h-[35vh] overflow-y-auto">
              {/* M6 — explicit re-suggestion launcher when suggestions ran out */}
              {!hasSuggestions && hasAccepted && (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-800/50 p-2.5 border border-slate-700/60">
                  <button
                    onClick={() => void handleSuggest()}
                    disabled={suggesting}
                    aria-busy={suggesting}
                    className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-wait text-white px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                  >
                    {suggesting ? "Suggesting…" : "Suggest claims"}
                  </button>
                  <UsageHint feature="ai_generations" />
                </div>
              )}
              {suggestError && (
                <p role="alert" className="text-[11px] text-rose-400 px-1">
                  {suggestError}
                </p>
              )}
              {/* Suggested (review) claims */}
              {suggestedClaims.map((claim, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60"
                >
                  {editingIndex === i ? (
                    // Edit mode
                    <div className="space-y-2">
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
                      <p className="text-xs text-slate-200">{claim.assertionText}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <FileText className="w-2.5 h-2.5" />
                          <span>Source: {claim.sourceActivityId}</span>
                          <span className="text-slate-600">|</span>
                          <span title={`Numeric confidence: ${claim.confidence.toFixed(2)}`}>Confidence: {confidenceWord(claim.confidence)}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            title="Accept"
                            onClick={() => acceptClaim(claim)}
                            className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Edit & Accept"
                            onClick={() => {
                              setEditingIndex(i);
                              setEditedText(claim.assertionText);
                            }}
                            className="p-1 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            title="Reject"
                            onClick={() => rejectClaim(i)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Accepted claims → continue to evidence */}
              {acceptedClaims?.length > 0 && (
                <div className="pt-1.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      Accepted Claims ({acceptedClaims.length})
                    </span>
                  </div>
                  {acceptedClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="bg-slate-800/30 rounded-xl p-2.5 border border-white/[0.04]"
                    >
                      <p className="text-xs text-slate-200">{claim.assertionText}</p>
                      <button
                        onClick={() => setStrengthenClaim(claim)}
                        className="mt-2 inline-flex items-center gap-1 rounded-lg bg-blue-600/20 border border-blue-500/30 px-2 py-1 text-[10px] font-medium text-blue-300 hover:bg-blue-600/30 hover:text-blue-200 transition-colors"
                      >
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Strengthen
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
          className="rounded-full bg-blue-600 text-white p-2.5 shadow-lg hover:bg-blue-500 transition-all"
        >
          <Lightbulb className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 items-center justify-center text-[10px]">
              {(suggestedClaims?.length ?? 0) + (acceptedClaims?.length ?? 0)}
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
