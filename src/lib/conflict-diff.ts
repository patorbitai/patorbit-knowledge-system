/**
 * C7 — Section-level diff for conflict resolution.
 *
 * Compares local and server resume versions at the section level
 * to show the user which sections changed.
 */

import type { Resume } from "@/types/resume";

export type SectionDiffStatus = "unchanged" | "local-only" | "server-only" | "both-changed";

export interface SectionDiff {
  section: string;
  status: SectionDiffStatus;
  localCount?: number;
  serverCount?: number;
  detail?: string;
}

/** Simple hash for comparing objects/arrays by content. */
function contentHash(value: unknown): string {
  return JSON.stringify(value ?? null);
}

/** Compare two section arrays and return a diff status. */
function diffArraySection(
  local: unknown[],
  server: unknown[],
  label: string,
): SectionDiff {
  const localHash = contentHash(local);
  const serverHash = contentHash(server);
  const localCount = local.length;
  const serverCount = server.length;

  if (localHash === serverHash) {
    return { section: label, status: "unchanged", localCount, serverCount };
  }

  // Both have content and differ — "both-changed" only if counts differ
  // (we can't know true "both" without timestamps, so we use "both-changed"
  // when counts differ, "local-only" or "server-only" as heuristic)
  if (localCount > 0 && serverCount > 0) {
    return {
      section: label,
      status: "both-changed",
      localCount,
      serverCount,
      detail: `${localCount} → ${serverCount} entries`,
    };
  }
  if (localCount > 0) {
    return { section: label, status: "local-only", localCount, serverCount };
  }
  return { section: label, status: "server-only", localCount, serverCount };
}

/** Compare two scalar sections. */
function diffScalarSection(
  local: unknown,
  server: unknown,
  label: string,
): SectionDiff {
  if (contentHash(local) === contentHash(server)) {
    return { section: label, status: "unchanged" };
  }
  return { section: label, status: "both-changed" };
}

/**
 * Compute section-level diffs between a local and server resume.
 * Returns an array of SectionDiff entries, one per section.
 */
export function computeSectionDiffs(
  local: Resume,
  server: Resume,
): SectionDiff[] {
  return [
    diffScalarSection(local.name, server.name, "Personal Info"),
    diffScalarSection(local.summary, server.summary, "Summary"),
    diffScalarSection(local.social, server.social, "Social Links"),
    diffArraySection(local.experience ?? [], server.experience ?? [], "Experience"),
    diffArraySection(local.education ?? [], server.education ?? [], "Education"),
    diffArraySection(local.skills ?? [], server.skills ?? [], "Skills"),
    diffArraySection(local.projects ?? [], server.projects ?? [], "Projects"),
    diffArraySection(local.certifications ?? [], server.certifications ?? [], "Certifications"),
    diffArraySection(local.languages ?? [], server.languages ?? [], "Languages"),
    diffArraySection(local.achievements ?? [], server.achievements ?? [], "Achievements"),
    diffScalarSection(local.templateId, server.templateId, "Template"),
  ];
}
