import { Injectable, Logger } from "@nestjs/common";
import {
  HealthCheckError,
  HealthIndicator,
  type HealthIndicatorResult,
} from "@nestjs/terminus";

import { CacheService } from "../../cache/cache.service";

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(RedisHealthIndicator.name);

  constructor(private readonly cacheService: CacheService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Attempt a simple set + get cycle to verify Redis connectivity
      const testKey = `health:${key}:${Date.now()}`;
      await this.cacheService.set(testKey, "ok", 5);
      const result = await this.cacheService.get<string>(testKey);
      await this.cacheService.del(testKey);

      const isRedis =
        result === "ok" || this.cacheService.providerName === "redis";

      if (isRedis) {
        return this.getStatus(key, true, {
          provider: this.cacheService.providerName,
        });
      }

      throw new Error("Cache provider is not Redis (in-memory fallback active)");
    } catch (error) {
      throw new HealthCheckError(
        "Redis health check failed",
        this.getStatus(key, false, {
          provider: this.cacheService.providerName,
          message: (error as Error).message,
        })
      );
    }
  }
}
