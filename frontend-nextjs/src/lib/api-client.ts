import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  LoginRequest,
  RegisterPatientRequest,
  RegisterProviderRequest,
  TokenResponse,
  User,
  Appointment,
  AppointmentBookRequest,
  PreSessionTask,
  PreSessionTaskSubmit,
  MedicationEducation,
  MedicationQuizSubmit,
  MedicationQuizAttempt,
  Referral,
  ReferralCreateRequest,
  EarningsDashboard,
  ProviderApplication,
  ProviderApplicationCreate,
  ProviderApplicationUpdate,
  ApplicationStatusResponse,
  Specialty,
  InsurancePlan,
  ProviderDocument,
  DocumentUploadResponse,
  DocumentType,
  ProviderAvailability,
  ProviderAvailabilitySlot,
  ProviderTimeOff,
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<{ detail: string }>) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          this.clearAuth()
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('access_token', token)
  }

  private getUserId(): number | null {
    if (typeof window === 'undefined') return null
    const userId = localStorage.getItem('user_id')
    return userId ? parseInt(userId, 10) : null
  }

  private getRole(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('user_role')
  }

  setAuthData(data: TokenResponse): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user_id', data.user_id.toString())
    localStorage.setItem('user_role', data.role)
  }

  clearAuth(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_role')
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  getCurrentRole(): string | null {
    return this.getRole()
  }

  // Authentication endpoints
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/login', data)
    this.setAuthData(response.data)
    return response.data
  }

  async registerPatient(data: RegisterPatientRequest): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/register/patient', data)
    this.setAuthData(response.data)
    return response.data
  }

  async registerProvider(data: RegisterProviderRequest): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/register/provider', data)
    this.setAuthData(response.data)
    return response.data
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me')
    return response.data
  }

  logout(): void {
    this.clearAuth()
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
  }

  // Appointment endpoints
  async bookAppointment(data: AppointmentBookRequest): Promise<Appointment> {
    const response = await this.client.post<Appointment>('/appointments/book', data)
    return response.data
  }

  async getMyAppointments(status?: string): Promise<Appointment[]> {
    const params = status ? { status_filter: status } : {}
    const response = await this.client.get<{ appointments: Appointment[] }>(
      '/appointments/my-appointments',
      { params }
    )
    return response.data.appointments
  }

  async getAppointment(id: number): Promise<Appointment> {
    const response = await this.client.get<Appointment>(`/appointments/${id}`)
    return response.data
  }

  async cancelAppointment(id: number): Promise<Appointment> {
    const response = await this.client.post<Appointment>(`/appointments/${id}/cancel`)
    return response.data
  }

  // Payment endpoints
  async updatePaymentMethod(paymentMethodId: string): Promise<void> {
    await this.client.post('/payments/payment-method', {
      payment_method_id: paymentMethodId,
    })
  }

  async getPaymentMethodStatus(): Promise<{ has_payment_method: boolean; payment_method_id: string | null }> {
    const response = await this.client.get('/payments/payment-method')
    return response.data
  }

  // Pre-session task endpoints
  async getMyPreSessionTasks(): Promise<PreSessionTask[]> {
    const response = await this.client.get<PreSessionTask[]>('/pre-session/tasks')
    return response.data
  }

  async submitPreSessionTask(taskId: number, data: PreSessionTaskSubmit): Promise<void> {
    await this.client.post(`/pre-session/tasks/${taskId}/submit`, data)
  }

  // Medication education endpoints
  async getMedicationEducation(id: number): Promise<MedicationEducation> {
    const response = await this.client.get<MedicationEducation>(`/medication/education/${id}`)
    return response.data
  }

  async submitMedicationQuiz(data: MedicationQuizSubmit): Promise<MedicationQuizAttempt> {
    const response = await this.client.post<MedicationQuizAttempt>('/medication/quiz/submit', data)
    return response.data
  }

  async getMyQuizAttempts(): Promise<MedicationQuizAttempt[]> {
    const response = await this.client.get<MedicationQuizAttempt[]>('/medication/quiz/attempts')
    return response.data
  }

  // Referral endpoints
  async createReferral(data: ReferralCreateRequest): Promise<Referral> {
    const response = await this.client.post<Referral>('/referrals/create', data)
    return response.data
  }

  async getMyReferrals(): Promise<Referral[]> {
    const response = await this.client.get<Referral[]>('/referrals/my-referrals')
    return response.data
  }

  async getPendingReferrals(): Promise<Referral[]> {
    const response = await this.client.get<Referral[]>('/referrals/pending')
    return response.data
  }

  async acceptReferral(id: number): Promise<Referral> {
    const response = await this.client.post<Referral>(`/referrals/${id}/accept`)
    return response.data
  }

  async getPatientReferrals(): Promise<Referral[]> {
    const response = await this.client.get<Referral[]>('/referrals/patient/my-referrals')
    return response.data
  }

  // Provider earnings endpoints
  async getEarningsDashboard(periodDays: number = 30): Promise<EarningsDashboard> {
    const response = await this.client.get<EarningsDashboard>('/earnings/dashboard', {
      params: { period_days: periodDays },
    })
    return response.data
  }

  // Phase 2: Provider Onboarding endpoints

  // Provider Applications
  async createProviderApplication(data: ProviderApplicationCreate): Promise<ProviderApplication> {
    const response = await this.client.post<ProviderApplication>('/provider/application', data)
    return response.data
  }

  async getMyProviderApplication(): Promise<ProviderApplication> {
    const response = await this.client.get<ProviderApplication>('/provider/application')
    return response.data
  }

  async updateProviderApplication(
    applicationId: number,
    data: ProviderApplicationUpdate
  ): Promise<ProviderApplication> {
    const response = await this.client.put<ProviderApplication>(
      `/provider/application/${applicationId}`,
      data
    )
    return response.data
  }

  async submitProviderApplication(applicationId: number): Promise<ProviderApplication> {
    const response = await this.client.post<ProviderApplication>(
      `/provider/application/${applicationId}/submit`
    )
    return response.data
  }

  async getApplicationStatus(applicationId: number): Promise<ApplicationStatusResponse> {
    const response = await this.client.get<ApplicationStatusResponse>(
      `/provider/application/${applicationId}/status`
    )
    return response.data
  }

  // Specialties & Insurance
  async getSpecialties(category?: string): Promise<Specialty[]> {
    const params = category ? { category } : {}
    const response = await this.client.get<Specialty[]>('/specialties', { params })
    return response.data
  }

  async getInsurancePlans(state?: string): Promise<InsurancePlan[]> {
    const params = state ? { state } : {}
    const response = await this.client.get<InsurancePlan[]>('/insurance-plans', { params })
    return response.data
  }

  async getInsurancePlan(planId: number): Promise<InsurancePlan> {
    const response = await this.client.get<InsurancePlan>(`/insurance-plans/${planId}`)
    return response.data
  }

  // Provider Documents
  async uploadProviderDocument(
    documentType: DocumentType,
    file: File
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)

    const response = await this.client.post<DocumentUploadResponse>('/provider/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async getMyProviderDocuments(): Promise<ProviderDocument[]> {
    const response = await this.client.get<ProviderDocument[]>('/provider/documents')
    return response.data
  }

  async getDocumentDownloadUrl(documentId: number): Promise<{ download_url: string }> {
    const response = await this.client.get<{ download_url: string }>(
      `/provider/documents/${documentId}/download`
    )
    return response.data
  }

  async deleteProviderDocument(documentId: number): Promise<void> {
    await this.client.delete(`/provider/documents/${documentId}`)
  }

  // Provider Availability
  async createAvailabilitySlot(data: ProviderAvailabilitySlot): Promise<ProviderAvailability> {
    const response = await this.client.post<ProviderAvailability>('/provider/availability', data)
    return response.data
  }

  async getMyAvailability(): Promise<ProviderAvailability[]> {
    const response = await this.client.get<ProviderAvailability[]>('/provider/availability')
    return response.data
  }

  async setWeeklyAvailability(
    slots: ProviderAvailabilitySlot[]
  ): Promise<{ message: string; slots_created: number }> {
    const response = await this.client.post<{ message: string; slots_created: number }>(
      '/provider/availability/bulk',
      { availability_slots: slots }
    )
    return response.data
  }

  async deleteAvailabilitySlot(slotId: number): Promise<void> {
    await this.client.delete(`/provider/availability/${slotId}`)
  }

  // Provider Time Off
  async createTimeOff(data: {
    start_date: string
    end_date: string
    reason?: string
    is_all_day?: boolean
  }): Promise<ProviderTimeOff> {
    const response = await this.client.post<ProviderTimeOff>('/provider/time-off', data)
    return response.data
  }

  async getMyTimeOff(upcomingOnly: boolean = true): Promise<ProviderTimeOff[]> {
    const response = await this.client.get<ProviderTimeOff[]>('/provider/time-off', {
      params: { upcoming_only: upcomingOnly },
    })
    return response.data
  }

  async deleteTimeOff(timeOffId: number): Promise<void> {
    await this.client.delete(`/provider/time-off/${timeOffId}`)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
