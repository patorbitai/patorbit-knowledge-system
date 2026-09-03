-- AlterTable
ALTER TABLE "ProfessionalIdentity" ADD COLUMN "profileData" JSONB,
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
