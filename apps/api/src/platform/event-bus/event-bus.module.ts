import { DynamicModule, Global, Module, Provider, Type } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { EventBusService } from "./event-bus.service";
import { EVENT_BUS, EVENT_BUS_MODULE_OPTIONS } from "./event-bus.constants";
import { DeadLetterService } from "./services/dead-letter.service";
import { OutboxService } from "./services/outbox.service";
import { RetryService } from "./services/retry.service";
import type { Event, EventHandler } from "./event-bus.provider";
import type { RetryOptions } from "./services/retry.service";

export interface EventBusModuleOptions {
  /**
   * If true, enables the outbox pattern. Events are stored before publishing
   * and processed by a background job. Defaults to false.
   */
  useOutbox?: boolean;
  /**
   * If true, enables the dead-letter queue. After all retries fail,
   * the event is moved to the DLQ. Defaults to true.
   */
  useDeadLetterQueue?: boolean;
  /** Default retry policy for all handlers. */
  defaultRetryPolicy?: Partial<RetryOptions>;
  /** Default timeout for each handler attempt. Zero disables it. */
  defaultHandlerTimeoutMs?: number;
  /** Custom injectable providers for the event bus module. */
  providers?: Provider[];
  /** Exports to make available from the event bus module. */
  exports?: any[];
}

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    DiscoveryModule,
  ],
  providers: [
    { provide: EVENT_BUS, useClass: EventBusService },
    OutboxService,
    DeadLetterService,
    RetryService,
  ],
  exports: [EVENT_BUS, OutboxService, DeadLetterService],
})
export class EventBusModule {
  static forRoot(options: EventBusModuleOptions = {}): DynamicModule {
    const {
      useOutbox = false,
      useDeadLetterQueue = true,
      defaultRetryPolicy,
      defaultHandlerTimeoutMs = 0,
    } = options;

    return {
      module: EventBusModule,
      providers: [
        {
          provide: EVENT_BUS_MODULE_OPTIONS,
          useValue: {
            useOutbox,
            useDeadLetterQueue,
            defaultRetryPolicy,
            defaultHandlerTimeoutMs,
          },
        },
        ...(options.providers ?? []),
      ],
      exports: [EVENT_BUS, ...(options.exports ?? [])],
    };
  }

  static forFeature(handlers: Type<EventHandler<Event>>[]): DynamicModule {
    return {
      module: EventBusModule,
      providers: handlers,
      exports: handlers,
    };
  }
}
