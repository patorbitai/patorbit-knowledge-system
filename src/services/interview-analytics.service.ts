"use strict";

import { prisma } from "@/lib/prisma";
import { categoryLabel } from "@/lib/interview/constants";

export interface TopicStat {
  topic: string;
  label: string;
  average: number;
  attempts: number;
}

export interface ScorePoint {
  sessionId: string;
  date: string;
  score: number;
  sessionType: string;
}

export interface InterviewAnalytics {
  totals: {
    profiles: number;
    upcoming: number;
    completedSessions: number;
    completedMocks: number;
  };
  scores: {
    average: number | null;
    latest: number | null;
    progression: ScorePoint[];
  };
  strongestTopics: TopicStat[];
  weakestTopics: TopicStat[];
  recommendations: string[];
  preparation: { plans: number; averageProgress: number };
}

const MIN_TOPIC_ATTEMPTS = 1;

/**
 * InterviewAnalyticsService — every number comes from completed sessions.
 * When there is no data, the response says so instead of inventing a baseline.
 */
export class InterviewAnalyticsService {
  async overview(professionalIdentityId: string): Promise<InterviewAnalytics> {
    const [profiles, upcoming, sessions, plans] = await Promise.all([
      prisma.interviewProfile.count({ where: { professionalIdentityId, status: "active" } }),
      prisma.interviewProfile.count({
        where: {
          professionalIdentityId,
          status: "active",
          interviewDate: { gte: new Date() },
        },
      }),
      prisma.practiceSession.findMany({
        where: {
          interviewProfile: { professionalIdentityId },
          status: "completed",
        },
        orderBy: { completedAt: "asc" },
        select: {
          id: true,
          sessionType: true,
          overallScore: true,
          completedAt: true,
          answers: true,
        },
      }),
      prisma.preparationPlan.findMany({
        where: { interviewProfile: { professionalIdentityId } },
        select: { progress: true },
      }),
    ]);

    const scored = sessions.filter((session) => typeof session.overallScore === "number");
    const scores = scored.map((session) => session.overallScore as number);
    const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const latest = scores.length ? scores[scores.length - 1] : null;

    const topicTotals = new Map<string, { sum: number; count: number }>();
    for (const session of sessions) {
      const answers = Array.isArray(session.answers) ? (session.answers as {
        category?: string;
        evaluation?: { topic?: string; dimensions?: Record<string, { score?: number }> };
      }[]) : [];
      for (const answer of answers) {
        const dimensions = answer.evaluation?.dimensions ?? {};
        const values = Object.values(dimensions).filter(
          (entry): entry is { score: number } => typeof entry?.score === "number",
        );
        if (values.length === 0) continue;
        const mean = values.reduce((sum, entry) => sum + entry.score, 0) / values.length;
        const topic = (answer.evaluation?.topic || answer.category || "general").trim();
        const entry = topicTotals.get(topic) ?? { sum: 0, count: 0 };
        entry.sum += mean;
        entry.count += 1;
        topicTotals.set(topic, entry);
      }
    }

    const topics: TopicStat[] = Array.from(topicTotals.entries())
      .filter(([, value]) => value.count >= MIN_TOPIC_ATTEMPTS)
      .map(([topic, value]) => ({
        topic,
        label: categoryLabel(topic),
        average: Math.round((value.sum / value.count) * 10) / 10,
        attempts: value.count,
      }));

    const strongestTopics = [...topics].sort((a, b) => b.average - a.average).slice(0, 3);
    const weakestTopics = [...topics].sort((a, b) => a.average - b.average).slice(0, 3);

    const recommendations: string[] = [];
    if (weakestTopics.length > 0 && weakestTopics[0].average < 4) {
      recommendations.push(
        `Run a targeted practice session on ${weakestTopics[0].label} — your average there is ${weakestTopics[0].average.toFixed(1)}/5.`,
      );
    }
    if (latest !== null && average !== null && latest < average) {
      recommendations.push("Your latest mock scored below your average; review the report before the next round.");
    }
    if (plans.length === 0) {
      recommendations.push("Generate a preparation plan for your next interview to get a structured sequence.");
    }
    if (sessions.length === 0) {
      recommendations.push("Complete one mock interview to unlock score progression and weak-topic tracking.");
    }

    return {
      totals: {
        profiles,
        upcoming,
        completedSessions: sessions.length,
        completedMocks: sessions.filter((session) => session.sessionType === "mock").length,
      },
      scores: {
        average,
        latest,
        progression: scored.map((session) => ({
          sessionId: session.id,
          date: (session.completedAt ?? new Date()).toISOString(),
          score: session.overallScore as number,
          sessionType: session.sessionType,
        })),
      },
      strongestTopics,
      weakestTopics,
      recommendations,
      preparation: {
        plans: plans.length,
        averageProgress: plans.length
          ? Math.round(plans.reduce((sum, plan) => sum + plan.progress, 0) / plans.length)
          : 0,
      },
    };
  }

  /** Profile-scoped analytics for the profile detail and report screens. */
  async forProfile(professionalIdentityId: string, profileId: string): Promise<InterviewAnalytics> {
    const profile = await prisma.interviewProfile.findFirst({
      where: { id: profileId, professionalIdentityId },
      select: { id: true, interviewDate: true, status: true },
    });
    if (!profile) {
      throw new Error("Interview profile not found.");
    }

    const sessions = await prisma.practiceSession.findMany({
      where: { interviewProfileId: profileId, status: "completed" },
      orderBy: { completedAt: "asc" },
      select: { id: true, sessionType: true, overallScore: true, completedAt: true, answers: true },
    });

    const scored = sessions.filter((session) => typeof session.overallScore === "number");
    const scores = scored.map((session) => session.overallScore as number);

    const topicTotals = new Map<string, { sum: number; count: number }>();
    for (const session of sessions) {
      const answers = Array.isArray(session.answers) ? (session.answers as {
        category?: string;
        evaluation?: { topic?: string; dimensions?: Record<string, { score?: number }> };
      }[]) : [];
      for (const answer of answers) {
        const values = Object.values(answer.evaluation?.dimensions ?? {}).filter(
          (entry): entry is { score: number } => typeof entry?.score === "number",
        );
        if (values.length === 0) continue;
        const mean = values.reduce((sum, entry) => sum + entry.score, 0) / values.length;
        const topic = (answer.evaluation?.topic || answer.category || "general").trim();
        const entry = topicTotals.get(topic) ?? { sum: 0, count: 0 };
        entry.sum += mean;
        entry.count += 1;
        topicTotals.set(topic, entry);
      }
    }

    const topics: TopicStat[] = Array.from(topicTotals.entries()).map(([topic, value]) => ({
      topic,
      label: categoryLabel(topic),
      average: Math.round((value.sum / value.count) * 10) / 10,
      attempts: value.count,
    }));

    const plan = await prisma.preparationPlan.findFirst({
      where: { interviewProfileId: profileId },
      orderBy: { createdAt: "desc" },
      select: { progress: true },
    });

    return {
      totals: {
        profiles: 1,
        upcoming: profile.interviewDate && profile.interviewDate > new Date() ? 1 : 0,
        completedSessions: sessions.length,
        completedMocks: sessions.filter((session) => session.sessionType === "mock").length,
      },
      scores: {
        average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
        latest: scores.length ? scores[scores.length - 1] : null,
        progression: scored.map((session) => ({
          sessionId: session.id,
          date: (session.completedAt ?? new Date()).toISOString(),
          score: session.overallScore as number,
          sessionType: session.sessionType,
        })),
      },
      strongestTopics: [...topics].sort((a, b) => b.average - a.average).slice(0, 3),
      weakestTopics: [...topics].sort((a, b) => a.average - b.average).slice(0, 3),
      recommendations: topics.length
        ? [`Practise ${[...topics].sort((a, b) => a.average - b.average)[0].label} next.`]
        : ["Complete a mock interview to unlock topic-level analytics."],
      preparation: { plans: plan ? 1 : 0, averageProgress: plan?.progress ?? 0 },
    };
  }
}

export const interviewAnalyticsService = new InterviewAnalyticsService();
