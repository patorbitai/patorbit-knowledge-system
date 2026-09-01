"use strict";

import { prisma } from "@/lib/prisma";
import type { Prisma, Resume } from "@prisma/client";

/** Prisma row alias — avoids colliding with the domain `Resume` type. */
export type ResumeRecord = Resume;

/**
 * ResumeRepository — persistence operations for the canonical server-side Resume.
 *
 * Phase 0 (ADR-003): the table exists but is NOT yet connected to Zustand or the
 * UI. Every operation is scoped through the authenticated ProfessionalIdentity —
 * callers must never pass a raw row id from the client as authority.
 *
 * The Prisma row type is aliased as `ResumeRecord` to avoid colliding with the
 * domain `Resume` type in `@/types/resume`.
 */

export interface ResumeCreateInput {
  id: string;
  resumeId: string;
  professionalIdentityId: string;
  resumeName: string;
  templateId: string;
  careerStage: string;
  payload: Prisma.InputJsonValue;
}

export const resumeRepository = {
  /** Find every resume owned by one ProfessionalIdentity. */
  async findAllByProfessionalIdentity(
    professionalIdentityId: string,
  ): Promise<ResumeRecord[]> {
    return prisma.resume.findMany({
      where: { professionalIdentityId },
      orderBy: { updatedAt: "desc" },
    });
  },

  /** Find one resume scoped to its owner identity. */
  async findByResumeIdAndIdentity(
    resumeId: string,
    professionalIdentityId: string,
  ): Promise<ResumeRecord | null> {
    return prisma.resume.findUnique({
      where: {
        professionalIdentityId_resumeId: { professionalIdentityId, resumeId },
      },
    });
  },

  /** Create a resume row. */
  async create(data: ResumeCreateInput): Promise<ResumeRecord> {
    return prisma.resume.create({ data });
  },

  /**
   * C16 — Upsert a resume row by resumeId + professionalIdentityId.
   * If a row with the same resumeId already exists, return it unchanged.
   * This prevents duplicate resumeId errors from concurrent POST requests.
   */
  async upsert(
    resumeId: string,
    professionalIdentityId: string,
    createData: ResumeCreateInput,
  ): Promise<ResumeRecord> {
    const existing = await this.findByResumeIdAndIdentity(resumeId, professionalIdentityId);
    if (existing) return existing;
    try {
      return await prisma.resume.create({ data: createData });
    } catch (err: unknown) {
      // Concurrent duplicate — return the existing row
      const errCode = (err as { code?: string })?.code;
      const errMsg = (err as { message?: string })?.message ?? "";
      const isP2002 = errCode === "P2002" || errMsg.includes("Unique constraint") || errMsg.includes("unique constraint");
      if (isP2002) {
        const afterRace = await this.findByResumeIdAndIdentity(resumeId, professionalIdentityId);
        if (afterRace) return afterRace;
      }
      throw err;
    }
  },

  /**
   * Update an existing resume row (scoped to its owner identity).
   * C6: If `baseVersion` is provided, the update is conditional on the
   * current version matching. Returns null when the version is stale
   * (0 rows affected) so the service layer can throw ResumeConflictError.
   */
  async update(
    resumeId: string,
    professionalIdentityId: string,
    data: {
      resumeName?: string;
      templateId?: string;
      careerStage?: string;
      payload?: Prisma.InputJsonValue;
      version?: number;
      baseVersion?: number;
    },
  ): Promise<ResumeRecord | null> {
    const existing = await this.findByResumeIdAndIdentity(
      resumeId,
      professionalIdentityId,
    );
    if (!existing) {
      return null;
    }

    // Atomic conditional update: only update if version matches
    if (data.baseVersion !== undefined) {
      const result = await prisma.resume.updateMany({
        where: {
          id: existing.id,
          version: data.baseVersion,
        },
        data: {
          resumeName: data.resumeName,
          templateId: data.templateId,
          careerStage: data.careerStage,
          payload: data.payload,
          version: data.baseVersion + 1,
        },
      });

      if (result.count === 0) {
        // Version mismatch — stale update
        return null;
      }

      // Return the updated record
      return this.findByResumeIdAndIdentity(resumeId, professionalIdentityId);
    }

    // No baseVersion — legacy non-atomic update (backward compat)
    return prisma.resume.update({
      where: { id: existing.id },
      data: {
        resumeName: data.resumeName,
        templateId: data.templateId,
        careerStage: data.careerStage,
        payload: data.payload,
        version: data.version,
      },
    });
  },

  /** Delete a resume row (scoped to its owner identity). Returns true when deleted. */
  async deleteByResumeIdAndIdentity(
    resumeId: string,
    professionalIdentityId: string,
  ): Promise<boolean> {
    const existing = await this.findByResumeIdAndIdentity(
      resumeId,
      professionalIdentityId,
    );
    if (!existing) {
      return false;
    }
    await prisma.resume.delete({ where: { id: existing.id } });
    return true;
  },
};
