"use strict";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getAIService } from "@/lib/ai/service";
import { buildProfileContext } from "@/lib/interview/context";
import { isTechnicalInterviewType } from "@/lib/interview/constants";
import { EVALUATION_DIMENSIONS } from "@/lib/interview/schemas";
import type { AnswerEvaluation, MockReportContent } from "@/lib/interview/schemas";
import { InterviewNotFoundError, InterviewValidationError } from "./interview-profile.service";

export interface SessionQuestion {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  answerFramework: string;
  followUps: string[];
}

export interface SessionAnswer {
  questionId: string;
  questionText: string;
  category: string;
  answer: string;
  answeredAt: string;
  evaluation: AnswerEvaluation;
}

export interface SessionData {
  id: string;
  interviewProfileId: string;
  roundId: string | null;
  sessionType: string;
  status: string;
  questions: SessionQuestion[];
  answers: SessionAnswer[];
  overallScore: number | null;
  startedAt: string;
  completedAt: string | null;
  report: MockReportContent | null;
  dimensionAverages: Record<string, number>;
}

type SessionRow = {
  id: string;
  interviewProfileId: string;
  roundId: string | null;
  sessionType: string;
  status: string;
  questions: unknown;
  answers: unknown;
  evaluation: unknown;
  overallScore: number | null;
  startedAt: Date;
  completedAt: Date | null;
};

const DEFAULT_MOCK_QUESTIONS = 5;

function asQuestions(value: unknown): SessionQuestion[] {
  return Array.isArray(value) ? (value as SessionQuestion[]) : [];
}

function asAnswers(value: unknown): SessionAnswer[] {
  return Array.isArray(value) ? (value as SessionAnswer[]) : [];
}

/** Average each dimension across answers (0–5, one decimal). */
export function computeDimensionAverages(answers: SessionAnswer[]): Record<string, number> {
  const totals: Record<string, { sum: number; count: number }> = {};
  for (const answer of answers) {
    const dimensions = answer.evaluation?.dimensions ?? {};
    for (const dimension of EVALUATION_DIMENSIONS) {
      const entry = dimensions[dimension];
      if (!entry || typeof entry.score !== "number") continue;
      totals[dimension] = totals[dimension] ?? { sum: 0, count: 0 };
      totals[dimension].sum += entry.score;
      totals[dimension].count += 1;
    }
  }
  const averages: Record<string, number> = {};
  for (const [dimension, value] of Object.entries(totals)) {
    averages[dimension] = Math.round((value.sum / value.count) * 10) / 10;
  }
  return averages;
}

/** Overall score (0–100) from the recorded dimension scores — deterministic. */
export function computeOverallScore(averages: Record<string, number>): number {
  const values = Object.values(averages);
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round((mean / 5) * 100);
}

/**
 * InterviewSessionService — practice and mock sessions.
 *
 * Question generation, evaluation and reporting all go through the shared AI
 * service. Scores stored on the session are derived from recorded per-answer
 * dimension scores, never invented by the report prompt.
 */
export class InterviewSessionService {
  async start(
    professionalIdentityId: string,
    profileId: string,
    options: { sessionType: "practice" | "mock"; roundId?: string | null; categories?: string[]; questionCount?: number },
  ): Promise<SessionData> {
    const profile = await prisma.interviewProfile.findFirst({
      where: { id: profileId, professionalIdentityId },
    });
    if (!profile) throw new InterviewNotFoundError("Interview profile not found.");

    let round = null;
    if (options.roundId) {
      round = await prisma.interviewRound.findFirst({
        where: { id: options.roundId, interviewProfileId: profileId },
      });
      if (!round) throw new InterviewValidationError("That interview round was not found for this profile.");
    }

    const context = await buildProfileContext(professionalIdentityId, profile, round);
    const categories =
      options.categories && options.categories.length > 0
        ? options.categories
        : this.defaultCategories(profile.interviewType, profile.requiredSkills);

    const count =
      options.sessionType === "mock"
        ? DEFAULT_MOCK_QUESTIONS
        : Math.min(Math.max(options.questionCount ?? 5, 1), 12);

    const service = getAIService();
    const generated = await service.interviewQuestions({ context, categories, count });

    const questions: SessionQuestion[] = generated.questions.map((question, index) => ({
      id: question.id ?? `q-${index + 1}-${randomUUID().slice(0, 8)}`,
      category: question.category,
      difficulty: question.difficulty,
      question: question.question,
      answerFramework: question.answerFramework,
      followUps: question.followUps ?? [],
    }));

    const session = await prisma.practiceSession.create({
      data: {
        interviewProfileId: profile.id,
        roundId: round?.id ?? null,
        sessionType: options.sessionType,
        status: "in_progress",
        questions: questions as never,
        answers: [] as never,
      },
    });

    return this.toData(session as SessionRow);
  }

  async get(professionalIdentityId: string, sessionId: string): Promise<SessionData> {
    const session = await this.findOwned(professionalIdentityId, sessionId);
    return this.toData(session);
  }

  async list(professionalIdentityId: string, profileId: string): Promise<SessionData[]> {
    const profile = await prisma.interviewProfile.findFirst({
      where: { id: profileId, professionalIdentityId },
      select: { id: true },
    });
    if (!profile) throw new InterviewNotFoundError("Interview profile not found.");

    const sessions = await prisma.practiceSession.findMany({
      where: { interviewProfileId: profileId },
      orderBy: { startedAt: "desc" },
      take: 50,
    });
    return sessions.map((session) => this.toData(session as SessionRow));
  }

  /**
   * Submit one answer. The AI evaluates it, the evaluation is stored, and for
   * mock sessions a follow-up question is appended until the session ends.
   */
  async answer(
    professionalIdentityId: string,
    sessionId: string,
    input: { questionId: string; answer: string },
  ): Promise<SessionData> {
    const session = await this.findOwned(professionalIdentityId, sessionId);
    if (session.status === "completed") {
      throw new InterviewValidationError("This session is already completed.");
    }

    const questions = asQuestions(session.questions);
    const answers = asAnswers(session.answers);
    const question = questions.find((entry) => entry.id === input.questionId);
    if (!question) throw new InterviewValidationError("That question is not part of this session.");
    if (answers.some((entry) => entry.questionId === input.questionId)) {
      throw new InterviewValidationError("You have already answered this question.");
    }

    const profile = await prisma.interviewProfile.findUnique({
      where: { id: session.interviewProfileId },
    });
    if (!profile) throw new InterviewNotFoundError("Interview profile not found.");
    const round = session.roundId
      ? await prisma.interviewRound.findUnique({ where: { id: session.roundId } })
      : null;

    const context = await buildProfileContext(professionalIdentityId, profile, round);
    const service = getAIService();
    const evaluation = await service.interviewEvaluate({
      context,
      question: question.question,
      category: question.category,
      answer: input.answer,
      isMock: session.sessionType === "mock",
    });

    const nextAnswers: SessionAnswer[] = [
      ...answers,
      {
        questionId: question.id,
        questionText: question.question,
        category: question.category,
        answer: input.answer,
        answeredAt: new Date().toISOString(),
        evaluation,
      },
    ];

    const nextQuestions = [...questions];
    if (
      session.sessionType === "mock" &&
      evaluation.followUpQuestion &&
      nextQuestions.length < DEFAULT_MOCK_QUESTIONS
    ) {
      nextQuestions.push({
        id: `follow-${randomUUID().slice(0, 8)}`,
        category: question.category,
        difficulty: question.difficulty,
        question: evaluation.followUpQuestion,
        answerFramework: "",
        followUps: [],
      });
    }

    const updated = await prisma.practiceSession.update({
      where: { id: session.id },
      data: {
        answers: nextAnswers as never,
        questions: nextQuestions as never,
        status: session.status === "paused" ? "in_progress" : session.status,
      },
    });

    return this.toData(updated as SessionRow);
  }

  async setStatus(
    professionalIdentityId: string,
    sessionId: string,
    status: "in_progress" | "paused" | "abandoned",
  ): Promise<SessionData> {
    const session = await this.findOwned(professionalIdentityId, sessionId);
    if (session.status === "completed") {
      throw new InterviewValidationError("A completed session cannot change status.");
    }
    const updated = await prisma.practiceSession.update({
      where: { id: session.id },
      data: { status },
    });
    return this.toData(updated as SessionRow);
  }

  /** Complete the session and generate the report from recorded answers. */
  async complete(professionalIdentityId: string, sessionId: string): Promise<SessionData> {
    const session = await this.findOwned(professionalIdentityId, sessionId);
    const answers = asAnswers(session.answers);
    if (answers.length === 0) {
      throw new InterviewValidationError("Answer at least one question before finishing the session.");
    }

    const profile = await prisma.interviewProfile.findUnique({
      where: { id: session.interviewProfileId },
    });
    if (!profile) throw new InterviewNotFoundError("Interview profile not found.");
    const round = session.roundId
      ? await prisma.interviewRound.findUnique({ where: { id: session.roundId } })
      : null;

    const context = await buildProfileContext(professionalIdentityId, profile, round);
    const averages = computeDimensionAverages(answers);
    const overall = computeOverallScore(averages);

    const service = getAIService();
    const report = await service.interviewReport({
      context,
      turns: answers.map((answer) => ({
        question: answer.questionText,
        answer: answer.answer,
        topic: answer.evaluation?.topic || answer.category,
        scores: Object.fromEntries(
          Object.entries(answer.evaluation?.dimensions ?? {}).map(([key, value]) => [key, value.score]),
        ),
      })),
      averages,
      overall,
    });

    const updated = await prisma.practiceSession.update({
      where: { id: session.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        overallScore: overall,
        evaluation: { report, averages, overall } as never,
      },
    });

    if (round) {
      await prisma.interviewRound.update({
        where: { id: round.id },
        data: { status: round.status === "cancelled" ? round.status : "completed" },
      });
    }

    return this.toData(updated as SessionRow);
  }

  async remove(professionalIdentityId: string, sessionId: string): Promise<void> {
    const session = await this.findOwned(professionalIdentityId, sessionId);
    await prisma.practiceSession.delete({ where: { id: session.id } });
  }

  private defaultCategories(interviewType: string, requiredSkills: string[]): string[] {
    const skills = requiredSkills.map((skill) => skill.toLowerCase());
    const categories = new Set<string>();
    if (skills.some((skill) => skill.includes("sql"))) categories.add("sql");
    if (skills.some((skill) => skill.includes("python"))) categories.add("python");
    if (skills.some((skill) => skill.includes("pyspark") || skill.includes("spark"))) categories.add("pyspark");
    if (skills.some((skill) => skill.includes("databricks"))) categories.add("databricks");
    if (skills.some((skill) => skill.includes("azure"))) categories.add("azure");

    if (isTechnicalInterviewType(interviewType)) {
      categories.add("data_engineering");
      categories.add("system_design");
    } else {
      categories.add("behavioral");
      categories.add("hr");
    }
    return Array.from(categories).slice(0, 4);
  }

  private async findOwned(professionalIdentityId: string, sessionId: string): Promise<SessionRow> {
    const session = await prisma.practiceSession.findFirst({
      where: { id: sessionId, interviewProfile: { professionalIdentityId } },
    });
    if (!session) throw new InterviewNotFoundError("Practice session not found.");
    return session as SessionRow;
  }

  private toData(session: SessionRow): SessionData {
    const answers = asAnswers(session.answers);
    const averages = computeDimensionAverages(answers);
    const stored = (session.evaluation ?? {}) as { report?: MockReportContent };
    return {
      id: session.id,
      interviewProfileId: session.interviewProfileId,
      roundId: session.roundId,
      sessionType: session.sessionType,
      status: session.status,
      questions: asQuestions(session.questions),
      answers,
      overallScore: session.overallScore,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      report: stored.report ?? null,
      dimensionAverages: averages,
    };
  }
}

export const interviewSessionService = new InterviewSessionService();
