-- CreateTable
CREATE TABLE "SessionReview" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "sessionId" TEXT,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "wouldRecommend" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionReview_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Encounter" ADD COLUMN "reviewSubmitted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "SessionReview_patientId_idx" ON "SessionReview"("patientId");

-- CreateIndex
CREATE INDEX "SessionReview_sessionId_idx" ON "SessionReview"("sessionId");

-- AddForeignKey
ALTER TABLE "SessionReview" ADD CONSTRAINT "SessionReview_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionReview" ADD CONSTRAINT "SessionReview_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
