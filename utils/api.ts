// utils/api.ts - API client for backend communication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Token management
export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  setAccessToken: (token: string): void => {
    localStorage.setItem('access_token', token);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token');
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem('refresh_token', token);
  },

  clearTokens: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

// Base fetch wrapper
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = tokenManager.getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401) {
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed) {
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${tokenManager.getAccessToken()}`;
          const retryResponse = await fetch(url, { ...options, headers });
          const retryData = await retryResponse.json();

          if (!retryResponse.ok) {
            return { error: retryData.error || retryData.message || 'Request failed' };
          }

          return { data: retryData };
        }
      }

      // If refresh failed, clear tokens and return error
      tokenManager.clearTokens();
      return { error: 'Authentication failed. Please log in again.' };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || data.message || `HTTP ${response.status}`,
      };
    }

    return { data };
  } catch (error) {
    console.error('API request error:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Refresh access token
async function refreshAccessToken(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      tokenManager.setAccessToken(data.accessToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
}

// ===== Auth API =====

export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    role: 'patient' | 'provider' | 'mentor';
    name: string;
    phone?: string;
    dateOfBirth?: string;
  }) => {
    const response = await fetchWithAuth<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.data?.tokens) {
      tokenManager.setAccessToken(response.data.tokens.accessToken);
      tokenManager.setRefreshToken(response.data.tokens.refreshToken);
    }

    return response;
  },

  login: async (email: string, password: string) => {
    const response = await fetchWithAuth<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.tokens) {
      tokenManager.setAccessToken(response.data.tokens.accessToken);
      tokenManager.setRefreshToken(response.data.tokens.refreshToken);
    }

    return response;
  },

  logout: async () => {
    const response = await fetchWithAuth('/auth/logout', {
      method: 'POST',
    });

    tokenManager.clearTokens();
    return response;
  },

  getCurrentUser: async () => {
    return fetchWithAuth<any>('/auth/me');
  },
};

// ===== Provider API =====

export const providerApi = {
  getAll: async (params?: {
    specialty?: string;
    acceptsNewPatients?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.specialty) queryParams.set('specialty', params.specialty);
    if (params?.acceptsNewPatients !== undefined) queryParams.set('acceptsNewPatients', params.acceptsNewPatients.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const query = queryParams.toString();
    return fetchWithAuth<any>(`/providers${query ? `?${query}` : ''}`);
  },

  getAvailable: async () => {
    return fetchWithAuth<any>('/providers/available');
  },

  getById: async (id: number) => {
    return fetchWithAuth<any>(`/providers/${id}`);
  },

  getBySpecialty: async (specialty: string) => {
    return fetchWithAuth<any>(`/providers/specialty/${encodeURIComponent(specialty)}`);
  },

  getCurrent: async () => {
    return fetchWithAuth<any>('/providers/me');
  },

  update: async (id: number, data: any) => {
    return fetchWithAuth<any>(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getAvailability: async (id: number) => {
    return fetchWithAuth<any>(`/providers/${id}/availability`);
  },

  setAvailability: async (id: number, data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable?: boolean;
  }) => {
    return fetchWithAuth<any>(`/providers/${id}/availability`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteAvailability: async (providerId: number, availabilityId: number) => {
    return fetchWithAuth<any>(`/providers/${providerId}/availability/${availabilityId}`, {
      method: 'DELETE',
    });
  },
};

// ===== Patient API =====

export const patientApi = {
  getAll: async (params?: {
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.isActive !== undefined) queryParams.set('isActive', params.isActive.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const query = queryParams.toString();
    return fetchWithAuth<any>(`/patients${query ? `?${query}` : ''}`);
  },

  getCurrent: async () => {
    return fetchWithAuth<any>('/patients/me');
  },

  getById: async (id: number) => {
    return fetchWithAuth<any>(`/patients/${id}`);
  },

  update: async (id: number, data: any) => {
    return fetchWithAuth<any>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getMedications: async (id: number) => {
    return fetchWithAuth<any>(`/patients/${id}/medications`);
  },

  getNotes: async (id: number, params?: {
    providerId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.providerId) queryParams.set('providerId', params.providerId.toString());
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    return fetchWithAuth<any>(`/patients/${id}/notes${query ? `?${query}` : ''}`);
  },

  getProviderPatients: async () => {
    return fetchWithAuth<any>('/patients/provider/my-patients');
  },
};

// ===== Appointment API =====

export const appointmentApi = {
  getAll: async (params?: {
    patientId?: number;
    providerId?: number;
    status?: string;
    appointmentType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.patientId) queryParams.set('patientId', params.patientId.toString());
    if (params?.providerId) queryParams.set('providerId', params.providerId.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.appointmentType) queryParams.set('appointmentType', params.appointmentType);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const query = queryParams.toString();
    return fetchWithAuth<any>(`/appointments${query ? `?${query}` : ''}`);
  },

  getUpcoming: async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return fetchWithAuth<any>(`/appointments/upcoming${query}`);
  },

  getHistory: async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return fetchWithAuth<any>(`/appointments/history${query}`);
  },

  getById: async (id: number) => {
    return fetchWithAuth<any>(`/appointments/${id}`);
  },

  book: async (data: {
    providerId: number;
    appointmentType: string;
    scheduledStart: string;
    scheduledEnd: string;
    googleCalendarEventId?: string;
    notes?: string;
    patientId?: number;
  }) => {
    return fetchWithAuth<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any) => {
    return fetchWithAuth<any>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: number, status: string) => {
    return fetchWithAuth<any>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  cancel: async (id: number, cancellationReason: string) => {
    return fetchWithAuth<any>(`/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancellationReason }),
    });
  },

  delete: async (id: number) => {
    return fetchWithAuth<any>(`/appointments/${id}`, {
      method: 'DELETE',
    });
  },
};

// ===== Mentor API =====

export const mentorApi = {
  getCurrent: async () => {
    return fetchWithAuth<any>('/mentors/me');
  },

  getMentees: async () => {
    return fetchWithAuth<any>('/mentors/mentees');
  },

  getStatistics: async () => {
    return fetchWithAuth<any>('/mentors/statistics');
  },

  getMenteeDetails: async (menteeId: number) => {
    return fetchWithAuth<any>(`/mentors/mentees/${menteeId}`);
  },
};

export default {
  auth: authApi,
  providers: providerApi,
  patients: patientApi,
  appointments: appointmentApi,
  mentors: mentorApi,
};
