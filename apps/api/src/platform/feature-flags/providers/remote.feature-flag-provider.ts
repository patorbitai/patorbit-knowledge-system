import { Injectable, Logger } from "@nestjs/common";

import  { type FeatureFlag, type FeatureFlagProvider } from "../feature-flags.provider";

@Injectable()
export class RemoteFeatureFlagProvider implements FeatureFlagProvider {
  private readonly logger = new Logger(RemoteFeatureFlagProvider.name);
  readonly name = "remote";

  private flags: Map<string, FeatureFlag> = new Map();

  async isEnabled(name: string): Promise<boolean> {
    // In production, this would query a database or external service
    const flag = this.flags.get(name);
    if (!flag) {
      this.logger.debug(`Flag "${name}" not found, defaulting to false`);
      return false;
    }
    return flag.enabled;
  }

  async getAll(): Promise<FeatureFlag[]> {
    return Array.from(this.flags.values());
  }

  async set(name: string, enabled: boolean): Promise<void> {
    this.flags.set(name, { name, enabled });
    // In production: await this.prisma.featureFlag.upsert(...)
    this.logger.log(`[Remote] Feature flag "${name}" set to ${enabled}`);
  }

  async delete(name: string): Promise<void> {
    this.flags.delete(name);
    // In production: await this.prisma.featureFlag.delete(...)
    this.logger.log(`[Remote] Feature flag "${name}" deleted`);
  }
}
