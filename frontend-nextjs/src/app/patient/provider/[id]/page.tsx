'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import type { AppointmentSlot } from '@/types'

export default function ProviderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const providerId = parseInt(params.id as string)

  const [provider, setProvider] = useState<any>(null)
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMonth, setViewMonth] = useState<Date>(new Date())

  useEffect(() => {
    loadProviderDetails()
  }, [providerId])

  useEffect(() => {
    if (provider) {
      loadAvailableSlots()
    }
  }, [provider, selectedDate])

  const loadProviderDetails = async () => {
    try {
      const data = await apiClient.getProviderDetail(providerId)
      setProvider(data)
    } catch (err) {
      console.error('Failed to load provider:', err)
      setError('Failed to load provider details')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    if (!provider) return

    try {
      // Load slots for selected date
      const startDate = selectedDate.toISOString().split('T')[0]
      const endDate = selectedDate.toISOString().split('T')[0]

      const slots = await apiClient.getAvailableSlots(
        providerId,
        startDate,
        endDate
      )
      setAvailableSlots(slots)
    } catch (err) {
      console.error('Failed to load slots:', err)
    }
  }

  const handleBookAppointment = async () => {
    if (!selectedSlot) return

    setIsBooking(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await apiClient.bookAppointmentFromSlot({
        slot_id: selectedSlot.id,
        appointment_type: 'therapy',
        payment_type: 'INSURANCE', // TODO: Let user choose
      })

      setSuccessMessage('Appointment booked successfully!')
      setSelectedSlot(null)

      // Refresh slots
      await loadAvailableSlots()

      // Redirect to appointments page after 2 seconds
      setTimeout(() => {
        router.push('/patient/appointments')
      }, 2000)
    } catch (err: any) {
      console.error('Booking failed:', err)
      setError(err.response?.data?.detail || 'Failed to book appointment')
    } finally {
      setIsBooking(false)
    }
  }

  const formatTime = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewMonth)
    newDate.setMonth(newDate.getMonth() + offset)
    setViewMonth(newDate)
  }

  const selectDate = (date: Date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  const isPastDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading provider details...</p>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="p-6 text-center">
            <p className="text-red-600 mb-4">Provider not found</p>
            <Button onClick={() => router.push('/patient/find-provider')}>
              Back to Search
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">Provider Profile</h1>
            <Button variant="outline" onClick={() => router.push('/patient/find-provider')}>
              Back to Search
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Provider Info - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <Card>
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {provider.profile_photo_url && (
                    <img
                      src={provider.profile_photo_url}
                      alt={provider.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{provider.name}</h2>
                    <p className="text-lg text-gray-600 mt-1">
                      {provider.provider_type}
                      {provider.specialty && ` • ${provider.specialty}`}
                    </p>
                    {provider.years_experience && (
                      <p className="text-sm text-gray-500 mt-1">
                        {provider.years_experience} years of experience
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {provider.accepts_new_patients && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                          Accepting New Patients
                        </span>
                      )}
                      {provider.is_verified && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    {provider.rating_average && (
                      <div className="mt-3">
                        <span className="text-lg">
                          ⭐ {provider.rating_average.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({provider.rating_count} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* About Section */}
            {provider.bio_long && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <div className="p-6 pt-0">
                  <p className="text-gray-700 whitespace-pre-line">{provider.bio_long}</p>
                </div>
              </Card>
            )}

            {/* Specialties & Conditions */}
            {provider.specialties && provider.specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Specialties</CardTitle>
                </CardHeader>
                <div className="p-6 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {provider.specialties.map((specialty: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Treatment Modalities */}
            {provider.treatment_modalities && provider.treatment_modalities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Treatment Approaches</CardTitle>
                </CardHeader>
                <div className="p-6 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {provider.treatment_modalities.map((modality: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                      >
                        {modality}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Insurance Information */}
            <Card>
              <CardHeader>
                <CardTitle>Insurance Accepted</CardTitle>
              </CardHeader>
              <div className="p-6 pt-0">
                <div className="space-y-2">
                  {provider.accepts_medicare && (
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✓</span>
                      <span>Medicare</span>
                    </div>
                  )}
                  {provider.accepts_medicaid && (
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✓</span>
                      <span>Medicaid</span>
                    </div>
                  )}
                  {provider.insurance_plan_names && provider.insurance_plan_names.map((plan: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-green-600">✓</span>
                      <span>{plan}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Calendar - Right Column */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Book Appointment</CardTitle>
              </CardHeader>
              <div className="p-6 pt-0 space-y-4">
                {error && (
                  <Alert variant="error">{error}</Alert>
                )}
                {successMessage && (
                  <Alert variant="success">{successMessage}</Alert>
                )}

                {/* Session Info */}
                <div className="text-sm text-gray-600">
                  <p>Session Length: {provider.session_duration_minutes} minutes</p>
                  <p>Rate: ${(provider.hourly_rate_cents / 100).toFixed(2)}/hour</p>
                </div>

                {/* Mini Calendar */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeMonth(-1)}
                    >
                      ←
                    </Button>
                    <span className="font-semibold">
                      {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeMonth(1)}
                    >
                      →
                    </Button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                    {getDaysInMonth(viewMonth).map((date, idx) => (
                      <div key={idx} className="aspect-square">
                        {date && (
                          <button
                            onClick={() => selectDate(date)}
                            disabled={isPastDate(date)}
                            className={`w-full h-full rounded flex items-center justify-center text-sm
                              ${isPastDate(date) ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-primary-50 cursor-pointer'}
                              ${isSameDay(date, selectedDate) ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}
                            `}
                          >
                            {date.getDate()}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Time Slots */}
                <div>
                  <h4 className="font-semibold mb-2">
                    Available Times for {formatDate(selectedDate.toISOString())}
                  </h4>
                  {availableSlots.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No available slots for this date
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full p-3 rounded border text-left transition-colors
                            ${selectedSlot?.id === slot.id
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {formatTime(slot.start_time)}
                            </span>
                            {slot.is_telehealth && (
                              <span className="text-xs text-gray-500">Telehealth</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Book Button */}
                <Button
                  onClick={handleBookAppointment}
                  disabled={!selectedSlot || isBooking}
                  className="w-full"
                >
                  {isBooking ? 'Booking...' : 'Book Appointment'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
