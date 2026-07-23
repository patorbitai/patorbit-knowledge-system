import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { DatabaseModule } from "@patorbit/database";

import { HealthController } from "./health.controller";
import { PrismaHealthIndicator } from "./indicators/prisma.health";
import { RedisHealthIndicator } from "./indicators/redis.health";
import { StorageHealthIndicator } from "./indicators/storage.health";

@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: "json",
      logger: true,
    }),
    DatabaseModule,
  ],
  controllers: [HealthController],
  providers: [
    PrismaHealthIndicator,
    RedisHealthIndicator,
    StorageHealthIndicator,
  ],
})
export class HealthModule {}
