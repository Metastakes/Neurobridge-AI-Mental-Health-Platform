-- Patch 04: DSM Tracking & AI Intelligence
-- Migration created: 2025-01-22

-- ============================================
-- ENUMS
-- ============================================

-- DSM Window enum
CREATE TYPE "DsmWindow" AS ENUM ('7d', '30d', '90d');

-- Risk Severity enum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- Task Status enum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'DONE', 'SKIPPED');

-- Consent Status enum
CREATE TYPE "ConsentStatus" AS ENUM ('REQUIRED', 'SIGNED', 'WAIVED');

-- Provider Action enum
CREATE TYPE "ProviderAction" AS ENUM ('ACCEPTED', 'MODIFIED', 'REJECTED');

-- ============================================
-- TABLES
-- ============================================

-- 1) Mood check-ins (DSM-aligned)
CREATE TABLE "MoodCheckin" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "mood" INTEGER NOT NULL CHECK ("mood" BETWEEN -2 AND 2),
    "sleep" INTEGER NOT NULL CHECK ("sleep" BETWEEN -2 AND 2),
    "energy" INTEGER NOT NULL CHECK ("energy" BETWEEN -2 AND 2),
    "focus" INTEGER NOT NULL CHECK ("focus" BETWEEN -2 AND 2),
    "appetite" INTEGER NOT NULL CHECK ("appetite" BETWEEN -2 AND 2),
    "motivation" INTEGER NOT NULL CHECK ("motivation" BETWEEN -2 AND 2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodCheckin_pkey" PRIMARY KEY ("id")
);

-- 2) AI-derived DSM summaries (precomputed for fast UI)
CREATE TABLE "DsmSummary" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "window" "DsmWindow" NOT NULL,
    "conditionCode" TEXT,
    "confidence" DOUBLE PRECISION,
    "matchedCriteria" JSONB,
    "lastRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DsmSummary_pkey" PRIMARY KEY ("id")
);

-- 3) Risk alerts fused from meds + mood
CREATE TABLE "RiskAlert" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "source" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "RiskAlert_pkey" PRIMARY KEY ("id")
);

-- 4) Pharmacology task list (patient-facing)
CREATE TABLE "PharmTask" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medOrderId" TEXT,
    "label" TEXT NOT NULL,
    "dueOn" DATE,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PharmTask_pkey" PRIMARY KEY ("id")
);

-- 5) Consent and compliance task gating
CREATE TABLE "ConsentTask" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "version" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'REQUIRED',
    "signatureHash" TEXT,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "ConsentTask_pkey" PRIMARY KEY ("id")
);

-- 6) AI feedback loop (provider alignment)
CREATE TABLE "AiFeedbackLog" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "advice" JSONB NOT NULL,
    "providerAction" "ProviderAction" NOT NULL,
    "mentorComment" TEXT,
    "alignmentScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiFeedbackLog_pkey" PRIMARY KEY ("id")
);

-- 7) Cached AI advice for fast UI (Co-Pilot panel)
CREATE TABLE "AiAdviceCache" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "advice" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAdviceCache_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- INDEXES
-- ============================================

-- MoodCheckin indexes
CREATE INDEX "MoodCheckin_patientId_idx" ON "MoodCheckin"("patientId");
CREATE INDEX "MoodCheckin_day_idx" ON "MoodCheckin"("day");
CREATE INDEX "MoodCheckin_patientId_day_idx" ON "MoodCheckin"("patientId", "day");

-- DsmSummary indexes
CREATE UNIQUE INDEX "DsmSummary_patientId_window_key" ON "DsmSummary"("patientId", "window");
CREATE INDEX "DsmSummary_patientId_idx" ON "DsmSummary"("patientId");

-- RiskAlert indexes
CREATE INDEX "RiskAlert_patientId_idx" ON "RiskAlert"("patientId");
CREATE INDEX "RiskAlert_severity_idx" ON "RiskAlert"("severity");
CREATE INDEX "RiskAlert_resolvedAt_idx" ON "RiskAlert"("resolvedAt");

-- PharmTask indexes
CREATE INDEX "PharmTask_patientId_idx" ON "PharmTask"("patientId");
CREATE INDEX "PharmTask_status_idx" ON "PharmTask"("status");
CREATE INDEX "PharmTask_dueOn_idx" ON "PharmTask"("dueOn");

-- ConsentTask indexes
CREATE INDEX "ConsentTask_patientId_idx" ON "ConsentTask"("patientId");
CREATE INDEX "ConsentTask_status_idx" ON "ConsentTask"("status");

-- AiFeedbackLog indexes
CREATE INDEX "AiFeedbackLog_encounterId_idx" ON "AiFeedbackLog"("encounterId");
CREATE INDEX "AiFeedbackLog_providerId_idx" ON "AiFeedbackLog"("providerId");
CREATE INDEX "AiFeedbackLog_createdAt_idx" ON "AiFeedbackLog"("createdAt");

-- AiAdviceCache indexes
CREATE UNIQUE INDEX "AiAdviceCache_patientId_key" ON "AiAdviceCache"("patientId");
CREATE INDEX "AiAdviceCache_updatedAt_idx" ON "AiAdviceCache"("updatedAt");

-- ============================================
-- FOREIGN KEYS
-- ============================================

-- MoodCheckin foreign keys
ALTER TABLE "MoodCheckin" ADD CONSTRAINT "MoodCheckin_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DsmSummary foreign keys
ALTER TABLE "DsmSummary" ADD CONSTRAINT "DsmSummary_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RiskAlert foreign keys
ALTER TABLE "RiskAlert" ADD CONSTRAINT "RiskAlert_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PharmTask foreign keys
ALTER TABLE "PharmTask" ADD CONSTRAINT "PharmTask_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ConsentTask foreign keys
ALTER TABLE "ConsentTask" ADD CONSTRAINT "ConsentTask_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AiFeedbackLog foreign keys
ALTER TABLE "AiFeedbackLog" ADD CONSTRAINT "AiFeedbackLog_encounterId_fkey"
    FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AiAdviceCache foreign keys
ALTER TABLE "AiAdviceCache" ADD CONSTRAINT "AiAdviceCache_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "MoodCheckin" IS 'Daily DSM-aligned mood tracking with 6 dimensions';
COMMENT ON TABLE "DsmSummary" IS 'Precomputed AI-derived DSM summaries for fast UI loads';
COMMENT ON TABLE "RiskAlert" IS 'Risk alerts fused from medication changes and mood patterns';
COMMENT ON TABLE "PharmTask" IS 'Patient-facing pharmacology tasks (labs, side effect reports)';
COMMENT ON TABLE "ConsentTask" IS 'Consent and compliance task gating for scheduling';
COMMENT ON TABLE "AiFeedbackLog" IS 'Provider alignment feedback loop for AI suggestions';
COMMENT ON TABLE "AiAdviceCache" IS 'Cached AI advice for instant Co-Pilot panel loads';
