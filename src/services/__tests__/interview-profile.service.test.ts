import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  profileFindMany: vi.fn(),
  profileFindFirst: vi.fn(),
  profileCreate: vi.fn(),
  profileUpdate: vi.fn(),
  profileDelete: vi.fn(),
  roundCreate: vi.fn(),
  sessionFindMany: vi.fn(),
  applicationFindFirst: vi.fn(),
  eventCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    interviewProfile: {
      findMany: mocks.profileFindMany,
      findFirst: mocks.profileFindFirst,
      create: mocks.profileCreate,
      update: mocks.profileUpdate,
      delete: mocks.profileDelete,
    },
    interviewRound: { create: mocks.roundCreate },
    practiceSession: { findMany: mocks.sessionFindMany },
    jobApplication: { findFirst: mocks.applicationFindFirst },
    applicationEvent: { create: mocks.eventCreate },
  },
}));

import {
  interviewProfileService,
  InterviewNotFoundError,
  InterviewValidationError,
} from "@/services/interview-profile.service";

const IDENTITY = "identity-a";
const OTHER_IDENTITY = "identity-b";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "profile-1",
    professionalIdentityId: IDENTITY,
    applicationId: null,
    companyName: "Contoso",
    jobTitle: "Senior Data Engineer",
    experienceYears: 6,
    jobDescription: "Build pipelines",
    requiredSkills: ["SQL", "Python"],
    preferredSkills: [],
    seniority: "senior",
    interviewDate: new Date("2026-12-01T10:00:00.000Z"),
    timezone: "UTC",
    durationMinutes: 60,
    interviewRound: "Round 1",
    interviewFormat: "video",
    interviewType: "technical_interview",
    notes: null,
    source: "manual",
    status: "active",
    createdAt: new Date("2026-11-20T10:00:00.000Z"),
    updatedAt: new Date("2026-11-20T10:00:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.roundCreate.mockResolvedValue({ id: "round-1" });
  mocks.eventCreate.mockResolvedValue({ id: "event-1" });
  mocks.sessionFindMany.mockResolvedValue([]);
  mocks.profileCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
    row({ ...data, id: "profile-new", createdAt: new Date(), updatedAt: new Date() }),
  );
});

describe("interview profile creation", () => {
  it("creates the first round so the timeline is never empty", async () => {
    const created = await interviewProfileService.create(IDENTITY, {
      companyName: "Contoso",
      jobTitle: "Senior Data Engineer",
      interviewType: "technical_interview",
    });

    expect(created.companyName).toBe("Contoso");
    expect(mocks.profileCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ professionalIdentityId: IDENTITY }) }),
    );
    expect(mocks.roundCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ interviewProfileId: "profile-new", order: 1, roundType: "technical_interview" }),
    });
  });

  it("links an existing application and records an application event", async () => {
    mocks.applicationFindFirst.mockResolvedValue({ applicationId: "app-1" });

    await interviewProfileService.create(IDENTITY, {
      companyName: "Contoso",
      jobTitle: "Senior Data Engineer",
      applicationId: "app-1",
      interviewType: "technical_interview",
    });

    expect(mocks.applicationFindFirst).toHaveBeenCalledWith({
      where: { applicationId: "app-1", professionalIdentityId: IDENTITY },
      select: { applicationId: true },
    });
    expect(mocks.profileCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ applicationId: "app-1" }),
    });
    expect(mocks.eventCreate).toHaveBeenCalled();
  });

  it("refuses to link an application that belongs to another user", async () => {
    mocks.applicationFindFirst.mockResolvedValue(null);

    await expect(
      interviewProfileService.create(IDENTITY, {
        companyName: "Contoso",
        jobTitle: "Senior Data Engineer",
        applicationId: "app-other",
        interviewType: "technical_interview",
      }),
    ).rejects.toBeInstanceOf(InterviewValidationError);

    expect(mocks.profileCreate).not.toHaveBeenCalled();
  });

  it("does not record an application event without a linked application", async () => {
    await interviewProfileService.create(IDENTITY, {
      companyName: "Contoso",
      jobTitle: "Senior Data Engineer",
      interviewType: "general_discussion",
    });
    expect(mocks.eventCreate).not.toHaveBeenCalled();
  });
});

describe("interview profile ownership", () => {
  it("scopes reads to the caller's professional identity", async () => {
    mocks.profileFindFirst.mockResolvedValue(row());

    await interviewProfileService.get(IDENTITY, "profile-1");

    expect(mocks.profileFindFirst).toHaveBeenCalledWith({
      where: { id: "profile-1", professionalIdentityId: IDENTITY },
    });
  });

  it("treats another user's profile as not found", async () => {
    mocks.profileFindFirst.mockResolvedValue(null);

    await expect(interviewProfileService.get(OTHER_IDENTITY, "profile-1")).rejects.toBeInstanceOf(
      InterviewNotFoundError,
    );
  });

  it("scopes list queries and attaches real counts", async () => {
    mocks.profileFindMany.mockResolvedValue([{ ...row(), _count: { rounds: 2, sessions: 3 } }]);

    const profiles = await interviewProfileService.list(IDENTITY);

    expect(mocks.profileFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { professionalIdentityId: IDENTITY } }),
    );
    expect(profiles[0]).toMatchObject({ roundCount: 2, completedSessions: 3 });
  });

  it("refuses to update another user's profile", async () => {
    mocks.profileFindFirst.mockResolvedValue(null);

    await expect(
      interviewProfileService.update(OTHER_IDENTITY, "profile-1", { companyName: "Evil" }),
    ).rejects.toBeInstanceOf(InterviewNotFoundError);
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
  });

  it("refuses to delete another user's profile", async () => {
    mocks.profileFindFirst.mockResolvedValue(null);

    await expect(interviewProfileService.remove(OTHER_IDENTITY, "profile-1")).rejects.toBeInstanceOf(
      InterviewNotFoundError,
    );
    expect(mocks.profileDelete).not.toHaveBeenCalled();
  });
});
