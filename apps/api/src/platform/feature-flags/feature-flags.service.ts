import { Inject, Injectable, Logger } from "@nestjs/common";
import { FEATURE_FLAG_PROVIDER } from "./feature-flags.constants";
import type { FeatureFlag, FeatureFlagProvider } from "./feature-flags.provider";

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(
    @Inject(FEATURE_FLAG_PROVIDER)
    private readonly provider: FeatureFlagProvider
  ) {}

  get providerName(): string {
    return this.provider.name;
  }

  isEnabled(name: string): boolean {
    return this.provider.isEnabled(name);
  }

  async getAll(): Promise<FeatureFlag[]> {
    return this.provider.getAll();
  }

  async enable(name: string): Promise<void> {
    await this.provider.set(name, true);
    this.logger.log(`Feature flag "${name}" enabled`);
  }

  async disable(name: string): Promise<void> {
    await this.provider.set(name, false);
    this.logger.log(`Feature flag "${name}" disabled`);
  }

  async delete(name: string): Promise<void> {
    await this.provider.delete(name);
    this.logger.log(`Feature flag "${name}" deleted`);
  }
}