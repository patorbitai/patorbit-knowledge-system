"use strict";

/**
 * Evidence Storage (Client-side)
 *
 * Wraps IndexedDB via `idb-keyval` to provide a clean, safe, async interface
 * for storing and retrieving file blobs.
 *
 * Why not localStorage?
 * - 5MB cap (too small for PDFs, videos).
 * - Sync, blocking API.
 * - No native Blob support (requires base64 encoding/decoding).
 *
 * This service ensures that evidence file content is persisted locally without
 * hitting `localStorage` limits. The `Evidence` metadata record (in the Zustand
 * store) references the blob via a key, keeping the main store lightweight.
 */

import { get, set, del, clear as clearDB, createStore } from "idb-keyval";

// Create a custom store to keep evidence blobs separate from other potential
// `idb-keyval` uses in the app.
const evidenceStore = createStore("patorbit-evidence-blobs", "evidence-files");

/**
 * Stores a file blob in IndexedDB.
 *
 * @param key The unique identifier for this blob (typically the Evidence ID).
 * @param blob The File or Blob object to store.
 * @returns A promise that resolves when the operation is complete.
 */
export async function storeEvidenceBlob(key: string, blob: Blob): Promise<void> {
  if (!key || !blob) {
    throw new Error("storeEvidenceBlob: key and blob are required.");
  }
  await set(key, blob, evidenceStore);
}

/**
 * Retrieves a file blob from IndexedDB.
 *
 * @param key The unique identifier for the blob.
 * @returns A promise that resolves with the Blob, or `undefined` if not found.
 */
export async function retrieveEvidenceBlob(key: string): Promise<Blob | undefined> {
  if (!key) return undefined;
  return await get<Blob>(key, evidenceStore);
}

/**
 * Deletes a file blob from IndexedDB.
 *
 * @param key The unique identifier for the blob to delete.
 * @returns A promise that resolves when the operation is complete.
 */
export async function removeEvidenceBlob(key: string): Promise<void> {
  if (!key) return;
  await del(key, evidenceStore);
}

/**
 * Clears the entire evidence blob store.
 *
 * Use with caution — this will delete all locally stored evidence files.
 *
 * @returns A promise that resolves when the store is cleared.
 */
export async function clearAllEvidenceBlobs(): Promise<void> {
  await clearDB(evidenceStore);
}
