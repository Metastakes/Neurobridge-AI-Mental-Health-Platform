// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  school?: string;
  graduation_year?: number;
  subscription_status: 'trial' | 'active' | 'canceled' | 'expired';
  created_at: string;
}

// Session types
export interface Session {
  id: string;
  user_id: string;
  session_number: number;
  patient_age_range: string;
  patient_sex: string;
  patient_ethnicity: string;
  chief_complaint: string;
  status: 'active' | 'completed' | 'error';
  created_at: string;
  duration_seconds?: number;
}

// Transcript types
export interface TranscriptSegment {
  id: string;
  text: string;
  speaker: 'provider' | 'patient';
  timestamp: number;
  confidence: number;
}

// AI Suggestion types
export interface AISuggestion {
  id: string;
  type: 'question' | 'safety_alert' | 'clinical_note';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  content: string;
  timestamp: number;
}

// MSE (Mental Status Exam) types
export interface MSE {
  appearance: string;
  behavior: string;
  speech: string;
  mood: string;
  affect: string;
  thought_process: string;
  thought_content: string;
  perception: string;
  cognition: string;
  insight: string;
  judgment: string;
}

// Medication types
export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  route: string;
  indication: string;
}

// Diagnosis types
export interface Diagnosis {
  id: string;
  icd10_code: string;
  description: string;
  type: 'primary' | 'secondary';
}

// Progress types
export interface UserProgress {
  id: string;
  user_id: string;
  total_sessions: number;
  total_hours: number;
  current_streak_days: number;
  longest_streak_days: number;
  xp: number;
  level: number;
}

// Achievement types
export interface Achievement {
  id: string;
  badge_type: string;
  name: string;
  description: string;
  icon: string;
  earned_at?: string;
}

// WebSocket event types
export interface WSTranscriptEvent {
  type: 'transcript';
  data: TranscriptSegment;
}

export interface WSSuggestionEvent {
  type: 'suggestion';
  data: AISuggestion;
}

export interface WSSessionEndEvent {
  type: 'session_end';
  data: {
    soap_note: string;
    core_elms: string;
    duration_seconds: number;
  };
}

export type WSEvent = WSTranscriptEvent | WSSuggestionEvent | WSSessionEndEvent;

// ============================================================================
// SUBSCRIPTION & PREMIUM FEATURES
// ============================================================================

// Subscription Tier types
export interface SubscriptionTier {
  id: string;
  name: 'Basic' | 'Pro' | 'Elite';
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  trial_days: number;
  features: string[];
}

// Subscription types
export interface Subscription {
  id: string;
  user_id: string;
  tier_id: string;
  tier?: SubscriptionTier;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
  billing_cycle: 'monthly' | 'yearly';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  trial_start_date?: string;
  trial_end_date?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  grace_period_end?: string;
  created_at: string;
  updated_at: string;
}

// Payment Method types
export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  verified_at?: string;
  created_at: string;
}

// Feature Access types
export interface FeatureAccess {
  access: boolean;
  reason: 'basic_tier' | 'trial_active' | 'subscription_active' | 'grace_period' |
          'requires_subscription' | 'not_in_tier' | 'trial_expired' | 'payment_failed' |
          'subscription_expired' | 'error';
}

// Premium Toggle State types
export type PremiumToggleState =
  | 'basic'              // Free tier
  | 'trial'              // Active trial
  | 'active'             // Active paid subscription
  | 'payment_failed'     // Payment failed, in grace period
  | 'canceled';          // Subscription canceled

// Learning Pathway types
export interface LearningPathway {
  id: string;
  user_id: string;
  pathway_type: 'depression' | 'anxiety' | 'bipolar' | 'schizophrenia' |
                'substance_use' | 'adhd' | 'ptsd' | 'eating_disorders';
  current_level: number;
  progress_percentage: number;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningModule {
  id: string;
  pathway_type: string;
  module_number: number;
  title: string;
  description?: string;
  difficulty_level: number;
  estimated_minutes?: number;
  content: any;
  created_at: string;
}

export interface LearningAssessment {
  id: string;
  user_id: string;
  pathway_type: string;
  module_id: string;
  assessment_type: 'pre_test' | 'post_test' | 'case_scenario' | 'simulation';
  score?: number;
  passed?: boolean;
  time_spent_seconds?: number;
  answers: any;
  completed_at: string;
}

export interface CompetencyMilestone {
  id: string;
  user_id: string;
  competency_name: string;
  level_achieved: number;
  evidence: any;
  achieved_at: string;
}

// Analytics types
export interface AnalyticsSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  medication_classes_used: Record<string, number>;
  avg_dose_changes_per_session: number;
  polypharmacy_rate: number;
  safety_assessments_completed: number;
  documentation_time_seconds: number;
  differential_diagnoses_considered: number;
  percentile_rank: number;
  cohort_comparison: any;
  created_at: string;
}

export interface MedicationOutcomeTracking {
  id: string;
  user_id: string;
  session_id: string;
  medication_class: string;
  medication_name?: string;
  dosage?: string;
  response_category: 'excellent' | 'good' | 'partial' | 'poor' | 'adverse';
  side_effects: any;
  continuation_decision: 'continue' | 'increase' | 'decrease' | 'discontinue' | 'switch';
  notes?: string;
  recorded_at: string;
}

export interface QualityMetric {
  id: string;
  user_id: string;
  metric_type: 'safety_assessment_rate' | 'avg_session_duration' |
                'documentation_quality' | 'treatment_adherence';
  metric_value: number;
  measurement_date: string;
  created_at: string;
}

// Research Hub types
export interface ResearchArticle {
  id: string;
  user_id: string;
  article_source: 'pubmed' | 'clinical_trial' | 'guideline';
  external_id?: string;
  title: string;
  authors?: string;
  journal?: string;
  publication_date?: string;
  abstract?: string;
  url?: string;
  relevance_score?: number;
  tags: any;
  saved_at: string;
}

export interface ClinicalTrial {
  id: string;
  nct_id: string;
  title: string;
  condition?: string;
  intervention?: string;
  phase?: string;
  status?: string;
  enrollment?: number;
  location?: string;
  brief_summary?: string;
  eligibility_criteria?: string;
  primary_outcome?: string;
  start_date?: string;
  completion_date?: string;
  url?: string;
  last_updated: string;
}

export interface ResearchAnnotation {
  id: string;
  user_id: string;
  article_id: string;
  annotation_type: 'highlight' | 'note' | 'question' | 'clinical_pearl';
  content: string;
  page_reference?: string;
  created_at: string;
}

export interface JournalClub {
  id: string;
  article_id: string;
  scheduled_date: string;
  moderator_id: string;
  discussion_topic?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'canceled';
  created_at: string;
}

export interface JournalClubParticipant {
  id: string;
  club_id: string;
  user_id: string;
  rsvp_status: 'going' | 'maybe' | 'not_going';
  attended?: boolean;
  joined_at: string;
}

// Clinical Excellence Challenge types
export interface Challenge {
  id: string;
  title: string;
  description?: string;
  challenge_type: 'monthly' | 'weekly' | 'special_event';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  objective_type: string;
  objective_target: number;
  xp_reward: number;
  badge_reward?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  participant_count: number;
  created_at: string;
}

export interface ChallengeParticipation {
  id: string;
  challenge_id: string;
  user_id: string;
  current_progress: number;
  progress_percentage: number;
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned';
  completed_at?: string;
  final_rank?: number;
  final_percentile?: number;
  joined_at: string;
}

export interface ChallengeLeaderboard {
  id: string;
  challenge_id: string;
  user_id: string;
  rank: number;
  score: number;
  completion_time_seconds?: number;
  updated_at: string;
}
