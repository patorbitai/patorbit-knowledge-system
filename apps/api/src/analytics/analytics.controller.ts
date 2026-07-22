import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('user-growth')
  getUserGrowth(@Query('days') days = '30') {
    return this.analyticsService.getUserGrowth(parseInt(days, 10));
  }

  @Get('resume-stats')
  getResumeStats() {
    return this.analyticsService.getResumeStats();
  }

  @Get('claim-stats')
  getClaimStats() {
    return this.analyticsService.getClaimStats();
  }

  @Get('timeline/:profileId')
  getTimeline(@Param('profileId') profileId: string) {
    return this.analyticsService.getTimeline(profileId);
  }
}
