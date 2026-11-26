"use strict";

import { prisma } from "@/lib/prisma";
import {
  interviewRoundCreateSchema,
  interviewRoundUpdateSchema,
  type InterviewRoundCreateInput,
} from "@/lib/interview/schemas";
import { InterviewNotFoundError } from "./interview-profile.service";

export interface InterviewRoundData {
  id: string;
  interviewProfileId: string;
  order: number;
  roundName: string;
  roundType: string;
  interviewDate: string | null;
  timezone: string;
  durationMinutes: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  sessionCount: number;
  completedSessions: number;
}

type RoundRow = {
  id: string;
  interviewProfileId: string;
  order: number;
  roundName: string;
  roundType: string;
  interviewDate: Date | null;
  timezone: string;
  durationMinutes: number | null;
  status: string;
  notes: string | null;
  createdAt: Date;
};

/**
 * InterviewRoundService — rounds belong to a profile and are never rewritten.
 * Adding a new round appends; completed rounds keep their history.
 */
export class InterviewRoundService {
  async list(professionalIdentityId: string, profileId: string): Promise<InterviewRoundData[]> {
    const profile = await prisma.interviewProfile.findFirst({
      where: { id: profileId, professionalIdentityId },
      select: { id: true },
    });
    if (!profile) throw new InterviewNotFoundError("Interview profile not found.");

    const rounds = await prisma.interviewRound.findMany({
      where: { interviewProfileId: profileId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { sessions: { select: { status: true } } },
    });

    return rounds.map((round) => ({
      id: round.id,
      interviewProfileId: round.interviewProfileId,
      order: round.order,
      roundName: round.roundName,
      roundType: round.roundType,
      interviewDate: round.interviewDate?.toISOString() ?? null,
      timezone: round.timezone,
      durationMinutes: round.durationMinutes,
      status: round.status,
      notes: round.notes,
      createdAt: round.createdAt.toISOString(),
      sessionCount: round.sessions.length,
      completedSessions: round.sessions.filter((session) => session.status === "completed").length,
    }));
  }

  async create(
    professionalIdentityId: string,
    profileId: string,
    input: InterviewRoundCreateInput,
  ): Promise<InterviewRoundData> {
    const profile = await prisma.interviewProfile.findFirst({
      where: { id: profileId, professionalIdentityId },
      select: { id: true, applicationId: true },
    });
    if (!profile) throw new InterviewNotFoundError("Interview profile not found.");

    const parsed = interviewRoundCreateSchema.parse(input);

    const last = await prisma.interviewRound.findFirst({
      where: { interviewProfileId: profileId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const created = await prisma.interviewRound.create({
      data: {
        interviewProfileId: profileId,
        order: (last?.order ?? 0) + 1,
        roundName: parsed.roundName,
        roundType: parsed.roundType,
        interviewDate: parsed.interviewDate ? new Date(parsed.interviewDate) : null,
        timezone: parsed.timezone,
        durationMinutes: parsed.durationMinutes ?? null,
        status: parsed.status,
        notes: parsed.notes ?? null,
      },
    });

    if (profile.applicationId) {
      try {
        const event = await prisma.applicationEvent.create({
          data: {
            applicationId: profile.applicationId,
            professionalIdentityId,
            eventType: "interview_scheduled",
            interviewStage: "technical",
            interviewType: "video",
            interviewDate: created.interviewDate,
            notes: `${created.roundName} (${created.roundType})`,
            metadata: { source: "interview_preparation", roundId: created.id },
          },
        });
        await prisma.interviewRound.update({
          where: { id: created.id },
          data: { applicationEventId: event.id },
        });
      } catch (err) {
        console.error("[interview-round] could not record application event", err);
      }
    }

    return {
      id: created.id,
      interviewProfileId: created.interviewProfileId,
      order: created.order,
      roundName: created.roundName,
      roundType: created.roundType,
      interviewDate: created.interviewDate?.toISOString() ?? null,
      timezone: created.timezone,
      durationMinutes: created.durationMinutes,
      status: created.status,
      notes: created.notes,
      createdAt: created.createdAt.toISOString(),
      sessionCount: 0,
      completedSessions: 0,
    };
  }

  async update(
    professionalIdentityId: string,
    roundId: string,
    input: unknown,
  ): Promise<InterviewRoundData> {
    const round = await this.findOwnedRound(professionalIdentityId, roundId);
    const parsed = interviewRoundUpdateSchema.parse(input);

    const updated = await prisma.interviewRound.update({
      where: { id: round.id },
      data: {
        ...(parsed.roundName !== undefined ? { roundName: parsed.roundName } : {}),
        ...(parsed.roundType !== undefined ? { roundType: parsed.roundType } : {}),
        ...(parsed.interviewDate !== undefined
          ? { interviewDate: parsed.interviewDate ? new Date(parsed.interviewDate) : null }
          : {}),
        ...(parsed.timezone !== undefined ? { timezone: parsed.timezone } : {}),
        ...(parsed.durationMinutes !== undefined ? { durationMinutes: parsed.durationMinutes ?? null } : {}),
        ...(parsed.status !== undefined ? { status: parsed.status } : {}),
        ...(parsed.notes !== undefined ? { notes: parsed.notes ?? null } : {}),
      },
    });

    const sessions = await prisma.practiceSession.findMany({
      where: { roundId: round.id },
      select: { status: true },
    });

    return {
      id: updated.id,
      interviewProfileId: updated.interviewProfileId,
      order: updated.order,
      roundName: updated.roundName,
      roundType: updated.roundType,
      interviewDate: updated.interviewDate?.toISOString() ?? null,
      timezone: updated.timezone,
      durationMinutes: updated.durationMinutes,
      status: updated.status,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      sessionCount: sessions.length,
      completedSessions: sessions.filter((session) => session.status === "completed").length,
    };
  }

  async remove(professionalIdentityId: string, roundId: string): Promise<void> {
    const round = await this.findOwnedRound(professionalIdentityId, roundId);
    const remaining = await prisma.interviewRound.count({
      where: { interviewProfileId: round.interviewProfileId },
    });
    if (remaining <= 1) {
      throw new Error("A profile must keep at least one interview round.");
    }
    await prisma.interviewRound.delete({ where: { id: round.id } });
  }

  private async findOwnedRound(professionalIdentityId: string, roundId: string): Promise<RoundRow> {
    const round = await prisma.interviewRound.findFirst({
      where: {
        id: roundId,
        interviewProfile: { professionalIdentityId },
      },
    });
    if (!round) throw new InterviewNotFoundError("Interview round not found.");
    return round as RoundRow;
  }
}

export const interviewRoundService = new InterviewRoundService();
