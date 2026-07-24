// apps/api/src/billing/billing.repository.ts
import { Injectable } from '@nestjs/common';
import { type PrismaService } from '@patorbit/database';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSubscriptionByOrganization(organizationId: string) {
    return this.prisma.subscription.findFirst({
      where: { organizationId },
    });
  }

  async upsertSubscription(
    organizationId: string,
    data: {
      plan?: string;
      status?: string;
      stripeSubscriptionId?: string;
      features?: Record<string, any>;
      currentPeriodEnd: Date;
      trialEndsAt?: Date | null;
      cancelAtPeriodEnd?: boolean;
    },
  ) {
    const existing = await this.findSubscriptionByOrganization(organizationId);
    if (existing) {
      return this.prisma.subscription.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.subscription.create({
      data: { organizationId, ...data },
    });
  }
}
