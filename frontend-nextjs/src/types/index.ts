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
