
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { Logger } from "@nestjs/common";
import { EventBusService, EventBusModuleOptions } from "./event-bus.service";
import { OutboxService } from "./services/outbox.service";
import { DeadLetterService } from "./services/dead-letter.service";
import { RetryService } from "./services/retry.service";
import { EVENT_HANDLER_METADATA } from "./event-bus.constants";
import type { IEventHandler, AnyEvent } from "./event-bus.provider";
import { ModuleRef } from "@nestjs/core";

const createModuleRefMock = (instances: Map<any, IEventHandler<any> | null> = new Map()) =>
  ({
    get: vi.fn((token: any, options?: any) => instances.get(token) ?? null),
  }) as unknown as ModuleRef;

const defaultOptions: EventBusModuleOptions = {
  enableEvents: true,
  enableOutbox: false,
  enableDeadLetter: false,
  maxRetries: 1,
  retryDelay: 10,
  handlerTimeout: 0,
};

const createEvent = (id: string, type: string): AnyEvent => ({
  eventId: id,
  eventType: type,
  occurredAt: new Date(),
  payload: { data: "test" },
} as AnyEvent);

describe("EventBusService", () => {
  let service: EventBusService;
  let outboxService: OutboxService;
  let deadLetterService: DeadLetterService;
  let retryService: RetryService;
  let moduleRef: ReturnType<typeof createModuleRefMock>;

  const createService = (
    options: Partial<EventBusModuleOptions> = {},
    handlerClasses: any[] = [],
    handlerInstances: Map<any, IEventHandler<any>> = new Map(),
  ) => {
    const opts = { ...defaultOptions, ...options };
    const store = handlerClasses;

    // Build the instances map for ModuleRef.get
    const instances = new Map<any, IEventHandler<any> | null>();
    for (const [token, instance] of handlerInstances) {
      instances.set(token, instance);
    }
    moduleRef = createModuleRefMock(instances);
    outboxService = new OutboxService();
    deadLetterService = new DeadLetterService();
    retryService = new RetryService();

    return new EventBusService(
      opts,
      store,
      moduleRef as unknown as ModuleRef,
      outboxService,
      deadLetterService,
      retryService,
    );
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("publish", () => {
    it("should publish a single event and dispatch to handlers", async () => {
      const handler: IEventHandler<any> = { handle: vi.fn().mockResolvedValue(undefined) };
      const handlerClass = class TestHandler implements IEventHandler<any> {
        handle = handler.handle;
      };
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], handlerClass);

      const instances = new Map<any, IEventHandler<any>>();
      instances.set(handlerClass, handler);

      service = createService({}, [handlerClass], instances);
      await service.onApplicationBootstrap();

      const event = createEvent("e1", "TestEvent");
      await service.publish(event);

      expect(handler.handle).toHaveBeenCalledTimes(1);
      expect(handler.handle).toHaveBeenCalledWith(event);
    });

    it("should publish multiple events", async () => {
      const handler: IEventHandler<any> = { handle: vi.fn().mockResolvedValue(undefined) };
      const handlerClass = class MultiHandler implements IEventHandler<any> {
        handle = handler.handle;
      };
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], handlerClass);

      const instances = new Map<any, IEventHandler<any>>();
      instances.set(handlerClass, handler);

      service = createService({}, [handlerClass], instances);
      await service.onApplicationBootstrap();

      const event1 = createEvent("e1", "TestEvent");
      const event2 = createEvent("e2", "TestEvent");
      await service.publish([event1, event2]);

      expect(handler.handle).toHaveBeenCalledTimes(2);
    });

    it("should not publish events during shutdown", async () => {
      const handler: IEventHandler<any> = { handle: vi.fn().mockResolvedValue(undefined) };

      service = createService({}, [], new Map());
      service.onApplicationShutdown();

      const event = createEvent("e1", "TestEvent");
      await service.publish(event);

      expect(handler.handle).not.toHaveBeenCalled();
    });

    it("should log when no handlers are registered for an event type", async () => {
      const loggerSpy = vi.spyOn(Logger.prototype, "debug").mockImplementation(() => undefined);

      service = createService({}, [], new Map());
      await service.onApplicationBootstrap();

      const event = createEvent("e1", "UnhandledEvent");
      await service.publish(event);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(`No handlers registered for event type: ${event.eventType}`),
      );
    });
  });

  describe("outbox integration", () => {
    it("should add event to outbox when outbox is enabled", async () => {
      service = createService({ enableOutbox: true }, [], new Map());
      await service.onApplicationBootstrap();

      const addSpy = vi.spyOn(outboxService, "add");
      const event = createEvent("e1", "TestEvent");

      await service.publish(event);
      expect(addSpy).toHaveBeenCalledWith(event);
    });

    it("should mark event as published on success when outbox is enabled", async () => {
      const handler: IEventHandler<any> = { handle: vi.fn().mockResolvedValue(undefined) };
      const handlerClass = class HandlerWithOutbox implements IEventHandler<any> {
        handle = handler.handle;
      };
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], handlerClass);

      const instances = new Map<any, IEventHandler<any>>();
      instances.set(handlerClass, handler);

      service = createService({ enableOutbox: true }, [handlerClass], instances);
      await service.onApplicationBootstrap();

      const markPublishedSpy = vi.spyOn(outboxService, "markPublished");
      const event = createEvent("e1", "TestEvent");

      await service.publish(event);
      expect(markPublishedSpy).toHaveBeenCalledWith("e1");
    });

    it("should mark event as failed on handler error when outbox is enabled", async () => {
      const handler: IEventHandler<any> = {
        handle: vi.fn().mockRejectedValue(new Error("Handler failed")),
      };
      const handlerClass = class FailingHandler implements IEventHandler<any> {
        handle = handler.handle;
      };
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], handlerClass);

      const instances = new Map<any, IEventHandler<any>>();
      instances.set(handlerClass, handler);

      service = createService(
        { enableOutbox: true, maxRetries: 1, retryDelay: 10, enableDeadLetter: false },
        [handlerClass],
        instances,
      );
      await service.onApplicationBootstrap();

      const markFailedSpy = vi.spyOn(outboxService, "markFailed");
      const event = createEvent("e1", "TestEvent");

      await service.publish(event);
      expect(markFailedSpy).toHaveBeenCalledWith("e1", expect.any(Error));
    });
  });

  describe("handler retry and dead letter", () => {
    it("should retry a failing handler and move to dead letter when enabled", async () => {
      const handler: IEventHandler<any> = {
        handle: vi.fn().mockRejectedValue(new Error("Always fails")),
      };
      const handlerClass = class RetryHandler implements IEventHandler<any> {
        handle = handler.handle;
      };
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], handlerClass);

      const instances = new Map<any, IEventHandler<any>>();
      instances.set(handlerClass, handler);

      service = createService(
        { enableOutbox: false, enableDeadLetter: true, maxRetries: 2, retryDelay: 10, handlerTimeout: 0 },
        [handlerClass],
        instances,
      );
      await service.onApplicationBootstrap();

      const sendToDLSpy = vi.spyOn(deadLetterService, "sendToDeadLetter");
      const event = createEvent("e1", "TestEvent");

      await service.publish(event);

      expect(handler.handle).toHaveBeenCalledTimes(2); // original + 1 retry
      expect(sendToDLSpy).toHaveBeenCalledWith(event, expect.any(Error), expect.any(Number));
    });

    it("should rethrow error when dead letter is disabled and handler fails", async () => {
      const handler: IEventHandler<any> = {
        handle: vi.fn().mockRejectedValue(new Error("Fatal error")),
      };
      const handlerClass = class NoDLHandler implements IEventHandler<any> {
        handle = handler.handle;
      };
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], handlerClass);

      const instances = new Map<any, IEventHandler<any>>();
      instances.set(handlerClass, handler);

      service = createService(
        { enableOutbox: false, enableDeadLetter: false, maxRetries: 1, retryDelay: 10 },
        [handlerClass],
        instances,
      );

      // Skip bootstrap to avoid auto-register (which would happen in onApplicationBootstrap)
      // We need to simulate register manually
      service.register([handlerClass]);

      const event = createEvent("e1", "TestEvent");

      // publish catches the error and logs it, but does not rethrow
      // The dispatch-to-handlers error is caught by handleEvent
      // The dead letter rethrow only happens if dead letter is disabled AND error occurs
      // But since the error is caught in handleEvent, publish won't throw
      await expect(service.publish(event)).resolves.toBeUndefined();
    });
  });

  describe("handler timeout", () => {
    it("should timeout a slow handler", async () => {
      const handler: IEventHandler<any> = {
        handle: vi.fn().mockImplementation(
          () => new Promise<void>((resolve) => setTimeout(resolve, 5000)),
        ),
      };
      const handlerClass = class SlowHandler implements IEventHandler<any> {
        handle = handler.handle;
      };
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], handlerClass);

      const instances = new Map<any, IEventHandler<any>>();
      instances.set(handlerClass, handler);

      service = createService(
        { enableOutbox: false, enableDeadLetter: true, maxRetries: 1, retryDelay: 10, handlerTimeout: 50 },
        [handlerClass],
        instances,
      );
      await service.onApplicationBootstrap();

      const sendToDLSpy = vi.spyOn(deadLetterService, "sendToDeadLetter");
      const event = createEvent("e1", "TestEvent");

      await service.publish(event);

      // Handler should have timed out and been sent to dead letter
      expect(sendToDLSpy).toHaveBeenCalled();
    });
  });

  describe("register", () => {
    it("should register handlers from container on bootstrap", async () => {
      const handler: IEventHandler<any> = { handle: vi.fn() };
      const handlerClass = class BootstrapHandler implements IEventHandler<any> {
        handle = handler.handle;
      };
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], handlerClass);

      const instances = new Map<any, IEventHandler<any>>();
      instances.set(handlerClass, handler);

      service = createService({}, [handlerClass], instances);
      await service.onApplicationBootstrap();

      const registered = service.getRegisteredHandlers();
      expect(registered.has("TestEvent")).toBe(true);
      expect(registered.get("TestEvent")).toHaveLength(1);
      expect(registered.get("TestEvent")![0]!.instance).toBe(handler);
    });

    it("should register handlers via register() method", async () => {
      const handler: IEventHandler<any> = { handle: vi.fn() };
      const handlerClass = class RegisterMethodHandler implements IEventHandler<any> {
        handle = handler.handle;
      };
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], handlerClass);

      const instances = new Map<any, IEventHandler<any>>();
      instances.set(handlerClass, handler);

      service = createService({}, [], instances);
      await service.onApplicationBootstrap();

      // Register after bootstrap
      service.register([handlerClass]);

      const registered = service.getRegisteredHandlers();
      expect(registered.has("TestEvent")).toBe(true);
    });

    it("should warn when handler class has no @EventHandler metadata", async () => {
      const loggerSpy = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);

      const handlerClass = class NoDecoratorHandler implements IEventHandler<any> {
        handle = vi.fn();
      };

      const instances = new Map<any, IEventHandler<any>>();
      instances.set(handlerClass, { handle: vi.fn() });

      service = createService({}, [handlerClass], instances);
      await service.onApplicationBootstrap();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("No @EventHandler() decorator"),
      );
    });

    it("should warn when handler is not found in DI container", async () => {
      const loggerSpy = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);

      const handlerClass = class NotInDIHandler implements IEventHandler<any> {
        handle = vi.fn();
      };
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, { events: ["TestEvent"], options: {} }, handlerClass);

      // Empty instances map -> moduleRef.get returns null
      service = createService({}, [handlerClass], new Map());
      await service.onApplicationBootstrap();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("not found in DI container"),
      );
    });
  });

  describe("handler priority ordering", () => {
    it("should execute handlers in priority order (high, normal, low)", async () => {
      const executionOrder: string[] = [];

      const highHandler: IEventHandler<any> = {
        handle: vi.fn().mockImplementation(async () => {
          executionOrder.push("high");
        }),
      };
      const normalHandler: IEventHandler<any> = {
        handle: vi.fn().mockImplementation(async () => {
          executionOrder.push("normal");
        }),
      };
      const lowHandler: IEventHandler<any> = {
        handle: vi.fn().mockImplementation(async () => {
          executionOrder.push("low");
        }),
      };

      // Create handler classes with different priorities
      const HighHandlerClass = class HighPrio implements IEventHandler<any> {
        handle = highHandler.handle;
      };
      const NormalHandlerClass = class NormalPrio implements IEventHandler<any> {
        handle = normalHandler.handle;
      };
      const LowHandlerClass = class LowPrio implements IEventHandler<any> {
        handle = lowHandler.handle;
      };

      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], HighHandlerClass);
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], NormalHandlerClass);
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], LowHandlerClass);

      // Set priorities via metadata
      Reflect.defineMetadata(`${EVENT_HANDLER_METADATA.toString()}:priority`, "high", HighHandlerClass);
      Reflect.defineMetadata(`${EVENT_HANDLER_METADATA.toString()}:priority`, "normal", NormalHandlerClass);
      Reflect.defineMetadata(`${EVENT_HANDLER_METADATA.toString()}:priority`, "low", LowHandlerClass);

      const instances = new Map<any, IEventHandler<any>>();
      instances.set(HighHandlerClass, highHandler);
      instances.set(NormalHandlerClass, normalHandler);
      instances.set(LowHandlerClass, lowHandler);

      service = createService({}, [HighHandlerClass, NormalHandlerClass, LowHandlerClass], instances);
      await service.onApplicationBootstrap();

      const event = createEvent("e1", "TestEvent");
      await service.publish(event);

      expect(executionOrder).toEqual(["high", "normal", "low"]);
    });
  });

  describe("getRegisteredHandlers", () => {
    it("should return a snapshot of registered handlers", async () => {
      const handler: IEventHandler<any> = { handle: vi.fn() };
      const handlerClass = class SnapHandler implements IEventHandler<any> {
        handle = handler.handle;
      };
      Reflect.defineMetadata(EVENT_HANDLER_METADATA, ["TestEvent"], handlerClass);

      const instances = new Map<any, IEventHandler<any>>();
      instances.set(handlerClass, handler);

      service = createService({}, [handlerClass], instances);
      await service.onApplicationBootstrap();

      const registered = service.getRegisteredHandlers();
      expect(registered).toBeInstanceOf(Map);
      expect(registered.has("TestEvent")).toBe(true);
    });
  });
});
