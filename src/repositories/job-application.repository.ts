"use strict";

import { prisma } from "@/lib/prisma";
import type { JobApplication, Prisma } from "@prisma/client";

/** Prisma row type for JobApplication. */
export type JobApplicationRecord = JobApplication;

export interface JobApplicationCreateInput {
  id: string;
  applicationId: string;
  professionalIdentityId: string;
  title: string;
  companyName: string;
  jobDescription: string;
  status?: string;
  resumeId?: string | null;
  matchScore?: number | null;
}

/**
 * JobApplicationRepository — persistence operations for Job Applications.
 *
 * Every operation is scoped through the authenticated ProfessionalIdentity.
 * Callers must never pass a raw row id from the client as authority.
 */
export const jobApplicationRepository = {
  /** Find all applications owned by one ProfessionalIdentity. */
  async findAllByProfessionalIdentity(
    professionalIdentityId: string,
  ): Promise<JobApplicationRecord[]> {
    return prisma.jobApplication.findMany({
      where: { professionalIdentityId },
      orderBy: { updatedAt: "desc" },
    });
  },

  /** Find one application by applicationId, scoped to its owner identity. */
  async findByApplicationIdAndIdentity(
    applicationId: string,
    professionalIdentityId: string,
  ): Promise<JobApplicationRecord | null> {
    return prisma.jobApplication.findFirst({
      where: { applicationId, professionalIdentityId },
    });
  },

  /** Create a job application row. */
  async create(data: JobApplicationCreateInput): Promise<JobApplicationRecord> {
    return prisma.jobApplication.create({ data });
  },

  /** Update an existing job application row (scoped to its owner identity). */
  async update(
    applicationId: string,
    professionalIdentityId: string,
    data: {
      title?: string;
      companyName?: string;
      jobDescription?: string;
      status?: string;
      resumeId?: string | null;
      matchScore?: number | null;
    },
  ): Promise<JobApplicationRecord | null> {
    const existing = await this.findByApplicationIdAndIdentity(
      applicationId,
      professionalIdentityId,
    );
    if (!existing) return null;

    return prisma.jobApplication.update({
      where: { id: existing.id },
      data,
    });
  },

  /** Update match data separately (JSON field needs special handling). */
  async updateMatchData(
    applicationId: string,
    professionalIdentityId: string,
    matchScore: number,
    matchData: Record<string, unknown>,
  ): Promise<JobApplicationRecord | null> {
    const existing = await this.findByApplicationIdAndIdentity(
      applicationId,
      professionalIdentityId,
    );
    if (!existing) return null;

    return prisma.jobApplication.update({
      where: { id: existing.id },
      data: {
        matchScore,
        matchData: matchData as unknown as Prisma.InputJsonValue,
      },
    });
  },

  /** Delete a job application row (scoped to its owner identity). */
  async deleteByApplicationIdAndIdentity(
    applicationId: string,
    professionalIdentityId: string,
  ): Promise<boolean> {
    const existing = await this.findByApplicationIdAndIdentity(
      applicationId,
      professionalIdentityId,
    );
    if (!existing) return false;

    await prisma.jobApplication.delete({ where: { id: existing.id } });
    return true;
  },

  /** Count applications for an identity. */
  async countByProfessionalIdentity(
    professionalIdentityId: string,
  ): Promise<number> {
    return prisma.jobApplication.count({
      where: { professionalIdentityId },
    });
  },
};
