/**
 * Safe local resume migration planner and executor (Phase 1B, ADR-005).
 *
 * This module plans and executes migration of LOCAL_ONLY resumes to PostgreSQL
 * without overwriting, deleting, or modifying any existing data. It is idempotent,
 * verifiable, and respects all safety rules.
 */

import type { Resume } from "@/types/resume";
import type { ServerResumeRecord } from "./client";
import {
  computeParity,
  type LocalResumeSnapshot,
  type ParityReport,
} from "./parity";

export type MigrationStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PARTIAL"
  | "CONFLICTS";

export type MigrationPlanCategory =
  | "SAFE_TO_MIGRATE"
  | "ALREADY_MIGRATED"
  | "CONFLICT"
  | "SERVER_ONLY";

export interface MigrationPlanEntry {
  resumeId: string;
  resumeName: string;
  category: MigrationPlanCategory;
  localSnapshot: LocalResumeSnapshot;
  serverUpdatedAt?: string;
}

export interface MigrationPlan {
  entries: MigrationPlanEntry[];
  summary: {
    safeToMigrate: number;
    alreadyMigrated: number;
    conflicts: number;
    serverOnly: number;
  };
  totalLocal: number;
  totalServer: number;
  generatedAt: string;
}

export interface MigrationResult {
  resumeId: string;
  success: boolean;
  verified: boolean;
  error?: string;
}

export interface MigrationReport {
  status: MigrationStatus;
  results: MigrationResult[];
  summary: {
    migrated: number;
    verified: number;
    failed: number;
    alreadyMigrated: number;
    conflicts: number;
    serverOnly: number;
  };
  executedAt: string;
}

/**
 * Create an immutable snapshot of local resumes without mutating the store.
 */
export function createLocalSnapshot(
  resumes: Resume[],
  styleConfigs: Record<string, unknown>,
): LocalResumeSnapshot[] {
  return resumes.map((resume) => ({
    resumeId: resume.resumeId || "",
    resumeName: resume.resumeName || "",
    templateId: resume.templateId,
    careerStage: resume.careerStage || "working-professional",
    document: structuredClone(resume),
    styleConfig: resume.resumeId ? styleConfigs[resume.resumeId] || null : null,
  }));
}

/**
 * Create a migration plan based on parity report and local snapshots.
 * PURE function: no side effects, no mutations.
 */
export function planMigration(
  localSnapshots: LocalResumeSnapshot[],
  parityReport: ParityReport,
): MigrationPlan {
  const entries: MigrationPlanEntry[] = [];
  const summary = {
    safeToMigrate: 0,
    alreadyMigrated: 0,
    conflicts: 0,
    serverOnly: 0,
  };

  // Process each entry in the parity report
  for (const entry of parityReport.entries) {
    const localSnapshot = localSnapshots.find(
      (l) => l.resumeId === entry.resumeId,
    );

    let category: MigrationPlanCategory;

    switch (entry.status) {
      case "LOCAL_ONLY":
        category = "SAFE_TO_MIGRATE";
        summary.safeToMigrate += 1;
        break;
      case "IDENTICAL":
        category = "ALREADY_MIGRATED";
        summary.alreadyMigrated += 1;
        break;
      case "DIFFERENT":
        category = "CONFLICT";
        summary.conflicts += 1;
        break;
      case "SERVER_ONLY":
        category = "SERVER_ONLY";
        summary.serverOnly += 1;
        break;
      default:
        throw new Error(`Unknown parity status: ${entry.status}`);
    }

    if (localSnapshot) {
      entries.push({
        resumeId: entry.resumeId,
        resumeName: localSnapshot.resumeName,
        category,
        localSnapshot,
        serverUpdatedAt: entry.serverUpdatedAt,
      });
    } else if (category === "SERVER_ONLY") {
      // Server-only entries don't have a local snapshot
      entries.push({
        resumeId: entry.resumeId,
        resumeName: "", // Unknown for server-only
        category,
        localSnapshot: null as unknown as LocalResumeSnapshot, // Placeholder
        serverUpdatedAt: entry.serverUpdatedAt,
      });
    }
  }

  return {
    entries,
    summary,
    totalLocal: localSnapshots.length,
    totalServer: parityReport.entries.filter((e) => e.serverExists).length,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Client-side helper to POST a resume to the server.
 */
async function uploadResume(
  snapshot: LocalResumeSnapshot,
): Promise<ServerResumeRecord> {
  const resumeData = {
    resumeId: snapshot.resumeId,
    resumeName: snapshot.resumeName,
    templateId: snapshot.templateId,
    careerStage: snapshot.careerStage,
    payload: {
      ...snapshot.document,
      styleConfigs: snapshot.styleConfig
        ? { [snapshot.resumeId]: snapshot.styleConfig }
        : {},
    },
  };

  const res = await fetch("/api/resumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resumeData),
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return await res.json();
}

/**
 * Verify that a server resume matches the local snapshot.
 */
async function verifyMigration(
  resumeId: string,
  localSnapshot: LocalResumeSnapshot,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/resumes/${resumeId}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return false;
    }

    const serverResume: ServerResumeRecord = await res.json();

    // Simple equality check for the critical fields
    return (
      serverResume.resumeId === localSnapshot.resumeId &&
      serverResume.resumeName === localSnapshot.resumeName &&
      serverResume.templateId === localSnapshot.templateId &&
      serverResume.careerStage === localSnapshot.careerStage
    );
  } catch {
    return false;
  }
}

/**
 * Execute migration for a single resume.
 * Returns MigrationResult with verification status.
 */
async function migrateOneResume(
  entry: MigrationPlanEntry,
): Promise<MigrationResult> {
  if (entry.category !== "SAFE_TO_MIGRATE") {
    return {
      resumeId: entry.resumeId,
      success: false,
      verified: false,
      error: `Cannot migrate ${entry.category} resume`,
    };
  }

  try {
    // Upload the resume
    await uploadResume(entry.localSnapshot);

    // Verify the upload succeeded
    const verified = await verifyMigration(
      entry.resumeId,
      entry.localSnapshot,
    );

    return {
      resumeId: entry.resumeId,
      success: true,
      verified,
      error: verified ? undefined : "Verification failed after upload",
    };
  } catch (error) {
    return {
      resumeId: entry.resumeId,
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute the migration plan. Safe for partial failures and retries.
 * Does NOT delete local data or modify the store.
 */
export async function executeMigration(
  plan: MigrationPlan,
): Promise<MigrationReport> {
  const results: MigrationResult[] = [];
  const summary = {
    migrated: 0,
    verified: 0,
    failed: 0,
    alreadyMigrated: 0,
    conflicts: plan.summary.conflicts,
    serverOnly: plan.summary.serverOnly,
  };

  // Process only SAFE_TO_MIGRATE entries
  for (const entry of plan.entries) {
    if (entry.category === "SAFE_TO_MIGRATE") {
      const result = await migrateOneResume(entry);
      results.push(result);

      if (result.success) {
        summary.migrated += 1;
        if (result.verified) {
          summary.verified += 1;
        }
      } else {
        summary.failed += 1;
      }
    } else if (entry.category === "ALREADY_MIGRATED") {
      summary.alreadyMigrated += 1;
    }
  }

  // Determine overall status
  let status: MigrationStatus;
  if (summary.failed === 0 && summary.conflicts === 0) {
    status = summary.migrated > 0 ? "COMPLETED" : "NOT_STARTED";
  } else if (summary.migrated > 0) {
    status = "PARTIAL";
  } else if (summary.conflicts > 0) {
    status = "CONFLICTS";
  } else {
    status = "NOT_STARTED";
  }

  return {
    status,
    results,
    summary,
    executedAt: new Date().toISOString(),
  };
}

/**
 * Calculate user-friendly migration message based on report.
 */
export function getMigrationMessage(report: MigrationReport): string {
  if (report.status === "NOT_STARTED") {
    if (report.summary.conflicts > 0) {
      return `${report.summary.conflicts} resume(s) need review due to conflicts.`;
    }
    return "No resumes to migrate.";
  }

  if (report.status === "CONFLICTS") {
    return `${report.summary.conflicts} resume(s) need manual review.`;
  }

  const parts: string[] = [];

  if (report.summary.verified > 0) {
    parts.push(`${report.summary.verified} resume(s) secured and verified.`);
  } else if (report.summary.migrated > 0) {
    parts.push(`${report.summary.migrated} resume(s) secured.`);
  }

  if (report.summary.alreadyMigrated > 0) {
    parts.push(
      `${report.summary.alreadyMigrated} resume(s) already synchronized.`,
    );
  }

  if (report.summary.conflicts > 0) {
    parts.push(`${report.summary.conflicts} resume(s) need review.`);
  }

  if (report.summary.failed > 0) {
    parts.push(`${report.summary.failed} resume(s) failed to migrate.`);
  }

  return parts.join(" ") || "Migration complete.";
}
