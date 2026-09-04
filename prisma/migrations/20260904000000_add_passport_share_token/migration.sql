-- AlterTable
ALTER TABLE "ProfessionalIdentity" ADD COLUMN "passportShareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalIdentity_passportShareToken_key" ON "ProfessionalIdentity"("passportShareToken");
