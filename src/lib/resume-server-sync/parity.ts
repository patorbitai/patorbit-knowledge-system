/**
 * Parity engine — deterministic LOCAL vs SERVER resume comparison (Phase 1A,
 * ADR-004).
 *
 * PURE module: no I/O, no store access, no side effects. It only classifies
 * resumes; it never uploads, overwrites, or adds anything to the UI.
 *
 * Comparison contract (canonical normalized representation):
 *  - Matched by `resumeId`.
 *  - Columns compared directly: `resumeName`, `templateId`, `careerStage`.
 *  - The resume document is normalized on BOTH sides through the shared
 *    `ResumePayloadSchema` (the single canonical document form per ADR-003)
 *    and compared as stable key-sorted JSON. This covers content fields,
 *    `claims`, and `styleConfigs`.
 *  - Local-only UI extension fields not carried by the canonical document
 *    (e.g. `experience.startDate/endDate/current/bulletPoints`,
 *    `achievement.title/date/issuer`) are stripped by the canonical
 *    normalization on both sides; field-level diffing of those extensions is
 *    deferred to the Phase-1B reconciliation UI.
 *  - Any normalization failure yields a DIFFERENT-safe fingerprint — parity
 *    never reports IDENTICAL for an unexpected document.
 */
import type { Resume } from "@/types/resume";
import type { ServerResumeRecord } from "./client";
import { ResumePayloadSchema } from "@/utils/resume-payload-schema";

export type ParityStatus = "IDENTICAL" | "DIFFERENT" | "LOCAL_ONLY" | "SERVER_ONLY";

/** Read-only projection of a local resume (from the Zustand store). */
export interface LocalResumeSnapshot {
  resumeId: string;
  resumeName: string;
  templateId: string;
  careerStage: string;
  document: Resume;
  /** The store's styleConfigs[resumeId] value, or null when unset. */
  styleConfig: unknown;
}

export interface ResumeParityEntry {
  resumeId: string;
  status: ParityStatus;
  localExists: boolean;
  serverExists: boolean;
  serverUpdatedAt?: string;
}

export interface ParityReport {
  entries: ResumeParityEntry[];
  summary: {
    identical: number;
    different: number;
    localOnly: number;
    serverOnly: number;
  };
  checkedAt: string;
}

/** Stable, key-sorted JSON serialization — order-independent comparison. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys
      .map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Canonical form of a LOCAL resume document for parity comparison. */
export function canonicalizeLocal(local: LocalResumeSnapshot): string {
  try {
    const doc = ResumePayloadSchema.parse({
      ...local.document,
      styleConfigs: local.styleConfig
        ? { [local.resumeId]: local.styleConfig }
        : {},
    });
    return stableStringify(doc);
  } catch {
    // Fail safe: never classify an unexpected document as IDENTICAL.
    return stableStringify({ __canonical_error__: true, raw: local.document });
  }
}

/** Canonical form of a SERVER resume payload for parity comparison. */
export function canonicalizeServer(server: ServerResumeRecord): string {
  try {
    const doc = ResumePayloadSchema.parse({
      ...server.resume,
      // Relational columns are authoritative; sync them before comparing so the
      // two representations can never diverge (ADR-003 §Payload contract).
      templateId: server.templateId,
      careerStage: server.careerStage,
    });
    return stableStringify(doc);
  } catch {
    return stableStringify({ __canonical_error__: true, raw: server.resume });
  }
}

/**
 * Classify the full multi-resume set: every resumeId present locally, on the
 * server, or both gets exactly one entry. Results are sorted by resumeId for
 * determinism. No mutation, no upload, no overwrite — classification only.
 */
export function computeParity(
  localResumes: LocalResumeSnapshot[],
  serverResumes: ServerResumeRecord[],
  checkedAt = new Date().toISOString(),
): ParityReport {
  const localByResumeId = new Map(localResumes.map((l) => [l.resumeId, l]));
  const serverByResumeId = new Map(serverResumes.map((s) => [s.resumeId, s]));
  const allIds = new Set([
    ...localByResumeId.keys(),
    ...serverByResumeId.keys(),
  ]);

  const entries: ResumeParityEntry[] = [];
  for (const resumeId of [...allIds].sort()) {
    const local = localByResumeId.get(resumeId);
    const server = serverByResumeId.get(resumeId);

    if (!local) {
      // SERVER_ONLY — must NOT appear in the UI; awaits a reconciliation phase.
      entries.push({
        resumeId,
        status: "SERVER_ONLY",
        localExists: false,
        serverExists: true,
        serverUpdatedAt: server!.updatedAt,
      });
      continue;
    }
    if (!server) {
      // LOCAL_ONLY — must NOT be uploaded automatically (safest condition).
      entries.push({ resumeId, status: "LOCAL_ONLY", localExists: true, serverExists: false });
      continue;
    }

    const identical =
      (local.resumeName ?? "") === (server.resumeName ?? "") &&
      local.templateId === server.templateId &&
      local.careerStage === server.careerStage &&
      canonicalizeLocal(local) === canonicalizeServer(server);

    entries.push({
      resumeId,
      status: identical ? "IDENTICAL" : "DIFFERENT",
      localExists: true,
      serverExists: true,
      serverUpdatedAt: server.updatedAt,
    });
  }

  const summary = { identical: 0, different: 0, localOnly: 0, serverOnly: 0 };
  for (const e of entries) {
    if (e.status === "IDENTICAL") summary.identical += 1;
    else if (e.status === "DIFFERENT") summary.different += 1;
    else if (e.status === "LOCAL_ONLY") summary.localOnly += 1;
    else summary.serverOnly += 1;
  }

  return { entries, summary, checkedAt };
}
