-- First-party funnel/workflow analytics (§16/§17/§24) — replaces the
-- single-instance .analytics/events.jsonl file. Client-generated ids make
-- beacon retries idempotent (PK dedupe); props are sanitized before insert.

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "props" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_event_ts_idx" ON "AnalyticsEvent"("event", "ts");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_ts_idx" ON "AnalyticsEvent"("ts");
