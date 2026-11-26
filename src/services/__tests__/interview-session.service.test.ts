import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  sessionFindFirst: vi.fn(),
  sessionCreate: vi.fn(),
  sessionUpdate: vi.fn(),
  sessionDelete: vi.fn(),
  sessionFindMany: vi.fn(),
  profileFindFirst: vi.fn(),
  profileFindUnique: vi.fn(),
  roundFindFirst: vi.fn(),
  roundFindUnique: vi.fn(),
  roundUpdate: vi.fn(),
  interviewQuestions: vi.fn(),
  interviewEvaluate: vi.fn(),
  interviewReport: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    practiceSession: {
      findFirst: mocks.sessionFindFirst,
      create: mocks.sessionCreate,
      update: mocks.sessionUpdate,
      delete: mocks.sessionDelete,
      findMany: mocks.sessionFindMany,
    },
    interviewProfile: { findFirst: mocks.profileFindFirst, findUnique: mocks.profileFindUnique },
    interviewRound: {
      findFirst: mocks.roundFindFirst,
      findUnique: mocks.roundFindUnique,
      update: mocks.roundUpdate,
    },
  },
}));

vi.mock("@/lib/interview/context", () => ({
  buildProfileContext: vi.fn().mockResolvedValue({
    identity: {},
    profile: {},
    round: null,
    resume: null,
  }),
}));

vi.mock("@/lib/ai/service", () => ({
  getAIService: () => ({
    interviewQuestions: mocks.interviewQuestions,
    interviewEvaluate: mocks.interviewEvaluate,
    interviewReport: mocks.interviewReport,
  }),
}));

import {
  interviewSessionService,
  computeDimensionAverages,
  computeOverallScore,
} from "@/services/interview-session.service";
import { InterviewNotFoundError, InterviewValidationError } from "@/services/interview-profile.service";

const IDENTITY = "identity-a";

const QUESTIONS = [
  {
    id: "q1",
    category: "sql",
    difficulty: "medium",
    question: "How would you tune a slow query?",
    answerFramework: "Plan, indexes, stats",
    followUps: [],
  },
  {
    id: "q2",
    category: "python",
    difficulty: "medium",
    question: "Explain generators.",
    answerFramework: "Laziness, memory",
    followUps: [],
  },
];

const EVALUATION = {
  dimensions: {
    technicalAccuracy: { score: 4, evidence: "Named the execution plan" },
    conceptualUnderstanding: { score: 4, evidence: "Explained indexing" },
    completeness: { score: 3, evidence: "Missed statistics" },
    problemSolving: { score: 3, evidence: "Methodical" },
    practicalApplication: { score: 4, evidence: "Real example" },
    communicationClarity: { score: 4, evidence: "Clear structure" },
  },
  strengths: ["Clear structure"],
  improvements: ["Mention statistics"],
  idealAnswerFramework: "Plan → indexes → statistics",
  followUpQuestion: null,
  topic: "sql",
};

function sessionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    interviewProfileId: "profile-1",
    roundId: null,
    sessionType: "practice",
    status: "in_progress",
    questions: QUESTIONS,
    answers: [],
    evaluation: null,
    overallScore: null,
    startedAt: new Date("2026-11-25T09:00:00.000Z"),
    completedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.profileFindUnique.mockResolvedValue({ id: "profile-1", interviewType: "technical_interview", requiredSkills: ["SQL"] });
  mocks.profileFindFirst.mockResolvedValue({ id: "profile-1", interviewType: "technical_interview", requiredSkills: ["SQL"] });
  mocks.roundFindUnique.mockResolvedValue(null);
  mocks.roundFindFirst.mockResolvedValue(null);
  mocks.roundUpdate.mockResolvedValue({});
  mocks.sessionUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
    sessionRow({ ...data, answers: data.answers ?? [], questions: data.questions ?? QUESTIONS }),
  );
  mocks.interviewEvaluate.mockResolvedValue(EVALUATION);
  mocks.interviewReport.mockResolvedValue({
    overview: "Solid fundamentals.",
    strengths: ["Clear structure"],
    improvements: ["Add statistics"],
    strongestTopics: ["sql"],
    weakestTopics: ["python"],
    recommendations: ["Practise Python generators"],
    generalRoleBased: true,
  });
});

describe("starting a session", () => {
  it("scopes the profile lookup to the caller", async () => {
    mocks.interviewQuestions.mockResolvedValue({
      questions: QUESTIONS,
      generalRoleBased: true,
    });
    mocks.sessionCreate.mockResolvedValue(sessionRow());

    await interviewSessionService.start(IDENTITY, "profile-1", { sessionType: "practice" });

    expect(mocks.profileFindFirst).toHaveBeenCalledWith({
      where: { id: "profile-1", professionalIdentityId: IDENTITY },
    });
  });

  it("refuses to start for another user's profile", async () => {
    mocks.profileFindFirst.mockResolvedValue(null);

    await expect(
      interviewSessionService.start(IDENTITY, "profile-other", { sessionType: "practice" }),
    ).rejects.toBeInstanceOf(InterviewNotFoundError);
    expect(mocks.interviewQuestions).not.toHaveBeenCalled();
  });

  it("uses five questions for a mock interview", async () => {
    mocks.interviewQuestions.mockResolvedValue({ questions: QUESTIONS, generalRoleBased: true });
    mocks.sessionCreate.mockResolvedValue(sessionRow());

    await interviewSessionService.start(IDENTITY, "profile-1", { sessionType: "mock" });

    expect(mocks.interviewQuestions).toHaveBeenCalledWith(expect.objectContaining({ count: 5 }));
  });
});

describe("answering questions", () => {
  it("stores the evaluation and returns the updated session", async () => {
    mocks.sessionFindFirst.mockResolvedValue(sessionRow());

    const result = await interviewSessionService.answer(IDENTITY, "session-1", {
      questionId: "q1",
      answer: "I would read the plan first.",
    });

    expect(mocks.interviewEvaluate).toHaveBeenCalledWith(
      expect.objectContaining({ answer: "I would read the plan first.", category: "sql" }),
    );
    expect(result.answers).toHaveLength(1);
    expect(result.answers[0].evaluation.dimensions.technicalAccuracy.score).toBe(4);
  });

  it("rejects a question that is not part of the session", async () => {
    mocks.sessionFindFirst.mockResolvedValue(sessionRow());

    await expect(
      interviewSessionService.answer(IDENTITY, "session-1", { questionId: "nope", answer: "text" }),
    ).rejects.toBeInstanceOf(InterviewValidationError);
    expect(mocks.interviewEvaluate).not.toHaveBeenCalled();
  });

  it("rejects answering the same question twice", async () => {
    mocks.sessionFindFirst.mockResolvedValue(
      sessionRow({
        answers: [
          {
            questionId: "q1",
            questionText: "How would you tune a slow query?",
            category: "sql",
            answer: "first",
            answeredAt: new Date().toISOString(),
            evaluation: EVALUATION,
          },
        ],
      }),
    );

    await expect(
      interviewSessionService.answer(IDENTITY, "session-1", { questionId: "q1", answer: "again" }),
    ).rejects.toBeInstanceOf(InterviewValidationError);
  });

  it("rejects answers on a completed session", async () => {
    mocks.sessionFindFirst.mockResolvedValue(sessionRow({ status: "completed" }));

    await expect(
      interviewSessionService.answer(IDENTITY, "session-1", { questionId: "q1", answer: "text" }),
    ).rejects.toBeInstanceOf(InterviewValidationError);
  });

  it("adds a follow-up question to a mock interview", async () => {
    mocks.sessionFindFirst.mockResolvedValue(sessionRow({ sessionType: "mock" }));
    mocks.interviewEvaluate.mockResolvedValue({ ...EVALUATION, followUpQuestion: "What about statistics?" });

    const result = await interviewSessionService.answer(IDENTITY, "session-1", {
      questionId: "q1",
      answer: "Answer",
    });

    expect(result.questions).toHaveLength(QUESTIONS.length + 1);
    expect(result.questions.at(-1)?.question).toBe("What about statistics?");
  });

  it("treats another user's session as not found", async () => {
    mocks.sessionFindFirst.mockResolvedValue(null);

    await expect(
      interviewSessionService.answer(IDENTITY, "session-other", { questionId: "q1", answer: "text" }),
    ).rejects.toBeInstanceOf(InterviewNotFoundError);
  });
});

describe("completing a session", () => {
  it("refuses to finish without a single answer", async () => {
    mocks.sessionFindFirst.mockResolvedValue(sessionRow());

    await expect(interviewSessionService.complete(IDENTITY, "session-1")).rejects.toBeInstanceOf(
      InterviewValidationError,
    );
    expect(mocks.interviewReport).not.toHaveBeenCalled();
  });

  it("stores a score derived from the recorded evaluations", async () => {
    mocks.sessionFindFirst.mockResolvedValue(
      sessionRow({
        answers: [
          {
            questionId: "q1",
            questionText: "How would you tune a slow query?",
            category: "sql",
            answer: "Read the plan",
            answeredAt: new Date().toISOString(),
            evaluation: EVALUATION,
          },
        ],
      }),
    );

    const result = await interviewSessionService.complete(IDENTITY, "session-1");

    const expectedAverages = computeDimensionAverages([
      {
        questionId: "q1",
        questionText: "",
        category: "sql",
        answer: "",
        answeredAt: "",
        evaluation: EVALUATION,
      },
    ]);
    const expectedScore = computeOverallScore(expectedAverages);

    expect(mocks.sessionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "completed", overallScore: expectedScore }),
      }),
    );
    expect(result.overallScore).toBe(expectedScore);
    expect(result.report?.generalRoleBased).toBe(true);
  });

  it("marks the round completed when the session belongs to one", async () => {
    mocks.sessionFindFirst.mockResolvedValue(
      sessionRow({
        roundId: "round-1",
        answers: [
          {
            questionId: "q1",
            questionText: "Q",
            category: "sql",
            answer: "A",
            answeredAt: new Date().toISOString(),
            evaluation: EVALUATION,
          },
        ],
      }),
    );
    mocks.roundFindUnique.mockResolvedValue({ id: "round-1", status: "scheduled" });

    await interviewSessionService.complete(IDENTITY, "session-1");

    expect(mocks.roundUpdate).toHaveBeenCalledWith({
      where: { id: "round-1" },
      data: { status: "completed" },
    });
  });

  it("never reopens a cancelled round", async () => {
    mocks.sessionFindFirst.mockResolvedValue(
      sessionRow({
        roundId: "round-1",
        answers: [
          {
            questionId: "q1",
            questionText: "Q",
            category: "sql",
            answer: "A",
            answeredAt: new Date().toISOString(),
            evaluation: EVALUATION,
          },
        ],
      }),
    );
    mocks.roundFindUnique.mockResolvedValue({ id: "round-1", status: "cancelled" });

    await interviewSessionService.complete(IDENTITY, "session-1");

    expect(mocks.roundUpdate).toHaveBeenCalledWith({
      where: { id: "round-1" },
      data: { status: "cancelled" },
    });
  });
});

describe("session state", () => {
  it("pauses an in-progress session", async () => {
    mocks.sessionFindFirst.mockResolvedValue(sessionRow());

    await interviewSessionService.setStatus(IDENTITY, "session-1", "paused");

    expect(mocks.sessionUpdate).toHaveBeenCalledWith({
      where: { id: "session-1" },
      data: { status: "paused" },
    });
  });

  it("refuses to change the status of a completed session", async () => {
    mocks.sessionFindFirst.mockResolvedValue(sessionRow({ status: "completed" }));

    await expect(
      interviewSessionService.setStatus(IDENTITY, "session-1", "in_progress"),
    ).rejects.toBeInstanceOf(InterviewValidationError);
  });
});

describe("dimension averages", () => {
  it("averages each dimension across answers, to one decimal", () => {
    const answers = [
      {
        questionId: "q1",
        questionText: "",
        category: "sql",
        answer: "",
        answeredAt: "",
        evaluation: EVALUATION,
      },
      {
        questionId: "q2",
        questionText: "",
        category: "python",
        answer: "",
        answeredAt: "",
        evaluation: {
          ...EVALUATION,
          dimensions: {
            ...EVALUATION.dimensions,
            technicalAccuracy: { score: 2, evidence: "" },
          },
        },
      },
    ];

    const averages = computeDimensionAverages(answers);
    expect(averages.technicalAccuracy).toBe(3);
    expect(averages.completeness).toBe(3);
    expect(computeOverallScore(averages)).toBeGreaterThan(0);
    expect(computeOverallScore(averages)).toBeLessThanOrEqual(100);
  });
});
