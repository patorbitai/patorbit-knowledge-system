import  { type Type } from "@nestjs/common";

import  {
  type EventHandlerOptions,
  type EventIdentifier,
} from "./decorators/event-handler.decorator";

export type EventMetadata = Readonly<Record<string, unknown>>;

export interface Event<TPayload = unknown> {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly payload: TPayload;
  readonly metadata?: EventMetadata;
}

export interface DomainEvent<TPayload = unknown> extends Event<TPayload> {
  readonly kind: "domain";
  readonly aggregateId: string;
  readonly aggregateType?: string;
  readonly aggregateVersion?: number;
}

export interface ApplicationEvent<TPayload = unknown> extends Event<TPayload> {
  readonly kind: "application";
}

export type AnyEvent = DomainEvent<unknown> | ApplicationEvent<unknown>;

export interface EventHandler<TEvent extends Event = Event> {
  handle(event: TEvent): void | Promise<void>;
}

export type EventHandlerFunction<TEvent extends Event = Event> = (
  event: TEvent,
) => void | Promise<void>;

export type Unsubscribe = () => void;

export interface EventBus {
  publish<TEvent extends Event>(event: TEvent): Promise<void>;
  publishAll<TEvent extends Event>(events: readonly TEvent[]): Promise<void>;
  subscribe<TEvent extends Event>(
    event: EventIdentifier<TEvent>,
    handler: EventHandler<TEvent> | EventHandlerFunction<TEvent>,
    options?: EventHandlerOptions,
  ): Unsubscribe;
  register(handlerTypes: readonly Type<EventHandler>[]): void;
}

// Compatibility aliases for consumers that prefer interface-prefixed names.
export type IEventBus = EventBus;
export type IEventHandler<TEvent extends Event = Event> = EventHandler<TEvent>;
