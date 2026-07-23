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
  EVENT_BUS_DISPATCH_TOPIC,
  EVENT_BUS_MODULE_OPTIONS,
  EVENT_HANDLER_METADATA,
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

  constructor(
    @Inject(EVENT_BUS_MODULE_OPTIONS)
    private readonly options: EventBusModuleOptions,
    private readonly discovery: DiscoveryService,
    private readonly emitter: EventEmitter2,
    private readonly outboxService: OutboxService,
    private readonly deadLetterService: DeadLetterService,
    private readonly retryService: RetryService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.discoverAndSubscribe();
  }

  onApplicationShutdown(): void {
    this.isShuttingDown = true;
    this.emitter.removeAllListeners();
    this.logger.log('Event bus shut down.');
  }

  async publish<TEvent extends Event>(event: TEvent): Promise<void> {
    if (this.isShuttingDown) return;
    if (this.options.useOutbox) {
      await this.outboxService.add(event as unknown as AnyEvent);
    }
    await this.emitter.emitAsync(EVENT_BUS_DISPATCH_TOPIC, event);
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
      if (this.options.useOutbox) {
        await this.outboxService.markPublished(outboxId);
      }
    } catch (error) {
      if (this.options.useOutbox) {
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
    const metadata = Reflect.getMetadata(EVENT_HANDLER_METADATA, provider) as
      EventHandlerMetadata | undefined;
    if (!metadata) return;

    const handler = this.createHandlerContext(provider as Type<IEventHandler>);
    for (const eventName of metadata.events) {
      this.emitter.on(eventName, handler.handle);
      this.logger.log(`Subscribed ${handler.name} to event "${eventName}"`);
    }
  }

  private createHandlerContext<TEvent extends Event>(
    metatype: Type<IEventHandler<TEvent>>,
  ): HandlerContext<TEvent> {
    const metadata = Reflect.getMetadata(EVENT_HANDLER_METADATA, metatype) as EventHandlerMetadata;

    return {
      name: metatype.name,
      metadata,
      handle: async (event: TEvent) => {
        const instance = this.discovery
          .getProviders()
          .find((p) => p.metatype === metatype)?.instance;
        if (!instance) return;

        try {
          await this.retryService.execute(
            () => this.runWithTimeout(() => instance.handle(event), metadata),
            {
              ...this.options.defaultRetryPolicy,
              ...metadata.options?.retry,
            },
          );
        } catch (error) {
          if (this.options.useDeadLetterQueue) {
            await this.deadLetterService.sendToDeadLetter(
              event as unknown as AnyEvent,
              error as Error,
              metadata.options.retry?.maxRetries ??
                this.options.defaultRetryPolicy?.maxRetries ??
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
    const timeoutMs = metadata.options.timeoutMs ?? this.options.defaultHandlerTimeoutMs;
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
