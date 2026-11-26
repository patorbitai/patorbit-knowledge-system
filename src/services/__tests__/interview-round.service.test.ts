import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  profileFindFirst: vi.fn(),
  roundFindFirst: vi.fn(),
  roundFindMany: vi.fn(),
  roundCreate: vi.fn(),
  roundUpdate: vi.fn(),
  roundDelete: vi.fn(),
  roundCount: vi.fn(),
  sessionFindMany: vi.fn(),
  eventCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    interviewProfile: { findFirst: mocks.profileFindFirst },
    interviewRound: {
      findFirst: mocks.roundFindFirst,
      findMany: mocks.roundFindMany,
      create: mocks.roundCreate,
      update: mocks.roundUpdate,
      delete: mocks.roundDelete,
      count: mocks.roundCount,
    },
    practiceSession: { findMany: mocks.sessionFindMany },
    applicationEvent: { create: mocks.eventCreate },
  },
}));

import { interviewRoundService } from "@/services/interview-round.service";
import { InterviewNotFoundError } from "@/services/interview-profile.service";

const IDENTITY = "identity-a";

function roundRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "round-2",
    interviewProfileId: "profile-1",
    order: 2,
    roundName: "Round 2",
    roundType: "technical_interview",
    interviewDate: new Date("2026-12-05T10:00:00.000Z"),
    timezone: "UTC",
    durationMinutes: 60,
    status: "scheduled",
    notes: null,
    createdAt: new Date("2026-11-24T10:00:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.profileFindFirst.mockResolvedValue({ id: "profile-1", applicationId: null });
  mocks.roundFindFirst.mockResolvedValue({ order: 1 });
  mocks.roundCreate.mockResolvedValue(roundRow());
  mocks.roundUpdate.mockResolvedValue(roundRow());
  mocks.sessionFindMany.mockResolvedValue([]);
  mocks.eventCreate.mockResolvedValue({ id: "event-9" });
});

describe("multiple interview rounds", () => {
  it("appends the next round instead of overwriting earlier ones", async () => {
    const round = await interviewRoundService.create(IDENTITY, "profile-1", {
      roundName: "Round 2",
      roundType: "technical_interview",
    });

    expect(mocks.roundCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ order: 2, roundName: "Round 2", status: "scheduled" }),
    });
    expect(round.order).toBe(2);
  });

  it("scopes the profile lookup to the caller", async () => {
    await interviewRoundService.create(IDENTITY, "profile-1", {
      roundName: "Round 2",
      roundType: "technical_interview",
    });

    expect(mocks.profileFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "profile-1", professionalIdentityId: IDENTITY } }),
    );
  });

  it("refuses to add a round to another user's profile", async () => {
    mocks.profileFindFirst.mockResolvedValue(null);

    await expect(
      interviewRoundService.create(IDENTITY, "profile-other", {
        roundName: "Round 2",
        roundType: "technical_interview",
      }),
    ).rejects.toBeInstanceOf(InterviewNotFoundError);
    expect(mocks.roundCreate).not.toHaveBeenCalled();
  });

  it("mirrors the scheduled date into the linked application's events", async () => {
    mocks.profileFindFirst.mockResolvedValue({ id: "profile-1", applicationId: "app-1" });

    await interviewRoundService.create(IDENTITY, "profile-1", {
      roundName: "System design",
      roundType: "system_design",
      interviewDate: "2026-12-05T10:00:00.000Z",
    });

    expect(mocks.eventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: "app-1",
        professionalIdentityId: IDENTITY,
        eventType: "interview_scheduled",
        interviewDate: new Date("2026-12-05T10:00:00.000Z"),
      }),
    });
  });

  it("still creates the round when the application event cannot be written", async () => {
    mocks.profileFindFirst.mockResolvedValue({ id: "profile-1", applicationId: "app-1" });
    mocks.eventCreate.mockRejectedValue(new Error("db down"));

    const round = await interviewRoundService.create(IDENTITY, "profile-1", {
      roundName: "Round 3",
      roundType: "hr",
    });

    expect(round.id).toBe("round-2");
  });
});

describe("round ownership", () => {
  it("refuses to delete a round that is not the caller's", async () => {
    mocks.roundFindFirst.mockResolvedValue(null);

    await expect(interviewRoundService.remove(IDENTITY, "round-other")).rejects.toBeInstanceOf(
      InterviewNotFoundError,
    );
    expect(mocks.roundDelete).not.toHaveBeenCalled();
  });

  it("deletes only the caller's round", async () => {
    mocks.roundFindFirst.mockResolvedValue(roundRow());
    mocks.roundCount.mockResolvedValue(2);

    await interviewRoundService.remove(IDENTITY, "round-2");

    expect(mocks.roundDelete).toHaveBeenCalledWith({ where: { id: "round-2" } });
  });

  it("keeps at least one round on a profile", async () => {
    mocks.roundFindFirst.mockResolvedValue(roundRow());
    mocks.roundCount.mockResolvedValue(1);

    await expect(interviewRoundService.remove(IDENTITY, "round-2")).rejects.toThrow(
      /at least one interview round/i,
    );
    expect(mocks.roundDelete).not.toHaveBeenCalled();
  });
});
