"use strict";

import { prisma } from "@/lib/prisma";
import { getAIService } from "@/lib/ai/service";
import { buildProfileContext } from "@/lib/interview/context";
import { isTechnicalInterviewType } from "@/lib/interview/constants";
import type { PreparationPlanContent } from "@/lib/interview/schemas";
import { InterviewNotFoundError, InterviewValidationError } from "./interview-profile.service";

export interface PreparationPlanData {
  id: string;
  interviewProfileId: string;
  roundId: string | null;
  summary: string;
  roadmap: PreparationPlanContent["roadmap"];
  topics: PreparationPlanContent["topics"];
  questions: PreparationPlanContent["questions"];
  projectDiscussionTopics: string[];
  practiceSequence: string[];
  generalRoleBased: boolean;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

function defaultCategories(interviewType: string, requiredSkills: string[]): string[] {
  const technical = isTechnicalInterviewType(interviewType);
  const categories = new Set<string>();
  const skills = requiredSkills.map((skill) => skill.toLowerCase());

  if (skills.some((skill) => skill.includes("sql"))) categories.add("sql");
  if (skills.some((skill) => skill.includes("python"))) categories.add("python");
  if (skills.some((skill) => skill.includes("pyspark") || skill.includes("spark"))) categories.add("pyspark");
  if (skills.some((skill) => skill.includes("azure"))) categories.add("azure");
  if (skills.some((skill) => skill.includes("databricks"))) categories.add("databricks");

  if (technical) {
    categories.add("data_engineering");
    categories.add("system_design");
    if (categories.size < 3) categories.add("architecture");
  } else {
    categories.add("behavioral");
    categories.add("hr");
    if (interviewType === "managerial") categories.add("managerial");
  }

  return Array.from(categories).slice(0, 5);
}

/**
 * InterviewPlanService — AI preparation plans, persisted and scoped.
 */
export class InterviewPlanService {
  async getLatest(professionalIdentityId: string, profileId: string): Promise<PreparationPlanData | null> {
    await this.assertOwnedProfile(professionalIdentityId, profileId);
    const plan = await prisma.preparationPlan.findFirst({
      where: { interviewProfileId: profileId },
      orderBy: { createdAt: "desc" },
    });
    return plan ? this.toData(plan) : null;
  }

  async generate(
    professionalIdentityId: string,
    profileId: string,
    options?: { roundId?: string | null; categories?: string[] },
  ): Promise<PreparationPlanData> {
    const profile = await prisma.interviewProfile.findFirst({
      where: { id: profileId, professionalIdentityId },
    });
    if (!profile) throw new InterviewNotFoundError("Interview profile not found.");

    let round = null;
    if (options?.roundId) {
      round = await prisma.interviewRound.findFirst({
        where: { id: options.roundId, interviewProfileId: profileId },
      });
      if (!round) throw new InterviewValidationError("That interview round was not found for this profile.");
    }

    const context = await buildProfileContext(professionalIdentityId, profile, round);
    const categories =
      options?.categories && options.categories.length > 0
        ? options.categories
        : defaultCategories(profile.interviewType, profile.requiredSkills);

    const service = getAIService();
    const content = await service.interviewPlan({ context, categories, existingPlan: false });

    const plan = await prisma.preparationPlan.create({
      data: {
        interviewProfileId: profile.id,
        roundId: round?.id ?? null,
        generatedContent: content as never,
        topics: content.topics as never,
        questions: content.questions as never,
        progress: 0,
      },
    });

    return this.toData(plan);
  }

  /** Progress = share of plan questions that have at least one completed answer. */
  async refreshProgress(professionalIdentityId: string, profileId: string): Promise<number> {
    await this.assertOwnedProfile(professionalIdentityId, profileId);
    const plan = await prisma.preparationPlan.findFirst({
      where: { interviewProfileId: profileId },
      orderBy: { createdAt: "desc" },
    });
    if (!plan) return 0;

    const questions = Array.isArray(plan.questions) ? (plan.questions as { question?: string }[]) : [];
    if (questions.length === 0) return 0;

    const sessions = await prisma.practiceSession.findMany({
      where: { interviewProfileId: profileId },
      select: { answers: true },
    });

    const answered = new Set<string>();
    for (const session of sessions) {
      const answers = Array.isArray(session.answers) ? (session.answers as { questionText?: string }[]) : [];
      for (const answer of answers) {
        if (answer?.questionText) answered.add(answer.questionText.trim().toLowerCase());
      }
    }

    const covered = questions.filter((question) =>
      question.question ? answered.has(question.question.trim().toLowerCase()) : false,
    ).length;

    const progress = Math.round((covered / questions.length) * 100);
    if (progress !== plan.progress) {
      await prisma.preparationPlan.update({ where: { id: plan.id }, data: { progress } });
    }
    return progress;
  }

  private async assertOwnedProfile(professionalIdentityId: string, profileId: string): Promise<void> {
    const profile = await prisma.interviewProfile.findFirst({
      where: { id: profileId, professionalIdentityId },
      select: { id: true },
    });
    if (!profile) throw new InterviewNotFoundError("Interview profile not found.");
  }

  private toData(plan: {
    id: string;
    interviewProfileId: string;
    roundId: string | null;
    generatedContent: unknown;
    topics: unknown;
    questions: unknown;
    progress: number;
    createdAt: Date;
    updatedAt: Date;
  }): PreparationPlanData {
    const content = (plan.generatedContent ?? {}) as Partial<PreparationPlanContent>;
    return {
      id: plan.id,
      interviewProfileId: plan.interviewProfileId,
      roundId: plan.roundId,
      summary: content.summary ?? "",
      roadmap: content.roadmap ?? [],
      topics: (plan.topics as PreparationPlanContent["topics"]) ?? [],
      questions: (plan.questions as PreparationPlanContent["questions"]) ?? [],
      projectDiscussionTopics: content.projectDiscussionTopics ?? [],
      practiceSequence: content.practiceSequence ?? [],
      generalRoleBased: content.generalRoleBased ?? true,
      progress: plan.progress,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }
}

export const interviewPlanService = new InterviewPlanService();
