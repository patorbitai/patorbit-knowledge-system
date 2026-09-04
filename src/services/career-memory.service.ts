"use strict";

/**
 * M5 Career Memory Service (Patorbit Phase 1).
 *
 * Derives structured career insights from actual application outcomes.
 * Only generates insights from sufficiently supported patterns — not single events.
 * Used to improve future career recommendations.
 *
 * TRUST RULE:
 *  - A single rejection cannot create a broad career conclusion
 *  - Patterns require multiple data points
 *  - Insights are honest about confidence levels
 */

import { prisma } from "@/lib/prisma";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type MemoryCategory =
  | "interview_pattern"
  | "skill_gap"
  | "outcome_trend"
  | "role_fit";

export interface CareerMemoryData {
  id: string;
  category: string;
  insight: string;
  confidence: number;
  evidenceCount: number;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface CareerInsightSummary {
  totalInsights: number;
  byCategory: Record<MemoryCategory, number>;
  topInsights: CareerMemoryData[];
  applicationStats: {
    total: number;
    byStatus: Record<string, number>;
    interviewRate: number;
    offerRate: number;
  };
}

/* ── Minimum evidence thresholds ─────────────────────────────────────────── */

const MIN_EVENTS_FOR_PATTERN = 2;
const MIN_EVENTS_FOR_CONFIDENT_INSIGHT = 3;

/* ── Service ────────────────────────────────────────────────────────────── */

export class CareerMemoryService {
  /**
   * Analyze application outcomes and generate/update career memory insights.
   * Called after recording significant events (outcome, interview completion).
   */
  async analyzeAndUpdate(
    professionalIdentityId: string,
  ): Promise<CareerInsightSummary> {
    // Gather all events for this identity
    const events = await prisma.applicationEvent.findMany({
      where: { professionalIdentityId },
      orderBy: { createdAt: "asc" },
    });

    // Gather all applications
    const applications = await prisma.jobApplication.findMany({
      where: { professionalIdentityId },
    });

    // Compute basic stats
    const stats = this.computeStats(applications, events);

    // Generate insights from patterns
    const insights = this.deriveInsights(events, applications, stats);

    // Upsert insights into CareerMemory
    for (const insight of insights) {
      await this.upsertInsight(professionalIdentityId, insight);
    }

    // Return summary
    return this.getSummary(professionalIdentityId);
  }

  /**
   * Get the career memory summary for an identity.
   */
  async getSummary(
    professionalIdentityId: string,
  ): Promise<CareerInsightSummary> {
    const memories = await prisma.careerMemory.findMany({
      where: { professionalIdentityId },
      orderBy: { confidence: "desc" },
    });

    const applications = await prisma.jobApplication.findMany({
      where: { professionalIdentityId },
    });

    const events = await prisma.applicationEvent.findMany({
      where: { professionalIdentityId },
    });

    const stats = this.computeStats(applications, events);

    const byCategory: Record<string, number> = {};
    for (const m of memories) {
      byCategory[m.category] = (byCategory[m.category] || 0) + 1;
    }

    return {
      totalInsights: memories.length,
      byCategory: byCategory as Record<MemoryCategory, number>,
      topInsights: memories.slice(0, 5).map((m) => ({
        id: m.id,
        category: m.category,
        insight: m.insight,
        confidence: m.confidence,
        evidenceCount: m.evidenceCount,
        metadata: m.metadata,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      applicationStats: stats,
    };
  }

  /**
   * Get career memory insights relevant to a specific job role/skill set.
   * Used by the Career Intelligence system to improve recommendations.
   */
  async getRelevantInsights(
    professionalIdentityId: string,
    context: { skills?: string[]; roleType?: string },
  ): Promise<CareerMemoryData[]> {
    const all = await prisma.careerMemory.findMany({
      where: { professionalIdentityId },
      orderBy: { confidence: "desc" },
    });

    // Filter insights that are relevant to the context
    return all
      .filter((m) => {
        const meta = (m.metadata as Record<string, unknown>) ?? {};
        // If context has skills, check if any match the insight's metadata
        if (context.skills?.length) {
          const insightSkills = (meta.skills as string[]) ?? [];
          const hasOverlap = context.skills.some((s) =>
            insightSkills.some((is) =>
              is.toLowerCase().includes(s.toLowerCase()),
            ),
          );
          if (hasOverlap) return true;
        }
        // If context has roleType, check if it matches
        if (context.roleType) {
          const insightRoles = (meta.roleTypes as string[]) ?? [];
          if (insightRoles.some((r) => r.toLowerCase().includes(context.roleType!.toLowerCase()))) {
            return true;
          }
        }
        // Include high-confidence insights regardless
        return m.confidence >= 0.7;
      })
      .slice(0, 10)
      .map((m) => ({
        id: m.id,
        category: m.category,
        insight: m.insight,
        confidence: m.confidence,
        evidenceCount: m.evidenceCount,
        metadata: m.metadata,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      }));
  }

  /* ── Private helpers ──────────────────────────────────────────────────── */

  private computeStats(
    applications: Array<{ status: string }>,
    events: Array<{ eventType: string; outcome: string | null }>,
  ) {
    const byStatus: Record<string, number> = {};
    for (const app of applications) {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    }

    const total = applications.length;
    const interviewCount = (byStatus["interview"] || 0);
    const offerCount = (byStatus["offer"] || 0);

    return {
      total,
      byStatus,
      interviewRate: total > 0 ? Math.round((interviewCount / total) * 100) : 0,
      offerRate: total > 0 ? Math.round((offerCount / total) * 100) : 0,
    };
  }

  private deriveInsights(
    events: Array<{
      eventType: string;
      interviewStage: string | null;
      outcome: string | null;
      notes: string | null;
      metadata: unknown;
      createdAt: Date;
    }>,
    applications: Array<{
      title: string;
      companyName: string;
      status: string;
      matchScore: number | null;
    }>,
    stats: { total: number; byStatus: Record<string, number>; interviewRate: number; offerRate: number },
  ): Array<{
    category: string;
    insight: string;
    confidence: number;
    evidenceCount: number;
    metadata: Record<string, unknown>;
  }> {
    const insights: Array<{
      category: string;
      insight: string;
      confidence: number;
      evidenceCount: number;
      metadata: Record<string, unknown>;
    }> = [];

    // 1. Outcome trend insight
    if (stats.total >= MIN_EVENTS_FOR_PATTERN) {
      const rejectedCount = (stats.byStatus["rejected"] || 0);
      const noResponseCount = (stats.byStatus["no_response"] || 0);
      const totalNonResponse = rejectedCount + noResponseCount;

      if (totalNonResponse >= MIN_EVENTS_FOR_PATTERN) {
        const confidence = totalNonResponse >= MIN_EVENTS_FOR_CONFIDENT_INSIGHT ? 0.7 : 0.5;
        insights.push({
          category: "outcome_trend",
          insight: `${totalNonResponse} of ${stats.total} applications resulted in rejection or no response. Consider refining targeting or strengthening qualifications.`,
          confidence,
          evidenceCount: totalNonResponse,
          metadata: {
            rejectedCount,
            noResponseCount,
            totalApplications: stats.total,
          },
        });
      }
    }

    // 2. Interview success pattern
    const completedInterviews = events.filter(
      (e) => e.eventType === "interview_completed",
    );
    if (completedInterviews.length >= MIN_EVENTS_FOR_PATTERN) {
      const interviewOutcomes = completedInterviews.map((e) => e.outcome);
      const positiveOutcomes = interviewOutcomes.filter(
        (o) => o === "offer",
      ).length;

      const confidence = completedInterviews.length >= MIN_EVENTS_FOR_CONFIDENT_INSIGHT ? 0.65 : 0.45;
      insights.push({
        category: "interview_pattern",
        insight: `${positiveOutcomes} of ${completedInterviews.length} completed interviews resulted in offers.`,
        confidence,
        evidenceCount: completedInterviews.length,
        metadata: {
          totalInterviews: completedInterviews.length,
          offers: positiveOutcomes,
          stages: completedInterviews.map((e) => e.interviewStage).filter(Boolean),
        },
      });
    }

    // 3. Skill gap from interview notes (conservative)
    const interviewEvents = events.filter(
      (e) =>
        (e.eventType === "interview_completed" || e.eventType === "outcome_recorded") &&
        e.notes,
    );

    if (interviewEvents.length >= MIN_EVENTS_FOR_PATTERN) {
      // Extract mentioned skills/topics from interview notes
      const mentionedTopics = new Map<string, number>();
      for (const event of interviewEvents) {
        const notes = event.notes?.toLowerCase() ?? "";
        // Conservative extraction — only well-known technical topics
        const topics = [
          "system design", "data structures", "algorithms", "behavioral",
          "leadership", "communication", "problem solving", "technical depth",
          "coding", "architecture", "testing", "debugging",
        ];
        for (const topic of topics) {
          if (notes.includes(topic)) {
            mentionedTopics.set(topic, (mentionedTopics.get(topic) || 0) + 1);
          }
        }
      }

      // Only surface topics mentioned multiple times
      const recurringTopics = [...mentionedTopics.entries()]
        .filter(([, count]) => count >= MIN_EVENTS_FOR_PATTERN)
        .sort((a, b) => b[1] - a[1]);

      for (const [topic, count] of recurringTopics.slice(0, 3)) {
        insights.push({
          category: "skill_gap",
          insight: `"${topic}" has been mentioned in ${count} interview events. Consider strengthening this area.`,
          confidence: count >= MIN_EVENTS_FOR_CONFIDENT_INSIGHT ? 0.6 : 0.4,
          evidenceCount: count,
          metadata: {
            topic,
            mentionCount: count,
          },
        });
      }
    }

    // 4. Role fit insight
    if (stats.total >= MIN_EVENTS_FOR_PATTERN && applications.length >= MIN_EVENTS_FOR_PATTERN) {
      const rolesByOutcome: Record<string, { total: number; positive: number }> = {};
      for (const app of applications) {
        const role = app.title;
        if (!rolesByOutcome[role]) {
          rolesByOutcome[role] = { total: 0, positive: 0 };
        }
        rolesByOutcome[role].total++;
        if (app.status === "offer" || app.status === "interview") {
          rolesByOutcome[role].positive++;
        }
      }

      // Find roles with best positive rate (need at least 2 apps)
      for (const [role, data] of Object.entries(rolesByOutcome)) {
        if (data.total >= 2 && data.positive >= 2) {
          const rate = Math.round((data.positive / data.total) * 100);
          if (rate >= 50) {
            insights.push({
              category: "role_fit",
              insight: `"${role}" roles show a ${rate}% positive response rate (${data.positive}/${data.total}).`,
              confidence: 0.5,
              evidenceCount: data.total,
              metadata: {
                roleType: role,
                totalApplications: data.total,
                positiveOutcomes: data.positive,
                successRate: rate,
              },
            });
          }
        }
      }
    }

    return insights;
  }

  private async upsertInsight(
    professionalIdentityId: string,
    insight: {
      category: string;
      insight: string;
      confidence: number;
      evidenceCount: number;
      metadata: Record<string, unknown>;
    },
  ): Promise<void> {
    // Check if a similar insight already exists
    const existing = await prisma.careerMemory.findFirst({
      where: {
        professionalIdentityId,
        category: insight.category,
        insight: insight.insight,
      },
    });

    if (existing) {
      // Update evidence count and confidence if new evidence is stronger
      if (insight.evidenceCount > existing.evidenceCount) {
        await prisma.careerMemory.update({
          where: { id: existing.id },
          data: {
            evidenceCount: insight.evidenceCount,
            confidence: Math.min(0.9, insight.confidence),
            metadata: insight.metadata as unknown as Record<string, string | number | boolean | null>,
          },
        });
      }
    } else {
      // Create new insight
      await prisma.careerMemory.create({
        data: {
          professionalIdentityId,
          category: insight.category,
          insight: insight.insight,
          confidence: insight.confidence,
          evidenceCount: insight.evidenceCount,
          metadata: insight.metadata as unknown as Record<string, string | number | boolean | null>,
        },
      });
    }
  }
}

export const careerMemoryService = new CareerMemoryService();
