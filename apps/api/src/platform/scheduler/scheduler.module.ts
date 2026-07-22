import { type DynamicModule, Global, Module, type Provider } from "@nestjs/common";

import { BullSchedulerProvider } from "./providers/bull.scheduler-provider";
import { InMemorySchedulerProvider } from "./providers/in-memory.scheduler-provider";
import { SCHEDULER_PROVIDER } from "./scheduler.constants";
import { SchedulerService } from "./scheduler.service";

export type SchedulerProviderType = "in-memory" | "bull";

export interface SchedulerModuleOptions {
  provider: SchedulerProviderType;
}

@Global()
@Module({})
export class SchedulerModule {
  static forRoot(options?: SchedulerModuleOptions): DynamicModule {
    const providerType = options?.provider ?? "in-memory";

    const provider: Provider =
      providerType === "bull"
        ? {
            provide: SCHEDULER_PROVIDER,
            useClass: BullSchedulerProvider,
          }
        : {
            provide: SCHEDULER_PROVIDER,
            useClass: InMemorySchedulerProvider,
          };

    return {
      module: SchedulerModule,
      global: true,
      providers: [provider, SchedulerService],
      exports: [SchedulerService],
    };
  }
}
