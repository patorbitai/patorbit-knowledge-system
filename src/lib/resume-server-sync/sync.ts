import { fetchServerResumes } from "./client";
import {
  computeParity,
  type LocalResumeSnapshot,
  type ParityReport,
} from "./parity";
import { isResumeServerSyncEnabled } from "./config";
import { useResumeBuilder } from "@/store/resume-builder";

/**
 * Read-only server resume sync (Phase 1A, ADR-004) + C6 version capture.
 *
 * Fetches the SERVER_SNAPSHOT for the authenticated user and classifies it
 * against the local resumes. It never overwrites local resume content.
 * It DOES capture the server version for each matching resume so that
 * future write-back can use optimistic locking (baseVersion).
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

    // C6: Capture server versions for matching resumes (read-only for content)
    const state = useResumeBuilder.getState();
    const newVersions = { ...state.serverVersions };
    let changed = false;
    for (const server of serverResumes) {
      if (server.version && (!newVersions[server.resumeId] || newVersions[server.resumeId] !== server.version)) {
        newVersions[server.resumeId] = server.version;
        changed = true;
      }
    }
    if (changed) {
      useResumeBuilder.setState({ serverVersions: newVersions });
    }

    return { status: "ok", report };
  } catch (err: unknown) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Failed to load server resumes",
    };
  }
}
