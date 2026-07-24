// apps/api/src/billing/billing.module.ts
import { Module } from '@nestjs/common';
import { FeatureGatingService, PLANS } from '@patorbit/billing';
import { DatabaseModule } from '@patorbit/database';

import { BillingController } from './billing.controller';
import { BillingRepository } from './billing.repository';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BillingController],
  providers: [
    SubscriptionService,
    BillingRepository,
    { provide: FeatureGatingService, useValue: new FeatureGatingService() },
    {
      provide: 'BILLING_PLANS',
      useValue: PLANS,
    },
  ],
  exports: [SubscriptionService, FeatureGatingService],
})
export class BillingModule {}
