'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import type {
  ProviderApplication,
  Specialty,
  InsurancePlan,
  ProviderApplicationUpdate,
} from '@/types'

const STEPS = [
  { number: 1, title: 'Basic Information', description: 'Your personal details' },
  { number: 2, title: 'Professional Info', description: 'Credentials and specialties' },
  { number: 3, title: 'Practice Address', description: 'Where you practice' },
  { number: 4, title: 'Insurance', description: 'Plans you accept' },
  { number: 5, title: 'CAQH Credentialing', description: 'Credential verification' },
  { number: 6, title: 'Background Check', description: 'Final step before submission' },
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export default function ProviderOnboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [application, setApplication] = useState<ProviderApplication | null>(null)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<ProviderApplicationUpdate>({})

  useEffect(() => {
    // Check authentication
    if (!apiClient.isAuthenticated() || apiClient.getCurrentRole() !== 'PROVIDER') {
      router.push('/auth/login')
      return
    }

    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load existing application or create new one
      try {
        const app = await apiClient.getMyProviderApplication()
        setApplication(app)
        setCurrentStep(app.current_step)

        // Populate form with existing data
        setFormData({
          first_name: app.first_name || '',
          last_name: app.last_name || '',
          phone: app.phone || '',
          date_of_birth: app.date_of_birth ? app.date_of_birth.split('T')[0] : '',
          ssn_last_four: app.ssn_last_four || '',
          npi_number: app.npi_number || '',
          dea_number: app.dea_number || '',
          provider_type: app.provider_type || '',
          specialties: app.specialties || [],
          years_experience: app.years_experience || undefined,
          practice_name: app.practice_name || '',
          practice_address_line1: app.practice_address_line1 || '',
          practice_address_line2: app.practice_address_line2 || '',
          practice_city: app.practice_city || '',
          practice_state: app.practice_state || '',
          practice_zip: app.practice_zip || '',
          practice_phone: app.practice_phone || '',
          insurance_plans: app.insurance_plans || [],
          accepts_medicare: app.accepts_medicare || false,
          accepts_medicaid: app.accepts_medicaid || false,
          caqh_provider_id: app.caqh_provider_id || '',
          caqh_username: app.caqh_username || '',
          background_check_consent: app.background_check_consent || false,
        })
      } catch (err) {
        // No existing application - will create on first save
        console.log('No existing application found')
      }

      // Load reference data
      const [specialtiesData, insuranceData] = await Promise.all([
        apiClient.getSpecialties(),
        apiClient.getInsurancePlans(),
      ])

      setSpecialties(specialtiesData)
      setInsurancePlans(insuranceData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load application data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setSuccessMessage(null)
  }

  const handleSaveAndContinue = async () => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const dataToSave: ProviderApplicationUpdate = {
        ...formData,
        current_step: currentStep + 1,
      }

      if (application) {
        // Update existing application
        const updated = await apiClient.updateProviderApplication(application.id, dataToSave)
        setApplication(updated)
      } else {
        // Create new application
        const newApp = await apiClient.createProviderApplication({
          first_name: formData.first_name || '',
          last_name: formData.last_name || '',
          email: formData.email || '',
          phone: formData.phone || '',
        })
        setApplication(newApp)
      }

      setSuccessMessage('Progress saved!')

      // Move to next step
      if (currentStep < 6) {
        setCurrentStep(currentStep + 1)
      }
    } catch (err: any) {
      console.error('Failed to save application:', err)
      setError(err.response?.data?.detail || 'Failed to save progress')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitApplication = async () => {
    if (!application) return

    setIsSaving(true)
    setError(null)

    try {
      // Final save with all data
      await apiClient.updateProviderApplication(application.id, formData)

      // Submit application
      await apiClient.submitProviderApplication(application.id)

      setSuccessMessage('Application submitted successfully! We will review and contact you soon.')

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/provider/dashboard')
      }, 2000)
    } catch (err: any) {
      console.error('Failed to submit application:', err)
      setError(err.response?.data?.detail || 'Failed to submit application')
    } finally {
      setIsSaving(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.first_name || ''}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={formData.last_name || ''}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                required
              />
            </div>
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              required
            />
            <Input
              label="Date of Birth"
              type="date"
              value={formData.date_of_birth || ''}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              required
            />
            <Input
              label="SSN (Last 4 digits)"
              type="text"
              maxLength={4}
              value={formData.ssn_last_four || ''}
              onChange={(e) => handleInputChange('ssn_last_four', e.target.value)}
              placeholder="1234"
              required
            />
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Professional Information</h3>
            <Input
              label="NPI Number"
              value={formData.npi_number || ''}
              onChange={(e) => handleInputChange('npi_number', e.target.value)}
              placeholder="10-digit NPI"
              required
            />
            <Input
              label="DEA Number (if applicable)"
              value={formData.dea_number || ''}
              onChange={(e) => handleInputChange('dea_number', e.target.value)}
              placeholder="Optional"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.provider_type || ''}
                onChange={(e) => handleInputChange('provider_type', e.target.value)}
                required
              >
                <option value="">Select provider type...</option>
                <option value="MD">Psychiatrist (MD)</option>
                <option value="DO">Psychiatrist (DO)</option>
                <option value="PMHNP">Psychiatric Nurse Practitioner</option>
                <option value="LCSW">Licensed Clinical Social Worker</option>
                <option value="LPC">Licensed Professional Counselor</option>
                <option value="LMFT">Licensed Marriage and Family Therapist</option>
                <option value="PsyD">Clinical Psychologist (PsyD)</option>
                <option value="PhD">Clinical Psychologist (PhD)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialties (select all that apply)
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                {specialties.map((specialty) => (
                  <label key={specialty.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(formData.specialties || []).includes(specialty.id)}
                      onChange={(e) => {
                        const current = formData.specialties || []
                        if (e.target.checked) {
                          handleInputChange('specialties', [...current, specialty.id])
                        } else {
                          handleInputChange('specialties', current.filter(id => id !== specialty.id))
                        }
                      }}
                    />
                    <span className="text-sm">{specialty.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <Input
              label="Years of Experience"
              type="number"
              value={formData.years_experience || ''}
              onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value))}
              min="0"
              required
            />
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Practice Address</h3>
            <Input
              label="Practice Name"
              value={formData.practice_name || ''}
              onChange={(e) => handleInputChange('practice_name', e.target.value)}
              required
            />
            <Input
              label="Address Line 1"
              value={formData.practice_address_line1 || ''}
              onChange={(e) => handleInputChange('practice_address_line1', e.target.value)}
              required
            />
            <Input
              label="Address Line 2"
              value={formData.practice_address_line2 || ''}
              onChange={(e) => handleInputChange('practice_address_line2', e.target.value)}
              placeholder="Suite, unit, etc. (optional)"
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="City"
                value={formData.practice_city || ''}
                onChange={(e) => handleInputChange('practice_city', e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.practice_state || ''}
                  onChange={(e) => handleInputChange('practice_state', e.target.value)}
                  required
                >
                  <option value="">Select...</option>
                  {US_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <Input
                label="ZIP Code"
                value={formData.practice_zip || ''}
                onChange={(e) => handleInputChange('practice_zip', e.target.value)}
                required
              />
            </div>
            <Input
              label="Practice Phone"
              type="tel"
              value={formData.practice_phone || ''}
              onChange={(e) => handleInputChange('practice_phone', e.target.value)}
              required
            />
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Insurance Plans</h3>
            <p className="text-sm text-gray-600">
              Select the insurance plans you accept. We'll handle credentialing for you.
            </p>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.accepts_medicare || false}
                  onChange={(e) => handleInputChange('accepts_medicare', e.target.checked)}
                />
                <span className="font-medium">Medicare</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.accepts_medicaid || false}
                  onChange={(e) => handleInputChange('accepts_medicaid', e.target.checked)}
                />
                <span className="font-medium">Medicaid</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                Commercial Insurance Plans
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                {insurancePlans.map((plan) => (
                  <label key={plan.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(formData.insurance_plans || []).includes(plan.id)}
                      onChange={(e) => {
                        const current = formData.insurance_plans || []
                        if (e.target.checked) {
                          handleInputChange('insurance_plans', [...current, plan.id])
                        } else {
                          handleInputChange('insurance_plans', current.filter(id => id !== plan.id))
                        }
                      }}
                    />
                    <span className="text-sm">
                      {plan.name} {plan.plan_type && `(${plan.plan_type})`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">CAQH Credentialing</h3>
            <Alert variant="info">
              <p className="text-sm">
                CAQH ProView is the industry standard for provider credentialing.
                We'll verify your information with CAQH to streamline insurance credentialing.
              </p>
            </Alert>
            <Input
              label="CAQH Provider ID"
              value={formData.caqh_provider_id || ''}
              onChange={(e) => handleInputChange('caqh_provider_id', e.target.value)}
              placeholder="Your CAQH ID"
              required
            />
            <Input
              label="CAQH Username"
              value={formData.caqh_username || ''}
              onChange={(e) => handleInputChange('caqh_username', e.target.value)}
              placeholder="Your CAQH login username"
              required
            />
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                Don't have a CAQH account?{' '}
                <a
                  href="https://proview.caqh.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  Create one here
                </a>
              </p>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Background Check & Final Steps</h3>
            <Alert variant="info">
              <p className="text-sm">
                Before we can approve your application, you must consent to a background check.
                This is required by state regulations and insurance companies.
              </p>
            </Alert>
            <div className="p-4 border border-gray-300 rounded-md">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.background_check_consent || false}
                  onChange={(e) => handleInputChange('background_check_consent', e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">
                  I consent to a background check as required for provider credentialing.
                  I understand that this may include criminal history, education verification,
                  and license verification.
                </span>
              </label>
            </div>
            <div className="mt-6 p-4 bg-green-50 rounded-md">
              <h4 className="font-medium text-green-900 mb-2">Next Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                <li>Upload required documents (licenses, DEA, malpractice insurance)</li>
                <li>We'll process your background check (typically 3-5 business days)</li>
                <li>Our team will review your application (1-2 business days)</li>
                <li>Once approved, you can start accepting patients!</li>
              </ol>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading application...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-primary-600">Provider Onboarding</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step.number
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.number}
                  </div>
                  <p className="text-xs mt-2 text-center max-w-[100px]">{step.title}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step.number ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              Step {currentStep} of 6: {STEPS[currentStep - 1].title}
            </CardTitle>
          </CardHeader>

          <div className="p-6">
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            {successMessage && (
              <Alert variant="success" className="mb-4">
                {successMessage}
              </Alert>
            )}

            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1 || isSaving}
              >
                Back
              </Button>

              {currentStep < 6 ? (
                <Button
                  onClick={handleSaveAndContinue}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save & Continue'}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitApplication}
                  disabled={isSaving || !formData.background_check_consent}
                >
                  {isSaving ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Application Status */}
        {application && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Application Status: <span className="font-medium">{application.status}</span>
          </div>
        )}
      </main>
    </div>
  )
}
