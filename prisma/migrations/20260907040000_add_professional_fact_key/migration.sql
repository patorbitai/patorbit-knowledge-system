-- AlterTable: Add professionalFactKey column to Claim
ALTER TABLE "Claim" ADD COLUMN "professionalFactKey" TEXT;

-- CreateIndex: Composite index for efficient lookup during synchronization
CREATE INDEX "Claim_professionalIdentityId_professionalFactKey_idx" ON "Claim"("professionalIdentityId", "professionalFactKey");
