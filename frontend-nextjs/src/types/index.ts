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
