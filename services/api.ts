/**
 * API Client for NeuroBridge Backend
 * Replace mock data with real API calls
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================
// AUTHENTICATION
// ============================================

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },

  verify: async (token: string) => {
    const { data } = await apiClient.post('/auth/verify', { token });
    return data;
  },
};

// ============================================
// PATIENTS
// ============================================

export const patientsApi = {
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/patients/${id}`);
    return data;
  },

  getByProvider: async (providerId: string) => {
    const { data } = await apiClient.get(`/patients/provider/${providerId}`);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/patients/${id}`, updates);
    return data;
  },

  getGamificationSummary: async (patientId: string) => {
    const { data } = await apiClient.get(`/patients/${patientId}/gamification`);
    return data;
  },
};

// ============================================
// MEDICATIONS
// ============================================

export const medicationsApi = {
  getByPatient: async (patientId: string) => {
    const { data } = await apiClient.get(`/medications/patient/${patientId}`);
    return data;
  },

  getActive: async (patientId: string) => {
    const { data } = await apiClient.get(`/medications/patient/${patientId}/active`);
    return data;
  },

  create: async (medication: {
    patientId: string;
    name: string;
    dosage: string;
    frequency: string;
    category?: string;
    prescriberId?: string;
  }) => {
    const { data } = await apiClient.post('/medications', medication);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/medications/${id}`, updates);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/medications/${id}`);
    return data;
  },
};

// ============================================
// DIAGNOSES
// ============================================

export const diagnosesApi = {
  getByPatient: async (patientId: string) => {
    const { data } = await apiClient.get(`/diagnoses/patient/${patientId}`);
    return data;
  },

  create: async (diagnosis: {
    patientId: string;
    icdCode: string;
    description: string;
    isPrimary?: boolean;
  }) => {
    const { data } = await apiClient.post('/diagnoses', diagnosis);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/diagnoses/${id}`);
    return data;
  },
};

// ============================================
// ENCOUNTERS (APPOINTMENTS)
// ============================================

export const encountersApi = {
  getByPatient: async (patientId: string) => {
    const { data } = await apiClient.get(`/encounters/patient/${patientId}`);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/encounters/${id}`);
    return data;
  },

  create: async (encounter: any) => {
    const { data } = await apiClient.post('/encounters', encounter);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/encounters/${id}`, updates);
    return data;
  },

  addCaseNote: async (encounterId: string, providerId: string, note: any) => {
    const { data } = await apiClient.post(`/encounters/${encounterId}/case-notes`, {
      providerId,
      note,
    });
    return data;
  },
};

// ============================================
// AI SERVICES
// ============================================

export const aiApi = {
  getMedicationSuggestions: async (patientId: string, proposedMedication: {
    name: string;
    dosage: string;
    category?: string;
  }) => {
    const { data } = await apiClient.post('/ai/suggest', {
      patientId,
      proposedMedication,
    });
    return data;
  },

  getNextQuestions: async (patientId: string, currentContext: string) => {
    const { data } = await apiClient.post('/ai/next-questions', {
      patientId,
      currentContext,
    });
    return data;
  },

  generateSOAPNote: async (encounterId: string) => {
    const { data } = await apiClient.post('/ai/soap-note', { encounterId });
    return data;
  },
};

// ============================================
// SCHEDULING
// ============================================

export const schedulingApi = {
  bookAppointment: async (booking: {
    patientId: string;
    providerId: string;
    scheduledAt: string;
    durationMinutes?: number;
  }) => {
    const { data } = await apiClient.post('/scheduling/book', booking);
    return data;
  },

  reschedule: async (encounterId: string, newTime: string) => {
    const { data } = await apiClient.put(`/scheduling/${encounterId}/reschedule`, {
      newTime,
    });
    return data;
  },

  cancel: async (encounterId: string) => {
    const { data } = await apiClient.delete(`/scheduling/${encounterId}/cancel`);
    return data;
  },
};

// ============================================
// GAMIFICATION
// ============================================

export const gamificationApi = {
  getSummary: async (patientId: string) => {
    const { data } = await apiClient.get(`/gamification/summary/${patientId}`);
    return data;
  },

  getAchievements: async (patientId: string) => {
    const { data } = await apiClient.get(`/gamification/achievements/${patientId}`);
    return data;
  },

  getAchievementsCatalog: async () => {
    const { data } = await apiClient.get('/gamification/achievements');
    return data;
  },

  trackEvent: async (event: {
    patientId: string;
    eventType: string;
    metadata?: any;
  }) => {
    const { data } = await apiClient.post('/gamification/track-event', event);
    return data;
  },

  recordEvent: async (event: {
    patientId: string;
    eventType: string;
    points: number;
    metadata?: any;
  }) => {
    const { data } = await apiClient.post('/gamification/events', event);
    return data;
  },

  unlockAchievement: async (patientId: string, achievementKey: string) => {
    const { data } = await apiClient.post('/gamification/unlock-achievement', {
      patientId,
      achievementKey,
    });
    return data;
  },
};

// ============================================
// BILLING
// ============================================

export const billingApi = {
  evaluateCodes: async (encounterId: string) => {
    const { data } = await apiClient.post('/billing/evaluate', { encounterId });
    return data;
  },

  saveCodes: async (encounterId: string, codes: any) => {
    const { data } = await apiClient.post('/billing/save', { encounterId, codes });
    return data;
  },
};

// ============================================
// MENTORS
// ============================================

export const mentorsApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/mentors');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/mentors/${id}`);
    return data;
  },

  getMentees: async (mentorId: string) => {
    const { data } = await apiClient.get(`/mentors/${mentorId}/mentees`);
    return data;
  },

  getSummary: async (mentorId: string) => {
    const { data } = await apiClient.get(`/mentors/${mentorId}/summary`);
    return data;
  },

  create: async (mentor: any) => {
    const { data } = await apiClient.post('/mentors', mentor);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/mentors/${id}`, updates);
    return data;
  },

  assignProvider: async (mentorId: string, providerId: string) => {
    const { data } = await apiClient.post(`/mentors/${mentorId}/assign-provider`, {
      providerId,
    });
    return data;
  },

  unassignProvider: async (mentorId: string, providerId: string) => {
    const { data } = await apiClient.delete(`/mentors/${mentorId}/providers/${providerId}`);
    return data;
  },
};
