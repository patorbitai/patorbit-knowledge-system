import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  profileCount: vi.fn(),
  profileFindFirst: vi.fn(),
  sessionFindMany: vi.fn(),
  planFindMany: vi.fn(),
  planFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    interviewProfile: { count: mocks.profileCount, findFirst: mocks.profileFindFirst },
    practiceSession: { findMany: mocks.sessionFindMany },
    preparationPlan: { findMany: mocks.planFindMany, findFirst: mocks.planFindFirst },
  },
}));

import { interviewAnalyticsService } from "@/services/interview-analytics.service";

const IDENTITY = "identity-a";

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    sessionType: "mock",
    overallScore: 70,
    completedAt: new Date("2026-11-20T10:00:00.000Z"),
    answers: [],
    ...overrides,
  };
}

function answersFor(topic: string, score: number) {
  return [
    {
      category: topic,
      evaluation: {
        topic,
        dimensions: {
          technicalAccuracy: { score },
          completeness: { score },
        },
      },
    },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.profileCount.mockResolvedValue(2);
  mocks.planFindMany.mockResolvedValue([{ progress: 40 }, { progress: 60 }]);
  mocks.planFindFirst.mockResolvedValue({ progress: 55 });
});

describe("global interview analytics", () => {
  it("only asks for completed sessions", async () => {
    mocks.sessionFindMany.mockResolvedValue([]);

    await interviewAnalyticsService.overview(IDENTITY);

    expect(mocks.sessionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { interviewProfile: { professionalIdentityId: IDENTITY }, status: "completed" },
      }),
    );
  });

  it("reports no scores at all when nothing has been completed", async () => {
    mocks.sessionFindMany.mockResolvedValue([]);

    const analytics = await interviewAnalyticsService.overview(IDENTITY);

    expect(analytics.scores.average).toBeNull();
    expect(analytics.scores.latest).toBeNull();
    expect(analytics.scores.progression).toEqual([]);
    expect(analytics.totals.completedSessions).toBe(0);
    expect(analytics.recommendations.join(" ")).toMatch(/mock interview/i);
  });

  it("computes average and latest from real completed scores", async () => {
    mocks.sessionFindMany.mockResolvedValue([
      session({ id: "s1", overallScore: 60 }),
      session({ id: "s2", overallScore: 80, sessionType: "practice" }),
      session({ id: "s3", overallScore: 70 }),
    ]);

    const analytics = await interviewAnalyticsService.overview(IDENTITY);

    expect(analytics.scores.average).toBe(70);
    expect(analytics.scores.latest).toBe(70);
    expect(analytics.scores.progression.map((point) => point.score)).toEqual([60, 80, 70]);
    expect(analytics.totals.completedMocks).toBe(2);
  });

  it("derives strongest and weakest topics from evaluated answers", async () => {
    mocks.sessionFindMany.mockResolvedValue([
      session({ answers: [...answersFor("sql", 5), ...answersFor("python", 2)] }),
    ]);

    const analytics = await interviewAnalyticsService.overview(IDENTITY);

    expect(analytics.strongestTopics[0]).toMatchObject({ topic: "sql", average: 5 });
    expect(analytics.weakestTopics[0]).toMatchObject({ topic: "python", average: 2 });
    expect(analytics.recommendations.join(" ")).toMatch(/Python|python/);
  });

  it("averages plan progress instead of showing a placeholder", async () => {
    mocks.sessionFindMany.mockResolvedValue([]);

    const analytics = await interviewAnalyticsService.overview(IDENTITY);

    expect(analytics.preparation).toEqual({ plans: 2, averageProgress: 50 });
  });
});

describe("profile-scoped analytics", () => {
  it("verifies ownership before reading sessions", async () => {
    mocks.profileFindFirst.mockResolvedValue({
      id: "profile-1",
      interviewDate: new Date(Date.now() + 86_400_000),
      status: "active",
    });
    mocks.sessionFindMany.mockResolvedValue([session({ answers: answersFor("sql", 4) })]);

    const analytics = await interviewAnalyticsService.forProfile(IDENTITY, "profile-1");

    expect(mocks.profileFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "profile-1", professionalIdentityId: IDENTITY } }),
    );
    expect(mocks.sessionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { interviewProfileId: "profile-1", status: "completed" } }),
    );
    expect(analytics.totals.profiles).toBe(1);
    expect(analytics.totals.upcoming).toBe(1);
  });

  it("throws for a profile the caller does not own", async () => {
    mocks.profileFindFirst.mockResolvedValue(null);

    await expect(interviewAnalyticsService.forProfile(IDENTITY, "profile-other")).rejects.toThrow(
      /not found/i,
    );
    expect(mocks.sessionFindMany).not.toHaveBeenCalled();
  });
});
