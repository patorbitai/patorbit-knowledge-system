
import { beforeEach,describe, expect, it, vi } from "vitest";

import  { type ApplicationEvent } from "../event-bus.provider";
import { OutboxEntry,OutboxService } from "./outbox.service";

const createTestEvent = (id: string, type: string): ApplicationEvent => ({
  eventId: id,
  eventType: type,
  timestamp: new Date(),
  payload: { key: "value" },
});

describe("OutboxService", () => {
  let service: OutboxService;

  beforeEach(() => {
    service = new OutboxService();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should add an event with initial status as pending", async () => {
    const event = createTestEvent("event-1", "TestEvent");
    await service.add(event);
    const entry = await service.get("event-1");

    expect(entry).toBeDefined();
    expect(entry!.id).toBe("event-1");
    expect(entry!.eventType).toBe("TestEvent");
    expect(entry!.event).toEqual(event);
    expect(entry!.status).toBe("pending");
    expect(entry!.createdAt).toBeInstanceOf(Date);
    expect(entry!.publishedAt).toBeUndefined();
    expect(entry!.error).toBeUndefined();
  });

  it("should mark an event as published", async () => {
    const event = createTestEvent("event-1", "TestEvent");
    await service.add(event);
    await service.markPublished("event-1");

    const entry = await service.get("event-1");
    expect(entry?.status).toBe("published");
    expect(entry?.publishedAt).toBeInstanceOf(Date);
  });

  it("should mark an event as failed", async () => {
    const event = createTestEvent("event-1", "TestEvent");
    await service.add(event);

    const err = new Error("Something went wrong");
    await service.markFailed("event-1", err);

    const entry = await service.get("event-1");
    expect(entry?.status).toBe("failed");
    expect(entry?.error).toBe("Something went wrong");
  });

  it("should not throw when marking a non-existent event as published", async () => {
    await expect(service.markPublished("non-existent")).resolves.toBeUndefined();
  });

  it("should not throw when marking a non-existent event as failed", async () => {
    await expect(service.markFailed("non-existent", new Error("err"))).resolves.toBeUndefined();
  });

  it("should return pending events only", async () => {
    const event1 = createTestEvent("event-1", "T1");
    const event2 = createTestEvent("event-2", "T2");
    const event3 = createTestEvent("event-3", "T3");

    await service.add(event1);
    await service.add(event2);
    await service.add(event3);

    await service.markPublished("event-1");
    await service.markFailed("event-2", new Error("err"));

    const pending = await service.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]!.id).toBe("event-3");
  });

  it("should return all events", async () => {
    await service.add(createTestEvent("e1", "T1"));
    await service.add(createTestEvent("e2", "T2"));

    const all = await service.getAll();
    expect(all).toHaveLength(2);
  });

  it("should retrieve a specific event by ID", async () => {
    const event = createTestEvent("event-1", "TestEvent");
    await service.add(event);

    const entry = await service.get("event-1");
    expect(entry).not.toBeNull();
    expect(entry?.id).toBe("event-1");
  });

  it("should return null when getting a non-existent event", async () => {
    const entry = await service.get("non-existent");
    expect(entry).toBeNull();
  });

  it("should remove an event from the outbox", async () => {
    await service.add(createTestEvent("e1", "T1"));
    const removed = await service.remove("e1");
    expect(removed).toBe(true);
    expect(await service.get("e1")).toBeNull();
  });

  it("should return false when removing a non-existent event", async () => {
    const removed = await service.remove("non-existent");
    expect(removed).toBe(false);
  });

  it("should return the correct pending count", async () => {
    expect(service.pendingCount).toBe(0);
    await service.add(createTestEvent("e1", "T1"));
    expect(service.pendingCount).toBe(1);
    await service.markPublished("e1");
    expect(service.pendingCount).toBe(0);
  });
});
