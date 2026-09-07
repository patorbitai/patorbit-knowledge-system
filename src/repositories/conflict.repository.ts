"use strict";

import { prisma } from "@/lib/prisma";
import type { ConflictRecord, Prisma } from "@prisma/client";

/**
 * ConflictRepository — persistence layer for detected conflicts.
 *
 * Conflicts belong to ProfessionalIdentity (ADR-002 Phase 5).
 * Every query is scoped to a ProfessionalIdentity — no cross-user queries.
 */
export const conflictRepository = {
  async create(data: {
    professionalIdentityId: string;
    conflictType: string;
    severity: string;
    description: string;
    claimIds: string[];
    status?: string;
  }): Promise<ConflictRecord> {
    return prisma.conflictRecord.create({
      data: {
        professionalIdentityId: data.professionalIdentityId,
        conflictType: data.conflictType,
        severity: data.severity,
        description: data.description,
        claimIds: data.claimIds,
        status: data.status ?? "new",
      },
    });
  },

  async findById(id: string): Promise<ConflictRecord | null> {
    return prisma.conflictRecord.findUnique({ where: { id } });
  },

  async findByProfessionalIdentityId(
    professionalIdentityId: string,
    options?: {
      status?: string;
      conflictType?: string;
      include?: Prisma.ConflictRecordInclude;
    },
  ): Promise<ConflictRecord[]> {
    const where: Prisma.ConflictRecordWhereInput = { professionalIdentityId };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.conflictType) {
      where.conflictType = options.conflictType;
    }
    return prisma.conflictRecord.findMany({
      where,
      include: options?.include,
      orderBy: { detectedAt: "desc" },
    });
  },

  async update(
    id: string,
    data: Prisma.ConflictRecordUpdateInput,
  ): Promise<ConflictRecord> {
    return prisma.conflictRecord.update({ where: { id }, data });
  },

  async delete(id: string): Promise<ConflictRecord> {
    return prisma.conflictRecord.delete({ where: { id } });
  },

  async countByProfessionalIdentityId(
    professionalIdentityId: string,
  ): Promise<number> {
    return prisma.conflictRecord.count({ where: { professionalIdentityId } });
  },

  async findExistingConflicts(
    professionalIdentityId: string,
    conflictType: string,
    claimIds: string[],
  ): Promise<ConflictRecord[]> {
    // Find conflicts of the same type that involve any of the same claim IDs
    return prisma.conflictRecord.findMany({
      where: {
        professionalIdentityId,
        conflictType,
        status: { notIn: ["dismissed", "resolved"] },
        claimIds: { hasSome: claimIds },
      },
    });
  },
};
