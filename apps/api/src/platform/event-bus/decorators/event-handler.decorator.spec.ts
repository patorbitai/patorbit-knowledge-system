
import { describe, it, expect, vi } from "vitest";
import { EventHandler } from "./event-handler.decorator";
import { EVENT_HANDLER_METADATA } from "../event-bus.constants";
import type { EventHandlerMetadata } from "./event-handler.decorator";

describe("EventHandler decorator", () => {
  it("should set metadata with a single event class", () => {
    class TestEvent {}
    Object.defineProperty(TestEvent, "name", { value: "TestEvent" });

    @EventHandler(TestEvent)
    class TestHandler {}

    const metadata: EventHandlerMetadata = Reflect.getMetadata(EVENT_HANDLER_METADATA, TestHandler);
    expect(metadata.events).toEqual(["TestEvent"]);
    expect(metadata.options).toEqual({});
  });

  it("should set metadata with multiple event classes", () => {
    class EventA {}
    class EventB {}

    @EventHandler([EventA, EventB])
    class MultiHandler {}

    const metadata: EventHandlerMetadata = Reflect.getMetadata(EVENT_HANDLER_METADATA, MultiHandler);
    expect(metadata.events).toEqual(["EventA", "EventB"]);
  });

  it("should set metadata with string event names", () => {
    @EventHandler(["StringEventName", "AnotherEvent"])
    class StringHandler {}

    const metadata: EventHandlerMetadata = Reflect.getMetadata(EVENT_HANDLER_METADATA, StringHandler);
    expect(metadata.events).toEqual(["StringEventName", "AnotherEvent"]);
  });

  it("should set metadata with mixed string and class references", () => {
    class EventClass {}
    Object.defineProperty(EventClass, "name", { value: "EventClass" });

    @EventHandler(["StringEvent", EventClass])
    class MixedHandler {}

    const metadata: EventHandlerMetadata = Reflect.getMetadata(EVENT_HANDLER_METADATA, MixedHandler);
    expect(metadata.events).toEqual(["StringEvent", "EventClass"]);
  });

  it("should return the class decorator function", () => {
    const decorator = EventHandler("Test");
    expect(decorator).toBeInstanceOf(Function);
  });

  it("should set metadata with options", () => {
    @EventHandler("PrioritizedEvent", { priority: "high" })
    class PriorityHandler {}

    const metadata: EventHandlerMetadata = Reflect.getMetadata(EVENT_HANDLER_METADATA, PriorityHandler);
    expect(metadata.events).toEqual(["PrioritizedEvent"]);
    expect(metadata.options.priority).toBe("high");
  });
});
