// types.ts

export type UserRole = 'patient' | 'provider' | 'mentor' | null;
export type PatientView = 'onboarding' | 'dashboard' | 'profile' | 'messages' | 'schedule' | 'review' | 'achievements' | 'rewards' | 'progress';
export type AlertStatus = 'stable' | 'new_message' | 'emergency';

export interface ChatMessage {
    id: string;
    text: string;
    senderId: number;
    timestamp: string;
}

export interface Medication {
    id:string;
    name: string;
    isCurrent: boolean;
    dosage?: string;
    frequency?: string;
}

export interface MedicationInfo {
    id: string;
    name: string;
    dosages: string[];
    frequencies: string[];
}

export interface MedicationSubCategory {
    name: string;
    medications: MedicationInfo[];
}

export interface MedicationCategory {
    name: string;
    subCategories: MedicationSubCategory[];
}


export interface Allergy {
    id: string;
    name: string;
    reaction: string;
    severity: number; // 1-10
}

export interface Appointment {
    id: string;
    date: string;
    time: string;
    providerName: string;
    type: 'Video Call' | 'In-Person';
}

export interface MedicationLogEntry {
    id: string;
    timestamp: string;
    user: string; // "Patient" or "Provider"
    action: string;
}

export interface PatientDetails {
    diagnosis: string;
    medications: Medication[];
    allergies: Allergy[];
    dateOfBirth: string;
    contact: { phone: string; email: string };
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    pharmacy: {
        name: string;
        address: string;
    };
    biometrics: {
        height: string;
        weight: string;
    };
    nextAppointment: Appointment | null;
    medicationLog: MedicationLogEntry[];
    onboardingComplete: boolean;
    signedDocuments: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'patient' | 'provider' | 'mentor';
  password?: string;
}

export interface Patient extends User {
  role: 'patient';
  details: PatientDetails;
  alertStatus: AlertStatus;
  providerId: number;
}

export interface Provider extends User {
    role: 'provider';
    patientIds: number[];
    mentorId: number | null;
}

export interface Mentor extends User {
    role: 'mentor';
    menteeIds: number[];
}

export interface Reward {
    id: string;
    name: string;
    cost: number;
    type: 'gift_card' | 'subscription';
    icon: string;
}

export interface DiagnosticQuestionOption {
    text: string;
    value: number;
}

export interface DiagnosticQuestion {
    id: string;
    text: string;
    options: DiagnosticQuestionOption[];
}

export interface DiagnosticTool {
    id: string;
    name: string;
    description: string;
    questions: DiagnosticQuestion[];
}

export interface LegalDocument {
    id: string;
    title: string;
    content: string;
}

export interface CaseNote {
    id: string;
    date: string;
    type: string;
    summary: string;
}

export interface CalendarEvent {
    id: string;
    summary: string;
    start: {
        dateTime: string;
        date?: string;
    };
    end: {
        dateTime: string;
        date?: string;
    };
    hangoutLink?: string;
    conferenceData?: {
        entryPoints: Array<{
            entryPointType: string;
            uri: string;
            label?: string;
        }>;
    };
}