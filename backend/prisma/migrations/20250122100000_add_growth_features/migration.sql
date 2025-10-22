-- Growth & Referral Features Migration
-- Created: 2025-01-22
-- Description: Add referral tracking, enhanced reviews, and social sharing

-- ============================================
-- CREATE NEW ENUMS
-- ============================================

CREATE TYPE "ReferrerType" AS ENUM ('PATIENT', 'PROVIDER');
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'SIGNED_UP', 'ONBOARDED', 'FIRST_SESSION', 'ACTIVE');
CREATE TYPE "ShareType" AS ENUM ('ACHIEVEMENT', 'MILESTONE', 'REVIEW', 'PROFILE', 'REFERRAL');
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TWITTER');

-- ============================================
-- UPDATE EXISTING ENUMS
-- ============================================

ALTER TYPE "GamificationEventType" ADD VALUE 'ONBOARDING_COMPLETE';
ALTER TYPE "GamificationEventType" ADD VALUE 'SESSION_REVIEW';
ALTER TYPE "GamificationEventType" ADD VALUE 'REFERRAL_SIGNUP';
ALTER TYPE "GamificationEventType" ADD VALUE 'REFERRAL_FIRST_SESSION';
ALTER TYPE "GamificationEventType" ADD VALUE 'SOCIAL_SHARE';

-- ============================================
-- UPDATE PATIENT TABLE
-- ============================================

ALTER TABLE "Patient" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "Patient" ADD COLUMN "referredBy" TEXT;
ALTER TABLE "Patient" ADD COLUMN "referralSource" TEXT;

CREATE UNIQUE INDEX "Patient_referralCode_key" ON "Patient"("referralCode");
CREATE INDEX "Patient_referralCode_idx" ON "Patient"("referralCode");

-- ============================================
-- UPDATE PROVIDER TABLE
-- ============================================

ALTER TABLE "Provider" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "Provider" ADD COLUMN "referredBy" TEXT;
ALTER TABLE "Provider" ADD COLUMN "referralBonus" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Provider" ADD COLUMN "profileUrl" TEXT;
ALTER TABLE "Provider" ADD COLUMN "bio" TEXT;
ALTER TABLE "Provider" ADD COLUMN "specialties" TEXT[];
ALTER TABLE "Provider" ADD COLUMN "credentials" TEXT[];

CREATE UNIQUE INDEX "Provider_referralCode_key" ON "Provider"("referralCode");
CREATE UNIQUE INDEX "Provider_profileUrl_key" ON "Provider"("profileUrl");
CREATE INDEX "Provider_referralCode_idx" ON "Provider"("referralCode");
CREATE INDEX "Provider_profileUrl_idx" ON "Provider"("profileUrl");

-- ============================================
-- CREATE REFERRAL TABLE
-- ============================================

CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerType" "ReferrerType" NOT NULL,
    "patientId" TEXT,
    "providerId" TEXT,
    "refereeType" "ReferrerType" NOT NULL,
    "refereePatientId" TEXT,
    "refereeProviderId" TEXT,
    "referralCode" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardType" TEXT,
    "rewardAmount" DOUBLE PRECISION,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimedAt" TIMESTAMP(3),
    "signupDate" TIMESTAMP(3),
    "firstSessionDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Referral_referralCode_key" ON "Referral"("referralCode");
CREATE INDEX "Referral_referralCode_idx" ON "Referral"("referralCode");
CREATE INDEX "Referral_patientId_idx" ON "Referral"("patientId");
CREATE INDEX "Referral_providerId_idx" ON "Referral"("providerId");
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- ============================================
-- CREATE REVIEW TABLE
-- ============================================

CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "sessionId" TEXT,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "quickTags" TEXT[],
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isGoogleReview" BOOLEAN NOT NULL DEFAULT false,
    "googleReviewUrl" TEXT,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "bonusAwarded" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "moderatedBy" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Review_patientId_idx" ON "Review"("patientId");
CREATE INDEX "Review_providerId_idx" ON "Review"("providerId");
CREATE INDEX "Review_rating_idx" ON "Review"("rating");
CREATE INDEX "Review_isPublic_idx" ON "Review"("isPublic");
CREATE INDEX "Review_approved_idx" ON "Review"("approved");

-- ============================================
-- CREATE SOCIAL SHARE TABLE
-- ============================================

CREATE TABLE "SocialShare" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "providerId" TEXT,
    "shareType" "ShareType" NOT NULL,
    "platform" "Platform" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "shareUrl" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "signups" INTEGER NOT NULL DEFAULT 0,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialShare_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SocialShare_patientId_idx" ON "SocialShare"("patientId");
CREATE INDEX "SocialShare_providerId_idx" ON "SocialShare"("providerId");
CREATE INDEX "SocialShare_shareType_idx" ON "SocialShare"("shareType");
CREATE INDEX "SocialShare_platform_idx" ON "SocialShare"("platform");

-- ============================================
-- CREATE REFERRAL REWARD TABLE
-- ============================================

CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "referralCount" INTEGER NOT NULL,
    "referralStatus" "ReferralStatus" NOT NULL,
    "rewardType" TEXT NOT NULL,
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicableTo" "ReferrerType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Referral table
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereePatientId_fkey"
    FOREIGN KEY ("refereePatientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeProviderId_fkey"
    FOREIGN KEY ("refereeProviderId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Review table
ALTER TABLE "Review" ADD CONSTRAINT "Review_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review" ADD CONSTRAINT "Review_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Review" ADD CONSTRAINT "Review_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SocialShare table
ALTER TABLE "SocialShare" ADD CONSTRAINT "SocialShare_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialShare" ADD CONSTRAINT "SocialShare_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- SEED DEFAULT REFERRAL REWARDS
-- ============================================

INSERT INTO "ReferralReward" ("id", "name", "description", "referralCount", "referralStatus", "rewardType", "rewardAmount", "applicableTo", "createdAt", "updatedAt") VALUES
    ('reward_patient_3', '3 Referrals = Free Session', 'Refer 3 friends who complete their first session to earn 1 free therapy session', 3, 'FIRST_SESSION', 'FREE_SESSION', 1, ARRAY['PATIENT']::"ReferrerType"[], NOW(), NOW()),
    ('reward_patient_10', '10 Referrals = Premium Month', 'Refer 10 friends who complete their first session to earn 1 month of premium features', 10, 'FIRST_SESSION', 'PREMIUM_MONTH', 1, ARRAY['PATIENT']::"ReferrerType"[], NOW(), NOW()),
    ('reward_patient_25', '25 Referrals = VIP Status', 'Refer 25 friends who complete their first session to earn VIP status with exclusive perks', 25, 'FIRST_SESSION', 'VIP_STATUS', 1, ARRAY['PATIENT']::"ReferrerType"[], NOW(), NOW()),
    ('reward_provider_1', 'Provider Signup Bonus', 'Earn $25 when a new patient signs up using your referral link', 1, 'SIGNED_UP', 'CASH', 25, ARRAY['PROVIDER']::"ReferrerType"[], NOW(), NOW()),
    ('reward_provider_session', 'Provider First Session Bonus', 'Earn an additional $50 when your referred patient completes their first session', 1, 'FIRST_SESSION', 'CASH', 50, ARRAY['PROVIDER']::"ReferrerType"[], NOW(), NOW()),
    ('reward_provider_active', 'Provider Retention Bonus', 'Earn an additional $100 when your referred patient stays active for 3+ months', 1, 'ACTIVE', 'CASH', 100, ARRAY['PROVIDER']::"ReferrerType"[], NOW(), NOW());

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "Referral" IS 'Tracks referrals from patients and providers with reward progression';
COMMENT ON TABLE "Review" IS 'Enhanced session reviews with Google Reviews integration and moderation';
COMMENT ON TABLE "SocialShare" IS 'Tracks social media shares and their performance metrics';
COMMENT ON TABLE "ReferralReward" IS 'Configurable referral reward tiers and incentives';

COMMENT ON COLUMN "Patient"."referralCode" IS 'Unique referral code for patient (e.g., SARAH2024)';
COMMENT ON COLUMN "Patient"."referredBy" IS 'Referral code that brought this patient to the platform';
COMMENT ON COLUMN "Provider"."referralBonus" IS 'Total dollar amount earned from successful referrals';
COMMENT ON COLUMN "Provider"."profileUrl" IS 'Public profile URL slug (e.g., dr-smith)';
