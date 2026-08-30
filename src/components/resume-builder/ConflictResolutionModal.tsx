"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Server,
  User,
  X,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { computeSectionDiffs, type SectionDiff, type SectionDiffStatus } from "@/lib/conflict-diff";

const STATUS_LABELS: Record<SectionDiffStatus, { label: string; color: string }> = {
  unchanged: { label: "Unchanged", color: "text-slate-500" },
  "local-only": { label: "Changed locally", color: "text-amber-400" },
  "server-only": { label: "Changed on server", color: "text-blue-400" },
  "both-changed": { label: "Changed on both", color: "text-red-400" },
};

function DiffRow({ diff }: { diff: SectionDiff }) {
  const { label, color } = STATUS_LABELS[diff.status];
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-200">{diff.section}</span>
        {diff.detail && (
          <span className="text-xs text-slate-500">({diff.detail})</span>
        )}
      </div>
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    </div>
  );
}

export function ConflictResolutionModal() {
  const writeConflict = useResumeBuilder((s) => s.writeConflict);
  const clearWriteConflict = useResumeBuilder((s) => s.clearWriteConflict);
  const resolveConflictKeepMine = useResumeBuilder((s) => s.resolveConflictKeepMine);
  const resolveConflictUseServer = useResumeBuilder((s) => s.resolveConflictUseServer);

  const [showDetails, setShowDetails] = useState(false);
  const [resolving, setResolving] = useState<"keep" | "server" | null>(null);

  const diffs = useMemo(() => {
    if (!writeConflict) return [];
    return computeSectionDiffs(writeConflict.localResume, writeConflict.serverResume);
  }, [writeConflict]);

  const changedCount = diffs.filter((d) => d.status !== "unchanged").length;

  const handleKeepMine = async () => {
    setResolving("keep");
    await resolveConflictKeepMine();
    setResolving(null);
  };

  const handleUseServer = () => {
    setResolving("server");
    resolveConflictUseServer();
    setResolving(null);
  };

  const handleCancel = () => {
    // Preserve local state, close UI, keep conflict available for later
    clearWriteConflict();
  };

  return (
    <AnimatePresence>
      {writeConflict && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            // Only close on backdrop click if not currently resolving
            if (e.target === e.currentTarget && !resolving) handleCancel();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg mx-4 bg-[#1a1d23] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white">Resume Conflict</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    This resume was modified on another device or session.
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  disabled={!!resolving}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Version comparison */}
            <div className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 bg-white/[0.04] rounded-xl px-4 py-3 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-slate-400">Your version</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  Version {writeConflict.localBaseVersion ?? "unversioned"}
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
              <div className="flex-1 bg-white/[0.04] rounded-xl px-4 py-3 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-1">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-medium text-slate-400">Server version</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  Version {writeConflict.serverVersion}
                </span>
              </div>
            </div>

            {/* Section diff toggle */}
            {diffs.length > 0 && (
              <div className="px-6 pb-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {changedCount} section{changedCount !== 1 ? "s" : ""} differ
                </button>
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-1.5">
                        {diffs.map((d) => (
                          <DiffRow key={d.section} diff={d} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={!!resolving}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUseServer}
                disabled={!!resolving}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {resolving === "server" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Server className="w-3.5 h-3.5" />
                )}
                Use Server
              </button>
              <button
                onClick={handleKeepMine}
                disabled={!!resolving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {resolving === "keep" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Keep Mine
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
