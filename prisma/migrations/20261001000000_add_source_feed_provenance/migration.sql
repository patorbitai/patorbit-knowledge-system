-- M7C — source/feed provenance + trustworthy freshness observations.
-- Additive only: new columns, one index, one new evidence table, and a
-- REPLACEMENT for the (sourceKind, externalId) unique index — the old key
-- could not distinguish two boards that legitimately share an external ID
-- (the M7C spec requires same-externalId-on-different-feeds never collide).
--
-- Both this migration and 20260930000000_add_job_sources run in the same
-- deploy, in order, against a database where the Job/JobPosting tables do
-- not yet exist — so ADD COLUMN ... NOT NULL (no default) is safe here and
-- matches prisma/schema.prisma exactly (no defaults to drift).

-- AlterTable
ALTER TABLE "JobPosting" ADD COLUMN "sourceFeedKey" TEXT NOT NULL;
ALTER TABLE "JobPosting" ADD COLUMN "applyUrl" TEXT NOT NULL;
ALTER TABLE "JobPosting" ADD COLUMN "lastConfirmedAt" TIMESTAMP(3);
ALTER TABLE "JobPosting" ADD COLUMN "absentConsecutiveChecks" INTEGER NOT NULL DEFAULT 0;

-- DropIndex
DROP INDEX "JobPosting_sourceKind_externalId_key";

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_sourceKind_sourceFeedKey_externalId_key" ON "JobPosting"("sourceKind", "sourceFeedKey", "externalId");

CREATE INDEX "JobPosting_sourceKind_sourceFeedKey_idx" ON "JobPosting"("sourceKind", "sourceFeedKey");

-- CreateTable
CREATE TABLE "JobSourceObservation" (
    "id" TEXT NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "sourceFeedKey" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "complete" BOOLEAN NOT NULL,
    "completeReason" TEXT,
    "presentExternalIds" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JobSourceObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobSourceObservation_sourceKind_sourceFeedKey_observedAt_idx" ON "JobSourceObservation"("sourceKind", "sourceFeedKey", "observedAt");
