import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { type DiscoveryService, type MetadataScanner, type Reflector } from "@nestjs/core";

import {
  SCHEDULE_CRON,
  SCHEDULE_INTERVAL,
  SCHEDULE_TIMEOUT,
} from "./decorators/schedule.decorator";

@Injectable()
export class ScheduleDecoratorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduleDecoratorService.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly metadataScanner: MetadataScanner
  ) {}

  onModuleInit() {
    this.discoverAndRun();
  }

  onModuleDestroy() {
    // Cleanup if needed
  }

  discoverAndRun() {
    const providers = this.discoveryService.getProviders();
    providers.forEach((wrapper) => {
      const { instance } = wrapper;
      if (!instance || typeof instance !== "object") {
        return;
      }
      const prototype = Object.getPrototypeOf(instance);
      this.metadataScanner.scanFromPrototype(
        instance,
        prototype,
        (key: string) => this.lookup(instance, key)
      );
    });
  }

  lookup(instance: any, key: string) {
    const methodRef = instance[key];
    const cronMeta = this.reflector.get(SCHEDULE_CRON, methodRef);
    if (cronMeta) {
      this.logger.log(`Scheduling cron job: ${cronMeta}`);
      // Integrate with a real scheduler here
    }

    const intervalMeta = this.reflector.get(SCHEDULE_INTERVAL, methodRef);
    if (intervalMeta) {
      this.logger.log(`Scheduling interval job: every ${intervalMeta}ms`);
      // setInterval(() => instance[key](), intervalMeta);
    }

    const timeoutMeta = this.reflector.get(SCHEDULE_TIMEOUT, methodRef);
    if (timeoutMeta) {
      this.logger.log(`Scheduling timeout job: in ${timeoutMeta}ms`);
      // setTimeout(() => instance[key](), timeoutMeta);
    }
  }
}
