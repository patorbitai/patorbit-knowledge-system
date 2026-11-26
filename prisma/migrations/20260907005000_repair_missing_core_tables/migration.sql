-- Repair: create the core tables that later migrations reference.
--
-- History note: `EvidenceRecord`, `Subscription` and `UsageRecord` were added to
-- `prisma/schema.prisma` without ever being written as a migration. As a result
-- the chain broke at 20260907010000 (which alters `EvidenceRecord`),
-- 20260907020000 (which adds a foreign key to it) and 20260908000000 (which
-- alters `Subscription`), so `prisma migrate deploy` could never complete on any
-- database.
--
-- This migration sits immediately before 20260907010000 and creates the tables
-- as they existed at that point in the history: `EvidenceRecord.claimId` is
-- still NOT NULL and carries no foreign key, because the *next* migration drops
-- the NOT NULL and adds the FK to `Claim`. `Subscription` is created without the
-- trial columns, which 20260908000000 adds.
--
-- Every statement is idempotent. That is deliberate: databases that were created
-- with `prisma db push` and later baselined already contain these tables (with
-- more columns than this migration defines), and this migration still has to run
-- without destroying or rewriting that existing data.

-- ─── EvidenceRecord ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "EvidenceRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "evidenceKind" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceRecord_pkey" PRIMARY KEY ("id")
);

-- NOTE: `EvidenceRecord_claimId_idx` is intentionally NOT created here.
-- 20260907010000 creates it, and it is still part of the chain.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'EvidenceRecord_userId_fkey'
    ) THEN
        ALTER TABLE "EvidenceRecord"
            ADD CONSTRAINT "EvidenceRecord_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ─── Subscription ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razorpaySubscriptionId" TEXT NOT NULL,
    "razorpayPlanId" TEXT NOT NULL,
    "razorpayCustomerId" TEXT,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_razorpaySubscriptionId_key" ON "Subscription"("razorpaySubscriptionId");
CREATE INDEX IF NOT EXISTS "Subscription_razorpaySubscriptionId_idx" ON "Subscription"("razorpaySubscriptionId");
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Subscription_userId_fkey'
    ) THEN
        ALTER TABLE "Subscription"
            ADD CONSTRAINT "Subscription_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ─── UsageRecord ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "UsageRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UsageRecord_userId_feature_period_key" ON "UsageRecord"("userId", "feature", "period");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UsageRecord_userId_fkey'
    ) THEN
        ALTER TABLE "UsageRecord"
            ADD CONSTRAINT "UsageRecord_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ─── Columns that exist in schema.prisma but in no migration ────────────
--
-- Same history gap as the tables above: these trust/passport cache and billing
-- columns were added to the schema without a migration, so a database created by
-- `prisma migrate deploy` lacks them while a `db push` database has them. Adding
-- them here keeps both kinds of database compatible with the application.

ALTER TABLE "ProfessionalIdentity" ADD COLUMN IF NOT EXISTS "trustShareToken" TEXT;
ALTER TABLE "ProfessionalIdentity" ADD COLUMN IF NOT EXISTS "trustShareEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProfessionalIdentity" ADD COLUMN IF NOT EXISTS "trustReportCache" TEXT;
ALTER TABLE "ProfessionalIdentity" ADD COLUMN IF NOT EXISTS "passportShareEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProfessionalIdentity" ADD COLUMN IF NOT EXISTS "passportDataCache" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ProfessionalIdentity_trustShareToken_key" ON "ProfessionalIdentity"("trustShareToken");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "razorpayCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "razorpayContactId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT NOT NULL DEFAULT 'inactive';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "User_razorpayCustomerId_key" ON "User"("razorpayCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_razorpayContactId_key" ON "User"("razorpayContactId");
