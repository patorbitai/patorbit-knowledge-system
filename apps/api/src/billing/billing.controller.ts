// apps/api/src/billing/billing.controller.ts
import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { type JwtPayload } from '@patorbit/auth';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type SubscriptionService } from './subscription.service';

@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionService.getAvailablePlans();
  }

  @Get('subscription')
  async getSubscription(@CurrentUser() user: JwtPayload) {
    return this.subscriptionService.getSubscription(user.sub);
  }

  @Get('limits')
  async getLimits(@CurrentUser() user: JwtPayload) {
    return this.subscriptionService.getEffectiveLimits(user.sub);
  }
}
