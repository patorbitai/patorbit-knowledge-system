/**
 * POST /api/analytics — receive funnel events (sendBeacon from the client).
 * GET  /api/analytics — aggregated funnel (authenticated; powers /settings/funnel).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { appendEvents, normalizeBatch, readEvents } from "@/lib/analytics-server";
import { buildFunnelReport } from "@/lib/analytics";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const events = normalizeBatch((body as { events?: unknown })?.events);
  const stored = await appendEvents(events);
  // Never surface storage errors to the beacon caller — silent by design.
  return NextResponse.json({ ok: stored, accepted: events.length }, { status: 200 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await readEvents();
  const report = buildFunnelReport(records);
  return NextResponse.json(report);
}
