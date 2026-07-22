
import { beforeEach,describe, expect, it, vi } from "vitest";

import  { type ApplicationEvent, type DomainEvent } from "../event-bus.provider";
import { DeadLetterEntry,DeadLetterService } from "./dead-letter.service";

const createTestEvent = (
  id: string,
  type: string,
  isDomainEvent = false,
): DomainEvent | ApplicationEvent => {
  const baseEvent = {
    eventId: id,
    eventType: type,
    timestamp: new Date(),
    payload: { test: "data" },
  };

  if (isDomainEvent) {
    return {
      ...baseEvent,
      aggregateId: `agg-${id}`,
      version: 1,
    };
  }
  return baseEvent;
};

describe("DeadLetterService", () => {
  let service: DeadLetterService;

  beforeEach(() => {
    service = new DeadLetterService();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should send an event to the dead letter store", async () => {
    const event = createTestEvent("event-1", "TestEvent");
    const error = new Error("Test Error");
    const retryCount = 3;

    await service.sendToDeadLetter(event, error, retryCount);

    expect(service.deadLetterCount).toBe(1);
    const entry = await service.get("event-1");

    expect(entry).not.toBeNull();
    expect(entry?.id).toBe("event-1");
    expect(entry?.event).toEqual(event);
    expect(entry?.error).toBe("Test Error");
    expect(entry?.retryCount).toBe(3);
    expect(entry?.failedAt).toBeInstanceOf(Date);
  });

  it("should retrieve all dead letter entries", async () => {
    const event1 = createTestEvent("event-1", "TestEvent1");
    const event2 = createTestEvent("event-2", "TestEvent2");
    await service.sendToDeadLetter(event1, new Error("Error1"), 1);
    await service.sendToDeadLetter(event2, new Error("Error2"), 2);

    const entries = await service.getAll();
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.id).sort()).toEqual(["event-1", "event-2"]);
  });

  it("should retrieve a specific dead letter entry by ID", async () => {
    const event = createTestEvent("event-1", "TestEvent");
    await service.sendToDeadLetter(event, new Error("Error"), 1);

    const entry = await service.get("event-1");
    expect(entry).not.toBeNull();
    expect(entry?.id).toBe("event-1");
  });

  it("should return null when getting a non-existent entry", async () => {
    const entry = await service.get("non-existent");
    expect(entry).toBeNull();
  });

  it("should remove a dead letter entry", async () => {
    const event = createTestEvent("event-1", "TestEvent");
    await service.sendToDeadLetter(event, new Error("Error"), 1);

    expect(service.deadLetterCount).toBe(1);
    const removed = await service.remove("event-1");
    expect(removed).toBe(true);
    expect(service.deadLetterCount).toBe(0);
  });

  it("should return false when removing a non-existent entry", async () => {
    const removed = await service.remove("non-existent");
    expect(removed).toBe(false);
  });

  it("should successfully retry a dead letter event", async () => {
    const event = createTestEvent("event-1", "TestEvent");
    await service.sendToDeadLetter(event, new Error("Error"), 1);

    const publishFn = vi.fn().mockResolvedValue(undefined);
    const success = await service.retry("event-1", publishFn);

    expect(success).toBe(true);
    expect(publishFn).toHaveBeenCalledWith(event);
    expect(service.deadLetterCount).toBe(0);
  });

  it("should handle retry failure for a dead letter event", async () => {
    const event = createTestEvent("event-1", "TestEvent");
    await service.sendToDeadLetter(event, new Error("Initial Error"), 1);

    const publishFn = vi.fn().mockRejectedValue(new Error("Retry Failed"));
    const success = await service.retry("event-1", publishFn);

    expect(success).toBe(false);
    expect(publishFn).toHaveBeenCalledWith(event);
    expect(service.deadLetterCount).toBe(1); // Should not be removed
  });

  it("should return false when retrying a non-existent entry", async () => {
    const publishFn = vi.fn();
    const success = await service.retry("non-existent", publishFn);
    expect(success).toBe(false);
    expect(publishFn).not.toHaveBeenCalled();
  });

  it("should return the correct dead letter count", async () => {
    expect(service.deadLetterCount).toBe(0);
    await service.sendToDeadLetter(createTestEvent("e1", "T1"), new Error("E1"), 1);
    expect(service.deadLetterCount).toBe(1);
    await service.sendToDeadLetter(createTestEvent("e2", "T2"), new Error("E2"), 1);
    expect(service.deadLetterCount).toBe(2);
    await service.remove("e1");
    expect(service.deadLetterCount).toBe(1);
  });
});
