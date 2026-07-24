// apps/api/src/billing/subscription.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Plan } from '@patorbit/billing';
import { type FeatureGatingService } from '@patorbit/billing';

import { type BillingRepository } from './billing.repository';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly billingRepository: BillingRepository,
    private readonly featureGating: FeatureGatingService,
    @Inject('BILLING_PLANS') private readonly plans: Plan[],
  ) {}

  async getSubscription(organizationId: string) {
    return this.billingRepository.findSubscriptionByOrganization(organizationId);
  }

  getAvailablePlans() {
    return this.plans.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getPlan(planId: string) {
    return this.plans.find((p) => p.id === planId) ?? null;
  }

  async getEffectiveLimits(organizationId: string) {
    const sub = await this.billingRepository.findSubscriptionByOrganization(organizationId);
    const planId = sub?.plan ?? 'free';
    const plan = this.getPlan(planId);
    return plan?.limits ?? this.plans.find((p) => p.id === 'free')!.limits;
  }

  async canCreateResume(organizationId: string, currentCount: number) {
    const limits = await this.getEffectiveLimits(organizationId);
    return currentCount < (limits as any).maxResumes;
  }

  async canUseAI(organizationId: string) {
    const limits = await this.getEffectiveLimits(organizationId);
    return (limits as any).hasAIAssistant;
  }
}
