import { Injectable, Logger } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';

import { type StorageService } from '../../storage/storage.service';

@Injectable()
export class StorageHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(StorageHealthIndicator.name);

  constructor(private readonly storageService: StorageService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const providerName = this.storageService.name;

      // For disk provider, check if temp file operations work
      const testKey = `health-${Date.now()}.tmp`;
      await this.storageService.upload(testKey, Buffer.from('health-check'));
      await this.storageService.delete(testKey);

      return this.getStatus(key, true, { provider: providerName });
    } catch (error) {
      throw new HealthCheckError(
        'Storage health check failed',
        this.getStatus(key, false, {
          provider: this.storageService.name,
          message: (error as Error).message,
        }),
      );
    }
  }
}
