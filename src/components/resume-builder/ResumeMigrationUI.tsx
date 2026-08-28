"use client";

/**
 * Resume Migration UI — Phase 1B (ADR-005).
 *
 * Compact dark-theme pill notification in bottom-right corner.
 * Does NOT automatically migrate, overwrite, or delete any data.
 */

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useResumeBuilder } from "@/store/resume-builder";
import { fetchServerResumes } from "@/lib/resume-server-sync/client";
import { computeParity } from "@/lib/resume-server-sync/parity";
import {
  createLocalSnapshot,
  planMigration,
  executeMigration,
  type MigrationPlan,
  type MigrationReport,
} from "@/lib/resume-server-sync/migration";

interface MigrationUIProps {
  onResumeMigrated?: (resumeId: string) => void;
}

export function ResumeMigrationUI({ onResumeMigrated }: MigrationUIProps) {
  const { status: authStatus } = useSession();
  const { resumes, styleConfigs } = useResumeBuilder();
  const [showUI, setShowUI] = useState(false);
  const [plan, setPlan] = useState<MigrationPlan | null>(null);
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePlan = useCallback(async () => {
    if (authStatus !== "authenticated") { setPlan(null); return; }
    try {
      setLoading(true);
      setError(null);
      const localSnapshots = createLocalSnapshot(resumes, styleConfigs);
      const serverResumes = await fetchServerResumes();
      const parityReport = computeParity(localSnapshots, serverResumes);
      setPlan(planMigration(localSnapshots, parityReport));
    } catch {
      setError("Failed to check status");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [resumes, styleConfigs, authStatus]);

  useEffect(() => {
    if (showUI) calculatePlan();
  }, [showUI, calculatePlan]);

  const handleMigrate = useCallback(async () => {
    if (!plan || plan.summary.safeToMigrate === 0) return;
    try {
      setLoading(true);
      setError(null);
      const migrationReport = await executeMigration(plan);
      setReport(migrationReport);
      if (migrationReport.status === "COMPLETED") {
        for (const r of migrationReport.results) {
          if (r.success && r.verified) onResumeMigrated?.(r.resumeId);
        }
      }
    } catch {
      setError("Migration failed. Local data is safe.");
    } finally {
      setLoading(false);
    }
  }, [plan, onResumeMigrated]);

  if (authStatus !== "authenticated") return null;

  // Collapsed pill — bottom-right corner
  if (!showUI) {
    const safeCount = resumes.length;
    if (safeCount === 0) return null;

    return (
      <button
        onClick={() => setShowUI(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#0a1424]/90 backdrop-blur-xl px-3.5 py-2 text-xs font-medium text-slate-400 shadow-lg hover:border-cyan-500/30 hover:text-slate-200 transition-all"
        title="Resume backup status"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>{safeCount} local resume{safeCount !== 1 ? "s" : ""}</span>
      </button>
    );
  }

  // Expanded card — bottom-right corner
  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl border border-white/[0.08] bg-[#0a1424]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="text-xs font-semibold text-white">Backup Status</span>
        </div>
        <button
          onClick={() => { setShowUI(false); setPlan(null); setReport(null); }}
          className="text-slate-500 hover:text-white transition-colors p-0.5 rounded"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="px-3.5 py-3">
        {loading && (
          <div className="flex items-center gap-2 py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-400 border-t-transparent" />
            <span className="text-xs text-slate-400">Checking...</span>
          </div>
        )}

        {error && (
          <div className="space-y-2">
            <p className="text-xs text-red-400">{error}</p>
            <button onClick={calculatePlan} className="text-[11px] text-cyan-400 hover:text-cyan-300 underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && plan && (
          <div className="space-y-2.5">
            {plan.summary.safeToMigrate > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-slate-300">
                  {plan.summary.safeToMigrate} resume{plan.summary.safeToMigrate !== 1 ? "s" : ""} ready to backup
                </span>
              </div>
            )}
            {plan.summary.alreadyMigrated > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-300">
                  {plan.summary.alreadyMigrated} resume{plan.summary.alreadyMigrated !== 1 ? "s" : ""} synced
                </span>
              </div>
            )}
            {plan.summary.conflicts > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-300">
                  {plan.summary.conflicts} resume{plan.summary.conflicts !== 1 ? "s" : ""} need review
                </span>
              </div>
            )}

            {plan.summary.safeToMigrate > 0 && !report && (
              <button
                onClick={handleMigrate}
                disabled={loading}
                className="w-full mt-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-500/20 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
              >
                Secure Now
              </button>
            )}

            {report && (
              <div className="mt-1 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-slate-300">
                  {report.status === "COMPLETED" ? "✓ All resumes secured" : "Partial — some failed"}
                </p>
                <button
                  onClick={() => { setReport(null); calculatePlan(); }}
                  className="mt-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 underline"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
