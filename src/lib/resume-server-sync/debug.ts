import type { ParityReport } from "./parity";

/**
 * Development-only parity report (ADR-004 §Debug output).
 *
 * Prints ONLY resume IDs + parity statuses — never resume content. Gated to
 * non-production builds, so it adds no noise in real deployments. There is no
 * existing debug panel in this repository, so this single dev-only console
 * line per builder load is the smallest safe inspection mechanism.
 */
export function reportParity(report: ParityReport): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  const rows = report.entries.map((e) => `  ${e.resumeId}\t${e.status}`);
  console.info(
    `[resume-server-sync] SERVER RESUME SYNC\nStatus: loaded\n${rows.join("\n")}`,
  );
}
