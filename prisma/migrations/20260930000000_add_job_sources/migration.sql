-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyKey" TEXT NOT NULL,
    "locationNorm" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "employmentType" TEXT,
    "descriptionText" TEXT NOT NULL,
    "applyUrl" TEXT NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastConfirmedAt" TIMESTAMP(3),
    "freshness" TEXT NOT NULL DEFAULT 'unknown',
    "status" TEXT NOT NULL DEFAULT 'open',

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "locationRaw" TEXT,
    "salaryRaw" TEXT,
    "descriptionText" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "validThrough" TIMESTAMP(3),
    "raw" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobId" TEXT,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_companyKey_idx" ON "Job"("companyKey");

-- CreateIndex
CREATE INDEX "Job_fingerprintHash_idx" ON "Job"("fingerprintHash");

-- CreateIndex
CREATE INDEX "Job_freshness_idx" ON "Job"("freshness");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "JobPosting_jobId_idx" ON "JobPosting"("jobId");

-- CreateIndex
CREATE INDEX "JobPosting_contentHash_idx" ON "JobPosting"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_sourceKind_externalId_key" ON "JobPosting"("sourceKind", "externalId");

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

