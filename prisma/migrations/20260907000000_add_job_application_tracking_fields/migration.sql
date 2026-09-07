-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN "jobUrl" TEXT,
ADD COLUMN "location" TEXT,
ADD COLUMN "employmentType" TEXT,
ADD COLUMN "appliedDate" TIMESTAMP(3),
ADD COLUMN "followUpDate" TIMESTAMP(3),
ADD COLUMN "notes" TEXT;
