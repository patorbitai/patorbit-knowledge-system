"use strict";

import { prisma } from "@/lib/prisma";
import {
  interviewProfileCreateSchema,
  interviewProfileUpdateSchema,
  type InterviewProfileCreateInput,
  type InterviewProfileUpdateInput,
} from "@/lib/interview/schemas";
import { isTechnicalInterviewType } from "@/lib/interview/constants";

/** Domain error → HTTP 400. */
export class InterviewValidationError extends Error {}
/** Scoped record missing → HTTP 404. */
export class InterviewNotFoundError extends Error {}

export interface InterviewProfileData {
  id: string;
  applicationId: string | null;
  companyName: string;
  jobTitle: string;
  experienceYears: number | null;
  jobDescription: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  seniority: string | null;
  interviewDate: string | null;
  timezone: string;
  durationMinutes: number | null;
  interviewRound: string | null;
  interviewFormat: string | null;
  interviewType: string;
  notes: string | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  roundCount?: number;
  completedSessions?: number;
  latestScore?: number | null;
}

type ProfileRow = {
  id: string;
  applicationId: string | null;
  companyName: string;
  jobTitle: string;
  experienceYears: number | null;
  jobDescription: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  seniority: string | null;
  interviewDate: Date | null;
  timezone: string;
  durationMinutes: number | null;
  interviewRound: string | null;
  interviewFormat: string | null;
  interviewType: string;
  notes: string | null;
  status: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

function toData(row: ProfileRow): InterviewProfileData {
  return {
    id: row.id,
    applicationId: row.applicationId,
    companyName: row.companyName,
    jobTitle: row.jobTitle,
    experienceYears: row.experienceYears,
    jobDescription: row.jobDescription,
    requiredSkills: row.requiredSkills,
    preferredSkills: row.preferredSkills,
    seniority: row.seniority,
    interviewDate: row.interviewDate?.toISOString() ?? null,
    timezone: row.timezone,
    durationMinutes: row.durationMinutes,
    interviewRound: row.interviewRound,
    interviewFormat: row.interviewFormat,
    interviewType: row.interviewType,
    notes: row.notes,
    status: row.status,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * InterviewProfileService — ownership-scoped CRUD for interview profiles.
 *
 * Every method takes the caller's ProfessionalIdentity id; a profile id from a
 * different identity resolves to "not found" rather than leaking existence.
 */
export class InterviewProfileService {
  async list(professionalIdentityId: string, options?: { status?: string }): Promise<InterviewProfileData[]> {
    const rows = await prisma.interviewProfile.findMany({
      where: {
        professionalIdentityId,
        ...(options?.status ? { status: options.status } : {}),
      },
      orderBy: [{ interviewDate: "asc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { rounds: true, sessions: true } },
      },
    });

    const scores = await prisma.practiceSession.findMany({
      where: {
        interviewProfileId: { in: rows.map((row) => row.id) },
        status: "completed",
        overallScore: { not: null },
      },
      select: { interviewProfileId: true, overallScore: true },
    });

    const scoreByProfile = new Map<string, { total: number; count: number; latest: number }>();
    for (const score of scores) {
      const entry = scoreByProfile.get(score.interviewProfileId) ?? { total: 0, count: 0, latest: 0 };
      entry.total += score.overallScore ?? 0;
      entry.count += 1;
      entry.latest = Math.round(entry.total / entry.count);
      scoreByProfile.set(score.interviewProfileId, entry);
    }

    return rows.map((row) => ({
      ...toData(row as ProfileRow),
      roundCount: row._count.rounds,
      completedSessions: row._count.sessions,
      latestScore: scoreByProfile.get(row.id)?.latest ?? null,
    }));
  }

  async get(professionalIdentityId: string, profileId: string): Promise<InterviewProfileData> {
    const row = await prisma.interviewProfile.findFirst({
      where: { id: profileId, professionalIdentityId },
    });
    if (!row) throw new InterviewNotFoundError("Interview profile not found.");
    return toData(row as ProfileRow);
  }

  async create(
    professionalIdentityId: string,
    input: InterviewProfileCreateInput,
  ): Promise<InterviewProfileData> {
    const parsed = interviewProfileCreateSchema.parse(input);

    if (parsed.applicationId) {
      const application = await prisma.jobApplication.findFirst({
        where: { applicationId: parsed.applicationId, professionalIdentityId },
        select: { applicationId: true },
      });
      if (!application) {
        throw new InterviewValidationError("That job application was not found in your workspace.");
      }
    }

    const created = await prisma.interviewProfile.create({
      data: {
        professionalIdentityId,
        applicationId: parsed.applicationId ?? null,
        companyName: parsed.companyName,
        jobTitle: parsed.jobTitle,
        experienceYears: parsed.experienceYears ?? null,
        jobDescription: parsed.jobDescription ?? null,
        requiredSkills: parsed.requiredSkills,
        preferredSkills: parsed.preferredSkills,
        seniority: parsed.seniority ?? null,
        interviewDate: parsed.interviewDate ? new Date(parsed.interviewDate) : null,
        timezone: parsed.timezone,
        durationMinutes: parsed.durationMinutes ?? null,
        interviewRound: parsed.interviewRound ?? null,
        interviewFormat: parsed.interviewFormat ?? null,
        interviewType: parsed.interviewType,
        notes: parsed.notes ?? null,
        source: parsed.source,
      },
    });

    // Every profile starts with its first round so the timeline is never empty.
    await prisma.interviewRound.create({
      data: {
        interviewProfileId: created.id,
        order: 1,
        roundName: parsed.interviewRound?.trim() || "Round 1",
        roundType: parsed.interviewType,
        interviewDate: created.interviewDate,
        timezone: created.timezone,
        durationMinutes: created.durationMinutes,
        status: "scheduled",
      },
    });

    await this.recordApplicationEvent(professionalIdentityId, created.applicationId, created.interviewDate, {
      roundName: parsed.interviewRound?.trim() || "Round 1",
      interviewType: parsed.interviewType,
      technical: isTechnicalInterviewType(parsed.interviewType),
    });

    return toData(created as ProfileRow);
  }

  async update(
    professionalIdentityId: string,
    profileId: string,
    input: InterviewProfileUpdateInput,
  ): Promise<InterviewProfileData> {
    const existing = await prisma.interviewProfile.findFirst({
      where: { id: profileId, professionalIdentityId },
    });
    if (!existing) throw new InterviewNotFoundError("Interview profile not found.");

    const parsed = interviewProfileUpdateSchema.parse(input);

    if (parsed.applicationId) {
      const application = await prisma.jobApplication.findFirst({
        where: { applicationId: parsed.applicationId, professionalIdentityId },
        select: { applicationId: true },
      });
      if (!application) {
        throw new InterviewValidationError("That job application was not found in your workspace.");
      }
    }

    const updated = await prisma.interviewProfile.update({
      where: { id: existing.id },
      data: {
        ...(parsed.companyName !== undefined ? { companyName: parsed.companyName } : {}),
        ...(parsed.jobTitle !== undefined ? { jobTitle: parsed.jobTitle } : {}),
        ...(parsed.experienceYears !== undefined ? { experienceYears: parsed.experienceYears ?? null } : {}),
        ...(parsed.jobDescription !== undefined ? { jobDescription: parsed.jobDescription ?? null } : {}),
        ...(parsed.requiredSkills !== undefined ? { requiredSkills: parsed.requiredSkills } : {}),
        ...(parsed.preferredSkills !== undefined ? { preferredSkills: parsed.preferredSkills } : {}),
        ...(parsed.seniority !== undefined ? { seniority: parsed.seniority ?? null } : {}),
        ...(parsed.interviewDate !== undefined
          ? { interviewDate: parsed.interviewDate ? new Date(parsed.interviewDate) : null }
          : {}),
        ...(parsed.timezone !== undefined ? { timezone: parsed.timezone } : {}),
        ...(parsed.durationMinutes !== undefined ? { durationMinutes: parsed.durationMinutes ?? null } : {}),
        ...(parsed.interviewRound !== undefined ? { interviewRound: parsed.interviewRound ?? null } : {}),
        ...(parsed.interviewFormat !== undefined ? { interviewFormat: parsed.interviewFormat } : {}),
        ...(parsed.interviewType !== undefined ? { interviewType: parsed.interviewType } : {}),
        ...(parsed.notes !== undefined ? { notes: parsed.notes ?? null } : {}),
        ...(parsed.status !== undefined ? { status: parsed.status } : {}),
        ...(parsed.applicationId !== undefined ? { applicationId: parsed.applicationId ?? null } : {}),
      },
    });

    return toData(updated as ProfileRow);
  }

  async remove(professionalIdentityId: string, profileId: string): Promise<void> {
    const existing = await prisma.interviewProfile.findFirst({
      where: { id: profileId, professionalIdentityId },
      select: { id: true },
    });
    if (!existing) throw new InterviewNotFoundError("Interview profile not found.");
    await prisma.interviewProfile.delete({ where: { id: existing.id } });
  }

  /** Mirror a scheduled interview into the existing application timeline. */
  private async recordApplicationEvent(
    professionalIdentityId: string,
    applicationId: string | null,
    interviewDate: Date | null,
    meta: { roundName: string; interviewType: string; technical: boolean },
  ): Promise<void> {
    if (!applicationId) return;
    try {
      await prisma.applicationEvent.create({
        data: {
          applicationId,
          professionalIdentityId,
          eventType: "interview_scheduled",
          interviewStage: meta.technical ? "technical" : "behavioral",
          interviewType: "video",
          interviewDate: interviewDate ?? null,
          notes: `${meta.roundName} (${meta.interviewType})`,
          metadata: { source: "interview_preparation", roundName: meta.roundName },
        },
      });
    } catch (err) {
      // The application may have been deleted concurrently; the profile must
      // still be usable, so the timeline mirror is best-effort.
      console.error("[interview-profile] could not record application event", err);
    }
  }
}

export const interviewProfileService = new InterviewProfileService();
