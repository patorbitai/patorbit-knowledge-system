-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "professionalIdentityId" TEXT NOT NULL,
    "resumeName" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "careerStage" TEXT NOT NULL DEFAULT 'working-professional',
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resume_resumeId_key" ON "Resume"("resumeId");

-- CreateIndex
CREATE UNIQUE INDEX "Resume_professionalIdentityId_resumeId_key" ON "Resume"("professionalIdentityId", "resumeId");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_professionalIdentityId_fkey" FOREIGN KEY ("professionalIdentityId") REFERENCES "ProfessionalIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
