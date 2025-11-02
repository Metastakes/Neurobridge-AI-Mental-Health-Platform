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
  PatientIntakeForm,
  IntakeFormCreate,
  ProviderSearchFilters,
  ProviderSearchResponse,
  AppointmentSlot,
  BookAppointmentRequest,
  VideoSession,
  SessionJoinResponse,
  SessionStatusUpdate,
  SessionNote,
  SessionNoteCreate,
  WaitingRoomEntry,
  AssessmentScale,
  AssessmentScaleListItem,
  AssessmentAttemptCreate,
  AssessmentAttempt,
  AssessmentScoreHistory,
  ProgressSummary,
  TreatmentGoalCreate,
  TreatmentGoalUpdate,
  TreatmentGoal,
  TreatmentGoalWithProgress,
  GoalProgressCreate,
  GoalProgress,
  PatientStreak,
  StreakUpdate,
  Achievement,
  PatientAchievement,
  GamificationDashboard,
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

  // Phase 3: Patient Intake & Scheduling endpoints

  // Provider Search
  async searchProviders(filters: ProviderSearchFilters): Promise<ProviderSearchResponse> {
    const response = await this.client.post<ProviderSearchResponse>('/search/search', filters)
    return response.data
  }

  async getProviderDetail(providerId: number): Promise<any> {
    const response = await this.client.get(`/search/providers/${providerId}`)
    return response.data
  }

  async getSpecialtiesForSearch(): Promise<Specialty[]> {
    const response = await this.client.get<Specialty[]>('/search/specialties-list')
    return response.data
  }

  async getInsurancePlansForSearch(state?: string): Promise<InsurancePlan[]> {
    const params = state ? { state } : {}
    const response = await this.client.get<InsurancePlan[]>('/search/insurance-plans-list', { params })
    return response.data
  }

  // Appointment Booking
  async getAvailableSlots(
    providerId: number,
    startDate: string,
    endDate: string
  ): Promise<AppointmentSlot[]> {
    const response = await this.client.post<{ slots: AppointmentSlot[] }>(
      '/booking/available-slots',
      {
        provider_id: providerId,
        start_date: startDate,
        end_date: endDate,
      }
    )
    return response.data.slots
  }

  async bookAppointmentFromSlot(request: BookAppointmentRequest): Promise<any> {
    const response = await this.client.post('/booking/book', request)
    return response.data
  }

  async rescheduleAppointment(appointmentId: number, newSlotId: number): Promise<any> {
    const response = await this.client.post(`/booking/appointments/${appointmentId}/reschedule`, {
      new_slot_id: newSlotId,
    })
    return response.data
  }

  async cancelAppointmentBooking(appointmentId: number, reason?: string): Promise<any> {
    const response = await this.client.post(`/booking/appointments/${appointmentId}/cancel`, {
      reason,
    })
    return response.data
  }

  // Patient Intake
  async createIntakeForm(formData: IntakeFormCreate): Promise<PatientIntakeForm> {
    const response = await this.client.post<PatientIntakeForm>('/patient/intake-form', formData)
    return response.data
  }

  async getMyIntakeForm(): Promise<PatientIntakeForm> {
    const response = await this.client.get<PatientIntakeForm>('/patient/intake-form')
    return response.data
  }

  async updateIntakeForm(formId: number, formData: Partial<IntakeFormCreate>): Promise<PatientIntakeForm> {
    const response = await this.client.put<PatientIntakeForm>(`/patient/intake-form/${formId}`, formData)
    return response.data
  }

  async submitIntakeForm(formId: number): Promise<PatientIntakeForm> {
    const response = await this.client.post<PatientIntakeForm>(`/patient/intake-form/${formId}/submit`)
    return response.data
  }

  async getIntakeFormStatus(formId: number): Promise<{
    form_id: number
    status: string
    completion_percentage: number
    required_fields_complete: boolean
    missing_required_fields: string[]
    can_submit: boolean
  }> {
    const response = await this.client.get(`/patient/intake-form/${formId}/completion-status`)
    return response.data
  }

  // Phase 4: Video Sessions
  async getVideoSessionForAppointment(appointmentId: number): Promise<VideoSession> {
    const response = await this.client.get<VideoSession>(`/video-sessions/appointment/${appointmentId}`)
    return response.data
  }

  async joinVideoSession(videoSessionId: number): Promise<SessionJoinResponse> {
    const response = await this.client.post<SessionJoinResponse>(`/video-sessions/join/${videoSessionId}`)
    return response.data
  }

  async updateSessionStatus(videoSessionId: number, statusUpdate: SessionStatusUpdate): Promise<any> {
    const response = await this.client.post(`/video-sessions/${videoSessionId}/status`, statusUpdate)
    return response.data
  }

  async createSessionNote(videoSessionId: number, noteData: SessionNoteCreate): Promise<SessionNote> {
    const response = await this.client.post<SessionNote>(`/video-sessions/${videoSessionId}/notes`, noteData)
    return response.data
  }

  async getSessionNotes(videoSessionId: number): Promise<SessionNote[]> {
    const response = await this.client.get<SessionNote[]>(`/video-sessions/${videoSessionId}/notes`)
    return response.data
  }

  async getWaitingRoom(videoSessionId: number): Promise<WaitingRoomEntry[]> {
    const response = await this.client.get<WaitingRoomEntry[]>(`/video-sessions/waiting-room/${videoSessionId}`)
    return response.data
  }

  async admitFromWaitingRoom(waitingRoomId: number): Promise<any> {
    const response = await this.client.post(`/video-sessions/waiting-room/${waitingRoomId}/admit`)
    return response.data
  }

  // Phase 5: Assessments & Progress Tracking
  async listAssessmentScales(scaleType?: string, activeOnly: boolean = true): Promise<AssessmentScaleListItem[]> {
    const params: any = {}
    if (scaleType) params.scale_type = scaleType
    if (activeOnly) params.active_only = true
    const response = await this.client.get<AssessmentScaleListItem[]>('/assessments/scales', { params })
    return response.data
  }

  async getAssessmentScale(scaleId: number): Promise<AssessmentScale> {
    const response = await this.client.get<AssessmentScale>(`/assessments/scales/${scaleId}`)
    return response.data
  }

  async submitAssessment(attemptData: AssessmentAttemptCreate): Promise<AssessmentAttempt> {
    const response = await this.client.post<AssessmentAttempt>('/assessments/attempts', attemptData)
    return response.data
  }

  async getAssessmentAttempt(attemptId: number): Promise<AssessmentAttempt> {
    const response = await this.client.get<AssessmentAttempt>(`/assessments/attempts/${attemptId}`)
    return response.data
  }

  async listPatientAssessments(patientId: number, scaleCode?: string, limit: number = 50): Promise<AssessmentAttempt[]> {
    const params: any = { limit }
    if (scaleCode) params.scale_code = scaleCode
    const response = await this.client.get<AssessmentAttempt[]>(`/assessments/patient/${patientId}/attempts`, { params })
    return response.data
  }

  async getAssessmentHistory(patientId: number, scaleCode: string): Promise<AssessmentScoreHistory> {
    const response = await this.client.get<AssessmentScoreHistory>(`/assessments/patient/${patientId}/history/${scaleCode}`)
    return response.data
  }

  async getPatientProgressSummary(patientId: number): Promise<ProgressSummary> {
    const response = await this.client.get<ProgressSummary>(`/assessments/patient/${patientId}/progress`)
    return response.data
  }

  // Treatment Goals
  async createTreatmentGoal(goalData: TreatmentGoalCreate): Promise<TreatmentGoal> {
    const response = await this.client.post<TreatmentGoal>('/treatment-goals/', goalData)
    return response.data
  }

  async getTreatmentGoal(goalId: number): Promise<TreatmentGoalWithProgress> {
    const response = await this.client.get<TreatmentGoalWithProgress>(`/treatment-goals/${goalId}`)
    return response.data
  }

  async updateTreatmentGoal(goalId: number, goalData: TreatmentGoalUpdate): Promise<TreatmentGoal> {
    const response = await this.client.put<TreatmentGoal>(`/treatment-goals/${goalId}`, goalData)
    return response.data
  }

  async deleteTreatmentGoal(goalId: number): Promise<void> {
    await this.client.delete(`/treatment-goals/${goalId}`)
  }

  async listPatientGoals(patientId: number, status?: string): Promise<TreatmentGoal[]> {
    const params = status ? { status } : {}
    const response = await this.client.get<TreatmentGoal[]>(`/treatment-goals/patient/${patientId}/goals`, { params })
    return response.data
  }

  async createGoalProgress(progressData: GoalProgressCreate): Promise<GoalProgress> {
    const response = await this.client.post<GoalProgress>('/treatment-goals/progress', progressData)
    return response.data
  }

  async getGoalProgressHistory(goalId: number, limit: number = 20): Promise<GoalProgress[]> {
    const response = await this.client.get<GoalProgress[]>(`/treatment-goals/progress/${goalId}`, { params: { limit } })
    return response.data
  }

  // Gamification
  async getPatientStreak(): Promise<PatientStreak> {
    const response = await this.client.get<PatientStreak>('/gamification/streak')
    return response.data
  }

  async updateStreak(): Promise<StreakUpdate> {
    const response = await this.client.post<StreakUpdate>('/gamification/streak/update')
    return response.data
  }

  async listAchievements(category?: string): Promise<Achievement[]> {
    const params = category ? { category } : {}
    const response = await this.client.get<Achievement[]>('/gamification/achievements', { params })
    return response.data
  }

  async getUnlockedAchievements(): Promise<PatientAchievement[]> {
    const response = await this.client.get<PatientAchievement[]>('/gamification/achievements/unlocked')
    return response.data
  }

  async markAchievementViewed(achievementId: number): Promise<void> {
    await this.client.post(`/gamification/achievements/${achievementId}/view`)
  }

  async getGamificationDashboard(): Promise<GamificationDashboard> {
    const response = await this.client.get<GamificationDashboard>('/gamification/dashboard')
    return response.data
  }

  // Medication Education & Rewards
  async getMedicationQuiz(medicationId: number): Promise<MedicationQuizQuestion[]> {
    const response = await this.client.get<MedicationQuizQuestion[]>(`/medication-rewards/medications/${medicationId}/quiz`)
    return response.data
  }

  async submitMedicationQuiz(quizData: MedicationQuizSubmit): Promise<MedicationQuizResult> {
    const response = await this.client.post<MedicationQuizResult>('/medication-rewards/medications/quiz/submit', quizData)
    return response.data
  }

  async listRewards(category?: string, featuredOnly: boolean = false): Promise<RewardItem[]> {
    const params: any = {}
    if (category) params.category = category
    if (featuredOnly) params.featured_only = featuredOnly
    const response = await this.client.get<RewardItem[]>('/medication-rewards/rewards', { params })
    return response.data
  }

  async getRewardsMarketplace(): Promise<RewardsMarketplace> {
    const response = await this.client.get<RewardsMarketplace>('/medication-rewards/rewards/marketplace')
    return response.data
  }

  async redeemReward(redeemData: RewardRedeemRequest): Promise<RewardRedemption> {
    const response = await this.client.post<RewardRedemption>('/medication-rewards/rewards/redeem', redeemData)
    return response.data
  }

  async getPatientPoints(): Promise<PatientPoints> {
    const response = await this.client.get<PatientPoints>('/medication-rewards/points')
    return response.data
  }

  async getPointsTransactions(limit: number = 50): Promise<PointsTransaction[]> {
    const response = await this.client.get<PointsTransaction[]>('/medication-rewards/points/transactions', { params: { limit } })
    return response.data
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
