import type { ParityReport } from "./parity";

/**
 * Development-only parity report (ADR-004 §Debug output).
 *
 * Prints ONLY resume IDs + parity statuses — never resume content. Gated to
 * non-production builds, so it adds no noise in real deployments. There is no
 * existing debug panel in this repository, so this single dev-only console
 * line per builder load is the smallest safe inspection mechanism.
 */
/**
 * Dev-only job-picker diagnostic (same safety rules as `reportParity`):
 * prints resume IDs ONLY — never resume content — and is stripped from
 * production builds.
 *
 * `offeredServerIds` are the server-backed resumes the job-detail picker
 * offers for linking; `excludedLocalIds` are IDs present in the local Zustand
 * store that the server does NOT know about (local-only/phantom resumes).
 * A non-empty `excludedLocalIds` is the exact precondition of the
 * "resume does not belong to your account" 400 blocker.
 */
export function reportPickerReconciliation(
  offeredServerIds: string[],
  excludedLocalIds: string[],
): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  console.info(
    `[resume-server-sync] JOB RESUME PICKER\n` +
      `Server-backed (selectable): ${offeredServerIds.join(", ") || "(none)"}\n` +
      `Excluded local-only: ${excludedLocalIds.join(", ") || "(none)"}`,
  );
}

export function reportParity(report: ParityReport): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  const rows = report.entries.map((e) => `  ${e.resumeId}\t${e.status}`);
  console.info(
    `[resume-server-sync] SERVER RESUME SYNC\nStatus: loaded\n${rows.join("\n")}`,
  );
}
