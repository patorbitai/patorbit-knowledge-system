"use strict";

/**
 * M5 Application Event Service (Patorbit Phase 1).
 *
 * Records the lifecycle history of job applications:
 *  - Status changes (applied → interview → offer/rejected)
 *  - Interview scheduling and completion
 *  - Outcome recording
 *
 * Preserves history so previous states are not lost.
 */

import { prisma } from "@/lib/prisma";

/* ── Types ──────────────────────────────────────────────────────────────── */

export type EventType =
  | "status_change"
  | "interview_scheduled"
  | "interview_completed"
  | "outcome_recorded";

export type InterviewStage =
  | "phone_screen"
  | "technical"
  | "behavioral"
  | "final"
  | "onsite";

export type InterviewType = "phone" | "video" | "in_person" | "take_home";

export type ApplicationOutcome =
  | "offer"
  | "rejected"
  | "withdrawn"
  | "no_response"
  | "ghosted";

export interface CreateEventInput {
  applicationId: string;
  eventType: EventType;
  previousStatus?: string;
  newStatus?: string;
  interviewStage?: InterviewStage;
  interviewType?: InterviewType;
  interviewDate?: string;
  outcome?: ApplicationOutcome;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ApplicationEventData {
  id: string;
  applicationId: string;
  eventType: string;
  previousStatus: string | null;
  newStatus: string | null;
  interviewStage: string | null;
  interviewType: string | null;
  interviewDate: string | null;
  outcome: string | null;
  notes: string | null;
  metadata: unknown;
  createdAt: string;
}

/* ── Valid transitions ───────────────────────────────────────────────────── */

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  saved: ["ready_to_apply", "applied"],
  ready_to_apply: ["applied", "saved"],
  applied: ["interview", "rejected", "withdrawn", "no_response"],
  interview: ["offer", "rejected", "interview"], // can stay in interview for multiple rounds
  offer: ["rejected", "withdrawn"],
  rejected: [],
  withdrawn: [],
  no_response: [],
};

function isValidTransition(from: string, to: string): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/* ── Service ────────────────────────────────────────────────────────────── */

export class ApplicationEventService {
  /**
   * Record a lifecycle event for a job application.
   * Automatically validates status transitions and preserves history.
   */
  async recordEvent(
    professionalIdentityId: string,
    input: CreateEventInput,
  ): Promise<ApplicationEventData> {
    // Verify application ownership
    const application = await prisma.jobApplication.findFirst({
      where: {
        applicationId: input.applicationId,
        professionalIdentityId,
      },
    });

    if (!application) {
      throw new Error("Application not found");
    }

    // Validate status transition if provided
    if (input.previousStatus && input.newStatus) {
      if (!isValidTransition(input.previousStatus, input.newStatus)) {
        throw new Error(
          `Invalid status transition: ${input.previousStatus} → ${input.newStatus}`,
        );
      }
    }

    // Create the event
    const event = await prisma.applicationEvent.create({
      data: {
        applicationId: input.applicationId,
        professionalIdentityId,
        eventType: input.eventType,
        previousStatus: input.previousStatus ?? null,
        newStatus: input.newStatus ?? null,
        interviewStage: input.interviewStage ?? null,
        interviewType: input.interviewType ?? null,
        interviewDate: input.interviewDate ? new Date(input.interviewDate) : null,
        outcome: input.outcome ?? null,
        notes: input.notes ?? null,
        metadata: (input.metadata as Record<string, string | number | boolean | null> | undefined) ?? undefined,
      },
    });

    // Update application status if this is a status change event
    if (input.newStatus && input.eventType === "status_change") {
      await prisma.jobApplication.update({
        where: { applicationId: input.applicationId },
        data: { status: input.newStatus },
      });
    }

    return this.toEventData(event);
  }

  /**
   * Record a status change event.
   * Convenience method for status_change events.
   */
  async recordStatusChange(
    professionalIdentityId: string,
    applicationId: string,
    newStatus: string,
    notes?: string,
  ): Promise<ApplicationEventData> {
    // Get current status
    const application = await prisma.jobApplication.findFirst({
      where: { applicationId, professionalIdentityId },
      select: { status: true },
    });

    if (!application) {
      throw new Error("Application not found");
    }

    return this.recordEvent(professionalIdentityId, {
      applicationId,
      eventType: "status_change",
      previousStatus: application.status,
      newStatus,
      notes,
    });
  }

  /**
   * Record an interview event.
   */
  async recordInterview(
    professionalIdentityId: string,
    applicationId: string,
    data: {
      stage: InterviewStage;
      type: InterviewType;
      date?: string;
      notes?: string;
      completed?: boolean;
    },
  ): Promise<ApplicationEventData> {
    const eventType: EventType = data.completed
      ? "interview_completed"
      : "interview_scheduled";

    return this.recordEvent(professionalIdentityId, {
      applicationId,
      eventType,
      interviewStage: data.stage,
      interviewType: data.type,
      interviewDate: data.date,
      notes: data.notes,
    });
  }

  /**
   * Record an application outcome.
   */
  async recordOutcome(
    professionalIdentityId: string,
    applicationId: string,
    outcome: ApplicationOutcome,
    notes?: string,
  ): Promise<ApplicationEventData> {
    // Map outcome to status
    const statusMap: Record<ApplicationOutcome, string> = {
      offer: "offer",
      rejected: "rejected",
      withdrawn: "withdrawn",
      no_response: "no_response",
      ghosted: "no_response",
    };

    const newStatus = statusMap[outcome];

    return this.recordEvent(professionalIdentityId, {
      applicationId,
      eventType: "outcome_recorded",
      newStatus,
      outcome,
      notes,
    });
  }

  /**
   * List all events for an application, ordered by creation time.
   */
  async listEvents(
    professionalIdentityId: string,
    applicationId: string,
  ): Promise<ApplicationEventData[]> {
    // Verify ownership
    const application = await prisma.jobApplication.findFirst({
      where: { applicationId, professionalIdentityId },
    });

    if (!application) {
      throw new Error("Application not found");
    }

    const events = await prisma.applicationEvent.findMany({
      where: { applicationId },
      orderBy: { createdAt: "asc" },
    });

    return events.map((e) => this.toEventData(e));
  }

  /**
   * List all events for an identity (across all applications).
   */
  async listAllEvents(
    professionalIdentityId: string,
  ): Promise<ApplicationEventData[]> {
    const events = await prisma.applicationEvent.findMany({
      where: { professionalIdentityId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return events.map((e) => this.toEventData(e));
  }

  private toEventData(event: {
    id: string;
    applicationId: string;
    eventType: string;
    previousStatus: string | null;
    newStatus: string | null;
    interviewStage: string | null;
    interviewType: string | null;
    interviewDate: Date | null;
    outcome: string | null;
    notes: string | null;
    metadata: unknown;
    createdAt: Date;
  }): ApplicationEventData {
    return {
      id: event.id,
      applicationId: event.applicationId,
      eventType: event.eventType,
      previousStatus: event.previousStatus,
      newStatus: event.newStatus,
      interviewStage: event.interviewStage,
      interviewType: event.interviewType,
      interviewDate: event.interviewDate?.toISOString() ?? null,
      outcome: event.outcome,
      notes: event.notes,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    };
  }
}

export const applicationEventService = new ApplicationEventService();
