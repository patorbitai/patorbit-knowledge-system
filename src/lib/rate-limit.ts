/**
 * In-memory sliding-window rate limiter for AI API routes.
 *
 * Limits:
 *   AI endpoints (/api/ai/*):  20 requests per user per 60 s
 *   Import endpoint:            5 requests per user per 60 s
 *
 * Keys are user IDs from the authenticated session — never IP addresses,
 * never resume content, never any sensitive data.
 *
 * Not suitable for multi-instance deployments; fine for single-server
 * private-beta where in-process state is shared across requests.
 */

interface SlidingWindow {
  timestamps: number[];
}

// Separate stores so import and AI limits are independent buckets.
const aiStore   = new Map<string, SlidingWindow>();
const importStore = new Map<string, SlidingWindow>();

const AI_WINDOW_MS    = 60_000;
const AI_MAX_REQUESTS = 20;

const IMPORT_WINDOW_MS    = 60_000;
const IMPORT_MAX_REQUESTS = 5;

// ── GC: prune idle entries every 5 min to prevent unbounded map growth ────────

function pruneStore(store: Map<string, SlidingWindow>, windowMs: number): void {
  const now = Date.now();
  for (const [key, win] of store.entries()) {
    win.timestamps = win.timestamps.filter((t) => now - t < windowMs);
    if (win.timestamps.length === 0) store.delete(key);
  }
}

setInterval(() => {
  pruneStore(aiStore,     AI_WINDOW_MS);
  pruneStore(importStore, IMPORT_WINDOW_MS);
}, 5 * 60_000);

// ── Core check ────────────────────────────────────────────────────────────────

function check(
  store: Map<string, SlidingWindow>,
  userId: string,
  windowMs: number,
  maxRequests: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const win = store.get(userId) ?? { timestamps: [] };

  win.timestamps = win.timestamps.filter((t) => now - t < windowMs);

  if (win.timestamps.length >= maxRequests) {
    const oldest = win.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    store.set(userId, win);
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  win.timestamps.push(now);
  store.set(userId, win);
  return { allowed: true, retryAfter: 0 };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function checkAIRateLimit(
  userId: string,
): { allowed: boolean; retryAfter: number } {
  return check(aiStore, userId, AI_WINDOW_MS, AI_MAX_REQUESTS);
}

export function checkImportRateLimit(
  userId: string,
): { allowed: boolean; retryAfter: number } {
  return check(importStore, userId, IMPORT_WINDOW_MS, IMPORT_MAX_REQUESTS);
}

export const AI_RATE_LIMIT_MAX     = AI_MAX_REQUESTS;
export const AI_RATE_LIMIT_WINDOW  = AI_WINDOW_MS;
export const IMPORT_RATE_LIMIT_MAX    = IMPORT_MAX_REQUESTS;
export const IMPORT_RATE_LIMIT_WINDOW = IMPORT_WINDOW_MS;
