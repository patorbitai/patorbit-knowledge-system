import { type DynamicModule,Module } from "@nestjs/common";

import { type CacheModuleOptions,PlatformCacheModule } from "./cache";
import { ConfigurationModule } from "./config";
import { EmailModule, type EmailModuleOptions } from "./email";
import { EventBusModule, type EventBusModuleOptions } from "./event-bus";
import { FeatureFlagsModule, type FeatureFlagsModuleOptions } from "./feature-flags";
import { GraphModule } from "./graph";
import { JobsModule, type JobsModuleOptions } from "./jobs";
import { LoggingModule } from "./logging";
import { MetricsModule, type MetricsModuleOptions } from "./metrics";
import { NotificationsModule } from "./notifications";
import { SchedulerModule, type SchedulerModuleOptions, type SchedulerProviderType } from "./scheduler";
import { SearchModule } from "./search";
import { StorageModule, type StorageModuleOptions, type StorageProviderType } from "./storage";

export interface PlatformConfig {
  storage?: StorageModuleOptions & { provider: StorageProviderType };
  email?: EmailModuleOptions;
  cache?: CacheModuleOptions;
  jobs?: JobsModuleOptions;
  eventBus?: EventBusModuleOptions;
  scheduler?: SchedulerModuleOptions;
  featureFlags?: FeatureFlagsModuleOptions;
  metrics?: MetricsModuleOptions;
}

@Module({})
export class PlatformModule {
  static forRoot(config?: PlatformConfig): DynamicModule {
    const imports: any[] = [
      ConfigurationModule,
      LoggingModule.forRoot(),
      StorageModule.forRoot(config?.storage ?? { provider: "disk" }),
      NotificationsModule.forRoot(),
      EmailModule.forRoot(config?.email ?? { provider: "console", queue: "memory" }),
      PlatformCacheModule.forRoot(config?.cache),
      SearchModule.forRoot(),
      GraphModule.forRoot(),
      JobsModule.forRoot(config?.jobs),
      EventBusModule.forRoot(config?.eventBus),
      SchedulerModule.forRoot(config?.scheduler),
      FeatureFlagsModule.forRoot(config?.featureFlags),
      MetricsModule.forRoot(config?.metrics),
    ];

    return {
      module: PlatformModule,
      imports,
      exports: imports,
    };
  }
}
