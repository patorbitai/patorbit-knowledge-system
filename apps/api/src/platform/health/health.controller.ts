import { Controller, Get } from "@nestjs/common";
import { HealthCheck,type HealthCheckService } from "@nestjs/terminus";

import { Public } from "../../auth/decorators/public.decorator";
import { type PrismaHealthIndicator } from "./indicators/prisma.health";

@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.isHealthy("database"),
    ]);
  }
}
