import { type DynamicModule, Global, Module, type Provider, type Type } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { EVENT_BUS, EVENT_BUS_MODULE_OPTIONS } from './event-bus.constants';
import { type Event, type EventHandler } from './event-bus.provider';
import { EventBusService } from './event-bus.service';
import { DeadLetterService } from './services/dead-letter.service';
import { OutboxService } from './services/outbox.service';
import { type RetryOptions } from './services/retry.service';
import { RetryService } from './services/retry.service';

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
    { provide: OUTBOX_SERVICE, useClass: OutboxService },
    { provide: DEAD_LETTER_SERVICE, useClass: DeadLetterService },
    { provide: RETRY_SERVICE, useClass: RetryService },
  ],
  exports: [EVENT_BUS, OUTBOX_SERVICE, DEAD_LETTER_SERVICE, RETRY_SERVICE],
})
export class EventBusModule {
  static forRoot(options: EventBusModuleOptions = {}): DynamicModule {
    // Support legacy option names used in some tests (enableOutbox, enableDeadLetter, maxRetries, retryDelay, handlerTimeout)
    const opts: any = options || {};
    const useOutbox = opts.useOutbox ?? opts.enableOutbox ?? false;
    const useDeadLetterQueue = opts.useDeadLetterQueue ?? opts.enableDeadLetter ?? true;
    const defaultRetryPolicy = opts.defaultRetryPolicy ?? {
      maxRetries: opts.maxRetries,
      delayMs: opts.retryDelay,
      backoff: opts.backoff ?? 'exponential',
    };
    const defaultHandlerTimeoutMs = opts.defaultHandlerTimeoutMs ?? opts.handlerTimeout ?? 0;

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
