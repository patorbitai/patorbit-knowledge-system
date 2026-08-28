"use client";

/**
 * Resume Migration UI — Phase 1B (ADR-005).
 *
 * Provides explicit user action to migrate LOCAL_ONLY resumes to PostgreSQL.
 * Does NOT automatically migrate, overwrite, or delete any data.
 *
 * Mounts in Resume Builder but does NOT trigger automatically.
 */

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useResumeBuilder } from "@/store/resume-builder";
import { fetchServerResumes } from "@/lib/resume-server-sync/client";
import {
  computeParity,
  type LocalResumeSnapshot,
} from "@/lib/resume-server-sync/parity";
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
  const { resumes, styleConfigs, activeResumeId } = useResumeBuilder();
  const [showUI, setShowUI] = useState(false);
  const [plan, setPlan] = useState<MigrationPlan | null>(null);
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate migration eligibility
  const calculatePlan = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setPlan(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create local snapshot without mutating store
      const localSnapshots = createLocalSnapshot(resumes, styleConfigs);

      // Fetch server resumes
      const serverResumes = await fetchServerResumes();

      // Compute parity
      const parityReport = computeParity(localSnapshots, serverResumes);

      // Create migration plan
      const migrationPlan = planMigration(localSnapshots, parityReport);

      setPlan(migrationPlan);
    } catch (err) {
      console.error("Failed to calculate migration plan:", err);
      setError("Failed to check migration status");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [resumes, styleConfigs, authStatus]);

  // Calculate plan on mount and when resumes change
  useEffect(() => {
    if (showUI) {
      calculatePlan();
    }
  }, [showUI, calculatePlan]);

  const handleMigrate = useCallback(async () => {
    if (!plan || plan.summary.safeToMigrate === 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Execute migration
      const migrationReport = await executeMigration(plan);
      setReport(migrationReport);

      // Notify parent of migrated resumes
      if (migrationReport.status === "COMPLETED") {
        for (const result of migrationReport.results) {
          if (result.success && result.verified) {
            onResumeMigrated?.(result.resumeId);
          }
        }
      }
    } catch (err) {
      console.error("Migration failed:", err);
      setError("Migration failed. Your local resumes remain safe.");
    } finally {
      setLoading(false);
    }
  }, [plan, onResumeMigrated]);

  // Don't show if not authenticated
  if (authStatus !== "authenticated") {
    return null;
  }

  // Show toggle button if UI is hidden
  if (!showUI) {
    const safeCount = resumes.length; // All local resumes are safe to show
    if (safeCount === 0) return null;

    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-800">
              <span className="font-medium">Backup your resumes</span>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {safeCount} resume{safeCount !== 1 ? "s" : ""} stored locally.
            </p>
          </div>
          <button
            onClick={() => setShowUI(true)}
            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
          >
            Check Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          Resume Backup Status
        </h3>
        <button
          onClick={() => {
            setShowUI(false);
            setPlan(null);
            setReport(null);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Checking status...</span>
        </div>
      )}

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={calculatePlan}
            className="mt-2 text-xs text-red-600 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && plan && (
        <>
          {/* Summary */}
          <div className="mb-4 space-y-2">
            {plan.summary.safeToMigrate > 0 && (
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-gray-700">
                  {plan.summary.safeToMigrate} resume
                  {plan.summary.safeToMigrate !== 1 ? "s" : ""} ready to
                  backup
                </span>
              </div>
            )}

            {plan.summary.alreadyMigrated > 0 && (
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-gray-700">
                  {plan.summary.alreadyMigrated} resume
                  {plan.summary.alreadyMigrated !== 1 ? "s" : ""} already
                  synchronized
                </span>
              </div>
            )}

            {plan.summary.conflicts > 0 && (
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-gray-700">
                  {plan.summary.conflicts} resume
                  {plan.summary.conflicts !== 1 ? "s" : ""} need review
                </span>
              </div>
            )}

            {plan.summary.serverOnly > 0 && (
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                <span className="text-gray-700">
                  {plan.summary.serverOnly} resume
                  {plan.summary.serverOnly !== 1 ? "s" : ""} only on server
                </span>
              </div>
            )}
          </div>

          {/* Action button */}
          {plan.summary.safeToMigrate > 0 && !report && (
            <button
              onClick={handleMigrate}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Secure My Resumes
            </button>
          )}

          {/* Migration Report */}
          {report && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Migration Result
              </h4>
              <p className="text-sm text-gray-700">
                {report.status === "COMPLETED"
                  ? "All local resumes secured successfully."
                  : report.status === "PARTIAL"
                    ? "Some resumes secured, some failed."
                    : report.status === "CONFLICTS"
                      ? "Resumes with conflicts need manual review."
                      : "Migration complete."}
              </p>

              {report.summary.verified > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ {report.summary.verified} resume(s) verified against
                  server.
                </p>
              )}

              {report.summary.failed > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  ✗ {report.summary.failed} resume(s) failed to migrate.
                </p>
              )}

              <button
                onClick={() => {
                  setReport(null);
                  calculatePlan(); // Refresh plan
                }}
                className="mt-3 text-xs text-blue-600 underline hover:text-blue-800"
              >
                Refresh Status
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
