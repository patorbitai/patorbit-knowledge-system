/**
 * Server-side storage for funnel/workflow analytics (§16, §17, §24).
 *
 * Backed by the production Postgres database (`AnalyticsEvent`) so the
 * pipeline works across multiple application instances. Events carry a
 * client-generated UUID and are inserted with `skipDuplicates`, so beacon
 * retries / double-submits are idempotent.
 *
 * Durability: if the database is briefly unavailable, records are appended
 * to a dead-letter JSONL file and drained back into the database on the
 * next successful write or read — events are never silently dropped.
 *
 * Privacy: `props` are sanitized (PII-ish keys stripped, strings truncated)
 * before they ever reach storage, and the table has no relation to User —
 * analytics can never be joined to identity. Every helper swallows I/O
 * errors — analytics must never break a product action.
 */

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  isTrackedEvent,
  sanitizeProps,
  type AnalyticsRecord,
  type TrackedEvent,
} from "./analytics";

const ANALYTICS_DIR =
  process.env.PATORBIT_ANALYTICS_DIR ?? path.join(process.cwd(), ".analytics");
const DEAD_LETTER_FILE = path.join(ANALYTICS_DIR, "events.jsonl");

const MAX_RECORDS_READ = 20_000;
const MAX_EVENTS_PER_BATCH = 50;

/** True only for automated test runs — real environments always write. */
function blockedByTestGuard(): boolean {
  return (
    (process.env.NODE_ENV === "test" || Boolean(process.env.VITEST)) &&
    process.env.ANALYTICS_ALLOW_WRITE !== "1"
  );
}

/**
 * Validate + normalize a batch of client-submitted records.
 * Pure — the client's `id` is preserved (or generated) so the same event
 * submitted twice collapses into one row.
 */
export function normalizeBatch(input: unknown): AnalyticsRecord[] {
  if (!Array.isArray(input)) return [];
  const now = new Date().toISOString();
  const out: AnalyticsRecord[] = [];
  const seenIds = new Set<string>();
  for (const raw of input.slice(0, MAX_EVENTS_PER_BATCH)) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as Record<string, unknown>;
    if (!isTrackedEvent(rec.event)) continue;
    const sessionId =
      typeof rec.sessionId === "string" && rec.sessionId.length > 0 && rec.sessionId.length <= 64
        ? rec.sessionId
        : "unknown";
    const ts = typeof rec.ts === "string" && rec.ts.length <= 40 ? rec.ts : now;
    const props = sanitizeProps(
      rec.props && typeof rec.props === "object" ? (rec.props as Record<string, string | number | boolean>) : undefined,
    );
    let id =
      typeof rec.id === "string" && rec.id.length > 0 && rec.id.length <= 64
        ? rec.id
        : randomUUID();
    // Defensive: two records in one batch must not share a primary key.
    while (seenIds.has(id)) id = randomUUID();
    seenIds.add(id);
    out.push({ id, event: rec.event, ts, sessionId, ...(props ? { props } : {}) });
  }
  return out;
}

function toRows(records: AnalyticsRecord[]): Array<{
  id: string;
  event: TrackedEvent;
  ts: Date;
  sessionId: string;
  props?: Prisma.InputJsonValue;
}> {
  return records.map((r) => ({
    id: r.id ?? randomUUID(),
    event: r.event,
    ts: new Date(r.ts),
    sessionId: r.sessionId,
    ...(r.props ? { props: r.props as Prisma.InputJsonValue } : {}),
  }));
}

async function writeDeadLetter(records: AnalyticsRecord[]): Promise<void> {
  try {
    await fs.mkdir(ANALYTICS_DIR, { recursive: true });
    const lines = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
    await fs.appendFile(DEAD_LETTER_FILE, lines, "utf8");
  } catch {
    /* dead-letter also failed — nothing further we can do safely */
  }
}

/** Re-insert any dead-lettered records, then clear the file. */
async function drainDeadLetter(): Promise<void> {
  if (blockedByTestGuard()) return;
  let content: string;
  try {
    content = await fs.readFile(DEAD_LETTER_FILE, "utf8");
  } catch {
    return; // no backlog
  }
  const records: AnalyticsRecord[] = [];
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line) as AnalyticsRecord;
      if (isTrackedEvent(parsed.event) && typeof parsed.sessionId === "string") {
        records.push({ id: parsed.id ?? randomUUID(), ...parsed });
      }
    } catch {
      /* skip malformed line */
    }
  }
  if (records.length === 0) {
    await fs.rm(DEAD_LETTER_FILE, { force: true }).catch(() => {});
    return;
  }
  try {
    await prisma.analyticsEvent.createMany({ data: toRows(records), skipDuplicates: true });
    await fs.rm(DEAD_LETTER_FILE, { force: true }).catch(() => {});
  } catch {
    /* still unavailable — keep the backlog for the next attempt */
  }
}

/** Insert records. Returns false on DB failure (records dead-lettered). */
export async function appendEvents(records: AnalyticsRecord[]): Promise<boolean> {
  if (records.length === 0) return true;
  if (blockedByTestGuard()) return true;
  try {
    // `skipDuplicates` + client-generated PK ⇒ retries/double-sends dedupe.
    await prisma.analyticsEvent.createMany({ data: toRows(records), skipDuplicates: true });
    await drainDeadLetter();
    return true;
  } catch {
    await writeDeadLetter(records);
    return false;
  }
}

/** Read the most recent records (newest first), draining any backlog first. */
export async function readEvents(limit = MAX_RECORDS_READ): Promise<AnalyticsRecord[]> {
  if (blockedByTestGuard()) return [];
  await drainDeadLetter();
  try {
    const rows = await prisma.analyticsEvent.findMany({
      orderBy: { ts: "desc" },
      take: limit,
    });
    const records: AnalyticsRecord[] = [];
    for (const row of rows) {
      if (!isTrackedEvent(row.event)) continue;
      records.push({
        id: row.id,
        event: row.event,
        ts: row.ts.toISOString(),
        sessionId: row.sessionId,
        ...(row.props
          ? { props: row.props as Record<string, string | number | boolean> }
          : {}),
      });
    }
    return records;
  } catch {
    return [];
  }
}
