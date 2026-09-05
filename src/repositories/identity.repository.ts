import { prisma } from "@/lib/prisma";
import type { ProfessionalIdentity } from "@prisma/client";
import type { Prisma } from "@prisma/client";

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
    // Verify the User exists before creating ProfessionalIdentity.
    // This prevents FK violations when the JWT session outlives the user record
    // (e.g. after database reset or user deletion).
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new Error("User not found — your session may have expired. Please sign in again.");
    }
    return prisma.professionalIdentity.create({ data: { userId } });
  },

  /** Update the canonical professional profile data. */
  async updateProfileData(
    id: string,
    profileData: Prisma.InputJsonValue,
  ): Promise<ProfessionalIdentity> {
    return prisma.professionalIdentity.update({
      where: { id },
      data: { profileData },
    });
  },

  /** Mark onboarding as completed. */
  async completeOnboarding(id: string): Promise<ProfessionalIdentity> {
    return prisma.professionalIdentity.update({
      where: { id },
      data: { onboardingCompleted: true },
    });
  },
};