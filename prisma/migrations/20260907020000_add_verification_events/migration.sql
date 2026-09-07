-- CreateTable
CREATE TABLE "VerificationEvent" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "evidenceRecordId" TEXT,
    "eventType" TEXT NOT NULL,
    "previousStatus" TEXT,
    "resultingStatus" TEXT NOT NULL,
    "outcome" TEXT,
    "reason" TEXT,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'user',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationEvent_claimId_idx" ON "VerificationEvent"("claimId");

-- CreateIndex
CREATE INDEX "VerificationEvent_claimId_createdAt_idx" ON "VerificationEvent"("claimId", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationEvent_evidenceRecordId_idx" ON "VerificationEvent"("evidenceRecordId");

-- AddForeignKey
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_evidenceRecordId_fkey" FOREIGN KEY ("evidenceRecordId") REFERENCES "EvidenceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
