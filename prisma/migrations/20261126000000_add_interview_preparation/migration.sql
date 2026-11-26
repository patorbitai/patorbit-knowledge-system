-- CreateTable
CREATE TABLE "InterviewProfile" (
    "id" TEXT NOT NULL,
    "professionalIdentityId" TEXT NOT NULL,
    "applicationId" TEXT,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "experienceYears" DOUBLE PRECISION,
    "jobDescription" TEXT,
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seniority" TEXT,
    "interviewDate" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "durationMinutes" INTEGER,
    "interviewRound" TEXT,
    "interviewFormat" TEXT,
    "interviewType" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewEmail" (
    "id" TEXT NOT NULL,
    "interviewProfileId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "subject" TEXT,
    "sender" TEXT,
    "receivedAt" TIMESTAMP(3),
    "originalContent" TEXT NOT NULL,
    "extractedFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewRound" (
    "id" TEXT NOT NULL,
    "interviewProfileId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "roundName" TEXT NOT NULL,
    "roundType" TEXT NOT NULL,
    "interviewDate" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "durationMinutes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "applicationEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparationPlan" (
    "id" TEXT NOT NULL,
    "interviewProfileId" TEXT NOT NULL,
    "roundId" TEXT,
    "generatedContent" JSONB NOT NULL,
    "topics" JSONB NOT NULL,
    "questions" JSONB NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreparationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "interviewProfileId" TEXT NOT NULL,
    "roundId" TEXT,
    "sessionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "questions" JSONB NOT NULL DEFAULT '[]',
    "answers" JSONB NOT NULL DEFAULT '[]',
    "evaluation" JSONB,
    "overallScore" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPracticeQuestion" (
    "id" TEXT NOT NULL,
    "professionalIdentityId" TEXT NOT NULL,
    "interviewProfileId" TEXT,
    "sessionId" TEXT,
    "category" TEXT NOT NULL,
    "difficulty" TEXT,
    "text" TEXT NOT NULL,
    "suggestedAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPracticeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewEmailConnection" (
    "id" TEXT NOT NULL,
    "professionalIdentityId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accountEmail" TEXT,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewEmailConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewProfile_professionalIdentityId_idx" ON "InterviewProfile"("professionalIdentityId");

-- CreateIndex
CREATE INDEX "InterviewProfile_professionalIdentityId_status_idx" ON "InterviewProfile"("professionalIdentityId", "status");

-- CreateIndex
CREATE INDEX "InterviewProfile_professionalIdentityId_interviewDate_idx" ON "InterviewProfile"("professionalIdentityId", "interviewDate");

-- CreateIndex
CREATE INDEX "InterviewProfile_applicationId_idx" ON "InterviewProfile"("applicationId");

-- CreateIndex
CREATE INDEX "InterviewEmail_interviewProfileId_idx" ON "InterviewEmail"("interviewProfileId");

-- CreateIndex
CREATE INDEX "InterviewRound_interviewProfileId_idx" ON "InterviewRound"("interviewProfileId");

-- CreateIndex
CREATE INDEX "InterviewRound_interviewProfileId_order_idx" ON "InterviewRound"("interviewProfileId", "order");

-- CreateIndex
CREATE INDEX "PreparationPlan_interviewProfileId_idx" ON "PreparationPlan"("interviewProfileId");

-- CreateIndex
CREATE INDEX "PreparationPlan_roundId_idx" ON "PreparationPlan"("roundId");

-- CreateIndex
CREATE INDEX "PracticeSession_interviewProfileId_idx" ON "PracticeSession"("interviewProfileId");

-- CreateIndex
CREATE INDEX "PracticeSession_interviewProfileId_status_idx" ON "PracticeSession"("interviewProfileId", "status");

-- CreateIndex
CREATE INDEX "PracticeSession_roundId_idx" ON "PracticeSession"("roundId");

-- CreateIndex
CREATE INDEX "SavedPracticeQuestion_professionalIdentityId_idx" ON "SavedPracticeQuestion"("professionalIdentityId");

-- CreateIndex
CREATE INDEX "SavedPracticeQuestion_professionalIdentityId_category_idx" ON "SavedPracticeQuestion"("professionalIdentityId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewEmailConnection_professionalIdentityId_provider_key" ON "InterviewEmailConnection"("professionalIdentityId", "provider");

-- AddForeignKey
ALTER TABLE "InterviewProfile" ADD CONSTRAINT "InterviewProfile_professionalIdentityId_fkey" FOREIGN KEY ("professionalIdentityId") REFERENCES "ProfessionalIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewProfile" ADD CONSTRAINT "InterviewProfile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("applicationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEmail" ADD CONSTRAINT "InterviewEmail_interviewProfileId_fkey" FOREIGN KEY ("interviewProfileId") REFERENCES "InterviewProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRound" ADD CONSTRAINT "InterviewRound_interviewProfileId_fkey" FOREIGN KEY ("interviewProfileId") REFERENCES "InterviewProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationPlan" ADD CONSTRAINT "PreparationPlan_interviewProfileId_fkey" FOREIGN KEY ("interviewProfileId") REFERENCES "InterviewProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationPlan" ADD CONSTRAINT "PreparationPlan_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "InterviewRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_interviewProfileId_fkey" FOREIGN KEY ("interviewProfileId") REFERENCES "InterviewProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "InterviewRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPracticeQuestion" ADD CONSTRAINT "SavedPracticeQuestion_professionalIdentityId_fkey" FOREIGN KEY ("professionalIdentityId") REFERENCES "ProfessionalIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPracticeQuestion" ADD CONSTRAINT "SavedPracticeQuestion_interviewProfileId_fkey" FOREIGN KEY ("interviewProfileId") REFERENCES "InterviewProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPracticeQuestion" ADD CONSTRAINT "SavedPracticeQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEmailConnection" ADD CONSTRAINT "InterviewEmailConnection_professionalIdentityId_fkey" FOREIGN KEY ("professionalIdentityId") REFERENCES "ProfessionalIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

