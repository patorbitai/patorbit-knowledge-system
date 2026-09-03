-- AlterTable
ALTER TABLE "Resume" ADD COLUMN "shareEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Resume" ADD COLUMN "shareToken" TEXT;

-- CreateIndex (shareToken is already unique via @unique in Prisma, but we add it explicitly)
CREATE UNIQUE INDEX "Resume_shareToken_key" ON "Resume"("shareToken");
