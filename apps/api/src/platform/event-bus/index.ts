export {
  EventBusModule,
  type EventBusModuleOptions,
} from "./event-bus.module";
export { EventBusService } from "./event-bus.service";
export {
  EVENT_BUS,
  EVENT_HANDLER_METADATA,
  EVENT_BUS_MODULE_OPTIONS,
} from "./event-bus.constants";
export { EventHandler } from "./decorators";
export type {
  EventHandlerMetadata,
  EventHandlerOptions,
  EventIdentifier,
  HandlerPriority,
} from "./decorators";

export type {
  EventBus as IEventBus,
  EventHandler as IEventHandler,
  Event,
  DomainEvent,
  ApplicationEvent,
  AnyEvent,
  EventMetadata,
  Unsubscribe,
} from "./event-bus.provider";

export {
  OutboxService,
  type OutboxEntry,
  DeadLetterService,
  type DeadLetterEntry,
  RetryService,
  type RetryOptions,
} from "./services";