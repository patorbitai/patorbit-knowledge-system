-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "professionalIdentityId" TEXT NOT NULL,
    "assertionText" TEXT NOT NULL,
    "claimType" TEXT NOT NULL,
    "sourceActivityId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "reasoning" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'suggested',
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Claim_professionalIdentityId_idx" ON "Claim"("professionalIdentityId");

-- CreateIndex
CREATE INDEX "Claim_professionalIdentityId_claimType_idx" ON "Claim"("professionalIdentityId", "claimType");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_professionalIdentityId_fkey" FOREIGN KEY ("professionalIdentityId") REFERENCES "ProfessionalIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Make claimId nullable on EvidenceRecord (existing rows with dangling claimId will become NULL)
ALTER TABLE "EvidenceRecord" ALTER COLUMN "claimId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "EvidenceRecord" ADD CONSTRAINT "EvidenceRecord_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "EvidenceRecord_claimId_idx" ON "EvidenceRecord"("claimId");
