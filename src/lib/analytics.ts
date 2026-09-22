"use strict";

/**
 * Funnel Analytics (§16, §17)
 *
 * Lightweight, privacy-conscious funnel tracking. No third-party analytics
 * provider exists in this codebase, so this is the single system:
 *
 *  - Client events are queued and sent to POST /api/analytics via sendBeacon.
 *  - The server appends records to .analytics/events.jsonl (git-ignored).
 *  - GET /api/analytics returns an aggregated funnel for the internal view
 *    at /settings/funnel.
 *
 * If a real provider (PostHog, Segment, …) is added later, replace the body
 * of `track()` below — this remains the single swap-point.
 *
 * Privacy: no email, name, or any PII is collected. Events carry a random
 * per-browser session id only. Props are sanitized (PII-ish keys stripped,
 * strings truncated) before they ever leave the browser.
 */

/** Canonical funnel events, in journey order where applicable. */
export const FUNNEL_EVENTS = [
  "landing_view",
  "signup_started",
  "signup_completed",
  "resume_upload_started",
  "resume_upload_completed",
  "profile_created",
  "job_analysis_started",
  "job_analysis_completed",
  "tailoring_started",
  "tailoring_completed",
  "resume_exported",
  "upgrade_viewed",
  "checkout_started",
  "subscription_completed",
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

export const FUNNEL_SET: ReadonlySet<string> = new Set(FUNNEL_EVENTS);

/**
 * The core journey, used for step-to-step conversion. `upgrade_viewed`,
 * `checkout_started` and `subscription_completed` are conversion events and
 * are reported separately from the activation funnel.
 */
export const ACTIVATION_FUNNEL: FunnelEvent[] = [
  "landing_view",
  "signup_started",
  "signup_completed",
  "resume_upload_completed",
  "profile_created",
  "job_analysis_completed",
  "tailoring_completed",
  "resume_exported",
];

export type EventProps = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsRecord {
  event: FunnelEvent;
  /** ISO timestamp. */
  ts: string;
  /** Random per-browser-session id (not a user id — no PII). */
  sessionId: string;
  props?: EventProps;
}

/* ── Sanitization ─────────────────────────────────────────────────────────── */

/** Keys that must never be sent, even if a caller passes them. */
const FORBIDDEN_PROP_KEYS = /email|name|phone|address|password|token|secret|resume_?text/i;
const MAX_STRING_PROP = 200;

/**
 * Strip PII-ish keys and truncate strings. Pure — unit tested.
 */
export function sanitizeProps(props: EventProps | undefined): EventProps | undefined {
  if (!props) return undefined;
  const out: EventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (FORBIDDEN_PROP_KEYS.test(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      out[key] = value.length > MAX_STRING_PROP ? `${value.slice(0, MAX_STRING_PROP)}…` : value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function isFunnelEvent(value: unknown): value is FunnelEvent {
  return typeof value === "string" && FUNNEL_SET.has(value);
}

/* ── Session identity (client only) ───────────────────────────────────────── */

const SESSION_KEY = "patorbit_analytics_sid";
const SEEN_KEY = "patorbit_analytics_seen";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = randomId();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "no-session";
  }
}

/* ── Client tracker ───────────────────────────────────────────────────────── */

let queue: AnalyticsRecord[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush(): void {
  if (queue.length === 0) return;
  const events = queue;
  queue = [];
  const body = JSON.stringify({ events });

  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon("/api/analytics", body);
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  try {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never break the app */
  }
}

function scheduleFlush(): void {
  // Flush immediately instead of debouncing. Funnel events are low-frequency,
  // and a debounced timer is lost when the main thread is about to block —
  // e.g. the export flow calls window.print(), which freezes the page (and all
  // pending timers) while the print dialog is open, dropping `resume_exported`.
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flush();
}

/** Queue a funnel event. Never throws; never collects PII. */
export function track(event: FunnelEvent, props?: EventProps): void {
  if (typeof window === "undefined") return;
  // Never emit network beacons from tests — a queued flush would otherwise
  // leak a stray fetch into unrelated suites.
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return;
  try {
    const record: AnalyticsRecord = {
      event,
      ts: new Date().toISOString(),
      sessionId: getSessionId(),
      props: sanitizeProps(props),
    };
    queue.push(record);
    scheduleFlush();
  } catch {
    /* swallow — analytics must never break the app */
  }
}

/** Queue an event at most once per browser session (keyed by event + subkey). */
export function trackOnce(event: FunnelEvent, props?: EventProps): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return;
  try {
    const subkey = (props?.step as string) ?? (props?.format as string) ?? "default";
    const key = `${event}:${subkey}`;
    let seen: string[] = [];
    try {
      const parsed = JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]");
      if (Array.isArray(parsed)) seen = parsed;
    } catch {
      seen = [];
    }
    if (seen.includes(key)) return;
    seen.push(key);
    try {
      sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-200)));
    } catch {
      /* storage full — still track this occurrence */
    }
    track(event, props);
  } catch {
    /* swallow */
  }
}

/**
 * Backward-compatible entry point (DemoModal and friends).
 * Funnel events go through the pipeline; other engagement events keep the
 * dev-console behavior until a real provider is connected.
 */
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (isFunnelEvent(name)) {
    track(name, properties as EventProps | undefined);
    return;
  }
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", name, properties);
  }
}

/* ── Aggregation (pure — server view + tests) ─────────────────────────────── */

export interface FunnelStepCount {
  event: FunnelEvent;
  total: number;
  /** Distinct sessions that fired the event. */
  unique: number;
  /** % of previous funnel step's unique sessions (null for the first step). */
  conversionFromPrevious: number | null;
}

export interface FunnelReport {
  steps: FunnelStepCount[];
  /** Conversion events with counts, reported outside the activation funnel. */
  conversion: Array<{ event: FunnelEvent; total: number; unique: number }>;
  totalRecords: number;
}

/**
 * Build the funnel report from raw records. Pure function — unit tested.
 */
export function buildFunnelReport(records: AnalyticsRecord[]): FunnelReport {
  const totals = new Map<FunnelEvent, number>();
  const uniques = new Map<FunnelEvent, Set<string>>();
  let counted = 0;

  for (const record of records) {
    if (!isFunnelEvent(record.event)) continue;
    counted += 1;
    totals.set(record.event, (totals.get(record.event) ?? 0) + 1);
    let set = uniques.get(record.event);
    if (!set) {
      set = new Set();
      uniques.set(record.event, set);
    }
    set.add(record.sessionId);
  }

  const steps: FunnelStepCount[] = [];
  let previousUnique: number | null = null;
  for (const event of ACTIVATION_FUNNEL) {
    const unique = uniques.get(event)?.size ?? 0;
    steps.push({
      event,
      total: totals.get(event) ?? 0,
      unique,
      conversionFromPrevious:
        previousUnique === null ? null : previousUnique === 0 ? 0 : Math.round((unique / previousUnique) * 100),
    });
    previousUnique = unique;
  }

  const conversionEvents: FunnelEvent[] = ["upgrade_viewed", "checkout_started", "subscription_completed"];
  const conversion = conversionEvents.map((event) => ({
    event,
    total: totals.get(event) ?? 0,
    unique: uniques.get(event)?.size ?? 0,
  }));

  return { steps, conversion, totalRecords: counted };
}