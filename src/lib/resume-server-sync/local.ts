import type { Resume } from "@/types/resume";
import type { ResumeStyleConfig } from "@/lib/resume-design-system/style-config";
import type { LocalResumeSnapshot } from "./parity";

/**
 * Build read-only LOCAL snapshots from the Zustand store state.
 *
 * This is the ONLY place that reads the store for Phase 1A; it never writes.
 * The monitor calls `useResumeBuilder.getState()` and passes the results here,
 * so the snapshot is a plain data copy, not a live store reference.
 */
export function buildLocalSnapshots(
  resumes: Resume[],
  styleConfigs: Record<string, ResumeStyleConfig>,
): LocalResumeSnapshot[] {
  return resumes.map((r) => ({
    resumeId: r.resumeId ?? "",
    resumeName: r.resumeName ?? "",
    templateId: r.templateId,
    careerStage: r.careerStage,
    document: r,
    styleConfig: styleConfigs[r.resumeId ?? ""] ?? null,
  }));
}
