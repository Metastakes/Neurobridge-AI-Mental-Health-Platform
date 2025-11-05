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
