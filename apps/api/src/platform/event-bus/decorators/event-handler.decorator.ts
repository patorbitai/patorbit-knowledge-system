import { SetMetadata, type Type } from "@nestjs/common";
import { EVENT_HANDLER_METADATA } from "../event-bus.constants";
import type { Event } from "../event-bus.provider";
import type { RetryOptions } from "../services/retry.service";

export type EventIdentifier<TEvent extends Event = Event> =
  | string
  | Type<TEvent>;

export type HandlerPriority = number | "high" | "normal" | "low";

export interface EventHandlerOptions {
  /** Higher values run first. Named priorities map to high=100, normal=0, low=-100. */
  priority?: HandlerPriority;
  /** Overrides the module retry policy for this handler. */
  retry?: Partial<RetryOptions>;
  /** Overrides the module timeout for each handler attempt. Zero disables it. */
  timeoutMs?: number;
}

export interface EventHandlerMetadata {
  events: readonly string[];
  options: EventHandlerOptions;
}

function eventName(event: EventIdentifier): string {
  return typeof event === "string" ? event : event.name;
}

/**
 * Registers an injectable class as a handler for one or more event types.
 * The class must implement EventHandler and be registered as a Nest provider.
 */
export function EventHandler(
  events: EventIdentifier | readonly EventIdentifier[],
  options: EventHandlerOptions = {},
): ClassDecorator {
  const identifiers = Array.isArray(events) ? events : [events];
  const metadata: EventHandlerMetadata = {
    events: identifiers.map(eventName),
    options,
  };

  return SetMetadata(EVENT_HANDLER_METADATA, metadata);
}
