-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN "qualificationMatch" JSONB,
ADD COLUMN "matchedResumeId" TEXT,
ADD COLUMN "matchedAt" TIMESTAMP(3);
