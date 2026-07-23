import { Controller, Get } from '@nestjs/common';
import { HealthCheck, type HealthCheckResult, type HealthCheckService } from '@nestjs/terminus';

import { Public } from '../../auth/decorators/public.decorator';
import { type PrismaHealthIndicator } from './indicators/prisma.health';
import { type RedisHealthIndicator } from './indicators/redis.health';
import { type StorageHealthIndicator } from './indicators/storage.health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly storage: StorageHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prisma.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
      () => this.storage.isHealthy('storage'),
    ]);
  }
}
