import { type DynamicModule, Global, Module, type Provider } from "@nestjs/common";

import { FEATURE_FLAG_PROVIDER } from "./feature-flags.constants";
import { FeatureFlagsService } from "./feature-flags.service";
import { LocalFeatureFlagProvider } from "./providers/local.feature-flag-provider";
import { RemoteFeatureFlagProvider } from "./providers/remote.feature-flag-provider";

export type FeatureFlagProviderType = "local" | "remote";

export interface FeatureFlagsModuleOptions {
  provider?: FeatureFlagProviderType;
}

@Global()
@Module({})
export class FeatureFlagsModule {
  static forRoot(options?: FeatureFlagsModuleOptions): DynamicModule {
    const providerType = options?.provider ?? "local";

    const provider: Provider =
      providerType === "remote"
        ? {
            provide: FEATURE_FLAG_PROVIDER,
            useClass: RemoteFeatureFlagProvider,
          }
        : {
            provide: FEATURE_FLAG_PROVIDER,
            useClass: LocalFeatureFlagProvider,
          };

    return {
      module: FeatureFlagsModule,
      global: true,
      providers: [provider, FeatureFlagsService],
      exports: [FeatureFlagsService],
    };
  }
}