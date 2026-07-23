import { type PrismaService } from '@patorbit/database';
import { FeatureGatingService } from './feature-gating.service';

export class SeatManager {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureGating: FeatureGatingService,
  ) {}

  async getSeatCount(organizationId: string): Promise<number> {
    return this.prisma.license.count({ where: { organizationId, status: 'active' } });
  }

  async getAvailableSeats(organizationId: string, subscriptionTier: any): Promise<number> {
    const current = await this.getSeatCount(organizationId);
    const limits = this.featureGating.getLimits(subscriptionTier);
    return Math.max(0, limits.maxRecruiterSeats - current);
  }

  async canAssignSeat(organizationId: string, subscriptionTier: any): Promise<boolean> {
    return (await this.getAvailableSeats(organizationId, subscriptionTier)) > 0;
  }

  async assignSeat(organizationId: string, subscriptionId: string, userId: string): Promise<any> {
    return this.prisma.license.create({
      data: {
        organizationId,
        subscriptionId,
        assignedUserId: userId,
        status: 'active',
        assignedAt: new Date(),
      },
    });
  }

  async unassignSeat(licenseId: string): Promise<any> {
    return this.prisma.license.update({
      where: { id: licenseId },
      data: { status: 'revoked', revokedAt: new Date() },
    });
  }

  async listSeats(organizationId: string): Promise<any[]> {
    return this.prisma.license.findMany({ where: { organizationId } });
  }

  async getSeatsByOrganization(organizationId: string): Promise<any[]> {
    return this.listSeats(organizationId);
  }
}
