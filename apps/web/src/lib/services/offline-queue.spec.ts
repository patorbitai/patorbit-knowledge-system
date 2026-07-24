import { IDBOpenDBRequest, IDBRequest } from 'fake-indexeddb';
import FDBFactory from 'fake-indexeddb/lib/FDBFactory';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as queue from './offline-queue';
import { type SaveQueueItem } from './offline-queue';

// Setup fresh fake IndexedDB per test — creating a new FDBFactory clears all state
beforeEach(() => {
  vi.stubGlobal('indexedDB', new FDBFactory());
  vi.stubGlobal('IDBRequest', IDBRequest);
  vi.stubGlobal('IDBOpenDBRequest', IDBOpenDBRequest);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('offline-queue', () => {
  const item1: SaveQueueItem = {
    id: 'item-1',
    type: 'section',
    resumeId: 'res-1',
    payload: { content: { text: 'hello' } },
    timestamp: 1000,
  };
  const item2: SaveQueueItem = {
    id: 'item-2',
    type: 'title',
    resumeId: 'res-1',
    payload: { title: 'New Title' },
    timestamp: 2000,
  };

  describe('enqueue', () => {
    it('should add an item to the database', async () => {
      await queue.enqueue(item1);
      const allItems = await queue.getAll();
      expect(allItems).toHaveLength(1);
      expect(allItems[0]).toEqual(item1);
    });

    it('should update an existing item with the same id', async () => {
      await queue.enqueue(item1);
      const updatedItem = { ...item1, payload: { content: { text: 'updated' } } };
      await queue.enqueue(updatedItem);
      const allItems = await queue.getAll();
      expect(allItems).toHaveLength(1);
      expect(allItems[0]).toEqual(updatedItem);
    });
  });

  describe('dequeue', () => {
    it('should remove an item from the database', async () => {
      await queue.enqueue(item1);
      await queue.enqueue(item2);
      await queue.dequeue('item-1');
      const allItems = await queue.getAll();
      expect(allItems).toHaveLength(1);
      expect(allItems[0]).toEqual(item2);
    });

    it('should do nothing if item id does not exist', async () => {
      await queue.enqueue(item1);
      await queue.dequeue('non-existent-id');
      const allItems = await queue.getAll();
      expect(allItems).toHaveLength(1);
    });
  });

  describe('getAll', () => {
    it('should return all items from the database', async () => {
      await queue.enqueue(item1);
      await queue.enqueue(item2);
      const allItems = await queue.getAll();
      expect(allItems).toHaveLength(2);
    });

    it('should return items sorted by timestamp', async () => {
      // Enqueue in reverse order
      await queue.enqueue(item2);
      await queue.enqueue(item1);
      const allItems = await queue.getAll();
      expect(allItems).toHaveLength(2);
      expect(allItems[0]).toEqual(item1);
      expect(allItems[1]).toEqual(item2);
    });

    it('should return an empty array if the store is empty', async () => {
      const allItems = await queue.getAll();
      expect(allItems).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('should remove all items from the database', async () => {
      await queue.enqueue(item1);
      await queue.enqueue(item2);
      await queue.clearAll();
      const allItems = await queue.getAll();
      expect(allItems).toHaveLength(0);
    });

    it('should not throw if the store is already empty', async () => {
      await expect(queue.clearAll()).resolves.not.toThrow();
    });
  });
});
