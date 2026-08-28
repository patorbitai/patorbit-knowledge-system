"use client";

/**
 * Client helper for the authenticated Resume API (Phase 1A, ADR-004).
 *
 * Read-only: it only calls GET /api/resumes. It NEVER writes to the store and
 * never mutates anything — the result is a SERVER_SNAPSHOT, not UI state.
 *
 * The response type mirrors the server DTO (`ServerResume`) without importing
 * the server service (which pulls in Prisma and is not client-safe).
 */

export interface ServerResumeRecord {
  resumeId: string;
  resumeName: string;
  templateId: string;
  careerStage: string;
  /** The canonical resume document (payload). */
  resume: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export class ResumeServerClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ResumeServerClientError";
    this.status = status;
  }
}

/**
 * Fetch the authenticated user's server resumes.
 *
 * Fail-closed: any non-2xx response or network failure throws; callers must
 * catch and continue with the local state untouched.
 */
export async function fetchServerResumes(
  signal?: AbortSignal,
): Promise<ServerResumeRecord[]> {
  const res = await fetch("/api/resumes", { cache: "no-store", signal });

  if (res.status === 401) {
    throw new ResumeServerClientError("Unauthorized", 401);
  }
  if (!res.ok) {
    throw new ResumeServerClientError(
      `Failed to load server resumes (${res.status})`,
      res.status,
    );
  }

  const body = (await res.json()) as { resumes?: unknown };
  if (!Array.isArray(body?.resumes)) {
    return [];
  }
  return body.resumes as ServerResumeRecord[];
}
