-- CreateTable
CREATE TABLE "ConflictRecord" (
    "id" TEXT NOT NULL,
    "professionalIdentityId" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "description" TEXT NOT NULL,
    "claimIds" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'new',
    "resolution" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConflictRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConflictRecord_professionalIdentityId_idx" ON "ConflictRecord"("professionalIdentityId");

-- CreateIndex
CREATE INDEX "ConflictRecord_professionalIdentityId_status_idx" ON "ConflictRecord"("professionalIdentityId", "status");

-- CreateIndex
CREATE INDEX "ConflictRecord_professionalIdentityId_conflictType_idx" ON "ConflictRecord"("professionalIdentityId", "conflictType");

-- AddForeignKey
ALTER TABLE "ConflictRecord" ADD CONSTRAINT "ConflictRecord_professionalIdentityId_fkey" FOREIGN KEY ("professionalIdentityId") REFERENCES "ProfessionalIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
