-- C55: Job Application Workspace
-- Each application belongs to a ProfessionalIdentity and optionally references a Resume.

CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "professionalIdentityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'saved',
    "resumeId" TEXT,
    "matchScore" INTEGER,
    "matchData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on applicationId
CREATE UNIQUE INDEX "JobApplication_applicationId_key" ON "JobApplication"("applicationId");

-- Index for listing all applications for an identity
CREATE INDEX "JobApplication_professionalIdentityId_idx" ON "JobApplication"("professionalIdentityId");

-- Composite index for filtered queries (e.g. by status)
CREATE INDEX "JobApplication_professionalIdentityId_status_idx" ON "JobApplication"("professionalIdentityId", "status");

-- Foreign key to ProfessionalIdentity
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_professionalIdentityId_fkey" FOREIGN KEY ("professionalIdentityId") REFERENCES "ProfessionalIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
