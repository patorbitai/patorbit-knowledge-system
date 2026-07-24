import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
  type Type,
} from '@nestjs/common';
import { type DiscoveryService } from '@nestjs/core';
import { type EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { type EventHandlerMetadata } from './decorators/event-handler.decorator';
import {
  DEAD_LETTER_SERVICE,
  EVENT_BUS_DISPATCH_TOPIC,
  EVENT_BUS_MODULE_OPTIONS,
  EVENT_HANDLER_METADATA,
  OUTBOX_SERVICE,
  RETRY_SERVICE,
} from './event-bus.constants';
import {
  type AnyEvent,
  type EventBus as IEventBus,
  type EventHandler as IEventHandler,
  type Unsubscribe,
} from './event-bus.provider';
import { type Event } from './event-bus.provider';
import { type DeadLetterService } from './services/dead-letter.service';
import { type OutboxService } from './services/outbox.service';
import { type RetryOptions } from './services/retry.service';
import { type RetryService } from './services/retry.service';

export interface EventBusModuleOptions {
  useOutbox: boolean;
  useDeadLetterQueue: boolean;
  defaultRetryPolicy?: Partial<RetryOptions>;
  defaultHandlerTimeoutMs: number;
}

interface HandlerContext<TEvent extends Event> {
  name: string;
  metadata: EventHandlerMetadata;
  handle: (event: TEvent) => void | Promise<void>;
}

@Injectable()
export class EventBusService implements IEventBus, OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(EventBusService.name);
  private isShuttingDown = false;

  // Runtime-only fields. Test-specific state removed for cleanliness.

  private readonly optsNormalized: EventBusModuleOptions;

  constructor(
    @Inject(EVENT_BUS_MODULE_OPTIONS)
    private readonly options: EventBusModuleOptions,
    // Normal runtime dependencies: DiscoveryService and EventEmitter2
    private readonly discovery: DiscoveryService,
    private readonly emitter: EventEmitter2,
    @Inject(OUTBOX_SERVICE) private readonly outboxService: OutboxService,
    @Inject(DEAD_LETTER_SERVICE) private readonly deadLetterService: DeadLetterService,
    @Inject(RETRY_SERVICE) private readonly retryService: RetryService,
  ) {
    // Normalize legacy option names (backwards-compatible mapping)
    const anyOpts = options as unknown as Record<string, any>;
    this.optsNormalized = {
      useOutbox: anyOpts.enableOutbox ?? anyOpts.useOutbox ?? false,
      useDeadLetterQueue: anyOpts.enableDeadLetter ?? anyOpts.useDeadLetterQueue ?? false,
      defaultRetryPolicy: anyOpts.defaultRetryPolicy ?? {
        maxRetries: anyOpts.maxRetries ?? 3,
        delayMs: anyOpts.retryDelay ?? 100,
      },
      defaultHandlerTimeoutMs: anyOpts.defaultHandlerTimeoutMs ?? anyOpts.handlerTimeout ?? 0,
    };
  }

  async onApplicationBootstrap(): Promise<void> {
    this.discoverAndSubscribe();
  }

  onApplicationShutdown(): void {
    this.isShuttingDown = true;
    this.emitter.removeAllListeners();
    this.logger.log('Event bus shut down.');
  }

  async publish<TEvent extends Event>(event: TEvent | readonly TEvent[]): Promise<void> {
    if (Array.isArray(event)) return this.publishAll(event);

    if (this.isShuttingDown) return;
    const anyEvent = event as unknown as AnyEvent;
    if (this.optsNormalized.useOutbox) {
      await this.outboxService.add(anyEvent);
    }

    // Log when no handlers are registered for an event type (test expectations)
    const handlersCount = this.emitter.listeners(anyEvent.eventType).length;
    const wildcardCount = this.emitter.listeners('*').length;
    if (handlersCount === 0 && wildcardCount === 0) {
      this.logger.debug(`No handlers registered for event type: ${anyEvent.eventType}`);
    }

    // Runtime path: emit to internal dispatch topic and allow the @OnEvent handler to pick it up
    await this.emitter.emitAsync(EVENT_BUS_DISPATCH_TOPIC, anyEvent);
  }

  async publishAll<TEvent extends Event>(events: readonly TEvent[]): Promise<void> {
    for (const event of events) await this.publish(event);
  }

  subscribe<TEvent extends Event>(): Unsubscribe {
    throw new Error('Dynamic subscription is not supported; use @EventHandler() instead.');
  }

  register(handlerTypes: readonly Type<IEventHandler>[]): void {
    for (const handlerType of handlerTypes) this.subscribeProvider(handlerType);
  }

  @OnEvent(EVENT_BUS_DISPATCH_TOPIC, { async: true })
  protected async onDispatch(event: AnyEvent): Promise<void> {
    const handlers = this.emitter.listeners(event.eventType);
    const hasWildcard = this.emitter.listeners('*').length > 0;
    if (handlers.length === 0 && !hasWildcard) return;

    const outboxId = event.eventId;
    try {
      await this.emitter.emitAsync(event.eventType, event);
      if (this.optsNormalized.useOutbox) {
        await this.outboxService.markPublished(outboxId);
      }
    } catch (error) {
      if (this.optsNormalized.useOutbox) {
        await this.outboxService.markFailed(outboxId, error as Error);
      }
      this.logger.error(
        `Event dispatch for ${event.eventType} failed: ${(error as Error).message}`,
      );
    }
  }

  private discoverAndSubscribe(): void {
    this.discovery
      .getProviders()
      .filter((wrapper) => wrapper.metatype)
      .forEach((wrapper) => this.subscribeProvider(wrapper.metatype as Type<any>));
  }

  private subscribeProvider(
    provider: (abstract new (...args: never[]) => unknown) | Type<any>,
  ): void {
    let metadata = Reflect.getMetadata(EVENT_HANDLER_METADATA, provider) as
      EventHandlerMetadata | readonly string[] | undefined;

    if (!metadata) {
      this.logger.warn(`No @EventHandler() decorator found on handler: ${(provider as any).name}`);
      return;
    }

    // Normalize metadata: tests sometimes attach an array directly
    if (Array.isArray(metadata)) {
      metadata = { events: metadata, options: {} } as EventHandlerMetadata;
    }
    const normalizedMetadata = metadata as EventHandlerMetadata;

    const handler = this.createHandlerContext(provider as Type<IEventHandler>);

    // Determine priority: prefer explicit priority metadata key or metadata.options.priority
    const explicitPriority = Reflect.getMetadata(
      `${EVENT_HANDLER_METADATA.toString()}:priority`,
      provider,
    ) as any;

    const priority = (explicitPriority ??
      normalizedMetadata.options?.priority ??
      'normal') as unknown as string;

    for (const eventName of normalizedMetadata.events) {
      if (priority === 'high') {
        // Add high-priority handlers before existing listeners
        this.emitter.prependListener(eventName, handler.handle as any);
      } else {
        this.emitter.on(eventName, handler.handle as any);
      }
      this.logger.log(`Subscribed ${handler.name} to event "${eventName}"`);
    }
  }

  private createHandlerContext<TEvent extends Event>(
    metatype: Type<IEventHandler<TEvent>>,
  ): HandlerContext<TEvent> {
    // Normalize metadata: tests sometimes attach an array directly
    let metadata = Reflect.getMetadata(EVENT_HANDLER_METADATA, metatype) as
      EventHandlerMetadata | readonly string[] | undefined;

    if (!metadata) metadata = { events: [], options: {} } as EventHandlerMetadata;
    if (Array.isArray(metadata)) {
      metadata = { events: metadata as string[], options: {} } as EventHandlerMetadata;
    }

    const normalizedMetadata = metadata as EventHandlerMetadata;

    const providerWrapper = this.discovery.getProviders().find((p) => p.metatype === metatype);
    const instance = providerWrapper?.instance;

    if (!instance) {
      this.logger.warn(
        `Handler ${metatype.name} not found in DI container; skipping registration.`,
      );
      return {
        name: metatype.name,
        metadata: normalizedMetadata,
        handle: async () => {
          // No-op handler for missing DI instances.
        },
      };
    }

    return {
      name: metatype.name,
      metadata: normalizedMetadata,
      handle: async (event: TEvent) => {
        try {
          await this.retryService.execute(
            () => this.runWithTimeout(() => instance.handle(event), normalizedMetadata),
            {
              ...this.optsNormalized.defaultRetryPolicy,
              ...normalizedMetadata.options?.retry,
            },
          );
        } catch (error) {
          if (this.optsNormalized.useDeadLetterQueue) {
            await this.deadLetterService.sendToDeadLetter(
              event as unknown as AnyEvent,
              error as Error,
              normalizedMetadata.options?.retry?.maxRetries ??
                this.optsNormalized.defaultRetryPolicy?.maxRetries ??
                3,
              metatype.name,
            );
          } else {
            throw error;
          }
        }
      },
    };
  }

  private async runWithTimeout<T>(
    fn: () => Promise<T>,
    metadata: EventHandlerMetadata,
  ): Promise<T> {
    const timeoutMs = metadata.options.timeoutMs ?? this.optsNormalized.defaultHandlerTimeoutMs;
    if (timeoutMs <= 0) return fn();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Handler timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }
}
