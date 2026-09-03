"use strict";

import { TEMPLATES } from "@/app/resume-builder/templates";
import {
  ResumePayloadSchema,
  type ResumePayload,
} from "@/utils/resume-payload-schema";
import {
  resumeRepository,
  type ResumeRecord,
} from "@/repositories/resume.repository";
import type { Prisma } from "@prisma/client";

/**
 * ResumeService — server-side Resume operations (Phase 0, ADR-003).
 *
 * Phase 0 is the server FOUNDATION ONLY: the API is safe and tested but is NOT
 * the source of truth yet. The client (Zustand + localStorage) is untouched and
 * remains authoritative from the UI perspective until later phases.
 *
 * Responsibilities (and nothing more):
 *  - validate the resume document with the existing ResumeSchema (+ optional
 *    styleConfigs) — no second, incompatible schema
 *  - enforce the stable resumeId
 *  - enforce ProfessionalIdentity ownership; never allow cross-user access
 *  - idempotent create/update by resumeId
 *  - return the canonical server representation
 *
 * Claims/evidence/trust/passport business logic deliberately does NOT live here.
 */

/** IDs of the 29 real resume templates (registry copy — templates.ts untouched). */
const KNOWN_TEMPLATE_IDS = new Set(TEMPLATES.map((t) => t.id));

// `ResumePayloadSchema` / `ResumePayload` are imported from
// `@/utils/resume-payload-schema` (client-safe, shared with the parity engine).

/** Canonical server representation returned by the API. */
export interface ServerResume {
  resumeId: string;
  resumeName: string;
  templateId: string;
  careerStage: string;
  resume: ResumePayload;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveResumeInput {
  /** Stable public/domain ID — required, never reassigned. */
  resumeId: string;
  resumeName?: string;
  templateId?: string;
  careerStage?: string;
  /** The resume document (ResumeSchema shape + optional styleConfigs). */
  resume?: unknown;
  /** Client's known version — for optimistic locking on update. */
  baseVersion?: number;
}

/** Validation failure → HTTP 400. */
export class ResumeValidationError extends Error {}

/** Scoped row missing → HTTP 404 (never reveals another user's resume). */
export class ResumeNotFoundError extends Error {}

/** Version conflict → HTTP 409 (client's baseVersion is stale). */
export class ResumeConflictError extends Error {
  constructor(public readonly currentVersion: number) {
    super("Resume was modified on the server");
    this.name = "ResumeConflictError";
  }
}

// ResumeIdConflictError is re-exported from repository
import { ResumeIdConflictError } from "@/repositories/resume.repository";
export { ResumeIdConflictError };

export class ResumeService {
  /** Validate an unknown resume document against the canonical payload schema. */
  validatePayload(data: unknown): ResumePayload {
    const result = ResumePayloadSchema.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      throw new ResumeValidationError(
        `Invalid resume payload:\n${issues.join("\n")}`,
      );
    }
    return result.data;
  }

  private assertTemplateId(templateId: string): string {
    if (!KNOWN_TEMPLATE_IDS.has(templateId)) {
      throw new ResumeValidationError(`Unknown templateId: ${templateId}`);
    }
    return templateId;
  }

  /** Convert a Prisma row into the canonical server representation. */
  private toServerResume(record: ResumeRecord): ServerResume {
    const payload = this.validatePayload(record.payload);
    return {
      resumeId: record.resumeId,
      resumeName: record.resumeName,
      templateId: record.templateId,
      careerStage: record.careerStage,
      // Relational columns are authoritative; sync them into the payload so the
      // two representations can never diverge (ADR-003 §Payload contract). The
      // column value was validated against the schema enum at write time.
      resume: {
        ...payload,
        templateId: record.templateId,
        careerStage: record.careerStage as ResumePayload["careerStage"],
      },
      version: record.version,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /**
   * Build the normalized save data. `templateId` and `careerStage` columns are
   * authoritative: any conflicting payload values are overridden.
   */
  private buildSaveData(input: SaveResumeInput) {
    const resumeId =
      typeof input.resumeId === "string" ? input.resumeId.trim() : "";
    if (!resumeId) {
      throw new ResumeValidationError("resumeId is required");
    }
    if (input.resume === undefined || input.resume === null) {
      throw new ResumeValidationError("resume payload is required");
    }
    const rawTemplateId =
      input.templateId ?? (input.resume as { templateId?: unknown })?.templateId;
    if (typeof rawTemplateId !== "string" || !rawTemplateId) {
      throw new ResumeValidationError("templateId is required");
    }
    const templateId = this.assertTemplateId(rawTemplateId);
    const careerStage =
      input.careerStage ?? (input.resume as { careerStage?: unknown })?.careerStage;
    // Validating `{ ...resume, templateId, careerStage }` validates the payload
    // AND the overlaid authoritative metadata values in one pass.
    const payload = this.validatePayload({
      ...(input.resume as object),
      templateId,
      careerStage,
    });
    // The validated payload is the authoritative string value.
    const resolvedCareerStage = payload.careerStage;
    const resumeName =
      input.resumeName !== undefined
        ? input.resumeName
        : payload.name?.trim()
          ? payload.name
          : "Untitled Resume";
    return {
      resumeId,
      resumeName,
      templateId,
      careerStage: resolvedCareerStage,
      payload,
    };
  }

  /** List all resumes owned by one ProfessionalIdentity. */
  async list(professionalIdentityId: string): Promise<ServerResume[]> {
    const records =
      await resumeRepository.findAllByProfessionalIdentity(
        professionalIdentityId,
      );
    return records.map((r) => this.toServerResume(r));
  }

  /** Get one resume, scoped to its owner identity (404 when missing/foreign). */
  async get(
    professionalIdentityId: string,
    resumeId: string,
  ): Promise<ServerResume> {
    const record = await resumeRepository.findByResumeIdAndIdentity(
      resumeId,
      professionalIdentityId,
    );
    if (!record) {
      throw new ResumeNotFoundError();
    }
    return this.toServerResume(record);
  }

  /**
   * Create a resume, idempotently by resumeId: if the resumeId already exists
   * for this identity, the existing row is returned unchanged.
   */
  async create(
    professionalIdentityId: string,
    input: SaveResumeInput,
  ): Promise<ServerResume> {
    const data = this.buildSaveData(input);

    const existing = await resumeRepository.findByResumeIdAndIdentity(
      data.resumeId,
      professionalIdentityId,
    );
    if (existing) {
      return this.toServerResume(existing);
    }

    try {
      const record = await resumeRepository.upsert(
        data.resumeId,
        professionalIdentityId,
        {
          id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          resumeId: data.resumeId,
          professionalIdentityId,
          resumeName: data.resumeName,
          templateId: data.templateId,
          careerStage: data.careerStage,
          payload: data.payload as Prisma.InputJsonValue,
        },
      );
      return this.toServerResume(record);
    } catch (err: unknown) {
      // C16: Robust duplicate detection — check both error code and message
      // because Turbopack/Next.js may wrap Prisma errors differently.
      const errCode = (err as { code?: string })?.code;
      const errMsg = (err as { message?: string })?.message ?? "";
      const isP2002 = errCode === "P2002" || errMsg.includes("Unique constraint") || errMsg.includes("unique constraint");
      if (isP2002) {
        const existingAfterRace =
          await resumeRepository.findByResumeIdAndIdentity(
            data.resumeId,
            professionalIdentityId,
          );
        if (existingAfterRace) {
          return this.toServerResume(existingAfterRace);
        }
      }
      throw err;
    }
  }

  /**
   * Update a resume (merge semantics — only provided fields change). Scoped to
   * the owner identity; missing/foreign rows throw ResumeNotFoundError.
   *
   * Optimistic locking (C5): if `baseVersion` is provided, the update is
   * conditional on the database version matching. A mismatch returns
   * ResumeConflictError so the caller knows the client is stale.
   */
  async update(
    professionalIdentityId: string,
    resumeId: string,
    input: Partial<SaveResumeInput>,
  ): Promise<ServerResume> {
    const existing = await resumeRepository.findByResumeIdAndIdentity(
      resumeId,
      professionalIdentityId,
    );
    if (!existing) {
      throw new ResumeNotFoundError();
    }

    const templateId =
      input.templateId !== undefined
        ? this.assertTemplateId(input.templateId)
        : existing.templateId;
    const careerStage = input.careerStage ?? existing.careerStage;
    const basePayload =
      input.resume !== undefined ? (input.resume as object) : (existing.payload as object);
    const payload = this.validatePayload({
      ...basePayload,
      templateId,
      careerStage,
    });
    const resumeName = input.resumeName ?? existing.resumeName;

    const record = await resumeRepository.update(
      resumeId,
      professionalIdentityId,
      {
        resumeName,
        templateId,
        careerStage,
        payload: payload as Prisma.InputJsonValue,
        version: existing.version + 1,
        baseVersion: input.baseVersion,
      },
    );
    if (!record) {
      // Atomic update returned null — version was stale (race condition)
      if (input.baseVersion !== undefined) {
        // Re-read to get current version for the conflict response
        const current = await resumeRepository.findByResumeIdAndIdentity(
          resumeId,
          professionalIdentityId,
        );
        throw new ResumeConflictError(current?.version ?? existing.version);
      }
      throw new ResumeNotFoundError();
    }
    return this.toServerResume(record);
  }

  /** Delete one resume, scoped to its owner identity. */
  async delete(
    professionalIdentityId: string,
    resumeId: string,
  ): Promise<boolean> {
    const deleted = await resumeRepository.deleteByResumeIdAndIdentity(
      resumeId,
      professionalIdentityId,
    );
    if (!deleted) {
      throw new ResumeNotFoundError();
    }
    return true;
  }

  /** Enable public sharing for a resume. Returns the share info. */
  async enableShare(
    professionalIdentityId: string,
    resumeId: string,
  ): Promise<{ shareEnabled: boolean; shareToken: string; shareUrl: string }> {
    const existing = await resumeRepository.findByResumeIdAndIdentity(resumeId, professionalIdentityId);
    if (!existing) throw new ResumeNotFoundError();

    // If already shared with a valid token, return existing
    if (existing.shareEnabled && existing.shareToken) {
      return {
        shareEnabled: true,
        shareToken: existing.shareToken,
        shareUrl: `/resume/share/${existing.shareToken}`,
      };
    }

    // Generate a cryptographically random share token
    const { randomBytes } = await import("crypto");
    const shareToken = randomBytes(32).toString("hex");

    const record = await resumeRepository.enableShare(resumeId, professionalIdentityId, shareToken);
    if (!record) throw new ResumeNotFoundError();

    return {
      shareEnabled: true,
      shareToken,
      shareUrl: `/resume/share/${shareToken}`,
    };
  }

  /** Disable public sharing for a resume. */
  async disableShare(
    professionalIdentityId: string,
    resumeId: string,
  ): Promise<{ shareEnabled: boolean }> {
    const existing = await resumeRepository.findByResumeIdAndIdentity(resumeId, professionalIdentityId);
    if (!existing) throw new ResumeNotFoundError();

    await resumeRepository.disableShare(resumeId, professionalIdentityId);
    return { shareEnabled: false };
  }

  /** Get current share status for a resume. */
  async getShareStatus(
    professionalIdentityId: string,
    resumeId: string,
  ): Promise<{ shareEnabled: boolean; shareToken: string | null; shareUrl: string | null }> {
    const existing = await resumeRepository.findByResumeIdAndIdentity(resumeId, professionalIdentityId);
    if (!existing) throw new ResumeNotFoundError();

    return {
      shareEnabled: existing.shareEnabled,
      shareToken: existing.shareToken,
      shareUrl: existing.shareToken ? `/resume/share/${existing.shareToken}` : null,
    };
  }

  /** Public lookup — find a resume by share token (no auth). */
  async getSharedResume(
    shareToken: string,
  ): Promise<ServerResume | null> {
    const record = await resumeRepository.findByShareToken(shareToken);
    if (!record || !record.shareEnabled) return null;
    return this.toServerResume(record);
  }
}

export const resumeService = new ResumeService();
