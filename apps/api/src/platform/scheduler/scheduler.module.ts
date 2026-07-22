import { Module, DynamicModule, Global, Provider } from "@nestjs/common";
import { SchedulerService } from "./scheduler.service";
import { SCHEDULER_PROVIDER } from "./scheduler.constants";
import { InMemorySchedulerProvider } from "./providers/in-memory.scheduler-provider";
import { BullSchedulerProvider } from "./providers/bull.scheduler-provider";

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
