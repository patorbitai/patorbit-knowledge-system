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

  /** Update an existing resume row (scoped to its owner identity). */
  async update(
    resumeId: string,
    professionalIdentityId: string,
    data: {
      resumeName?: string;
      templateId?: string;
      careerStage?: string;
      payload?: Prisma.InputJsonValue;
      version?: number;
    },
  ): Promise<ResumeRecord | null> {
    const existing = await this.findByResumeIdAndIdentity(
      resumeId,
      professionalIdentityId,
    );
    if (!existing) {
      return null;
    }
    return prisma.resume.update({
      where: { id: existing.id },
      data,
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
