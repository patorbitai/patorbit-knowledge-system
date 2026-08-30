/**
 * C8 — Offline Resume Edit Queue
 *
 * Persists pending resume edits in IndexedDB so they survive browser refresh
 * while offline. On reconnect, queued edits are flushed to the server.
 *
 * Architecture:
 *   User edit → debouncedSave → fetch fails (network error)
 *     → enqueue to IndexedDB
 *     → saveStatus = "offline"
 *   User refreshes while offline
 *     → Zustand hydrates from localStorage (resume data intact)
 *     → hookWriteBackToStore detects offline queue has entries
 *     → waits for online event
 *   Browser goes online
 *     → online event fires
 *     → flushQueue() iterates entries, sends PUT for each
 *     → on success: remove entry
 *     → on 409: enter C7 conflict flow
 *     → on persistent failure: keep entry for next retry
 *
 * Coalescing: only the LATEST edit per resumeId is kept.
 * Multiple rapid offline edits → single queue entry with latest resume data.
 */

import { get, set, del, values, createStore } from "idb-keyval";

/** Custom IndexedDB store for the offline queue. */
const offlineStore = createStore("patorbit-offline-queue", "pending-saves");

/** A single queued save entry. */
export interface OfflineQueueEntry {
  /** Unique ID for this queue entry. */
  id: string;
  /** The resume ID this entry is for. */
  resumeId: string;
  /** The full resume payload to send. */
  resume: Record<string, unknown>;
  /** The baseVersion to use for optimistic locking. */
  baseVersion?: number;
  /** ISO timestamp of when this entry was created/updated. */
  timestamp: string;
}

/**
 * Generate a unique queue entry ID.
 */
function queueEntryId(): string {
  return `oq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Enqueue a resume edit for later sync.
 * If an entry already exists for this resumeId, it is replaced (coalesced).
 */
export async function enqueueOfflineSave(
  resumeId: string,
  resume: Record<string, unknown>,
  baseVersion?: number,
): Promise<void> {
  if (!resumeId) return;

  // Check for existing entry for this resumeId — replace (coalesce)
  const existing = await getOfflineEntry(resumeId);
  if (existing) {
    await del(existing.id, offlineStore);
  }

  const entry: OfflineQueueEntry = {
    id: queueEntryId(),
    resumeId,
    resume,
    baseVersion,
    timestamp: new Date().toISOString(),
  };

  await set(entry.id, entry, offlineStore);
}

/**
 * Get the queue entry for a specific resumeId.
 * Returns the most recent entry if multiple exist (shouldn't happen with coalescing).
 */
export async function getOfflineEntry(
  resumeId: string,
): Promise<OfflineQueueEntry | null> {
  const all = await values<OfflineQueueEntry>(offlineStore);
  const matches = all.filter((e) => e.resumeId === resumeId);
  if (matches.length === 0) return null;
  // Return the most recent
  matches.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return matches[0];
}

/**
 * Remove the queue entry for a specific resumeId.
 */
export async function removeOfflineEntry(resumeId: string): Promise<void> {
  const entry = await getOfflineEntry(resumeId);
  if (entry) {
    await del(entry.id, offlineStore);
  }
}

/**
 * Get all queued entries.
 */
export async function getAllOfflineEntries(): Promise<OfflineQueueEntry[]> {
  return values<OfflineQueueEntry>(offlineStore);
}

/**
 * Get the count of queued entries.
 */
export async function getOfflineQueueSize(): Promise<number> {
  const all = await values<OfflineQueueEntry>(offlineStore);
  return all.length;
}

/**
 * Clear the entire offline queue.
 */
export async function clearOfflineQueue(): Promise<void> {
  const all = await values<OfflineQueueEntry>(offlineStore);
  for (const entry of all) {
    await del(entry.id, offlineStore);
  }
}
