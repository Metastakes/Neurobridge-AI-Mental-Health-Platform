-- Patch 04A: Side Effects + Performance Indexes
-- Migration created: 2025-01-22

-- ============================================
-- SIDE EFFECT EVENT TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "SideEffectEvent" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "medOrderId" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'mild' CHECK ("severity" IN ('mild','moderate','severe')),
    "onset" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SideEffectEvent_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Mood check-in queries (used heavily by risk fusion)
CREATE INDEX IF NOT EXISTS "MoodCheckin_patientId_day_idx"
    ON "MoodCheckin"("patientId", "day" DESC);

-- Medication order queries (risk fusion looks for recent changes)
CREATE INDEX IF NOT EXISTS "Medication_patientId_updatedAt_idx"
    ON "Medication"("patientId", "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "Medication_patientId_status_idx"
    ON "Medication"("patientId", "status");

-- Risk alert queries (provider dashboard)
CREATE INDEX IF NOT EXISTS "RiskAlert_patientId_createdAt_idx"
    ON "RiskAlert"("patientId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "RiskAlert_patientId_resolvedAt_idx"
    ON "RiskAlert"("patientId", "resolvedAt") WHERE "resolvedAt" IS NULL;

-- Diagnosis queries (encounter overview)
CREATE INDEX IF NOT EXISTS "Diagnosis_patientId_diagnosedAt_idx"
    ON "Diagnosis"("patientId", "diagnosedAt" DESC);

-- DSM summary queries (encounter banner)
CREATE INDEX IF NOT EXISTS "DsmSummary_patientId_window_lastRunAt_idx"
    ON "DsmSummary"("patientId", "window", "lastRunAt" DESC);

-- Side effect event queries
CREATE INDEX IF NOT EXISTS "SideEffectEvent_encounterId_idx"
    ON "SideEffectEvent"("encounterId");

CREATE INDEX IF NOT EXISTS "SideEffectEvent_medOrderId_idx"
    ON "SideEffectEvent"("medOrderId");

CREATE INDEX IF NOT EXISTS "SideEffectEvent_effect_severity_idx"
    ON "SideEffectEvent"("effect", "severity");

-- ============================================
-- FOREIGN KEYS
-- ============================================

-- SideEffectEvent foreign keys
ALTER TABLE "SideEffectEvent" ADD CONSTRAINT "SideEffectEvent_encounterId_fkey"
    FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SideEffectEvent" ADD CONSTRAINT "SideEffectEvent_medOrderId_fkey"
    FOREIGN KEY ("medOrderId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "SideEffectEvent" IS 'Structured side effect tracking for pharmacovigilance';
COMMENT ON COLUMN "SideEffectEvent"."severity" IS 'Severity: mild, moderate, or severe';
COMMENT ON COLUMN "SideEffectEvent"."onset" IS 'Date when side effect first appeared';
