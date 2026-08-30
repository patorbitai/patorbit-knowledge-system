/**
 * C8 — Offline Queue Tests
 *
 * Tests the IndexedDB-backed offline queue for persisting resume edits
 * when the network is unavailable.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// vi.hoisted ensures variables are available when vi.mock() runs
const { mockStore, mockGet, mockSet, mockDel, mockValues } = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  return {
    mockStore: store,
    mockGet: vi.fn((key: string) => Promise.resolve(store.get(key))),
    mockSet: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    mockDel: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    mockValues: vi.fn(() => Promise.resolve(Array.from(store.values()))),
  };
});

vi.mock("idb-keyval", () => ({
  get: mockGet,
  set: mockSet,
  del: mockDel,
  values: mockValues,
  clear: vi.fn(() => { mockStore.clear(); return Promise.resolve(); }),
  createStore: vi.fn(() => "mock-store"),
}));

import {
  enqueueOfflineSave,
  getOfflineEntry,
  removeOfflineEntry,
  getAllOfflineEntries,
  getOfflineQueueSize,
  clearOfflineQueue,
} from "@/lib/offline-queue";

describe("C8 — Offline Queue", () => {
  beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
  });

  describe("enqueueOfflineSave", () => {
    it("adds an entry to the queue", async () => {
      await enqueueOfflineSave("resume-1", { name: "Alice", resumeId: "resume-1" });

      const entry = await getOfflineEntry("resume-1");
      expect(entry).not.toBeNull();
      expect(entry?.resumeId).toBe("resume-1");
      expect(entry?.resume.name).toBe("Alice");
    });

    it("includes baseVersion when provided", async () => {
      await enqueueOfflineSave("resume-1", { name: "Alice" }, 5);

      const entry = await getOfflineEntry("resume-1");
      expect(entry?.baseVersion).toBe(5);
    });

    it("sets a timestamp", async () => {
      await enqueueOfflineSave("resume-1", { name: "Alice" });

      const entry = await getOfflineEntry("resume-1");
      expect(entry?.timestamp).toBeDefined();
      expect(new Date(entry!.timestamp).getTime()).toBeGreaterThan(0);
    });

    it("generates a unique ID", async () => {
      await enqueueOfflineSave("resume-1", { name: "Alice" });

      const entry = await getOfflineEntry("resume-1");
      expect(entry?.id).toMatch(/^oq_/);
    });
  });

  describe("Coalescing", () => {
    it("replaces existing entry for same resumeId", async () => {
      await enqueueOfflineSave("resume-1", { name: "Alice v1" });
      await enqueueOfflineSave("resume-1", { name: "Alice v2" });

      const entries = await getAllOfflineEntries();
      const resume1Entries = entries.filter((e) => e.resumeId === "resume-1");
      expect(resume1Entries).toHaveLength(1);
      expect(resume1Entries[0].resume.name).toBe("Alice v2");
    });

    it("keeps separate entries for different resumeIds", async () => {
      await enqueueOfflineSave("resume-1", { name: "Alice" });
      await enqueueOfflineSave("resume-2", { name: "Bob" });

      const entries = await getAllOfflineEntries();
      expect(entries).toHaveLength(2);

      const entry1 = await getOfflineEntry("resume-1");
      const entry2 = await getOfflineEntry("resume-2");
      expect(entry1?.resume.name).toBe("Alice");
      expect(entry2?.resume.name).toBe("Bob");
    });
  });

  describe("removeOfflineEntry", () => {
    it("removes the entry for a specific resumeId", async () => {
      await enqueueOfflineSave("resume-1", { name: "Alice" });
      expect(await getOfflineQueueSize()).toBe(1);

      await removeOfflineEntry("resume-1");
      expect(await getOfflineQueueSize()).toBe(0);
    });

    it("does not affect other entries", async () => {
      await enqueueOfflineSave("resume-1", { name: "Alice" });
      await enqueueOfflineSave("resume-2", { name: "Bob" });

      await removeOfflineEntry("resume-1");

      const entry2 = await getOfflineEntry("resume-2");
      expect(entry2).not.toBeNull();
      expect(entry2?.resume.name).toBe("Bob");
    });
  });

  describe("getAllOfflineEntries", () => {
    it("returns all queued entries", async () => {
      await enqueueOfflineSave("resume-1", { name: "Alice" });
      await enqueueOfflineSave("resume-2", { name: "Bob" });
      await enqueueOfflineSave("resume-3", { name: "Charlie" });

      const entries = await getAllOfflineEntries();
      expect(entries).toHaveLength(3);
    });

    it("returns empty array when queue is empty", async () => {
      const entries = await getAllOfflineEntries();
      expect(entries).toHaveLength(0);
    });
  });

  describe("getOfflineQueueSize", () => {
    it("returns correct count", async () => {
      expect(await getOfflineQueueSize()).toBe(0);

      await enqueueOfflineSave("resume-1", { name: "Alice" });
      expect(await getOfflineQueueSize()).toBe(1);

      await enqueueOfflineSave("resume-2", { name: "Bob" });
      expect(await getOfflineQueueSize()).toBe(2);

      await removeOfflineEntry("resume-1");
      expect(await getOfflineQueueSize()).toBe(1);
    });
  });

  describe("clearOfflineQueue", () => {
    it("removes all entries", async () => {
      await enqueueOfflineSave("resume-1", { name: "Alice" });
      await enqueueOfflineSave("resume-2", { name: "Bob" });

      await clearOfflineQueue();

      expect(await getOfflineQueueSize()).toBe(0);
    });
  });

  describe("Persistence across refresh", () => {
    it("entries survive simulated refresh (IndexedDB persistence)", async () => {
      // Simulate: user edits while offline
      await enqueueOfflineSave("resume-1", { name: "Alice", summary: "Engineer" });

      // Simulate: page refresh — the mockStore still has the data
      // (in real code, IndexedDB persists across refreshes)
      const entry = await getOfflineEntry("resume-1");
      expect(entry).not.toBeNull();
      expect(entry?.resume.name).toBe("Alice");
      expect(entry?.resume.summary).toBe("Engineer");
    });
  });

  describe("Multi-resume isolation", () => {
    it("queue entries are independent per resumeId", async () => {
      await enqueueOfflineSave("resume-a", { name: "Alice" });
      await enqueueOfflineSave("resume-b", { name: "Bob" });

      await removeOfflineEntry("resume-a");

      // Resume B should be unaffected
      const entryB = await getOfflineEntry("resume-b");
      expect(entryB).not.toBeNull();
      expect(entryB?.resume.name).toBe("Bob");

      // Resume A should be removed
      const entryA = await getOfflineEntry("resume-a");
      expect(entryA).toBeNull();
    });

    it("coalescing only affects the same resumeId", async () => {
      await enqueueOfflineSave("resume-a", { name: "Alice v1" });
      await enqueueOfflineSave("resume-b", { name: "Bob" });
      await enqueueOfflineSave("resume-a", { name: "Alice v2" });

      const entryA = await getOfflineEntry("resume-a");
      expect(entryA?.resume.name).toBe("Alice v2");

      const entryB = await getOfflineEntry("resume-b");
      expect(entryB?.resume.name).toBe("Bob");

      expect(await getOfflineQueueSize()).toBe(2);
    });
  });
});
