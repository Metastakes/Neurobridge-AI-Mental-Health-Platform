/**
 * TypeScript types for NeuroBridge API
 * Auto-generated from backend schema
 */

// ============================================
// ENUMS
// ============================================

export enum UserRole {
  PATIENT = 'PATIENT',
  PROVIDER = 'PROVIDER',
  MENTOR = 'MENTOR',
  ADMIN = 'ADMIN',
}

export enum AlertStatus {
  STABLE = 'STABLE',
  NEW_MESSAGE = 'NEW_MESSAGE',
  EMERGENCY = 'EMERGENCY',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum MedicationStatus {
  ACTIVE = 'ACTIVE',
  DISCONTINUED = 'DISCONTINUED',
  PAUSED = 'PAUSED',
}

export enum GamificationEventType {
  SESSION_COMPLETED = 'SESSION_COMPLETED',
  MEDICATION_ADHERENCE = 'MEDICATION_ADHERENCE',
  SIDE_EFFECT_REPORT = 'SIDE_EFFECT_REPORT',
  SAFETY_CHECK = 'SAFETY_CHECK',
  LAB_COMPLETED = 'LAB_COMPLETED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  mfaEnabled: boolean;
  patient?: Patient;
  provider?: Provider;
  mentor?: Mentor;
}

// ============================================
// PATIENT TYPES
// ============================================

export interface Patient {
  id: string;
  userId: string;
  user?: User;
  dateOfBirth: string;
  sex?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  pharmacyName?: string;
  pharmacyPhone?: string;
  pharmacyAddress?: string;
  height?: number;
  weight?: number;
  alertStatus: AlertStatus;
  onboardingComplete: boolean;
  providerId?: string;
  provider?: Provider;
  diagnoses?: Diagnosis[];
  medications?: Medication[];
  allergies?: Allergy[];
  encounters?: Encounter[];
  achievements?: PatientAchievement[];
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id: string;
  userId: string;
  user?: User;
  npiNumber?: string;
  licenseNumber?: string;
  licenseState?: string;
  deaNumber?: string;
  mentorId?: string;
  mentor?: Mentor;
  patients?: Patient[];
  encounters?: Encounter[];
  createdAt: string;
  updatedAt: string;
}

export interface Mentor {
  id: string;
  userId: string;
  user?: User;
  npiNumber?: string;
  licenseNumber?: string;
  mentees?: Provider[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CLINICAL TYPES
// ============================================

export interface Diagnosis {
  id: string;
  patientId: string;
  icdCode: string;
  description: string;
  diagnosedAt: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  category?: string;
  prescribedAt: string;
  status: MedicationStatus;
  startedAt?: string;
  stoppedAt?: string;
  prescriberId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Allergy {
  id: string;
  patientId: string;
  allergen: string;
  reaction?: string;
  severity: number; // 1-10
  createdAt: string;
  updatedAt: string;
}

export interface Encounter {
  id: string;
  patientId: string;
  providerId: string;
  patient?: Patient;
  provider?: Provider;
  scheduledAt: string;
  completedAt?: string;
  status: AppointmentStatus;
  meetLink?: string;
  meetEventId?: string;
  durationMinutes?: number;
  caseNotes?: CaseNote[];
  billingCodes?: BillingCode[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseNote {
  id: string;
  encounterId: string;
  providerId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  generatedByAI: boolean;
  aiModelUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingCode {
  id: string;
  encounterId: string;
  code: string;
  type: 'EM_CODE' | 'CPT' | 'MODIFIER';
  description?: string;
  basis?: string;
  rationale?: string;
  createdAt: string;
}

// ============================================
// GAMIFICATION TYPES
// ============================================

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon?: string;
  points: number;
}

export interface PatientAchievement {
  id: string;
  patientId: string;
  achievementId: string;
  achievement?: Achievement;
  unlockedAt: string;
}

export interface GamificationEvent {
  id: string;
  patientId: string;
  eventType: GamificationEventType;
  points: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface GamificationSummary {
  totalPoints: number;
  achievements: (Achievement & { unlockedAt: string })[];
  recentEvents: GamificationEvent[];
  stats: { eventType: string; _count: number }[];
}

// ============================================
// AI TYPES
// ============================================

export interface AISafetyAlert {
  severity: 'critical' | 'high' | 'moderate' | 'low';
  category: string;
  message: string;
  recommendation?: string;
}

export interface AINextQuestion {
  question: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIPlanReview {
  item: string;
  assessment: string;
  alternatives?: string[];
}

export interface AIBillingPrompt {
  code: string;
  basis: string;
  rationale: string;
}

export interface AISuggestionResponse {
  safety_alerts: AISafetyAlert[];
  next_best_questions: AINextQuestion[];
  plan_reviews: AIPlanReview[];
  billing_prompts?: AIBillingPrompt[];
  safetyScore: number; // 1-10
  confidence: number; // 0-1
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    skip?: number;
    take?: number;
  };
}

export interface ApiError {
  statusCode: number;
  timestamp: string;
  path: string;
  error: string;
  message: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: { status: string; latency: string };
    ai: { status: string; provider: string };
    calendar: { status: string; provider: string };
    payments: { status: string; provider: string };
  };
  memory: {
    used: string;
    total: string;
  };
  responseTime: string;
}

// ============================================
// SCHEDULING TYPES
// ============================================

export interface BookAppointmentRequest {
  patientId: string;
  providerId: string;
  scheduledAt: string;
  durationMinutes?: number;
}

export interface BookAppointmentResponse {
  encounter: Encounter;
  meetLink: string;
  startTime: string;
  endTime: string;
}

// ============================================
// BILLING TYPES
// ============================================

export interface BillingEvaluation {
  emCode: string;
  basis: 'MDM' | 'Time';
  modifiers: string[];
  g2211: boolean;
  rationale: string;
}
