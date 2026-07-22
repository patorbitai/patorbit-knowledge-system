import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { DatabaseModule } from "@patorbit/database";

import { HealthController } from "./health.controller";
import { PrismaHealthIndicator } from "./indicators/prisma.health";

@Module({
  imports: [TerminusModule, DatabaseModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
  exports: [PrismaHealthIndicator],
})
export class HealthModule {}
