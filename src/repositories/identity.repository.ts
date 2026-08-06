import { prisma } from "@/lib/prisma";
import type { ProfessionalIdentity } from "@prisma/client";

/**
 * IdentityRepository — persistence operations for ProfessionalIdentity.
 *
 * This is the canonical owner of all business data (ADR-007). It holds the
 * persistence layer ONLY. It must never know anything about JWT, sessions,
 * cookies, or authentication — it simply persists the aggregate.
 *
 * Scale by `userId` / `id`; all domain aggregates hang off `ProfessionalIdentity`.
 */
export const identityRepository = {
  async findByUserId(userId: string): Promise<ProfessionalIdentity | null> {
    return prisma.professionalIdentity.findUnique({ where: { userId } });
  },

  async findById(id: string): Promise<ProfessionalIdentity | null> {
    return prisma.professionalIdentity.findUnique({ where: { id } });
  },

  async create(userId: string): Promise<ProfessionalIdentity> {
    return prisma.professionalIdentity.create({ data: { userId } });
  },
};