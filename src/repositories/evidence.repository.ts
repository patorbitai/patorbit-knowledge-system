"use strict";

import { prisma } from "@/lib/prisma";
import type { EvidenceRecord } from "@prisma/client";

export const evidenceRepository = {
  async create(data: {
    id: string;
    userId: string;
    claimId: string;
    evidenceType: string;
    evidenceKind: string;
    content: string;
    format: string;
    metadata: string;
    status: string;
    confidence: number;
    notes?: string;
    visibility: string;
    consent: boolean;
  }): Promise<EvidenceRecord> {
    return prisma.evidenceRecord.create({ data });
  },

  async findById(id: string): Promise<EvidenceRecord | null> {
    return prisma.evidenceRecord.findUnique({ where: { id } });
  },

  async findByUserId(userId: string): Promise<EvidenceRecord[]> {
    return prisma.evidenceRecord.findMany({ where: { userId } });
  },

  async findByClaimId(claimId: string): Promise<EvidenceRecord[]> {
    return prisma.evidenceRecord.findMany({ where: { claimId } });
  },

  async findByClaimIdWithClaim(claimId: string): Promise<(EvidenceRecord & { claim: import("@prisma/client").Claim | null })[]> {
    return prisma.evidenceRecord.findMany({
      where: { claimId },
      include: { claim: true },
    });
  },

  async delete(id: string): Promise<EvidenceRecord> {
    return prisma.evidenceRecord.delete({ where: { id } });
  },
};
