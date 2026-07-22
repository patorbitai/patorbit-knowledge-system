import { Injectable } from "@nestjs/common";
import { HealthCheckError,HealthIndicator, type HealthIndicatorResult } from "@nestjs/terminus";
import { type PrismaService } from '@patorbit/database';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (e) {
      throw new HealthCheckError("Prisma health check failed", this.getStatus(key, false));
    }
  }
}
