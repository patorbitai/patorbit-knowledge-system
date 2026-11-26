"use strict";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        professionalIdentity: {
          include: {
            // Interview Preparation data is personal data and must be included
            // in a full account export. Mailbox tokens are never included —
            // only the connection metadata the user already sees in the UI.
            interviewProfiles: {
              include: {
                rounds: true,
                plans: true,
                sessions: true,
                emails: true,
                savedQuestions: true,
              },
            },
            savedPracticeQuestions: true,
            interviewEmailConnections: {
              select: {
                provider: true,
                accountEmail: true,
                scope: true,
                connectedAt: true,
              },
            },
          },
        },
        accounts: true,
        sessions: true,
        evidenceRecords: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let trustReportCache = null;
    try {
      if (user.professionalIdentity?.trustReportCache) {
        trustReportCache = JSON.parse(user.professionalIdentity.trustReportCache);
      }
    } catch {
      trustReportCache = user.professionalIdentity?.trustReportCache;
    }

    let passportDataCache = null;
    try {
      if (user.professionalIdentity?.passportDataCache) {
        passportDataCache = JSON.parse(user.professionalIdentity.passportDataCache);
      }
    } catch {
      passportDataCache = user.professionalIdentity?.passportDataCache;
    }

    const exportData = {
      exportVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      dataSource: "server-database",
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      professionalIdentity: user.professionalIdentity ? {
        trustShareEnabled: user.professionalIdentity.trustShareEnabled,
        passportShareEnabled: user.professionalIdentity.passportShareEnabled,
        trustReportCache,
        passportDataCache,
        createdAt: user.professionalIdentity.createdAt,
        updatedAt: user.professionalIdentity.updatedAt,
      } : null,
      connectedAccounts: user.accounts.map((acc) => ({
        provider: acc.provider,
        type: acc.type,
      })),
      evidenceRecords: user.evidenceRecords.map((e) => ({
        id: e.id,
        claimId: e.claimId,
        evidenceType: e.evidenceType,
        evidenceKind: e.evidenceKind,
        format: e.format,
        metadata: JSON.parse(e.metadata),
        status: e.status,
        visibility: e.visibility,
        createdAt: e.createdAt,
      })),
      interviewPreparation: user.professionalIdentity
        ? {
            profiles: user.professionalIdentity.interviewProfiles.map((profile) => ({
              id: profile.id,
              companyName: profile.companyName,
              jobTitle: profile.jobTitle,
              experienceYears: profile.experienceYears,
              jobDescription: profile.jobDescription,
              requiredSkills: profile.requiredSkills,
              preferredSkills: profile.preferredSkills,
              seniority: profile.seniority,
              interviewDate: profile.interviewDate,
              timezone: profile.timezone,
              durationMinutes: profile.durationMinutes,
              interviewRound: profile.interviewRound,
              interviewFormat: profile.interviewFormat,
              interviewType: profile.interviewType,
              notes: profile.notes,
              status: profile.status,
              source: profile.source,
              createdAt: profile.createdAt,
              rounds: profile.rounds.map((round) => ({
                id: round.id,
                order: round.order,
                roundName: round.roundName,
                roundType: round.roundType,
                interviewDate: round.interviewDate,
                timezone: round.timezone,
                durationMinutes: round.durationMinutes,
                status: round.status,
                notes: round.notes,
              })),
              plans: profile.plans.map((plan) => ({
                id: plan.id,
                roundId: plan.roundId,
                generatedContent: plan.generatedContent,
                topics: plan.topics,
                questions: plan.questions,
                progress: plan.progress,
                createdAt: plan.createdAt,
              })),
              sessions: profile.sessions.map((practice) => ({
                id: practice.id,
                roundId: practice.roundId,
                sessionType: practice.sessionType,
                status: practice.status,
                questions: practice.questions,
                answers: practice.answers,
                evaluation: practice.evaluation,
                overallScore: practice.overallScore,
                startedAt: practice.startedAt,
                completedAt: practice.completedAt,
              })),
              importedEmails: profile.emails.map((email) => ({
                id: email.id,
                sourceType: email.sourceType,
                subject: email.subject,
                sender: email.sender,
                receivedAt: email.receivedAt,
                originalContent: email.originalContent,
                extractedFields: email.extractedFields,
                createdAt: email.createdAt,
              })),
              savedQuestions: profile.savedQuestions.map((question) => ({
                id: question.id,
                category: question.category,
                difficulty: question.difficulty,
                text: question.text,
                suggestedAnswer: question.suggestedAnswer,
                createdAt: question.createdAt,
              })),
            })),
            savedPracticeQuestions: user.professionalIdentity.savedPracticeQuestions.map((question) => ({
              id: question.id,
              interviewProfileId: question.interviewProfileId,
              category: question.category,
              difficulty: question.difficulty,
              text: question.text,
              suggestedAnswer: question.suggestedAnswer,
              createdAt: question.createdAt,
            })),
            mailboxConnections: user.professionalIdentity.interviewEmailConnections.map((connection) => ({
              provider: connection.provider,
              accountEmail: connection.accountEmail,
              scope: connection.scope,
              connectedAt: connection.connectedAt,
            })),
          }
        : null,
      activeSessionsCount: user.sessions.length,
    };

    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="patorbit-data-export-${user.id}.json"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (err: unknown) {
    console.error("[user-export] error:", err);
    return NextResponse.json(
      { error: "Failed to export data. Please try again." },
      { status: 500 }
    );
  }
}
