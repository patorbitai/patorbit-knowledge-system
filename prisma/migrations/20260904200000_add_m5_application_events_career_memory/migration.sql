-- M5: Application Lifecycle Events + Career Memory

-- ApplicationEvent: records history of status changes and interview events
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "professionalIdentityId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "interviewStage" TEXT,
    "interviewType" TEXT,
    "interviewDate" TIMESTAMP(3),
    "outcome" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CareerMemory: structured facts derived from application outcomes
CREATE TABLE "CareerMemory" (
    "id" TEXT NOT NULL,
    "professionalIdentityId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "evidenceCount" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerMemory_pkey" PRIMARY KEY ("id")
);

-- Indexes for ApplicationEvent
CREATE INDEX "ApplicationEvent_applicationId_idx" ON "ApplicationEvent"("applicationId");
CREATE INDEX "ApplicationEvent_professionalIdentityId_idx" ON "ApplicationEvent"("professionalIdentityId");
CREATE INDEX "ApplicationEvent_applicationId_createdAt_idx" ON "ApplicationEvent"("applicationId", "createdAt");

-- Indexes for CareerMemory
CREATE INDEX "CareerMemory_professionalIdentityId_idx" ON "CareerMemory"("professionalIdentityId");
CREATE INDEX "CareerMemory_professionalIdentityId_category_idx" ON "CareerMemory"("professionalIdentityId", "category");

-- Foreign key: ApplicationEvent -> JobApplication
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("applicationId") ON DELETE CASCADE ON UPDATE CASCADE;
