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

import { NextResponse } from "next/server";
import { JOB_SOURCE_RATE_LIMIT } from "./job-sources/registry";

interface SlidingWindow {
  timestamps: number[];
}

// Separate stores so import and AI limits are independent buckets.
const aiStore   = new Map<string, SlidingWindow>();
const importStore = new Map<string, SlidingWindow>();
// M7B — job-source discovery bucket. Same sliding-window mechanics, fully
// independent from the AI/import buckets. Limits come from
// JOB_SOURCE_RATE_LIMIT (src/lib/job-sources/registry.ts) so the source
// limit stays centralized in M7A's config — no second limit system.
const jobSourceStore = new Map<string, SlidingWindow>();

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
  pruneStore(jobSourceStore, JOB_SOURCE_RATE_LIMIT.windowMs);
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

/**
 * M7B — job-source discovery rate limit (per authenticated user, sliding
 * window). Called BEFORE every upstream source request so a rate-limited
 * discovery never reaches the network. Shares the exact check() mechanics
 * and the shared rateLimitResponse() 429 shape with the AI/import limits,
 * but lives in its own bucket: exhausting source calls never affects AI or
 * import limits (and vice versa). M6 AI quota/rate behavior is untouched.
 */
export function checkJobSourceRateLimit(
  userId: string,
): { allowed: boolean; retryAfter: number } {
  return check(
    jobSourceStore,
    userId,
    JOB_SOURCE_RATE_LIMIT.windowMs,
    JOB_SOURCE_RATE_LIMIT.maxRequests,
  );
}

export const AI_RATE_LIMIT_MAX     = AI_MAX_REQUESTS;
export const AI_RATE_LIMIT_WINDOW  = AI_WINDOW_MS;
export const IMPORT_RATE_LIMIT_MAX    = IMPORT_MAX_REQUESTS;
export const IMPORT_RATE_LIMIT_WINDOW = IMPORT_WINDOW_MS;

/** Job-source discovery limit (M7B) — derived from JOB_SOURCE_RATE_LIMIT. */
export const JOB_SOURCE_RATE_LIMIT_MAX = JOB_SOURCE_RATE_LIMIT.maxRequests;
export const JOB_SOURCE_RATE_LIMIT_WINDOW = JOB_SOURCE_RATE_LIMIT.windowMs;

// ── Shared 429 response (M6) ─────────────────────────────────────────────────

/**
 * Standard rate-limit response for AI routes.
 *
 * Every rate-limited AI endpoint answers with the same contract so clients
 * can classify it in one place (see classifyAiFailure in lib/ai/client.ts):
 *   status 429, body code "RATE_LIMITED", body retryAfter (seconds), and a
 *   Retry-After header. Quota responses use code "USAGE_LIMIT_REACHED" —
 *   never this — so "rate" and "quota" failures stay distinguishable.
 */
export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please try again shortly.",
      code: "RATE_LIMITED",
      retryAfter,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    },
  );
}
