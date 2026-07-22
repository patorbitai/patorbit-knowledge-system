export const EVENT_BUS = Symbol("EVENT_BUS");
export const EVENT_BUS_MODULE_OPTIONS = Symbol("EVENT_BUS_MODULE_OPTIONS");
export const EVENT_HANDLER_METADATA = Symbol("EVENT_HANDLER_METADATA");

export const OUTBOX_SERVICE = Symbol("OUTBOX_SERVICE");
export const DEAD_LETTER_SERVICE = Symbol("DEAD_LETTER_SERVICE");
export const RETRY_SERVICE = Symbol("RETRY_SERVICE");

/** Internal EventEmitter2 topic used by the EventBus wrapper. */
export const EVENT_BUS_DISPATCH_TOPIC = "platform.event-bus.dispatch";
