/**
 * Type definitions matching backend models
 * FIX #12 APPLIED: Snake_case to match backend exactly
 */

export type UserRole = 'PATIENT' | 'PROVIDER' | 'ADMIN'

export type ProviderType = 'THERAPIST' | 'PMHNP' | 'PSYCHIATRIST' | 'FNP'

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export type PaymentType = 'CASH' | 'INSURANCE'

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE'

export type QuizStatus = 'PASSED' | 'FAILED'

export type ReferralStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED'

// Phase 2: Provider Onboarding Types
export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_PENDING'
  | 'CAQH_VERIFICATION'
  | 'BACKGROUND_CHECK'
  | 'APPROVED'
  | 'REJECTED'

export type DocumentType =
  | 'DEA_CERTIFICATE'
  | 'STATE_LICENSE'
  | 'MALPRACTICE_INSURANCE'
  | 'CV_RESUME'
  | 'BOARD_CERTIFICATION'
  | 'W9_TAX_FORM'
  | 'HIPAA_TRAINING'
  | 'OTHER'

export type DocumentStatus =
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'

export interface User {
  id: number
  email: string
  name: string
  phone: string | null
  role: UserRole
  is_active: number
  created_at: string
}

export interface Provider {
  id: number
  user_id: number
  provider_type: ProviderType
  specialty: string | null
  bio: string | null
  license_number: string | null
  state: string | null
  hourly_rate_cents: number
  no_show_min_fee_cents: number
  insurance_no_show_fee_cents: number
  late_cancel_window_hours: number
  created_at: string
}

export interface Patient {
  id: number
  user_id: number
  insurance_provider: string | null
  insurance_policy_number: string | null
  default_payment_method_id: string | null
  provider_id: number | null
  diagnosis: string | null
  created_at: string
}

export interface Appointment {
  id: number
  patient_id: number
  provider_id: number
  appointment_type: string
  status: AppointmentStatus
  payment_type: PaymentType
  starts_at: string
  ends_at: string
  amount_cents: number
  no_show_fee_charged_cents: number
  admin_fee_cents: number
  created_at: string
}

export interface PreSessionTask {
  id: number
  appointment_id: number
  question_1: string
  question_2: string
  question_3: string
  status: TaskStatus
  due_at: string
  completed_at: string | null
}

export interface MedicationEducation {
  id: number
  medication_name: string
  medication_class: string
  description: string
  usage_instructions: string
  side_effects: string
  warnings: string
  quiz_questions: QuizQuestion[]
  passing_score: number
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: string
}

export interface MedicationQuizAttempt {
  id: number
  education_id: number
  score: number
  status: QuizStatus
  acknowledged: number
  attempted_at: string
}

export interface Referral {
  id: number
  patient_id: number
  referring_provider_id: number
  referred_to_provider_id: number | null
  reason: string
  status: ReferralStatus
  from_provider_type: string
  to_provider_type: string
  created_at: string
  updated_at: string | null
}

export interface EarningsBreakdown {
  session_revenue_cents: number
  no_show_fees_cents: number
  insurance_topup_cents: number
  admin_fees_cents: number
  late_cancel_fees_cents: number
}

export interface PaymentTypeBreakdown {
  cash_revenue_cents: number
  insurance_revenue_cents: number
}

export interface EarningsDashboard {
  provider_id: number
  period_start: string
  period_end: string
  total_earnings_cents: number
  earnings_breakdown: EarningsBreakdown
  payment_type_breakdown: PaymentTypeBreakdown
  total_appointments: number
  completed_appointments: number
  no_show_count: number
  cancelled_count: number
}

// API Request/Response types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterPatientRequest {
  email: string
  password: string
  name: string
  phone?: string
}

export interface RegisterProviderRequest {
  email: string
  password: string
  name: string
  phone?: string
  provider_type: ProviderType
  specialty?: string
  license_number?: string
  state?: string
  hourly_rate_cents?: number
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: number
  role: UserRole
}

export interface AppointmentBookRequest {
  provider_id: number
  starts_at: string
  ends_at: string
  appointment_type?: string
  payment_type: PaymentType
}

export interface PreSessionTaskSubmit {
  answer_1: string
  answer_2: string
  answer_3: string
}

export interface MedicationQuizSubmit {
  education_id: number
  answers: string[]
  acknowledged: boolean
}

export interface ReferralCreateRequest {
  patient_id: number
  to_provider_type: ProviderType
  reason: string
  clinical_notes?: string
}

// Phase 2: Provider Onboarding Interfaces

export interface Specialty {
  id: number
  name: string
  description: string | null
  category: string | null
  keywords: string | null
  icon: string | null
  is_active: boolean
}

export interface InsurancePlan {
  id: number
  name: string
  payer_id: string | null
  payer_name: string | null
  plan_type: string | null
  state_coverage: string | null
  clearinghouse: string | null
  requires_auth: boolean
  logo_url: string | null
  is_active: boolean
}

export interface ProviderApplication {
  id: number
  user_id: number
  status: ApplicationStatus
  current_step: number

  // Step 1: Basic Information
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  date_of_birth: string | null
  ssn_last_four: string | null

  // Step 2: Professional Information
  npi_number: string | null
  dea_number: string | null
  provider_type: string | null
  specialties: number[] | null
  years_experience: number | null

  // Step 3: Practice Address
  practice_name: string | null
  practice_address_line1: string | null
  practice_address_line2: string | null
  practice_city: string | null
  practice_state: string | null
  practice_zip: string | null
  practice_phone: string | null

  // Step 4: Insurance & Credentialing
  insurance_plans: number[] | null
  accepts_medicare: boolean
  accepts_medicaid: boolean

  // Step 5: CAQH Credentialing
  caqh_provider_id: string | null
  caqh_username: string | null
  caqh_verified: boolean
  caqh_last_verified: string | null

  // Step 6: Background Check & Documents
  background_check_consent: boolean
  background_check_status: string | null
  background_check_completed_at: string | null
  documents_complete: boolean

  // Metadata
  created_at: string
  updated_at: string
  submitted_at: string | null
}

export interface ProviderApplicationCreate {
  first_name: string
  last_name: string
  email: string
  phone: string
}

export interface ProviderApplicationUpdate {
  // All fields optional for partial updates
  current_step?: number
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
  ssn_last_four?: string
  npi_number?: string
  dea_number?: string
  provider_type?: string
  specialties?: number[]
  years_experience?: number
  practice_name?: string
  practice_address_line1?: string
  practice_address_line2?: string
  practice_city?: string
  practice_state?: string
  practice_zip?: string
  practice_phone?: string
  insurance_plans?: number[]
  accepts_medicare?: boolean
  accepts_medicaid?: boolean
  caqh_provider_id?: string
  caqh_username?: string
  background_check_consent?: boolean
  documents_complete?: boolean
}

export interface ApplicationStatusResponse {
  application_id: number
  status: ApplicationStatus
  current_step: number
  completion_percentage: number
  missing_fields: string[]
  can_submit: boolean
}

export interface ProviderDocument {
  id: number
  provider_id: number
  document_type: DocumentType
  document_name: string
  description: string | null
  file_size: number | null
  file_type: string | null
  status: DocumentStatus
  expiration_date: string | null
  requires_renewal: number
  uploaded_at: string
  reviewed_at: string | null
  rejection_reason: string | null
}

export interface DocumentUploadResponse {
  document_id: number
  document_type: DocumentType
  file_name: string
  file_size: number
  s3_key: string
  status: DocumentStatus
  uploaded_at: string
}

export interface ProviderAvailabilitySlot {
  day_of_week: number // 0=Monday, 6=Sunday
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  timezone?: string
  is_recurring?: boolean
  allowed_appointment_types?: string[]
}

export interface ProviderAvailability extends ProviderAvailabilitySlot {
  id: number
  provider_id: number
  is_available: boolean
  override_date: string | null
}

export interface ProviderTimeOff {
  id: number
  provider_id: number
  start_date: string
  end_date: string
  reason: string | null
  is_all_day: boolean
  created_at: string
}

// Phase 3: Patient Intake & Scheduling Interfaces

export interface MedicationItem {
  name: string
  dosage: string
  frequency: string
}

export interface PatientIntakeForm {
  id: number
  patient_id: number
  status: string

  // Demographics
  preferred_name: string | null
  preferred_pronouns: string | null

  // Emergency Contact
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null

  // Insurance
  insurance_provider: string | null
  insurance_policy_number: string | null
  insurance_group_number: string | null
  insurance_subscriber_name: string | null
  insurance_subscriber_relationship: string | null
  insurance_subscriber_dob: string | null

  // Medical History
  primary_care_physician: string | null
  pcp_phone: string | null
  current_medications: MedicationItem[] | null
  medication_allergies: string | null

  // Mental Health History
  previous_mental_health_treatment: boolean | null
  previous_therapist_name: string | null
  previous_treatment_dates: string | null
  previous_psychiatric_medications: string | null
  previous_hospitalizations: string | null
  family_mental_health_history: string | null

  // Current Symptoms
  primary_concerns: string[] | null
  symptom_duration: string | null
  symptom_severity: number | null

  // Screening
  phq9_score: number | null
  gad7_score: number | null

  // Safety
  current_suicidal_ideation: boolean
  suicide_plan: boolean
  suicide_attempt_history: boolean
  suicide_attempt_details: string | null
  self_harm_history: boolean
  self_harm_details: string | null

  // Substance Use
  alcohol_use: string | null
  substance_use: string | null
  tobacco_use: boolean | null

  // Goals
  treatment_goals: string | null
  preferred_appointment_times: string[] | null
  session_frequency_preference: string | null

  // Consents
  consent_to_treatment: boolean
  consent_to_telehealth: boolean
  hipaa_acknowledgment: boolean

  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface IntakeFormCreate {
  preferred_name?: string
  preferred_pronouns?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  insurance_provider?: string
  insurance_policy_number?: string
  insurance_group_number?: string
  primary_care_physician?: string
  current_medications?: MedicationItem[]
  primary_concerns?: string[]
  phq9_score?: number
  gad7_score?: number
  treatment_goals?: string
  consent_to_treatment?: boolean
  consent_to_telehealth?: boolean
  hipaa_acknowledgment?: boolean
}

export interface ProviderSearchResult {
  provider_id: number
  user_id: number
  name: string
  provider_type: string
  specialty: string | null
  years_experience: number | null
  languages_spoken: string[] | null
  bio: string | null
  profile_photo_url: string | null
  accepts_new_patients: boolean
  earliest_availability_date: string | null
  session_duration_minutes: number
  accepts_medicare: boolean
  accepts_medicaid: boolean
  accepts_self_pay: boolean
  insurance_plans_count: number
  rating_average: number | null
  rating_count: number
}

export interface ProviderSearchFilters {
  specialty_ids?: number[]
  insurance_plan_id?: number
  accepts_medicare?: boolean
  accepts_medicaid?: boolean
  state?: string
  languages?: string[]
  sort_by?: string
  skip?: number
  limit?: number
}

export interface ProviderSearchResponse {
  results: ProviderSearchResult[]
  total_count: number
  page_size: number
  page_number: number
  total_pages: number
}

export interface AppointmentSlot {
  id: number
  provider_id: number
  start_time: string
  end_time: string
  timezone: string
  slot_type: string | null
  is_telehealth: boolean
}

export interface BookAppointmentRequest {
  slot_id: number
  appointment_type: string
  payment_type: string
  insurance_provider?: string
  insurance_policy_number?: string
  notes?: string
}

// Phase 4: Telehealth Video Integration Interfaces

export type VideoSessionStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type VideoSessionPlatform =
  | 'GOOGLE_MEET'
  | 'ZOOM'
  | 'CUSTOM'

export interface VideoSession {
  id: number
  appointment_id: number
  platform: VideoSessionPlatform
  meeting_url: string
  meeting_id: string | null
  meeting_password: string | null
  google_event_id: string | null
  google_meet_code: string | null
  scheduled_start_time: string
  scheduled_duration_minutes: number
  actual_start_time: string | null
  actual_end_time: string | null
  provider_joined_at: string | null
  patient_joined_at: string | null
  status: VideoSessionStatus
  connection_quality: string | null
  technical_issues: string | null
  recording_enabled: boolean
  recording_consent: boolean
  recording_url: string | null
  created_at: string
  updated_at: string
}

export interface SessionJoinResponse {
  video_session_id: number
  meeting_url: string
  meeting_id: string | null
  meeting_password: string | null
  status: string
  can_join: boolean
  message: string
  waiting_room_required: boolean
}

export interface SessionStatusUpdate {
  status?: VideoSessionStatus
  connection_quality?: string
  technical_issues?: string
}

export interface SessionNote {
  id: number
  video_session_id: number
  provider_id: number
  note_content: string
  note_type: string | null
  note_timestamp: string
  is_private: boolean
}

export interface SessionNoteCreate {
  note_content: string
  note_type?: string
  is_private?: boolean
}

export interface WaitingRoomEntry {
  id: number
  video_session_id: number
  patient_id: number
  joined_at: string
  is_waiting: boolean
  admitted_at: string | null
  message_to_provider: string | null
  technical_issue: string | null
}

// Phase 5: Progress Tracking & Outcomes Measurement Interfaces

export type AssessmentType =
  | 'PHQ9'
  | 'GAD7'
  | 'CUSTOM'
  | 'SESSION_RATING'
  | 'WELLBEING'

export type SeverityLevel =
  | 'NONE_MINIMAL'
  | 'MILD'
  | 'MODERATE'
  | 'MODERATELY_SEVERE'
  | 'SEVERE'

export type GoalStatus =
  | 'ACTIVE'
  | 'ACHIEVED'
  | 'DISCONTINUED'
  | 'ON_HOLD'

export type GoalCategory =
  | 'SYMPTOM_REDUCTION'
  | 'FUNCTIONAL_IMPROVEMENT'
  | 'BEHAVIORAL_CHANGE'
  | 'RELATIONSHIP_IMPROVEMENT'
  | 'COPING_SKILLS'
  | 'MEDICATION_MANAGEMENT'
  | 'LIFESTYLE_CHANGE'
  | 'OTHER'

export interface AssessmentQuestionOption {
  value: number
  text: string
}

export interface AssessmentQuestion {
  question: string
  options: AssessmentQuestionOption[]
  reverse_scored: boolean
}

export interface AssessmentScale {
  id: number
  scale_type: AssessmentType
  scale_name: string
  scale_code: string
  description: string | null
  instructions: string | null
  min_score: number
  max_score: number
  questions: AssessmentQuestion[]
  severity_thresholds: Record<string, number> | null
  is_standard: boolean
  is_active: boolean
  created_by_provider_id: number | null
  created_at: string
  updated_at: string | null
}

export interface AssessmentScaleListItem {
  id: number
  scale_type: string
  scale_name: string
  scale_code: string
  description: string | null
  min_score: number
  max_score: number
  is_standard: boolean
  is_active: boolean
}

export interface AssessmentAttemptCreate {
  scale_id: number
  responses: number[]
  appointment_id?: number
  notes?: string
  started_at?: string
}

export interface AssessmentAttempt {
  id: number
  patient_id: number
  scale_id: number
  appointment_id: number | null
  responses: number[]
  total_score: number
  severity_level: SeverityLevel | null
  notes: string | null
  administered_by_provider_id: number | null
  started_at: string | null
  completed_at: string
  created_at: string
  scale_name: string | null
  scale_code: string | null
}

export interface AssessmentScoreHistory {
  scale_id: number
  scale_name: string
  scale_code: string
  min_score: number
  max_score: number
  attempts: AssessmentAttempt[]
  current_score: number | null
  previous_score: number | null
  score_change: number | null
  trend: 'improving' | 'stable' | 'worsening' | null
}

export interface ProgressSummary {
  patient_id: number
  first_assessment_date: string | null
  last_assessment_date: string | null
  total_assessments: number
  assessment_history: AssessmentScoreHistory[]
  active_goals_count: number
  achieved_goals_count: number
}

export interface TreatmentGoalCreate {
  patient_id: number
  category: GoalCategory
  goal_text: string
  is_specific?: boolean
  is_measurable?: boolean
  target_metric?: string
  target_value?: number
  target_date?: string
  interventions?: string
}

export interface TreatmentGoalUpdate {
  goal_text?: string
  category?: GoalCategory
  target_metric?: string
  target_value?: number
  target_date?: string
  status?: GoalStatus
  progress_percentage?: number
  barriers?: string
  interventions?: string
  discontinued_reason?: string
}

export interface TreatmentGoal {
  id: number
  patient_id: number
  provider_id: number
  category: GoalCategory
  goal_text: string
  is_specific: boolean
  is_measurable: boolean
  target_metric: string | null
  target_value: number | null
  target_date: string | null
  status: GoalStatus
  progress_percentage: number
  barriers: string | null
  interventions: string | null
  achieved_at: string | null
  discontinued_at: string | null
  discontinued_reason: string | null
  created_at: string
  updated_at: string | null
}

export interface GoalProgressCreate {
  goal_id: number
  progress_percentage: number
  metric_value?: number
  progress_notes?: string
  patient_feedback?: string
  appointment_id?: number
}

export interface GoalProgress {
  id: number
  goal_id: number
  recorded_by_provider_id: number
  appointment_id: number | null
  progress_percentage: number
  metric_value: number | null
  progress_notes: string | null
  patient_feedback: string | null
  recorded_at: string
  created_at: string
}

export interface TreatmentGoalWithProgress extends TreatmentGoal {
  recent_progress: GoalProgress[]
}

// Phase 5 Enhancement: Gamification Interfaces

export type AchievementCategory =
  | 'ASSESSMENT'
  | 'STREAK'
  | 'PROGRESS'
  | 'GOAL'
  | 'ENGAGEMENT'

export type AchievementTier =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'

export interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  category: AchievementCategory
  tier: AchievementTier
  unlock_criteria: Record<string, any>
  points: number
  color: string | null
  is_hidden: boolean
  is_active: boolean
  created_at: string
}

export interface PatientAchievement {
  id: number
  patient_id: number
  achievement_id: number
  unlocked_at: string
  is_viewed: boolean
  trigger_context: Record<string, any> | null
  achievement: Achievement
}

export interface PatientStreak {
  id: number
  patient_id: number
  current_streak_days: number
  longest_streak_days: number
  last_assessment_date: string | null
  current_streak_weeks: number
  longest_streak_weeks: number
  total_assessment_count: number
  total_session_count: number
  engagement_score: number
  created_at: string
  updated_at: string | null
}

export interface StreakUpdate {
  streak: PatientStreak
  streak_broken: boolean
  streak_maintained: boolean
  new_record: boolean
  achievements_unlocked: Achievement[]
  motivational_message: string | null
}

export interface GamificationDashboard {
  patient_id: number
  streak: PatientStreak
  streak_status: 'active' | 'at_risk' | 'broken'
  next_streak_milestone: number | null
  total_achievements: number
  unlocked_achievements: number
  recent_achievements: PatientAchievement[]
  next_achievement: Achievement | null
  total_milestones: number
  achieved_milestones: number
  milestone_progress: any[]
  total_points: number
  current_level: number
  points_to_next_level: number
  motivational_message: string | null
  motivational_icon: string | null
}

// Phase 5 Enhancement: Medication Education & Rewards Interfaces

export type RewardCategory =
  | 'VITAMINS'
  | 'FITNESS_GEAR'
  | 'HEALTHY_SNACKS'
  | 'WELLNESS_BOOKS'
  | 'MEDITATION_APPS'
  | 'GYM_MEMBERSHIP'
  | 'MEAL_PREP'
  | 'OTHER'

export type RedemptionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

export interface PrescribedMedication {
  id: number
  patient_id: number
  provider_id: number
  medication_name: string
  dosage: string | null
  frequency: string | null
  instructions: string | null
  prescribed_date: string
  start_date: string | null
  end_date: string | null
  requires_quiz: boolean
  quiz_completed: boolean
  quiz_completed_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface MedicationQuizQuestion {
  id: number
  medication_name: string
  question: string
  question_type: string
  options: Record<string, string>
  correct_answer: string
  explanation: string
  is_critical: boolean
  is_active: boolean
  created_at: string
}

export interface QuizAnswerSubmit {
  question_id: number
  selected_answer: string
}

export interface MedicationQuizSubmit {
  prescribed_medication_id: number
  responses: QuizAnswerSubmit[]
  started_at?: string
}

export interface QuizResponseDetail {
  question_id: number
  question: string
  selected: string
  correct: string
  is_correct: boolean
  explanation: string
  is_critical: boolean
}

export interface MedicationQuizResult {
  attempt_id: number
  prescribed_medication_id: number
  medication_name: string
  total_questions: number
  correct_answers: number
  score_percentage: number
  passed: boolean
  points_earned: number
  responses: QuizResponseDetail[]
  completed_at: string
}

export interface RewardItem {
  id: number
  name: string
  description: string
  category: RewardCategory
  brand_name: string | null
  is_partner: boolean
  points_cost: number
  image_url: string | null
  stock_quantity: number | null
  max_per_user: number | null
  is_available: boolean
  is_active: boolean
  is_featured: boolean
  display_order: number
  terms_conditions: string | null
  created_at: string
  updated_at: string | null
}

export interface RewardRedeemRequest {
  reward_item_id: number
  quantity: number
  shipping_address?: Record<string, any>
}

export interface RewardRedemption {
  id: number
  patient_id: number
  reward_item_id: number
  reward_name: string
  points_spent: number
  quantity: number
  status: RedemptionStatus
  requires_shipping: boolean
  tracking_number: string | null
  redeemed_at: string
}

export interface PatientPoints {
  id: number
  patient_id: number
  current_balance: number
  total_points_earned: number
  total_points_spent: number
  total_redemptions: number
  created_at: string
  updated_at: string | null
}

export interface PointsTransaction {
  id: number
  patient_points_id: number
  patient_id: number
  transaction_type: string
  points: number
  balance_after: number
  description: string
  reference_id: number | null
  reference_type: string | null
  created_at: string
}

export interface PointsEarningSummary {
  available_tasks: Array<{
    task: string
    points: number
    icon: string
  }>
  total_available_points: number
}

export interface RewardsMarketplace {
  patient_points: PatientPoints
  featured_rewards: RewardItem[]
  all_rewards: RewardItem[]
  recent_redemptions: RewardRedemption[]
  points_earning_guide: PointsEarningSummary
}
