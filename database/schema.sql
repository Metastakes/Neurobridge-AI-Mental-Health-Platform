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
