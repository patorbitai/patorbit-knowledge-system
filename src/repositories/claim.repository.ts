"use strict";

import { prisma } from "@/lib/prisma";
import type { Claim, Prisma } from "@prisma/client";

/**
 * ClaimRepository — persistence layer for the Claim domain entity.
 *
 * Claims belong to ProfessionalIdentity (ADR-002).
 * Every query is scoped to a ProfessionalIdentity — no cross-user queries.
 */
export const claimRepository = {
  async create(data: {
    professionalIdentityId: string;
    assertionText: string;
    claimType: string;
    sourceActivityId?: string;
    professionalFactKey?: string;
    confidence?: number;
    reasoning?: string;
    verificationStatus?: string;
    reviewed?: boolean;
    accepted?: boolean;
  }): Promise<Claim> {
    return prisma.claim.create({
      data: {
        professionalIdentityId: data.professionalIdentityId,
        assertionText: data.assertionText,
        claimType: data.claimType,
        sourceActivityId: data.sourceActivityId ?? null,
        professionalFactKey: data.professionalFactKey ?? null,
        confidence: data.confidence ?? 0.5,
        reasoning: data.reasoning ?? null,
        verificationStatus: data.verificationStatus ?? "suggested",
        reviewed: data.reviewed ?? false,
        accepted: data.accepted ?? false,
      },
    });
  },

  async findById(id: string): Promise<Claim | null> {
    return prisma.claim.findUnique({ where: { id } });
  },

  async findByProfessionalIdentityId(
    professionalIdentityId: string,
    options?: { claimType?: string; professionalFactKey?: string; include?: Prisma.ClaimInclude },
  ): Promise<Claim[]> {
    const where: Prisma.ClaimWhereInput = { professionalIdentityId };
    if (options?.claimType) {
      where.claimType = options.claimType;
    }
    if (options?.professionalFactKey) {
      where.professionalFactKey = options.professionalFactKey;
    }
    return prisma.claim.findMany({
      where,
      include: options?.include,
      orderBy: { createdAt: "desc" },
    });
  },

  async findByProfessionalFactKey(
    professionalIdentityId: string,
    professionalFactKey: string,
  ): Promise<Claim | null> {
    return prisma.claim.findFirst({
      where: {
        professionalIdentityId,
        professionalFactKey,
      },
    });
  },

  async update(
    id: string,
    data: Prisma.ClaimUpdateInput,
  ): Promise<Claim> {
    return prisma.claim.update({ where: { id }, data });
  },

  async delete(id: string): Promise<Claim> {
    return prisma.claim.delete({ where: { id } });
  },

  async countByProfessionalIdentityId(
    professionalIdentityId: string,
  ): Promise<number> {
    return prisma.claim.count({ where: { professionalIdentityId } });
  },
};
