/**
 * Server-side storage for funnel analytics.
 *
 * Events are appended to .analytics/events.jsonl (git-ignored). This keeps
 * the funnel free of database migrations while remaining durable on any
 * host with a writable working directory. Every helper swallows I/O errors —
 * analytics must never break a product action.
 */

import { promises as fs } from "fs";
import path from "path";
import {
  isFunnelEvent,
  sanitizeProps,
  type AnalyticsRecord,
} from "./analytics";

const ANALYTICS_DIR = path.join(process.cwd(), ".analytics");
const EVENTS_FILE = path.join(ANALYTICS_DIR, "events.jsonl");

const MAX_RECORDS_READ = 20_000;
const MAX_EVENTS_PER_BATCH = 50;

/** Validate + normalize a batch of client-submitted records. */
export function normalizeBatch(input: unknown): AnalyticsRecord[] {
  if (!Array.isArray(input)) return [];
  const now = new Date().toISOString();
  const out: AnalyticsRecord[] = [];
  for (const raw of input.slice(0, MAX_EVENTS_PER_BATCH)) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as Record<string, unknown>;
    if (!isFunnelEvent(rec.event)) continue;
    const sessionId =
      typeof rec.sessionId === "string" && rec.sessionId.length > 0 && rec.sessionId.length <= 64
        ? rec.sessionId
        : "unknown";
    const ts = typeof rec.ts === "string" && rec.ts.length <= 40 ? rec.ts : now;
    const props = sanitizeProps(
      rec.props && typeof rec.props === "object" ? (rec.props as Record<string, string | number | boolean>) : undefined,
    );
    out.push({ event: rec.event, ts, sessionId, ...(props ? { props } : {}) });
  }
  return out;
}

/** Append records to the JSONL log. Returns false on I/O failure. */
export async function appendEvents(records: AnalyticsRecord[]): Promise<boolean> {
  if (records.length === 0) return true;
  // Unit tests exercise route handlers directly — never write test traffic
  // into the real event log.
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return true;
  try {
    await fs.mkdir(ANALYTICS_DIR, { recursive: true });
    const lines = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
    await fs.appendFile(EVENTS_FILE, lines, "utf8");
    return true;
  } catch {
    return false;
  }
}

/** Read the most recent records. Missing file ⇒ empty list. */
export async function readEvents(limit = MAX_RECORDS_READ): Promise<AnalyticsRecord[]> {
  try {
    const content = await fs.readFile(EVENTS_FILE, "utf8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    const slice = lines.slice(-limit);
    const records: AnalyticsRecord[] = [];
    for (const line of slice) {
      try {
        const parsed = JSON.parse(line) as AnalyticsRecord;
        if (isFunnelEvent(parsed.event) && typeof parsed.sessionId === "string") {
          records.push(parsed);
        }
      } catch {
        /* skip malformed line */
      }
    }
    return records;
  } catch {
    return [];
  }
}
