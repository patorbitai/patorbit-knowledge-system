import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type { FeatureFlag, FeatureFlagProvider } from "../feature-flags.provider";

@Injectable()
export class LocalFeatureFlagProvider implements FeatureFlagProvider, OnModuleInit {
  private readonly logger = new Logger(LocalFeatureFlagProvider.name);
  readonly name = "local";

  private flags: Map<string, FeatureFlag> = new Map();

  async onModuleInit(): Promise<void> {
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith("FEATURE_")) {
        const name = key.replace("FEATURE_", "").toLowerCase();
        this.flags.set(name, {
          name,
          enabled: value === "true",
        });
      }
    }

    if (!this.flags.has("resume_builder")) {
      this.flags.set("resume_builder", { name: "resume_builder", enabled: true });
    }
    if (!this.flags.has("career_passport")) {
      this.flags.set("career_passport", { name: "career_passport", enabled: true });
    }
    if (!this.flags.has("ai_features")) {
      this.flags.set("ai_features", { name: "ai_features", enabled: false });
    }

    this.logger.log(`Initialized ${this.flags.size} feature flags from environment`);
  }

  isEnabled(name: string): boolean {
    return this.flags.get(name)?.enabled ?? false;
  }

  getAll(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  async set(name: string, enabled: boolean): Promise<void> {
    this.flags.set(name, { name, enabled });
    this.logger.log(`Feature flag "${name}" set to ${enabled}`);
  }

  async delete(name: string): Promise<void> {
    this.flags.delete(name);
    this.logger.log(`Feature flag "${name}" deleted`);
  }
}
