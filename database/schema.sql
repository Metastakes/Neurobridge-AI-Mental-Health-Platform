-- ============================================================================
-- NeuroBridge Database Schema
-- Supabase/PostgreSQL
--
-- IMPORTANT: This stores ONLY metadata for gamification
-- NO PHI, NO transcripts, NO session content
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    school VARCHAR,
    graduation_year INT,
    subscription_status VARCHAR DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'canceled', 'expired')),
    subscription_end_date TIMESTAMP,
    stripe_customer_id VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SESSION METADATA (NO PHI)
-- ============================================================================
CREATE TABLE session_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_number INT NOT NULL, -- Auto-increments per day
    session_date DATE NOT NULL,
    duration_seconds INT,
    safety_checks_completed BOOLEAN DEFAULT FALSE,
    status VARCHAR DEFAULT 'completed' CHECK (status IN ('active', 'completed', 'error')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_session_metadata_user_date ON session_metadata(user_id, session_date);

-- ============================================================================
-- USER PROGRESS (Gamification)
-- ============================================================================
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    total_sessions INT DEFAULT 0,
    total_hours DECIMAL(7,2) DEFAULT 0,
    current_streak_days INT DEFAULT 0,
    longest_streak_days INT DEFAULT 0,
    last_session_date DATE,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ACHIEVEMENTS/BADGES
-- ============================================================================
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    badge_type VARCHAR NOT NULL,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- Index for faster badge queries
CREATE INDEX idx_achievements_user ON achievements(user_id);

-- ============================================================================
-- QUIZ RESPONSES (optional post-session quiz)
-- ============================================================================
CREATE TABLE quiz_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES session_metadata(id) ON DELETE CASCADE,
    question_text TEXT,
    user_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Session metadata policies
CREATE POLICY "Users can view own sessions"
    ON session_metadata FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
    ON session_metadata FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON session_metadata FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
    ON session_metadata FOR DELETE
    USING (auth.uid() = user_id);

-- Progress policies
CREATE POLICY "Users can view own progress"
    ON user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON user_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements"
    ON achievements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
    ON achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Quiz responses policies
CREATE POLICY "Users can view own quiz responses"
    ON quiz_responses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz responses"
    ON quiz_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES FOR PREMIUM FEATURES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_method ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_pathway ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_milestone ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_outcome_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_metric ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_article ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_annotation ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_club_participant ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_leaderboard ENABLE ROW LEVEL SECURITY;

-- Subscription policies
CREATE POLICY "Users can view own subscription"
    ON subscription FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
    ON subscription FOR UPDATE
    USING (auth.uid() = user_id);

-- Payment method policies
CREATE POLICY "Users can view own payment methods"
    ON payment_method FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
    ON payment_method FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
    ON payment_method FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
    ON payment_method FOR DELETE
    USING (auth.uid() = user_id);

-- Feature access log policies
CREATE POLICY "Users can view own feature access log"
    ON feature_access_log FOR SELECT
    USING (auth.uid() = user_id);

-- Learning pathway policies
CREATE POLICY "Users can view own learning pathways"
    ON learning_pathway FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning pathways"
    ON learning_pathway FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning pathways"
    ON learning_pathway FOR UPDATE
    USING (auth.uid() = user_id);

-- Learning assessment policies
CREATE POLICY "Users can view own learning assessments"
    ON learning_assessment FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning assessments"
    ON learning_assessment FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Competency milestone policies
CREATE POLICY "Users can view own competency milestones"
    ON competency_milestone FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own competency milestones"
    ON competency_milestone FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Analytics snapshot policies
CREATE POLICY "Users can view own analytics snapshots"
    ON analytics_snapshot FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics snapshots"
    ON analytics_snapshot FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Medication outcome tracking policies
CREATE POLICY "Users can view own medication outcomes"
    ON medication_outcome_tracking FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medication outcomes"
    ON medication_outcome_tracking FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Quality metric policies
CREATE POLICY "Users can view own quality metrics"
    ON quality_metric FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quality metrics"
    ON quality_metric FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Research article policies
CREATE POLICY "Users can view own research articles"
    ON research_article FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own research articles"
    ON research_article FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own research articles"
    ON research_article FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own research articles"
    ON research_article FOR DELETE
    USING (auth.uid() = user_id);

-- Research annotation policies
CREATE POLICY "Users can view own research annotations"
    ON research_annotation FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own research annotations"
    ON research_annotation FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own research annotations"
    ON research_annotation FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own research annotations"
    ON research_annotation FOR DELETE
    USING (auth.uid() = user_id);

-- Journal club participant policies
CREATE POLICY "Users can view own journal club participations"
    ON journal_club_participant FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal club participations"
    ON journal_club_participant FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal club participations"
    ON journal_club_participant FOR UPDATE
    USING (auth.uid() = user_id);

-- Challenge participation policies
CREATE POLICY "Users can view own challenge participations"
    ON challenge_participation FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge participations"
    ON challenge_participation FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge participations"
    ON challenge_participation FOR UPDATE
    USING (auth.uid() = user_id);

-- Challenge leaderboard policies (read-only for all users)
CREATE POLICY "Users can view challenge leaderboards"
    ON challenge_leaderboard FOR SELECT
    USING (true);

-- Public read access for reference tables
ALTER TABLE subscription_tier ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_module ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_trial ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_club ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription tiers"
    ON subscription_tier FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view learning modules"
    ON learning_module FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view clinical trials"
    ON clinical_trial FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view journal clubs"
    ON journal_club FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view challenges"
    ON challenge FOR SELECT
    USING (true);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'User'));

  INSERT INTO public.user_progress (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUBSCRIPTION TIERS (reference data)
-- ============================================================================
CREATE TABLE subscription_tier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE CHECK (name IN ('Basic', 'Pro', 'Elite')),
    display_name VARCHAR NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    stripe_price_id_monthly VARCHAR,
    stripe_price_id_yearly VARCHAR,
    trial_days INT DEFAULT 0,
    features JSONB NOT NULL, -- Array of feature identifiers
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO subscription_tier (name, display_name, price_monthly, price_yearly, trial_days, features) VALUES
('Basic', 'Basic (Free)', 0.00, 0.00, 0, '["core_features", "basic_gamification"]'),
('Pro', 'Pro', 79.00, 790.00, 14, '["core_features", "basic_gamification", "learning_pathways", "advanced_analytics"]'),
('Elite', 'Elite', 149.00, 1490.00, 7, '["core_features", "basic_gamification", "learning_pathways", "advanced_analytics", "research_hub", "clinical_challenges"]');

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE subscription (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    tier_id UUID REFERENCES subscription_tier(id),
    status VARCHAR NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
    billing_cycle VARCHAR DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),

    -- Stripe fields
    stripe_customer_id VARCHAR,
    stripe_subscription_id VARCHAR,

    -- Trial management
    trial_start_date TIMESTAMP,
    trial_end_date TIMESTAMP,

    -- Billing dates
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP,

    -- Grace period for payment failures
    grace_period_end TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_user ON subscription(user_id);
CREATE INDEX idx_subscription_stripe_customer ON subscription(stripe_customer_id);

-- ============================================================================
-- PAYMENT METHODS
-- ============================================================================
CREATE TABLE payment_method (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR NOT NULL,
    card_brand VARCHAR,
    card_last4 VARCHAR(4),
    card_exp_month INT,
    card_exp_year INT,
    is_default BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP, -- $1 authorize timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_method_user ON payment_method(user_id);

-- ============================================================================
-- FEATURE ACCESS LOG
-- ============================================================================
CREATE TABLE feature_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    feature_name VARCHAR NOT NULL,
    access_granted BOOLEAN NOT NULL,
    reason VARCHAR, -- 'subscription_active', 'trial_active', 'subscription_expired', etc.
    accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feature_access_user ON feature_access_log(user_id, accessed_at);

-- ============================================================================
-- LEARNING PATHWAYS (Premium Feature 1)
-- ============================================================================
CREATE TABLE learning_pathway (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    pathway_type VARCHAR NOT NULL CHECK (pathway_type IN ('depression', 'anxiety', 'bipolar', 'schizophrenia', 'substance_use', 'adhd', 'ptsd', 'eating_disorders')),
    current_level INT DEFAULT 1,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_activity_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE learning_module (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pathway_type VARCHAR NOT NULL,
    module_number INT NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    difficulty_level INT CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_minutes INT,
    content JSONB, -- Module content structure
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE learning_assessment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    pathway_type VARCHAR NOT NULL,
    module_id UUID REFERENCES learning_module(id) ON DELETE CASCADE,
    assessment_type VARCHAR CHECK (assessment_type IN ('pre_test', 'post_test', 'case_scenario', 'simulation')),
    score DECIMAL(5,2),
    passed BOOLEAN,
    time_spent_seconds INT,
    answers JSONB, -- User answers
    completed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE competency_milestone (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    competency_name VARCHAR NOT NULL,
    level_achieved INT,
    evidence JSONB, -- References to assessments/sessions
    achieved_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_learning_pathway_user ON learning_pathway(user_id);
CREATE INDEX idx_learning_assessment_user ON learning_assessment(user_id);

-- ============================================================================
-- ADVANCED ANALYTICS (Premium Feature 2)
-- ============================================================================
CREATE TABLE analytics_snapshot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,

    -- Medication tracking metrics (aggregated from sessions)
    medication_classes_used JSONB, -- {"SSRI": 5, "SNRI": 3, "Atypical": 2}
    avg_dose_changes_per_session DECIMAL(5,2),
    polypharmacy_rate DECIMAL(5,2),

    -- Quality metrics
    safety_assessments_completed INT DEFAULT 0,
    documentation_time_seconds INT,
    differential_diagnoses_considered INT,

    -- Benchmarking (compared to anonymized cohort)
    percentile_rank DECIMAL(5,2),
    cohort_comparison JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medication_outcome_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES session_metadata(id) ON DELETE CASCADE,
    medication_class VARCHAR NOT NULL,
    medication_name VARCHAR,
    dosage VARCHAR,
    response_category VARCHAR CHECK (response_category IN ('excellent', 'good', 'partial', 'poor', 'adverse')),
    side_effects JSONB,
    continuation_decision VARCHAR CHECK (continuation_decision IN ('continue', 'increase', 'decrease', 'discontinue', 'switch')),
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quality_metric (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    metric_type VARCHAR NOT NULL CHECK (metric_type IN ('safety_assessment_rate', 'avg_session_duration', 'documentation_quality', 'treatment_adherence')),
    metric_value DECIMAL(10,2),
    measurement_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_snapshot_user ON analytics_snapshot(user_id, snapshot_date);
CREATE INDEX idx_medication_outcome_user ON medication_outcome_tracking(user_id);

-- ============================================================================
-- RESEARCH HUB (Premium Feature 3)
-- ============================================================================
CREATE TABLE research_article (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    article_source VARCHAR CHECK (article_source IN ('pubmed', 'clinical_trial', 'guideline')),
    external_id VARCHAR, -- PubMed ID, ClinicalTrials.gov ID
    title TEXT NOT NULL,
    authors TEXT,
    journal VARCHAR,
    publication_date DATE,
    abstract TEXT,
    url VARCHAR,
    relevance_score DECIMAL(3,2), -- AI-generated relevance (0-1)
    tags JSONB, -- Keywords, topics
    saved_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clinical_trial (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nct_id VARCHAR UNIQUE NOT NULL, -- ClinicalTrials.gov identifier
    title TEXT NOT NULL,
    condition VARCHAR,
    intervention TEXT,
    phase VARCHAR,
    status VARCHAR,
    enrollment INT,
    location TEXT,
    brief_summary TEXT,
    eligibility_criteria TEXT,
    primary_outcome TEXT,
    start_date DATE,
    completion_date DATE,
    url VARCHAR,
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE research_annotation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    article_id UUID REFERENCES research_article(id) ON DELETE CASCADE,
    annotation_type VARCHAR CHECK (annotation_type IN ('highlight', 'note', 'question', 'clinical_pearl')),
    content TEXT,
    page_reference VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE journal_club (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES research_article(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMP,
    moderator_id UUID REFERENCES profiles(id),
    discussion_topic TEXT,
    status VARCHAR DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'canceled')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE journal_club_participant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES journal_club(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rsvp_status VARCHAR CHECK (rsvp_status IN ('going', 'maybe', 'not_going')),
    attended BOOLEAN,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

CREATE INDEX idx_research_article_user ON research_article(user_id);
CREATE INDEX idx_clinical_trial_condition ON clinical_trial(condition);

-- ============================================================================
-- CLINICAL EXCELLENCE CHALLENGES (Premium Feature 4)
-- ============================================================================
CREATE TABLE challenge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    description TEXT,
    challenge_type VARCHAR CHECK (challenge_type IN ('monthly', 'weekly', 'special_event')),
    difficulty_level VARCHAR CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),

    -- Objectives
    objective_type VARCHAR NOT NULL, -- 'session_count', 'streak_days', 'competency_achievement', 'learning_pathway_completion'
    objective_target INT NOT NULL, -- e.g., 20 sessions, 14 days streak

    -- Rewards
    xp_reward INT DEFAULT 0,
    badge_reward VARCHAR,

    -- Timing
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    participant_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE challenge_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES challenge(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Progress tracking
    current_progress INT DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,

    -- Status
    status VARCHAR DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'abandoned')),
    completed_at TIMESTAMP,

    -- Ranking
    final_rank INT,
    final_percentile DECIMAL(5,2),

    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

CREATE TABLE challenge_leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES challenge(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rank INT NOT NULL,
    score INT NOT NULL,
    completion_time_seconds INT,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_challenge_active ON challenge(is_active, start_date, end_date);
CREATE INDEX idx_challenge_participation_user ON challenge_participation(user_id);
CREATE INDEX idx_challenge_leaderboard_challenge ON challenge_leaderboard(challenge_id, rank);

-- ============================================================================
-- BADGE DEFINITIONS (reference data)
-- ============================================================================

-- This is reference data - no need to store in DB, can be in app code
-- But including here for documentation

/*
Badge Types:
- first_session: First Session
- dedicated_learner: 10 Sessions
- veteran_clinician: 50 Sessions
- master_practitioner: 100 Sessions
- week_warrior: 7-Day Streak
- month_master: 30-Day Streak
- level_5: Reached Level 5
- level_10: Reached Level 10
- level_20: Reached Level 20
*/

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- Get user's progress dashboard
/*
SELECT
    p.full_name,
    p.school,
    up.total_sessions,
    up.total_hours,
    up.current_streak_days,
    up.xp,
    up.level,
    COUNT(DISTINCT a.badge_type) as badges_earned
FROM profiles p
JOIN user_progress up ON up.user_id = p.id
LEFT JOIN achievements a ON a.user_id = p.id
WHERE p.id = '<user_id>'
GROUP BY p.id, up.id;
*/

-- Get user's recent sessions
/*
SELECT
    session_number,
    session_date,
    duration_seconds / 60 as duration_minutes,
    safety_checks_completed,
    created_at
FROM session_metadata
WHERE user_id = '<user_id>'
ORDER BY created_at DESC
LIMIT 10;
*/

-- Get user's achievements
/*
SELECT
    badge_type,
    earned_at
FROM achievements
WHERE user_id = '<user_id>'
ORDER BY earned_at DESC;
*/

-- ============================================================================
-- NOTES
-- ============================================================================

/*
IMPORTANT REMINDERS:

1. NO PHI IS STORED IN THIS DATABASE
   - No patient names
   - No transcripts
   - No SOAP notes
   - No medications
   - No diagnoses

2. Session content lives ONLY in backend memory during active session

3. After session ends, ALL content is deleted immediately

4. Only metadata (date, duration, completion status) is logged

5. This design is HIPAA-compliant because NO PHI is persisted

6. Users access only their own data via Row Level Security (RLS)

7. All queries are automatically filtered by auth.uid()
*/
