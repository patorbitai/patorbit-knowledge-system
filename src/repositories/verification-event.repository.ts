"use strict";

import { prisma } from "@/lib/prisma";
import type { VerificationEvent, Prisma } from "@prisma/client";

/**
 * VerificationEventRepository — persistence for the VerificationEvent domain.
 *
 * VerificationEvents are append-only audit records. They are never updated
 * or deleted after creation. The repository exposes only create and read
 * operations — no update or delete.
 *
 * All queries are scoped to a Claim or EvidenceRecord context.
 */
export const verificationEventRepository = {
  async create(data: {
    claimId: string;
    evidenceRecordId?: string;
    eventType: string;
    previousStatus?: string;
    resultingStatus: string;
    outcome?: string;
    reason?: string;
    actorId?: string;
    actorType?: string;
    metadata?: unknown;
  }): Promise<VerificationEvent> {
    return prisma.verificationEvent.create({
      data: {
        claimId: data.claimId,
        evidenceRecordId: data.evidenceRecordId ?? null,
        eventType: data.eventType,
        previousStatus: data.previousStatus ?? null,
        resultingStatus: data.resultingStatus,
        outcome: data.outcome ?? null,
        reason: data.reason ?? null,
        actorId: data.actorId ?? null,
        actorType: data.actorType ?? "user",
        metadata: data.metadata ?? undefined,
      },
    });
  },

  async findById(id: string): Promise<VerificationEvent | null> {
    return prisma.verificationEvent.findUnique({ where: { id } });
  },

  /**
   * List verification history for a Claim, ordered chronologically.
   */
  async findByClaimId(claimId: string): Promise<VerificationEvent[]> {
    return prisma.verificationEvent.findMany({
      where: { claimId },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * List verification events for a specific EvidenceRecord.
   */
  async findByEvidenceRecordId(evidenceRecordId: string): Promise<VerificationEvent[]> {
    return prisma.verificationEvent.findMany({
      where: { evidenceRecordId },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Get the most recent verification event for a Claim.
   */
  async findLatestByClaimId(claimId: string): Promise<VerificationEvent | null> {
    return prisma.verificationEvent.findFirst({
      where: { claimId },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Count verification events for a Claim.
   */
  async countByClaimId(claimId: string): Promise<number> {
    return prisma.verificationEvent.count({ where: { claimId } });
  },
};
