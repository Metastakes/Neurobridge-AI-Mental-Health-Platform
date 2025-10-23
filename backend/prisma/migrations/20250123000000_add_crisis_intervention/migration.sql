-- CreateTable
CREATE TABLE "CrisisIntervention" (
    "id" TEXT NOT NULL,
    "crisisId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "actionsTaken" TEXT[],
    "notes" TEXT NOT NULL,
    "contactedEmergencyServices" BOOLEAN NOT NULL DEFAULT false,
    "contactedEmergencyContact" BOOLEAN NOT NULL DEFAULT false,
    "scheduledFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "resolution" TEXT NOT NULL,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrisisIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrisisIntervention_crisisId_idx" ON "CrisisIntervention"("crisisId");

-- CreateIndex
CREATE INDEX "CrisisIntervention_providerId_idx" ON "CrisisIntervention"("providerId");

-- CreateIndex
CREATE INDEX "CrisisIntervention_patientId_idx" ON "CrisisIntervention"("patientId");

-- CreateIndex
CREATE INDEX "CrisisIntervention_resolution_idx" ON "CrisisIntervention"("resolution");

-- CreateIndex
CREATE INDEX "CrisisIntervention_createdAt_idx" ON "CrisisIntervention"("createdAt");
