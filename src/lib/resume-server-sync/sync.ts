import { fetchServerResumes } from "./client";
import {
  computeParity,
  type LocalResumeSnapshot,
  type ParityReport,
} from "./parity";
import { isResumeServerSyncEnabled } from "./config";

/**
 * Read-only server resume sync (Phase 1A, ADR-004).
 *
 * Fetches the SERVER_SNAPSHOT for the authenticated user and classifies it
 * against the local resumes. It is deliberately PURE with respect to the
 * application state: it never writes to Zustand, never uploads local resumes,
 * never adds server-only resumes to the UI, and never overwrites anything.
 * Every failure mode returns an `error` outcome so the builder can keep
 * working entirely from localStorage (fail closed).
 */
export type ResumeSyncOutcome =
  | { status: "disabled" }
  | { status: "error"; error: string }
  | { status: "ok"; report: ParityReport };

export async function runServerResumeSync(
  localSnapshots: LocalResumeSnapshot[],
): Promise<ResumeSyncOutcome> {
  if (!isResumeServerSyncEnabled()) {
    return { status: "disabled" };
  }

  try {
    const serverResumes = await fetchServerResumes();
    const report = computeParity(localSnapshots, serverResumes);
    return { status: "ok", report };
  } catch (err: unknown) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Failed to load server resumes",
    };
  }
}
